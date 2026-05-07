import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? ''
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

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

function buildContext(questionContext: { questionText: string; options: string[]; correctOptionText: string; selectedOptionText?: string | null; explanation?: string }): string {
  let ctx = `Öğrenci şu anda bir DUS sorusu üzerinde çalışıyor:\n\nSORU: ${questionContext.questionText}\n\nŞIKLAR:\n`
  questionContext.options.forEach((opt: string, i: number) => {
    ctx += `${['A','B','C','D','E'][i] ?? i+1}) ${opt}\n`
  })
  ctx += `\nDOĞRU CEVAP: ${questionContext.correctOptionText}`
  if (questionContext.selectedOptionText && questionContext.selectedOptionText !== questionContext.correctOptionText) {
    ctx += `\nÖĞRENCİNİN SEÇTİĞİ (YANLIŞ): ${questionContext.selectedOptionText}`
  }
  if (questionContext.explanation) {
    ctx += `\n\nAÇIKLAMA: ${questionContext.explanation}`
  }
  return ctx
}

async function callGemini(messages: { role: string; text: string }[], questionContext: Parameters<typeof buildContext>[0]) {
  const ctx = buildContext(questionContext)
  const contents = [
    { role: 'user',  parts: [{ text: ctx }] },
    { role: 'model', parts: [{ text: 'Soruyu görüyorum. Ne sormak istersin?' }] },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
  ]

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.65, maxOutputTokens: 8192 },
    }),
  })

  const data = await res.json()

  if (res.status === 429) {
    const msg = data.error?.message ?? ''
    const match = msg.match(/retry in ([\d.]+)s/i)
    const retryAfter = match ? Math.ceil(parseFloat(match[1])) : 60
    return { rateLimited: true, retryAfter }
  }

  if (!res.ok) throw new Error(data.error?.message ?? 'Gemini API hatası')

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Cevap alınamadı.'
  return { text }
}

async function callGroq(messages: { role: string; text: string }[], questionContext: Parameters<typeof buildContext>[0]) {
  const ctx = buildContext(questionContext)
  const groqMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: ctx },
    { role: 'assistant', content: 'Soruyu görüyorum. Ne sormak istersin?' },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  ]

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: groqMessages,
      temperature: 0.65,
      max_tokens: 8192,
    }),
  })

  const data = await res.json()

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('retry-after') ?? '60')
    return { rateLimited: true, retryAfter: isNaN(retryAfter) ? 60 : retryAfter }
  }

  if (!res.ok) throw new Error(data.error?.message ?? 'Groq API hatası')

  const text = data.choices?.[0]?.message?.content ?? 'Cevap alınamadı.'
  return { text }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { messages, questionContext, model = 'gemini' } = await req.json()

    const result = model === 'groq'
      ? await callGroq(messages, questionContext)
      : await callGemini(messages, questionContext)

    if (result.rateLimited) {
      return new Response(JSON.stringify({ error: 'RATE_LIMIT', retryAfter: result.retryAfter }), {
        status: 429,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ text: result.text }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
