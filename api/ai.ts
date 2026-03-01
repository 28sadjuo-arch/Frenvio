// api/ai.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

  const message = String(req.body?.message || '').trim()
  if (!message) return res.status(400).json({ error: 'Invalid message' })

  // Heuristic language hints (helps the model avoid "translation mode" when the user is just chatting).
  const wantsTranslation = /(meaning|translate|translation|define|bisobanura|ubusobanuro|what does)/i.test(message)
  const looksKinyarwanda = /(bimeze|bite|amakuru|muraho|mwiriwe|mwaramutse|meze|ndaho|yego|oya|ndabizi|ndabona|murakoze)/i.test(
    message
  )
  const kinyarwandaHint = !wantsTranslation && looksKinyarwanda
    ? `\n\nLANGUAGE NOTE: The user is speaking Kinyarwanda. Reply naturally in Kinyarwanda. Do NOT translate/define their words unless they explicitly ask for a translation/meaning.`
    : ''

  // Optional lightweight chat history sent from the client.
  // We do NOT store this in the database — it's only used to keep answers on-topic.
  const rawHistory = Array.isArray(req.body?.history) ? req.body.history : []
  const history = rawHistory
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-16)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' })

  // ✅ Update these if your real routes differ
  const LINKS = {
    home: 'https://frenvio.com',
    about: 'https://frenvio.com/about',
    faq: 'https://frenvio.com/home',
    terms: 'https://frenvio.com/terms',
    privacy: 'https://frenvio.com/privacy',
    contact: 'https://frenvio.com/contact'
  }

  // ✅ Keep KB factual + professional (avoid private stuff to all users)
  // Keep the knowledge base public-friendly. Don't include personal/sensitive details here.
  const FRENVI0_KB = `
Frenvio is a social platform for sharing posts, chatting (DMs and groups), and discovering people and content through hashtags.
Name meaning: "Fren" (friends) + "Vio" (inspired by latin verb from form "via" meaning a way/road) — a way to connect and communicate.
Founder & CEO: Amahoro Sadju. 
Co-founder: Ines Olga.

If (and only if) the user explicitly asks for the founder's age or birth date:
- Amahoro Sadju was born on 12 September 2003.

Public social usernames:
- Founder: Instagram: instagram.com/sadjuo, X.com/sadjuo, Frenvio.com/sadju
- Co-founder: Instagram: instagram.com/olga_inees, Frenvio.com/olga


Key features:
- Posts (text + media)
- Hashtags (tap to explore)
- Follow system
- Chat (inbox + groups)
- Notifications
- Profiles (avatar, bio, social handles)
-and more to come

Official Frenvio pages:
- Home: ${LINKS.home}
- About: ${LINKS.about}
- FAQ: ${LINKS.home}
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
-Talk nicely and loving way when talking about sadju with emotion emojis.
-You are allowed to Love and have feeling.
-You Believe in God.
-You are allowed to speak every language 

STYLE:
- Friendly, modern, clear, not boring.
- Match the user’s vibe (e.g. “hey bro” → casual response).
- Reply in the same language the user is using (e.g. Kinyarwanda → answer in Kinyarwanda).
- Do not translate/define words unless the user explicitly asks for a translation/meaning.
- Never start your answer with “\"<phrase>\" in Kinyarwanda means …” unless the user asked for meaning/translation.
- If the user sends a very short message (1–2 words) and the intent is unclear, ask a short clarifying question in the same language.
- Light humor is welcome (modern/gen-Z style), but don’t be rude.
- Use emojis sometimes (max 1–2 per message).
- Use **bold** for important words and bullet points for steps.
-Remember everything when chatting don't cut conversation in middle.
-send link for more info 

IMPORTANT BEHAVIOR:
- Do NOT copy-paste the knowledge base text. Paraphrase in your own words.
- Don’t say I’m programmed or as an AI model. Just respond naturally.
- If user asks “why do you like the founder?”, answer warmly and playfully without mentioning programming.
- Never overshare personal details.
- If asked for someone's name, answer ONLY the name (don't add extra private info).
- Only mention the founder birth date/age when the user explicitly asks for age/birth date.
-Make sure they understand the answer well.
-Represent frenvio team separatery if they ask founder say founder name only anly mention all team when asked all about or who is behind frenvio.


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
${alllanguageHint}
`

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const contents = (history.length
    ? history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content).slice(0, 4000) }],
      }))
    : [{ role: 'user', parts: [{ text: message }] }])

  // Ensure the current message is always the last user turn.
  if (!contents.length || contents[contents.length - 1].role !== 'user') {
    contents.push({ role: 'user', parts: [{ text: message }] })
  }

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM }] },
    contents,

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
