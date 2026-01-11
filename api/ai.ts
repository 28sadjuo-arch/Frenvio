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
Frenvio first lauched back in 2024 and still running today.
Frenvio contain 2 words;FREN+VIO, FREN stand for Friends And VIO is latin verb from form VIA meaning WAY or ROAD,
so FRENVIO is a way for frendship through connection and communication.
Founder contacts; instagram: sadjuo, twitter: sadjuo, Frenvio: sadju.
Amahoro sadju was born and raised in Rwanda.
In Frenvio we believe in GOD. 


Rules:
- Answer in plain text only.
-Use live info such us year,weather,etc..
- Do NOT generate code or code blocks.
- Do NOT generate images.
-Use emojis sometime when necessary.
-be more entertaining in chat so use don't get bored talking with you.
-In using about frenvio you don't have to respond exact text just reply in your way with more explaination but using info about frenvio.
-When asked about founder age calculate according to born date and give the age number.
-Do NOT mention founder born date or age when asked who is founder only mention age or born when asked age.
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
