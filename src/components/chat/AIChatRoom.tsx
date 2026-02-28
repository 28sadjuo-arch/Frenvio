import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import React, { useEffect, useRef, useState } from 'react'
import { Bot, Send } from 'lucide-react'

type AiMsg = { id: string; role: 'user' | 'assistant'; content: string; created_at: string }

const STORAGE_KEY = 'frenvio_ai_chat_v1'
const MAX_HISTORY = 16

function localAnswer(prompt: string) {
  const p = prompt.toLowerCase()
  if (p.includes('help') || p.includes('how')) return "Tell me what you're trying to do and I’ll guide you step by step."
  if (p.includes('frenvio')) return "Frenvio AI here. Ask me anything about Frenvio or Anything."
  if (p.includes('sql')) return "If you're pasting SQL in Supabase, share the error line and I’ll fix it."
  return "I’m Frenvio AI. I can answer questions, suggest ideas, and help troubleshoot. What do you want to do?"
}

// ✅ This version shows the REAL error instead of silently falling back
async function callApi(prompt: string, history: Array<Pick<AiMsg, 'role' | 'content'>>): Promise<string> {
  let res: Response | null = null
  try {
    res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Send lightweight chat history (client-side only; not stored in DB)
      body: JSON.stringify({ message: prompt, history }),
    })
  } catch (e: any) {
    return `⚠️ Frenvio AI backend not reachable. (Network error)\n\n${String(e?.message || e)}`
  }

  // If Vercel returns 404/500, show the real status + body snippet
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    const snippet = bodyText ? bodyText.slice(0, 300) : ''
    return `⚠️ Frenvio AI error calling /api/ai\nStatus: ${res.status} ${res.statusText}\n\n${snippet || '(no response body)'}`
  }

  const data = await res.json().catch(() => null)
  const reply = data?.reply

  if (typeof reply === 'string' && reply.trim()) {
    return reply.trim()
  }

  return `⚠️ Frenvio AI returned no reply field.\nResponse: ${JSON.stringify(data)}`
}

const AIChatRoom: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [messages, setMessages] = useState<AiMsg[]>(() => {
    // Persist only in the browser (localStorage). Nothing is saved in your database.
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? (JSON.parse(raw) as AiMsg[]) : null
      if (Array.isArray(parsed) && parsed.length) return parsed
    } catch {
      // ignore
    }
    return [{ id: 'w', role: 'assistant', content: 'Hi 👋 I’m Frenvio AI. Ask me anything.', created_at: new Date().toISOString() }]
  })
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }

  useEffect(() => scrollToBottom(), [messages.length])

  // Save chat locally so Frenvio AI can stay on topic across refreshes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)))
    } catch {
      // ignore
    }
  }, [messages])

  const send = async () => {
    const prompt = text.trim()
    if (!prompt || loading) return

    setText('')

    const userMsg: AiMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      created_at: new Date().toISOString(),
    }

    setMessages((p) => [...p, userMsg])
    setLoading(true)

    // Send a compact history window so replies stay on topic.
    const compactHistory = [...messages, userMsg]
      .slice(-MAX_HISTORY)
      .map(({ role, content }) => ({ role, content }))

    const answer = await callApi(prompt, compactHistory).catch((e) => `⚠️ AI failed: ${String(e)}`)

    const botMsg: AiMsg = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: answer || localAnswer(prompt),
      created_at: new Date().toISOString(),
    }

    setMessages((p) => [...p, botMsg])
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-[100dvh] md:h-[calc(100vh-56px-64px)]">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        {onBack && (
          <button
            className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
            onClick={onBack}
            aria-label="Back"
            type="button"
          >
            ←
          </button>
        )}
        <div className="h-9 w-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <div className="font-extrabold leading-tight">Frenvio AI</div>
          <div className="text-xs text-slate-500">Online</div>
        </div>
      </div>

      <div ref={listRef} className="p-4 space-y-3 overflow-y-auto flex-1">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[86%] rounded-2xl px-4 py-2 ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
              }`}
            >
              {m.role === 'assistant' ? (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      a: ({ node, ...props }) => (
        <a
          {...props}
          target="_blank"
          rel="noreferrer"
          className="underline text-blue-600 dark:text-blue-400"
        />
      ),
      // hide code blocks completely (you requested no code generation)
      code: () => null,
      pre: () => null,
    }}
  >
    {m.content}
  </ReactMarkdown>
) : (
  <div className="whitespace-pre-wrap break-words">{m.content}</div>
)}

            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-500">Thinking…</div>}
      </div>

      <div className="shrink-0 p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask Frenvio AI…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button
            onClick={send}
            disabled={loading}
            className="px-4 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIChatRoom
