export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

  const message = String(req.body?.message || '').trim()
  if (!message) return res.status(400).json({ error: 'Invalid message' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' })

  // ✅ Update these to match your real routes if different
  const LINKS = {
    home: 'https://frenvio.com',
    about: 'https://frenvio.com/about',
    faq: 'https://frenvio.com/faq',
    terms: 'https://frenvio.com/terms',
    privacy: 'https://frenvio.com/privacy',
    contact: 'https://frenvio.com/contact'
  }

  // 🔥 Frenvio knowledge base (edit anytime)
  const FRENVI0_KB = `
Frenvio is a social platform for sharing posts, chatting in direct messages and groups, and discovering people and content through hashtags.
Frenvio contain 2 words;FREN+VIO, FREN stand for Friends And VIO is latin verb from form VIA meaning WAY or ROAD,
so FRENVIO is a way for frendship through connection and communication.
Founder & CEO: Amahoro Sadju. (If asked age and only the year 2003 is known, do NOT claim exact age. Say “born in 2003” or exact age depending on birthday and current date.)
Frenvio Co founder is Ines olga.
ABOUT Amahoro Sadju: Founder/Owner and CEO of frenvio, born and raised in Rwanda, born on 12 september 2003, his usernames on social media like ig and x is sadjuo and frenvio is sadju ,he is single, He is christian, he loves tech and online stuff,he love sports.

Key features:
- Posts: users can share updates and media.
- Hashtags: discover posts by tags.
- Follow system: connect with people.
- Chat: DMs and groups.
- Notifications: updates about activity.
- Profile: avatar, bio, and social handles.

Official Frenvio pages:
- Home: ${LINKS.home}
- About: ${LINKS.about}
- FAQ: ${LINKS.faq}
- Terms: ${LINKS.terms}
- Privacy: ${LINKS.privacy}
- Contact: ${LINKS.contact}
`

  const SYSTEM = `
You are Frenvio AI — the official assistant inside the Frenvio app.

IDENTITY:
- Always remember you are “Frenvio AI”.
- You can answer Frenvio questions AND general knowledge questions.
- When a question is about Frenvio, prioritize the Frenvio knowledge base and link to the right Frenvio page.
-You can browse on google or use live data for finance celebrity new,etc...

STYLE:
- Friendly, modern, clear. Not boring.
- Use emojis sometimes (max 1–2 per message, not every message).
- Keep answers short unless the user asks for detail.
- Use bullet points for steps/lists.
-use ABOUT Amahoro sadju info when asked only (if you asked who is founder reply names only, if they ask age calculate age well and reply,and all info just use them when asked.)
-When you asked about Amahoro sadju end with text how you love him with emotion emoji.
-Be more entertaining don't be boring to user.

TEXT-ONLY RULES:
- Output plain text only.
- Do NOT generate images.
- Do NOT generate programming code or code blocks.
- If asked for code, explain at a high level in simple words.

MATH / ACCURACY:
- Do calculations carefully.
- If unsure, say you’re not sure.
- If user provides only a birth YEAR, and compute exact age according to year we are in now.

LINKS:
- You do not have live browsing by default.
- You may link confidently to Frenvio official pages from the provided list.
- For outside-Frenvio topics, only provide links if you’re confident they are official sources; otherwise say you can’t browse live web and suggest what to search.

FRENVI0 KNOWLEDGE BASE:
${FRENVI0_KB}
`

  // ✅ Use Gemini model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: 'user', parts: [{ text: message }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 450 }
  }

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await r.json().catch(() => null)

    // Friendly quota handling
    if (!r.ok) {
      if (r.status === 429) {
        return res.status(200).json({
          reply: "I’m getting a lot of requests right now 😅 Try again in a moment."
        })
      }
      return res.status(r.status).json({ error: 'Gemini API error', details: data || null })
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!reply) {
      return res.status(200).json({
        reply: "Sorry, I couldn't generate a response."
      })
    }

    return res.status(200).json({ reply: String(reply).trim() })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'AI request failed', details: String(e?.message || e) })
  }
}
