import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message } = req.body

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message' })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ],
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
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400
          }
        })
      }
    )

    const data = await response.json()

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Sorry, I could not generate a response.'

    res.status(200).json({ reply: text })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'AI request failed' })
  }
}
