export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text, source } = req.body
    
    // Use OpenAI or Claude API for advanced bias detection
    const prompt = `Analyze the following news text for bias. Provide:
1. Bias percentage (0-100)
2. Bias level (Low/Medium/High)
3. Brief analysis explaining the bias indicators
4. Detected bias types (political, emotional, sensational, etc.)

Text: "${text}"
Source: "${source}"

Respond in JSON format.`

    // Example response structure
    const analysis = {
      biasPercentage: 25,
      biasLevel: 'Medium',
      analysis: 'The article uses some emotional language and opinion-based statements that indicate moderate bias.',
      detectedBias: [
        { type: 'emotional', matches: ['shocking', 'devastating'] },
        { type: 'opinion', matches: ['clearly', 'obviously'] }
      ]
    }

    res.status(200).json(analysis)
  } catch (error) {
    res.status(500).json({ error: 'Bias analysis failed' })
  }
}