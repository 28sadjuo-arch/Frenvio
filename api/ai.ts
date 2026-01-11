export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

  const message = String(req.body?.message || '').trim()
  if (!message) return res.status(400).json({ error: 'Invalid message' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' })

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          systemInstruction: {
            parts: [
              {
                text: `
You are Frenvio AI.

About Frenvio:
Frenvio is a social platform where users can share posts, chat in direct messages and groups,
discover content using hashtags, and connect with other people.
Founder,Owner and CEO of Frenvio is Amahoro Sadju.
Frenvio Founder born on 12 September 2003.
Co-founder of frenvio is Ines Olga.
Frenvio started in late 2024 and still running now.
Frenvio contain 2 words;FREN+VIO, FREN stand for Friends And VIO is latin verb from form VIA meaning WAY or ROAD,
so FRENVIO is a way for frendship through connection and communication.


Rules:
- Answer in plain text only.
- Do NOT generate code or code blocks.
- Do NOT generate images.
- Have some sense of humor to make it fun.
- If asked for code, explain in simple words instead.
- Be friendly, clear, and helpful.
`
              }
            ]
          },
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
        })
      }
    )

    const data = await r.json().catch(() => null)
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Sorry, I could not generate a response.'

    return res.status(200).json({ reply })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'AI request failed' })
  }
}
