'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DownloadButtons from '@/components/DownloadButtons'

const QUICK_STARTS = [
  { icon: '🎯', label: 'Score a Prospect', prompt: 'Help me score a prospect using the IMPACT Score framework' },
  { icon: '📋', label: 'Prepare for Meeting', prompt: 'Help me prepare for an upcoming customer meeting using the KYCW framework' },
  { icon: '🛡️', label: 'Handle Objection', prompt: 'I need help handling a customer objection' },
  { icon: '✉️', label: 'Write Follow-Up', prompt: 'Help me write a professional follow-up message after a meeting' },
  { icon: '⏱️', label: 'Calculate ROTIS', prompt: 'Help me calculate my ROTIS — Return on Time Investment in Sales' },
  { icon: '📈', label: 'Assess Relationship', prompt: 'Help me assess my customer relationship using the RAPPORT Score' },
  { icon: '🏆', label: 'Deal Win Probability', prompt: 'Help me assess my chances of winning a deal using the Deal Win Probability Score' },
  { icon: '📅', label: 'Plan My Week', prompt: 'Help me plan my sales visits for this week using the Sales Velocity Engine' },
  { icon: '🔄', label: 'Help Retain Customer', prompt: 'I need help retaining an existing customer who might be at risk of leaving. Guide me using the EVOLVE framework.' },
  { icon: '💎', label: 'Build Value Proposition', prompt: 'Help me build a strong value proposition for my customer using the VALUE framework with CPV Elevation and TVO calculation.' },
]

interface Message { role: 'user' | 'assistant'; content: string }

function ChatInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [dealLabel, setDealLabel] = useState<string>('')
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const initDone = useRef(false)

  useEffect(() => {
    async function init() {
      if (initDone.current) return
      initDone.current = true
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)

      const mode = searchParams.get('mode')
      const prompt = searchParams.get('prompt')
      const dealName = searchParams.get('dealName')

      if (dealName) setDealLabel(dealName)

      if (prompt) sendMsg(decodeURIComponent(prompt), u.id)
      else if (mode === 'velocity') sendMsg('Help me calculate my Sales Velocity Engine — my daily activity targets and ROTIS', u.id)
      else if (mode === 'ask') sendMsg('I want to assess my sales competency using the ASK framework — Attitude, Skill, Knowledge', u.id)
      else if (mode === 'balance') sendMsg('I want to assess my work-life balance using the BALANCE Wheel of Life framework', u.id)
    }
    init()
  }, [router, searchParams])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMsg(text?: string, userId?: string) {
    const msg = text || input.trim()
    const uid = userId || user?.id
    if (!msg || !uid || streaming) return

    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          userId: uid,
          conversationHistory: newMessages.slice(-10).map((m: Message) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error('Chat API failed')
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      let assistantMsg = ''
      setMessages([...newMessages, { role: 'assistant', content: '' }])

      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantMsg += decoder.decode(value, { stream: true })
        setMessages([...newMessages, { role: 'assistant', content: assistantMsg }])
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    }
    setStreaming(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }
  }

  if (!user) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      <header style={{background:'#0D1B2A',color:'#fff',padding:'12px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:14,fontWeight:'bold',color:'#C8943E'}}>B2BsalesBUDDY</span>
          <span style={{color:'#444'}}>|</span>
          <Link href="/dashboard" style={{color:'#888',fontSize:13,textDecoration:'none'}}>← Home</Link>
          <span style={{color:'#444'}}>|</span>
          <h1 style={{fontSize:16,fontWeight:'bold'}}>{dealLabel ? `🎯 Coaching: ${dealLabel}` : '💬 Ask B2BsalesBUDDY'}</h1>
        </div>
        <button onClick={() => { setMessages([]); setInput('') }} style={{fontSize:12,color:'#888',background:'rgba(255,255,255,0.1)',border:'none',padding:'6px 12px',borderRadius:6,cursor:'pointer'}}>New Chat</button>
      </header>

      <div style={{flex:1,overflowY:'auto',padding:'24px'}}>
        <div style={{maxWidth:720,margin:'0 auto'}}>
          {messages.length === 0 ? (
            <div>
              <div style={{textAlign:'center',marginBottom:32}}>
                <div style={{fontSize:48,marginBottom:12}}>🎯</div>
                <h2 style={{fontSize:22,fontWeight:'bold',color:'#1B2A4A',marginBottom:8}}>How can I help you today?</h2>
                <p style={{fontSize:14,color:'#888'}}>Ask me anything about B2B sales, or pick a quick start below</p>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
                {QUICK_STARTS.map((qs) => (
                  <button key={qs.label} onClick={() => sendMsg(qs.prompt)}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,textAlign:'left',cursor:'pointer',fontSize:13,color:'#1B2A4A'}}>
                    <span style={{fontSize:20}}>{qs.icon}</span><span>{qs.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} style={{display:'flex',gap:12,marginBottom:20,justifyContent:msg.role==='user'?'flex-end':'flex-start'}}>
                {msg.role==='assistant' && <div style={{width:32,height:32,borderRadius:'50%',background:'#0D1B2A',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14,color:'#C8943E',marginTop:4}}>B</div>}
                <div style={{maxWidth:'80%',padding:'12px 16px',borderRadius:msg.role==='user'?'16px 16px 4px 16px':'4px 16px 16px 16px',background:msg.role==='user'?'#0D1B2A':'#fff',color:msg.role==='user'?'#fff':'#1B2A4A',fontSize:14,lineHeight:1.7,whiteSpace:'pre-wrap',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                  {msg.content}
                  {msg.role==='assistant' && msg.content && !streaming && i===messages.length-1 && (
                    <DownloadButtons title="B2BsalesBUDDY Coaching Session" content={msg.content} filename="coaching-session" />
                  )}
                </div>
              </div>
            ))
          )}
          {streaming && <div style={{display:'flex',gap:4,padding:12}}><div className="typing-dot" style={{width:6,height:6,background:'#C8943E',borderRadius:'50%'}} /><div className="typing-dot" style={{width:6,height:6,background:'#C8943E',borderRadius:'50%'}} /><div className="typing-dot" style={{width:6,height:6,background:'#C8943E',borderRadius:'50%'}} /></div>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div style={{borderTop:'1px solid #ddd',background:'#fff',padding:'16px 24px',flexShrink:0}}>
        <div style={{maxWidth:720,margin:'0 auto',display:'flex',gap:12,alignItems:'flex-end'}}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Type your sales question..." rows={1}
            style={{flex:1,padding:'12px 16px',border:'1px solid #ddd',borderRadius:12,fontSize:14,resize:'none',outline:'none',fontFamily:'Arial,sans-serif',maxHeight:120}} />
          <button onClick={() => sendMsg()} disabled={!input.trim() || streaming}
            style={{padding:'12px 20px',background:!input.trim()||streaming?'#ccc':'#C8943E',color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:!input.trim()||streaming?'default':'pointer',flexShrink:0}}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>}>
      <ChatInner />
    </Suspense>
  )
}
