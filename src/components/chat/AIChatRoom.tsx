import React, { useEffect, useRef, useState } from 'react'
import { Bot, Send } from 'lucide-react'

type AiMsg = { id: string; role: 'user' | 'assistant'; content: string; created_at: string }

function localAnswer(prompt: string) {
  const p = prompt.toLowerCase()
  if (p.includes('help') || p.includes('how')) return "Tell me what you're trying to do and I’ll guide you step by step."
  if (p.includes('frenvio')) return "Frenvio AI here. Ask me anything about Frenvio, social media ideas, or coding."
  if (p.includes('sql')) return "If you're pasting SQL in Supabase, share the error line and I’ll fix it."
  return "I’m Frenvio AI. I can answer questions, suggest ideas, and help troubleshoot. What do you want to do?"
}

async function callApi(prompt: string): Promise<string> {
  const url = import.meta.env.VITE_AI_API_URL as string | undefined
  const key = import.meta.env.VITE_AI_API_KEY as string | undefined
  if (!url) return localAnswer(prompt)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) return localAnswer(prompt)
  const data = await res.json().catch(() => null)
  return data?.text || data?.answer || data?.message || localAnswer(prompt)
}

const AIChatRoom: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [messages, setMessages] = useState<AiMsg[]>([
    { id: 'w', role: 'assistant', content: 'Hi 👋 I’m Frenvio AI. Ask me anything.', created_at: new Date().toISOString() },
  ])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }

  useEffect(() => scrollToBottom(), [messages.length])

  const send = async () => {
    const prompt = text.trim()
    if (!prompt) return
    setText('')
    const userMsg: AiMsg = { id: crypto.randomUUID(), role: 'user', content: prompt, created_at: new Date().toISOString() }
    setMessages((p) => [...p, userMsg])
    setLoading(true)
    const answer = await callApi(prompt).catch(() => localAnswer(prompt))
    const botMsg: AiMsg = { id: crypto.randomUUID(), role: 'assistant', content: answer, created_at: new Date().toISOString() }
    setMessages((p) => [...p, botMsg])
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-[100dvh] md:h-[calc(100vh-56px-64px)]">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
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
              <div className="whitespace-pre-wrap break-words">{m.content}</div>
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
          <button onClick={send} className="px-4 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Send className="h-4 w-4" /> Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIChatRoom
