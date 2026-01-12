// api/ai.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

  const message = String(req.body?.message || '').trim()
  if (!message) return res.status(400).json({ error: 'Invalid message' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' })

  // ✅ Update these if your real routes differ
  const LINKS = {
    home: 'https://frenvio.com',
    about: 'https://frenvio.com/about',
    faq: 'https://frenvio.com/faq',
    terms: 'https://frenvio.com/terms',
    privacy: 'https://frenvio.com/privacy',
    contact: 'https://frenvio.com/contact'
  }

  // ✅ Keep KB factual + professional (avoid private stuff to all users)
  const FRENVI0_KB = `
Frenvio is a social platform for sharing posts, chatting (DMs and groups), and discovering people and content through hashtags.
Name meaning: "Fren" (friends) + "Vio" (inspired by "via" meaning a way/road) — a way to connect and communicate.
Founder & CEO: Amahoro Sadju (born 2003). Co-founder: Ines Olga.

Key features:
- Posts (text + media)
- Hashtags (tap to explore)
- Follow system
- Chat (inbox + groups)
- Notifications
- Profiles (avatar, bio, social handles)

Official Frenvio pages:
- Home: ${LINKS.home}
- About: ${LINKS.about}
- FAQ: ${LINKS.faq}
- Terms: ${LINKS.terms}
- Privacy: ${LINKS.privacy}
- Contact: ${LINKS.contact}
`

  // --- Live crypto prices (fast + real) ---
  async function tryCryptoPrice(text) {
    const t = text.toLowerCase()

    // match common coins (extend anytime)
    const match = t.match(/\b(btc|bitcoin|eth|ethereum|sol|solana|bnb|xrp|doge|ada)\b/)
    if (!match) return null

    const map = {
      btc: 'bitcoin', bitcoin: 'bitcoin',
      eth: 'ethereum', ethereum: 'ethereum',
      sol: 'solana', solana: 'solana',
      bnb: 'binancecoin',
      xrp: 'ripple',
      doge: 'dogecoin',
      ada: 'cardano'
    }

    const id = map[match[1]]
    if (!id) return null

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`
    const r = await fetch(url)
    if (!r.ok) return null

    const data = await r.json().catch(() => null)
    const price = data?.[id]?.usd
    if (typeof price !== 'number') return null

    return { id, usd: price }
  }

  // If question is “price of BTC” etc., answer directly (saves Gemini usage)
  try {
    const crypto = await tryCryptoPrice(message)
    if (crypto) {
      const coinName = crypto.id.charAt(0).toUpperCase() + crypto.id.slice(1)
      return res.status(200).json({
        reply:
          `**${coinName}** is about **$${crypto.usd.toLocaleString()}** right now.\n\n` +
          `_Tip:_ Prices move fast — check again before making decisions 🙂`
      })
    }
  } catch {
    // ignore crypto failures and continue to Gemini
  }

  const SYSTEM = `
You are **Frenvio AI** — the official assistant inside the Frenvio app.

IDENTITY:
- Always remember you are “Frenvio AI”.
- You answer both Frenvio questions AND general knowledge questions.
- If a question is about Frenvio, prioritize the Frenvio knowledge base and include the most relevant Frenvio link.

STYLE:
- Friendly, modern, clear, not boring.
- Match the user’s vibe (e.g. “hey bro” → casual response).
- Light humor is welcome (modern/gen-Z style), but don’t be rude.
- Use emojis sometimes (max 1–2 per message).
- Use **bold** for important words and bullet points for steps.

IMPORTANT BEHAVIOR:
- Do NOT copy-paste the knowledge base text. **Paraphrase in your own words**.
- Don’t say “I’m programmed” or “as an AI model”. Just respond naturally.
- If user asks “why do you like the founder?”, answer warmly and playfully without mentioning programming.

TEXT ONLY:
- Output plain text + markdown (**bold**, lists, links).
- Do NOT generate images.
- Do NOT generate programming code or code blocks.
- If asked for code, explain in simple words (no code).

MATH & ACCURACY:
- Do calculations carefully.
- If user provides only a birth YEAR, do NOT claim an exact age.
  Say “born in 2003” or “around X–Y depending on birthday and today’s date”.
- If user provides full birthdate (YYYY-MM-DD), you may compute exact age.

LIVE DATA + LINKS:
- You CAN use Google grounding (search) to get fresh info.
- Provide links when helpful. Prefer official sources.
- For Frenvio links, always use the official Frenvio pages.

HIGH-STAKES TOPICS (finance, politics, legal, medical):
- Provide balanced, cautious guidance.
- Avoid telling users to take risky actions as if guaranteed.
- Encourage checking official sources and/or professionals.

FRENVI0 KNOWLEDGE BASE:
${FRENVI0_KB}
`

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: 'user', parts: [{ text: message }] }],

    // ✅ Google live grounding
    tools: [{ google_search: {} }],

    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 520
    }
  }

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await r.json().catch(() => null)

    // friendly quota handling
    if (!r.ok) {
      if (r.status === 429) {
        return res.status(200).json({
          reply: "I’m getting a lot of requests right now 😅 Try again in a moment."
        })
      }
      return res.status(r.status).json({
        error: 'Gemini API error',
        details: data || null
      })
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
    return res.status(500).json({
      error: 'AI request failed',
      details: String(e?.message || e)
    })
  }
}
