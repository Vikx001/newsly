const BIAS_PATTERNS = {
  emotional: [
    'shocking', 'devastating', 'outrageous', 'alarming', 'horrifying', 'stunning',
    'explosive', 'dramatic', 'bombshell', 'jaw-dropping', 'mind-blowing', 'terrifying',
    'disgusting', 'heartbreaking', 'infuriating', 'catastrophic', 'unbelievable',
    'incredible', 'astounding', 'appalling', 'scandalous', 'chaotic', 'brutal'
  ],
  opinion: [
    'clearly', 'obviously', 'undoubtedly', 'certainly', 'without question', 'it is clear',
    'everyone knows', 'no one can deny', 'it is obvious', 'it is undeniable',
    'of course', 'naturally', 'needless to say', 'it goes without saying',
    'must', 'should', 'ought to', 'has to', 'needs to'
  ],
  sensational: [
    'crisis', 'disaster', 'emergency', 'collapse', 'chaos', 'meltdown', 'explosion',
    'war', 'battle', 'fight', 'attack', 'slams', 'blasts', 'rips', 'tears into',
    'destroys', 'crushes', 'obliterates', 'demolishes', 'exposed', 'busted',
    'caught red-handed', 'shocking truth', 'dark secret', 'cover-up', 'scandal'
  ],
  political: [
    'radical', 'extremist', 'far-left', 'far-right', 'socialist', 'communist',
    'fascist', 'globalist', 'elite', 'deep state', 'establishment', 'regime',
    'propaganda', 'indoctrination', 'corrupt', 'rigged', 'stolen', 'fake news',
    'mainstream media', 'woke', 'leftist', 'rightist', 'partisan'
  ],
  loaded: [
    'illegal alien', 'illegals', 'invaders', 'thugs', 'criminals', 'terrorists',
    'freedom fighters', 'heroes', 'saviors', 'traitors', 'patriots', 'enemies',
    'patriots', 'elites', 'globalists', 'puppets', 'sheeple', 'brainwashed'
  ]
}

function analyzeText(text) {
  if (!text || typeof text !== 'string') return null

  const lower = text.toLowerCase()
  const words = lower.split(/\s+/)
  const detected = []
  let totalMatches = 0

  for (const [type, terms] of Object.entries(BIAS_PATTERNS)) {
    const matches = terms.filter(term => lower.includes(term.toLowerCase()))
    if (matches.length > 0) {
      detected.push({ type, matches })
      totalMatches += matches.length
    }
  }

  // Heuristic score: word density of bias terms (capped at 100)
  const wordCount = Math.max(words.length, 1)
  const rawScore = Math.min(Math.round((totalMatches / wordCount) * 100 * 20), 100)

  // Apply a floor for articles with at least one match type
  const biasPercentage = detected.length > 0 ? Math.max(rawScore, 10) : rawScore

  let biasLevel
  if (biasPercentage < 20) biasLevel = 'Low'
  else if (biasPercentage < 50) biasLevel = 'Medium'
  else biasLevel = 'High'

  const typeNames = detected.map(d => d.type)
  let analysis

  if (detected.length === 0) {
    analysis = 'The text appears largely neutral with no strong bias indicators detected.'
  } else {
    const parts = []
    if (typeNames.includes('emotional')) parts.push('emotional language')
    if (typeNames.includes('opinion')) parts.push('opinion-framed statements')
    if (typeNames.includes('sensational')) parts.push('sensationalist framing')
    if (typeNames.includes('political')) parts.push('politically charged terms')
    if (typeNames.includes('loaded')) parts.push('loaded or prejudicial language')
    analysis = `The text contains ${parts.join(', ')}, which may indicate ${biasLevel.toLowerCase()} bias in its presentation.`
  }

  return { biasPercentage, biasLevel, analysis, detectedBias: detected }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text, source } = req.body

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text field is required' })
    }

    const analysis = analyzeText(text)
    res.status(200).json(analysis)
  } catch (error) {
    res.status(500).json({ error: 'Bias analysis failed' })
  }
}