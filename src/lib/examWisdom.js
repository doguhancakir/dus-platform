/**
 * DUS sınavında bu branştan konulara göre kaç soru çıktığına dair
 * derlenmiş referans veri. Branş id'sine göre anahtarlanmıştır.
 *
 * topics[].q: sınavdaki soru aralığı, örn. [2, 3] → 2-3 soru
 * topics[].pct: o branş içindeki yaklaşık yüzde ağırlığı
 * wisdom: sadece klinik branşlarda var — kısa bir çalışma önerisi
 */
export const EXAM_WISDOM = {
  // ── Temel Bilimler ──
  101: { // Anatomi
    total: 6,
    topics: [
      { name: 'Baş-Boyun (kemik, kas, eklem)', q: [2, 3], pct: 45 },
      { name: 'Nöroanatomi ve kranial sinirler', q: [2, 2], pct: 35 },
      { name: 'Genel anatomi (solunum, dolaşım, sindirim)', q: [1, 1], pct: 20 },
    ],
  },
  103: { // Fizyoloji
    total: 6,
    topics: [
      { name: 'Hücre, kas, periferik sinir', q: [1, 2], pct: 30 },
      { name: 'Dolaşım, kan, solunum', q: [1, 2], pct: 30 },
      { name: 'Nörofizyoloji (SSS)', q: [1, 2], pct: 25 },
      { name: 'Endokrin, GİS, üriner', q: [0, 1], pct: 15 },
    ],
  },
  104: { // Tıbbi Biyokimya
    total: 6,
    topics: [
      { name: 'KH, lipit, protein metabolizması', q: [2, 2], pct: 34 },
      { name: 'Kemik ve diş dokusu biyokimyası (vit/min)', q: [1, 2], pct: 25 },
      { name: 'Enzimler, nükleik asitler, genetik', q: [1, 2], pct: 25 },
      { name: 'Hormonlar ve mesajcı sistemler', q: [1, 1], pct: 16 },
    ],
  },
  105: { // Tıbbi Mikrobiyoloji
    total: 6,
    topics: [
      { name: 'Bakteriyoloji ve oral mikrobiyoloji', q: [2, 3], pct: 40 },
      { name: 'Viroloji / mikoloji / parazitoloji', q: [1, 2], pct: 26 },
      { name: 'Temel mikrobiyoloji ve sterilizasyon', q: [1, 1], pct: 17 },
      { name: 'İmmünoloji', q: [1, 1], pct: 17 },
    ],
  },
  102: { // Histoloji ve Embriyoloji
    total: 4,
    topics: [
      { name: 'Oral histoloji ve odontogenez', q: [1, 2], pct: 40 },
      { name: 'Hücre ve temel dokular', q: [1, 2], pct: 35 },
      { name: 'Baş-boyun embriyolojisi (faringeal arkuslar)', q: [1, 1], pct: 25 },
    ],
  },
  106: { // Tıbbi Patoloji
    total: 4,
    topics: [
      { name: 'Oral patoloji (odontojenik kist/tümör, tükürük bezi)', q: [1, 2], pct: 40 },
      { name: 'Neoplazi', q: [1, 1], pct: 25 },
      { name: 'Hücre zedelenmesi, inflamasyon, onarım', q: [1, 1], pct: 25 },
      { name: 'Genel/sistemik patoloji', q: [0, 1], pct: 10 },
    ],
  },
  107: { // Tıbbi Farmakoloji
    total: 4,
    topics: [
      { name: 'Analjezikler ve lokal anestezikler', q: [1, 2], pct: 35 },
      { name: 'Kemoterapötikler (antibiyotikler)', q: [1, 1], pct: 25 },
      { name: 'Genel farmakoloji (kinetik/dinamik)', q: [1, 1], pct: 25 },
      { name: 'Otonom ve santral sinir sistemi ilaçları', q: [0, 1], pct: 15 },
    ],
  },
  // Not: Tıbbi Biyoloji ve Genetik (108) bilerek yok — doğrulanmış veri gelene kadar eklenmedi.

  // ── Klinik Bilimler ──
  2: { // Protetik Diş Tedavisi
    total: 10,
    topics: [
      { name: 'Sabit protez + preparasyon', q: [2, 3], pct: 25 },
      { name: 'Tam protez ve çene ilişkileri', q: [2, 2], pct: 20 },
      { name: 'Dental materyaller', q: [2, 2], pct: 20 },
      { name: 'Hareketli bölümlü', q: [1, 2], pct: 15 },
      { name: 'Oklüzyon/TME/artikülatör', q: [1, 1], pct: 10 },
      { name: 'İmplant üstü protez', q: [1, 1], pct: 10 },
    ],
    wisdom: 'En geniş ders ama en çok "bilgi" ölçen ders, yorum az. Preparasyon açıları, ölçü maddesi özellikleri, seramik türleri net bilgi sorusu — kaçırmak affedilmez. Tam protezde çene ilişkileri ve kayıt aşamaları klasik.',
  },
  1: { // Restoratif Diş Tedavisi
    total: 10,
    topics: [
      { name: 'Adeziv sistemler + kompozit', q: [3, 4], pct: 35 },
      { name: 'Karyoloji', q: [2, 3], pct: 25 },
      { name: 'Simanlar ve pulpa koruyucular', q: [1, 2], pct: 15 },
      { name: 'Beyazlatma/hassasiyet/izolasyon', q: [1, 1], pct: 15 },
      { name: 'Kavite prep + amalgam', q: [1, 1], pct: 10 },
    ],
    wisdom: 'Adeziv nesilleri ve etch-rinse / self-etch farkı tek başına 3 soru edebiliyor. Amalgam artık düşük ağırlıklı, üzerine fazla düşme. Çürük etyolojisi mikrobiyoloji ile entegre geliyor.',
  },
  3: { // Ağız, Diş ve Çene Cerrahisi
    total: 10,
    topics: [
      { name: 'Lokal anestezi', q: [2, 3], pct: 25 },
      { name: 'Çekim, gömülü diş, komplikasyon', q: [2, 3], pct: 25 },
      { name: 'Kist/tümör cerrahisi', q: [1, 2], pct: 15 },
      { name: 'Sistemik hastalık ve aciller', q: [1, 2], pct: 15 },
      { name: 'İmplantoloji + preprotetik', q: [1, 1], pct: 10 },
      { name: 'Çene kırığı, ortognatik, TME', q: [1, 1], pct: 10 },
    ],
    wisdom: 'Anatomi ve patoloji ile en entegre branş; anatomi çalışman burada ikinci kez para ediyor. Anestezi soruları teknikten çok komplikasyon ve anestezik farmakolojisi üzerinden geliyor. Tıbbi aciller (senkop, anafilaksi, MI) ezber ve kesin puan.',
  },
  4: { // Ağız, Diş ve Çene Radyolojisi
    total: 10,
    topics: [
      { name: 'Radyolojik patoloji', q: [3, 4], pct: 35 },
      { name: 'Radyasyon fiziği/biyolojisi/korunma', q: [2, 3], pct: 25 },
      { name: 'Normal radyografik anatomi', q: [1, 2], pct: 15 },
      { name: 'İntraoral/ekstraoral teknikler', q: [1, 2], pct: 15 },
      { name: 'İleri görüntüleme (CBCT, MR, BT)', q: [1, 1], pct: 10 },
    ],
    wisdom: 'Ders adı radyoloji ama sorunun üçte biri aslında patoloji: radyolüsent/radyoopak ayırıcı tanı. Fizik kısmı sabit ve tekrarlıyor — kV, mA, filtrasyon, kolimasyon garanti puan.',
  },
  5: { // Periodontoloji
    total: 10,
    topics: [
      { name: 'Hastalıklar ve güncel sınıflandırma', q: [3, 4], pct: 35 },
      { name: 'Etyoloji, mikrobiyoloji, patogenez', q: [2, 2], pct: 20 },
      { name: 'Periodontal ve rejeneratif cerrahi', q: [2, 2], pct: 20 },
      { name: 'Anatomi ve klinik muayene', q: [1, 2], pct: 15 },
      { name: 'Peri-implant hastalıklar', q: [1, 1], pct: 10 },
    ],
    wisdom: '2017 sınıflandırması (evre/derece) artık soru merkezinde, eski sınıflandırmayla çalışma. Mikrobiyoloji dersiyle çakışıyor, iki kere okuma — bir kere iyi oku. Flep teknikleri ve greft materyalleri klasik ayırt edici soru.',
  },
  6: { // Ortodonti
    total: 10,
    topics: [
      { name: 'Sefalometri ve teşhis', q: [2, 3], pct: 25 },
      { name: 'Büyüme-gelişim ve koruyucu ortodonti', q: [2, 2], pct: 20 },
      { name: 'Biyomekanik ve doku yanıtı', q: [2, 2], pct: 20 },
      { name: 'Oklüzyon, maloklüzyon, ankraj', q: [1, 2], pct: 15 },
      { name: 'Apareyler', q: [1, 2], pct: 15 },
      { name: 'Ortognatik cerrahi ve sendromlar', q: [1, 1], pct: 5 },
    ],
    wisdom: 'Adayların en çok kaçtığı ders, o yüzden puanı en çok ayıran yer. Sefalometrik açıların (SNA, SNB, ANB, GoGn-SN) normal değerleri ve ne anlattığı ezberlenmeden soru çözülmüyor. Biyomekanik hesap değil, mantık sorusu — kuvvet, moment, rotasyon merkezi.',
  },
  7: { // Endodonti
    total: 10,
    topics: [
      { name: 'Pulpa/periapikal patoloji ve teşhis', q: [2, 3], pct: 25 },
      { name: 'Kanal preparasyonu (alet ve teknik)', q: [2, 3], pct: 25 },
      { name: 'İrrigasyon ve kanal içi ilaçlar', q: [2, 2], pct: 20 },
      { name: 'Kanal dolgusu', q: [1, 2], pct: 15 },
      { name: 'Travma, vital pulpa, aciller', q: [1, 1], pct: 10 },
      { name: 'Giriş kavitesi ve endo cerrahi', q: [0, 1], pct: 5 },
    ],
    wisdom: 'Sorunun yarısı "hangi teşhis, hangi tedavi" senaryosu. Pulpal ve periapikal tanı terimlerini ezberlemeden hiçbir şey oturmuyor. Alet soruları güncel: Reciproc, ProTaper, kesit geometrisi, taper. İrrigasyon konsantrasyon ve etkileşim sorusu neredeyse her yıl var.',
  },
  8: { // Pedodonti
    total: 10,
    topics: [
      { name: 'Pediatrik endodonti ve travma', q: [3, 4], pct: 35 },
      { name: 'Koruyucu ve restoratif tedaviler', q: [2, 3], pct: 25 },
      { name: 'Büyüme-gelişim, sürme, anomaliler', q: [1, 2], pct: 15 },
      { name: 'Yer tutucular ve koruyucu ortodonti', q: [1, 2], pct: 15 },
      { name: 'Davranış yönlendirmesi ve sistemik hastalıklar', q: [1, 1], pct: 10 },
    ],
    wisdom: 'Travma vakaları en yüksek getirili blok — avulsiyon, luksasyon, kron-kök kırığı protokollerini tablo halinde çalış. Süt dişi ve daimî diş yaklaşımının farkı sürekli tuzak olarak kullanılıyor. Sürme zamanları saf ezber, kaçırma.',
  },
}

export function getExamWisdom(branchId) {
  return EXAM_WISDOM[Number(branchId)] || null
}
