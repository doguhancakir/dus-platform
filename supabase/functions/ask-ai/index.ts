import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// ── Gemini key pool — biri 429 atınca sıradakine geçer ──────────────────────
// Keyleri Supabase secrets'a ekle: GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_API_KEY_1') ?? '',
  Deno.env.get('GEMINI_API_KEY_2') ?? '',
  Deno.env.get('GEMINI_API_KEY_3') ?? '',
].filter(k => k.length > 0)

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='

const SYSTEM_PROMPT = `Sen Davy's Dental, bir DUS (Diş Hekimliği Uzmanlık Sınavı) hazırlık platformunun yapay zeka asistanısın.
Öğrencilerin diş hekimliği sorularını daha iyi anlamalarına ve konuları pekiştirmelerine yardımcı olursun.

KURALLAR:
- SADECE diş hekimliği, tıp, biyoloji ve sınav konularında yardımcı ol.
- Her zaman Türkçe konuş.
- Madde madde açıkla.
- Sınav tüyoları ver.
- Cevabı asla yarıda bırakma, eksiksiz tamamla.`

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function buildContext(qc: { questionText: string; options: string[]; correctOptionText: string; selectedOptionText?: string | null; explanation?: string }): string {
  let ctx = `Öğrenci şu anda bir DUS sorusu üzerinde çalışıyor:\n\nSORU: ${qc.questionText}\n\nŞIKLAR:\n`
  qc.options.forEach((opt: string, i: number) => {
    ctx += `${['A','B','C','D','E'][i] ?? i+1}) ${opt}\n`
  })
  ctx += `\nDOĞRU CEVAP: ${qc.correctOptionText}`
  if (qc.selectedOptionText && qc.selectedOptionText !== qc.correctOptionText) {
    ctx += `\nÖĞRENCİNİN SEÇTİĞİ (YANLIŞ): ${qc.selectedOptionText}`
  }
  if (qc.explanation) ctx += `\n\nACIKLAMA: ${qc.explanation}`
  return ctx
}

async function callGemini(
  messages: { role: string; text: string }[],
  qc: Parameters<typeof buildContext>[0]
): Promise<{ text: string } | { rateLimited: true; retryAfter: number }> {
  const ctx = buildContext(qc)
  const contents = [
    { role: 'user',  parts: [{ text: ctx }] },
    { role: 'model', parts: [{ text: 'Soruyu görüyorum. Ne sormak istersin?' }] },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
  ]

  let lastRetryAfter = 60

  for (const key of GEMINI_KEYS) {
    const res = await fetch(GEMINI_BASE + key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.65, maxOutputTokens: 8192 },
      }),
    })

    if (res.status === 429) {
      const data = await res.json()
      const msg   = data.error?.message ?? ''
      const match = msg.match(/retry in ([\d.]+)s/i)
      lastRetryAfter = match ? Math.ceil(parseFloat(match[1])) : 60
      continue // sonraki key'i dene
    }

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error?.message ?? 'Gemini API hatası')
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Cevap alınamadı.'
    return { text }
  }

  // Tüm keyler tükendi
  return { rateLimited: true, retryAfter: lastRetryAfter }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { messages, questionContext } = await req.json()
    const result = await callGemini(messages, questionContext)

    if ('rateLimited' in result) {
      return new Response(
        JSON.stringify({ error: 'RATE_LIMIT', retryAfter: result.retryAfter }),
        { status: 429, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
