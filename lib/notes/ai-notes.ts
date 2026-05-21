// ─────────────────────────────────────────────────────────────────
// AI NOTES ENGINE — Rule-based analysis helpers
// No external API calls — pure text processing
// ─────────────────────────────────────────────────────────────────

export function countWords(content: string): number {
  const cleaned = content.trim()
  if (!cleaned) return 0
  return cleaned.split(/\s+/).filter(Boolean).length
}

export function estimateReadingTime(content: string): number {
  const words = countWords(content)
  return Math.max(1, Math.round(words / 200))
}

export function generateSummary(content: string): string {
  const cleaned = content.trim()
  if (!cleaned || cleaned.length < 200) {
    return 'Not çok kısa, özet oluşturulamadı.'
  }

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 20)

  if (paragraphs.length === 0) return 'Not çok kısa, özet oluşturulamadı.'

  const sentences = paragraphs.map(para => {
    // Take first sentence of each paragraph
    const match = para.match(/[^.!?]*[.!?]/)
    return match ? match[0].trim() : para.substring(0, 120).trim()
  })

  return sentences.filter(Boolean).join(' ')
}

const SIGNAL_WORDS = ['önemli', 'dikkat', 'not:', 'sonuç', 'özetle', 'mutlaka', 'kritik', 'temel', 'anahtar']

export function extractKeyPoints(content: string): string[] {
  const cleaned = content.trim()
  if (!cleaned) return []

  // Split into sentences
  const sentences = cleaned
    .split(/[.!?]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15)

  // First try: sentences with signal words
  const signalSentences = sentences.filter(s =>
    SIGNAL_WORDS.some(word => s.toLowerCase().includes(word))
  )

  if (signalSentences.length >= 2) {
    return signalSentences.slice(0, 5)
  }

  // Fallback: first sentence of each paragraph
  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 20)

  const points = paragraphs.map(para => {
    const match = para.match(/[^.!?]*[.!?]/)
    return match ? match[0].trim() : para.substring(0, 150).trim()
  })

  return points.filter(Boolean).slice(0, 5)
}

export function generateFlashcards(content: string): Array<{ question: string; answer: string }> {
  const cleaned = content.trim()
  if (!cleaned) return []

  const flashcards: Array<{ question: string; answer: string }> = []

  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    if (flashcards.length >= 10) break

    // Pattern: "X: Y"
    const colonMatch = line.match(/^([^:]{3,40}):\s*(.{5,})$/)
    if (colonMatch && !colonMatch[1].toLowerCase().startsWith('http')) {
      flashcards.push({
        question: `${colonMatch[1].trim()} nedir?`,
        answer: colonMatch[2].trim(),
      })
      continue
    }

    // Pattern: "X — Y" or "X - Y" (dash definition)
    const dashMatch = line.match(/^([^—\-]{3,40})\s*[—–-]\s*(.{5,})$/)
    if (dashMatch) {
      flashcards.push({
        question: `${dashMatch[1].trim()} nedir/ne anlama gelir?`,
        answer: dashMatch[2].trim(),
      })
      continue
    }

    // Pattern: "X = Y"
    const eqMatch = line.match(/^([^=]{3,40})\s*=\s*(.{3,})$/)
    if (eqMatch) {
      flashcards.push({
        question: `${eqMatch[1].trim()} neye eşittir?`,
        answer: eqMatch[2].trim(),
      })
      continue
    }

    // Pattern: "X nedir? Y" — already in question form
    const qMatch = line.match(/^(.{5,60}\?)\s+(.{5,})$/)
    if (qMatch) {
      flashcards.push({
        question: qMatch[1].trim(),
        answer: qMatch[2].trim(),
      })
      continue
    }

    // Short definitional sentences (under 100 chars, contains "dir/dır/tır/tir")
    if (line.length <= 100 && /[dt][ıiuü]r\.?$/.test(line)) {
      const words = line.split(/\s+/)
      if (words.length >= 4 && words.length <= 15) {
        flashcards.push({
          question: `"${words.slice(0, 3).join(' ')}" hakkında ne biliyorsunuz?`,
          answer: line,
        })
      }
    }
  }

  return flashcards.slice(0, 10)
}

export function generateQuiz(content: string): Array<{ question: string; options: string[]; correct: number }> {
  const cleaned = content.trim()
  if (!cleaned) return []

  const quiz: Array<{ question: string; options: string[]; correct: number }> = []

  // Extract key terms and facts from content
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 10)
  const sentences = cleaned.split(/[.!?]\s+/).map(s => s.trim()).filter(s => s.length > 20)

  // Try to build questions from colon definitions (most reliable)
  const definitions: Array<{ term: string; def: string }> = []
  for (const line of lines) {
    const colonMatch = line.match(/^([^:]{3,40}):\s*(.{5,120})$/)
    if (colonMatch && !colonMatch[1].toLowerCase().startsWith('http')) {
      definitions.push({ term: colonMatch[1].trim(), def: colonMatch[2].trim() })
    }
    const dashMatch = line.match(/^([^—\-]{3,40})\s*[—–-]\s*(.{5,120})$/)
    if (dashMatch) {
      definitions.push({ term: dashMatch[1].trim(), def: dashMatch[2].trim() })
    }
  }

  // Generate MC questions from definitions
  for (let i = 0; i < definitions.length && quiz.length < 5; i++) {
    const { term, def } = definitions[i]
    // Generate 3 distractors from other definitions or generic ones
    const others = definitions.filter((_, idx) => idx !== i).map(d => d.def)
    const distractors = others.slice(0, 3)
    while (distractors.length < 3) {
      distractors.push(generateDistractor(def, distractors.length))
    }
    const correctIndex = Math.floor(Math.random() * 4)
    const options = [...distractors.slice(0, 3)]
    options.splice(correctIndex, 0, def)

    quiz.push({
      question: `"${term}" için doğru açıklama hangisidir?`,
      options: options.slice(0, 4),
      correct: correctIndex,
    })
  }

  // If not enough, add comprehension questions from sentences
  if (quiz.length < 3 && sentences.length > 0) {
    const topicSentence = sentences[0]
    quiz.push({
      question: 'Bu notun ana konusu aşağıdakilerden hangisidir?',
      options: [
        topicSentence.substring(0, 60) + (topicSentence.length > 60 ? '...' : ''),
        'Yukarıdakilerin hiçbiri',
        'Konuyla ilgisiz bir bilgi',
        'Tanımsız bir kavram',
      ],
      correct: 0,
    })
  }

  if (quiz.length === 0) {
    // Generic comprehension fallback
    quiz.push({
      question: 'Bu notun içeriğini en iyi özetleyen ifade hangisidir?',
      options: [
        cleaned.substring(0, 80).trim() + '...',
        'Konuyla ilgisiz bilgiler içermektedir',
        'Hiçbir bilgi verilmemiştir',
        'Yalnızca başlıktan ibarettir',
      ],
      correct: 0,
    })
  }

  return quiz.slice(0, 5)
}

function generateDistractor(correctAnswer: string, index: number): string {
  const distractors = [
    'Verilen tanım doğru değildir',
    'Bu terim farklı bir anlam taşımaktadır',
    'Konuyla ilişkisi bulunmamaktadır',
    'Yanlış bir açıklama yapılmıştır',
  ]
  return distractors[index % distractors.length]
}
