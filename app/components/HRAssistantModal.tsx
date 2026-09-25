'use client'

import { useState } from 'react'
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react'

type Message = {
  sender: 'hr' | 'ai'
  text: string
}

export function HRAssistantModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Hello HR Manager! I am your Zeerostock HR Copilot. How can I assist you with policies, employee comms, or reviews today?',
    },
  ])

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || loading) return

    setMessages((previous) => [...previous, { sender: 'hr', text: trimmedPrompt }])
    setPrompt('')
    setLoading(true)

    try {
      const conversationHistory = [
        ...messages.map((message) => ({
          role: message.sender === 'hr' ? 'user' : 'assistant',
          content: message.text,
        })),
        { role: 'user', content: trimmedPrompt },
      ]

      const response = await fetch('/api/hr/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Error generating AI response.')
      }

      setMessages((previous) => [
        ...previous,
        { sender: 'ai', text: data.reply || data.text || 'I could not generate a response for that request.' },
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error. Please try again.'
      setMessages((previous) => [...previous, { sender: 'ai', text: message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-purple-400/30 bg-gradient-to-r from-purple-600 to-indigo-600 p-3.5 text-white shadow-2xl transition hover:scale-105"
      >
        <Sparkles className="h-5 w-5" />
        <span className="pr-1 text-xs font-bold tracking-wide">HR Copilot AI</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 flex h-[500px] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl border border-purple-500/20 bg-purple-600/20 p-2 text-purple-400">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
                  Zeerostock HR AI
                  <span className="rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-[10px] text-purple-300">HR ONLY</span>
                </h3>
                <p className="text-[10px] text-slate-400">Policy & Decision Intelligence</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
                className={`flex ${message.sender === 'hr' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    message.sender === 'hr'
                      ? 'rounded-br-none bg-blue-600 text-white'
                      : 'rounded-bl-none border border-slate-700/60 bg-slate-800 text-slate-200'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-none bg-slate-800 p-3 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-800 bg-slate-950 p-3">
            <input
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask HR policy, email drafts, review tips..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none transition focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="rounded-xl bg-purple-600 p-2 text-white transition hover:bg-purple-500 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
