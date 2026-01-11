export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

  const message = String(req.body?.message || '').trim()
  if (!message) return res.status(400).json({ error: 'Invalid message' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' })

  // ✅ Use a current, documented model
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const payload = {
    // ✅ system_instruction is shown in Google’s REST examples
    system_instruction: {
      parts: [{ text: `
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
- Be funny with laughing emojis in funny moment.
- If asked for code, explain in simple words instead.
- Be friendly, clear, and helpful.
` }]
    },
    contents: [
      { role: 'user', parts: [{ text: message }] }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 300
    }
  }

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await r.json().catch(() => null)

    // ✅ If Gemini returns an error, show it clearly
    if (!r.ok) {
      return res.status(r.status).json({
        error: 'Gemini API error',
        details: data || null
      })
    }

    // ✅ Sometimes Gemini returns no candidates; show promptFeedback
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!reply) {
      return res.status(200).json({
        reply: "Sorry, I couldn't generate a response.",
        debug: {
          promptFeedback: data?.promptFeedback || null,
          finishReason: data?.candidates?.[0]?.finishReason || null,
          raw: data
        }
      })
    }

    return res.status(200).json({ reply })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'AI request failed', details: String(e?.message || e) })
  }
}
