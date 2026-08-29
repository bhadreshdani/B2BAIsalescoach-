'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CalendlyButton from '@/components/CalendlyButton'

const ATTITUDE = [{id:'a1',q:'Goal Orientation',desc:'How driven are you to achieve and exceed sales targets?'},{id:'a2',q:'Resilience & Persistence',desc:'How well do you bounce back from rejections and setbacks?'},{id:'a3',q:'Self-Motivation',desc:'Can you push yourself without external pressure?'},{id:'a4',q:'Positive Mindset',desc:'Do you see challenges as opportunities?'},{id:'a5',q:'Ownership & Accountability',desc:'Do you take full responsibility for your results?'},{id:'a6',q:'Customer-First Thinking',desc:'Do you genuinely prioritise customer success?'},{id:'a7',q:'Growth Mindset',desc:'Are you constantly learning and improving?'},{id:'a8',q:'Ethical Standards',desc:'Do you maintain integrity even under pressure?'},{id:'a9',q:'Time Discipline',desc:'Do you respect your own and others\' time?'},{id:'a10',q:'Competitive Drive',desc:'Do you actively study and outperform competitors?'},{id:'a11',q:'Adaptability',desc:'How quickly do you adjust to changing situations?'}]
const SKILL = [{id:'s1',q:'Prospecting & Lead Generation',desc:'Can you consistently identify and reach new prospects?'},{id:'s2',q:'Discovery & Questioning',desc:'Do you ask deep questions that uncover real needs?'},{id:'s3',q:'Presentation & Communication',desc:'Can you articulate value clearly and persuasively?'},{id:'s4',q:'Objection Handling',desc:'Do you address concerns confidently without discounting?'},{id:'s5',q:'Negotiation & Closing',desc:'Can you navigate complex negotiations to a win-win?'},{id:'s6',q:'Relationship Building',desc:'Do you build trust that lasts beyond individual transactions?'},{id:'s7',q:'Pipeline Management',desc:'Do you manage a healthy, balanced pipeline?'},{id:'s8',q:'Follow-Up Discipline',desc:'Do you follow up consistently with added value?'},{id:'s9',q:'Stakeholder Management',desc:'Can you manage multiple decision-makers in a deal?'},{id:'s10',q:'Digital Selling',desc:'Do you effectively use LinkedIn, email, CRM tools?'}]
const KNOWLEDGE = [{id:'k1',q:'Product & Application Knowledge',desc:'How deeply do you know your products and their applications?'},{id:'k2',q:'Industry & Market Knowledge',desc:'Do you understand market trends, regulations, and dynamics?'},{id:'k3',q:'Customer Business Understanding',desc:'Do you understand how your customers make money?'},{id:'k4',q:'Competitor Intelligence',desc:'Do you know competitor strengths, weaknesses, and strategies?'},{id:'k5',q:'Financial Acumen',desc:'Can you discuss ROI, TCO, payback periods confidently?'},{id:'k6',q:'Sales Process & Methodology',desc:'Do you follow a structured sales process?'},{id:'k7',q:'Technology & Tools',desc:'Are you proficient with CRM, analytics, and sales tools?'},{id:'k8',q:'Legal & Commercial Terms',desc:'Do you understand contracts, warranties, payment terms?'},{id:'k9',q:'Value Chain Understanding',desc:'Do you know the full value chain from supplier to end user?'},{id:'k10',q:'Cross-Functional Knowledge',desc:'Do you understand production, logistics, service functions?'}]

const PILLARS = [{name:'Attitude',weight:35,items:ATTITUDE,color:'#2563eb'},{name:'Skill',weight:35,items:SKILL,color:'#16a34a'},{name:'Knowledge',weight:30,items:KNOWLEDGE,color:'#9333ea'}]
const BANDS = [{min:8.5,label:'PRO',color:'#16a34a'},{min:7,label:'Advanced',color:'#2563eb'},{min:5.5,label:'Intermediate',color:'#f59e0b'},{min:4,label:'Developing',color:'#f97316'},{min:0,label:'Foundation',color:'#dc2626'}]

export default function AssessmentPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [pillarIdx, setPillarIdx] = useState(0)
  const [scores, setScores] = useState<Record<string,number>>({})
  const [phase, setPhase] = useState<'intro'|'scoring'|'results'>('intro')
  const [saving, setSaving] = useState(false)
  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
    }
    init()
  }, [router])

  const currentPillar = PILLARS[pillarIdx]
  const allDone = PILLARS.every(p => p.items.every(i => scores[i.id] !== undefined))

  function pillarAvg(items: any[]): number {
    const answered = items.filter(i => scores[i.id] !== undefined)
    if (answered.length === 0) return 0
    return answered.reduce((s, i) => s + (scores[i.id] || 0), 0) / answered.length
  }

  function overallScore(): number {
    return PILLARS.reduce((s, p) => s + pillarAvg(p.items) * (p.weight / 100), 0)
  }

  function getBand(score: number) {
    return BANDS.find(b => score >= b.min) || BANDS[BANDS.length - 1]
  }

  async function handleFinish() {
    setSaving(true)
    const aAvg = parseFloat(pillarAvg(ATTITUDE).toFixed(1))
    const sAvg = parseFloat(pillarAvg(SKILL).toFixed(1))
    const kAvg = parseFloat(pillarAvg(KNOWLEDGE).toFixed(1))
    const overall = parseFloat(overallScore().toFixed(1))
    const band = getBand(overall)

    const allItems = [...ATTITUDE,...SKILL,...KNOWLEDGE].map(i => ({...i, score: scores[i.id]||0})).sort((a,b) => b.score - a.score)
    const strengths = allItems.slice(0,3).map(i => `${i.q}: ${i.score}/10`)
    const gaps = allItems.slice(-3).reverse().map(i => `${i.q}: ${i.score}/10`)

    const r = { aAvg, sAvg, kAvg, overall, band, strengths, gaps, allItems }
    setResults(r)

    await fetch('/api/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, ask_score: overall, ask_attitude: aAvg, ask_skill: sAvg, ask_knowledge: kAvg })
    })
    setSaving(false)
    setPhase('results')
  }

  if (!user) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>

  return (
    <div style={{minHeight:'100vh',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      <header style={{background:'#0D1B2A',color:'#fff',padding:'12px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:14,fontWeight:'bold',color:'#C8943E'}}>B2BsalesBUDDY</span>
          <span style={{color:'#444'}}>|</span>
          <button onClick={() => {
            if (phase === 'scoring' && pillarIdx > 0) setPillarIdx(pillarIdx - 1)
            else if (phase === 'scoring' && pillarIdx === 0) setPhase('intro')
            else if (phase === 'results') setPhase('scoring')
            else router.back()
          }} style={{display:'flex',alignItems:'center',gap:4,color:'#C8943E',fontSize:13,background:'rgba(200,148,62,0.15)',border:'none',cursor:'pointer',padding:'6px 12px',borderRadius:6,fontWeight:600}}>🏠 Home</button>
          <span style={{color:'#444'}}>|</span>
          <h1 style={{fontSize:16,fontWeight:'bold'}}>🔥 ASK™ Competency Assessment</h1>
        </div>
      </header>

      <div style={{maxWidth:640,margin:'0 auto',padding:24}}>
        {phase === 'intro' && (
          <div style={{background:'#fff',borderRadius:12,padding:32,textAlign:'center'}}>
            <p style={{fontSize:48,marginBottom:16}}>🔥</p>
            <h2 style={{fontSize:22,fontWeight:'bold',marginBottom:8}}>ASK™ Competency Assessment</h2>
            <p style={{fontSize:14,color:'#888',marginBottom:24}}>Assess your sales competency across 3 pillars: Attitude (35%), Skill (35%), Knowledge (30%). Total: 31 questions.</p>
            <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:24}}>
              {PILLARS.map(p => (
                <div key={p.name} style={{textAlign:'center'}}>
                  <div style={{fontSize:24,fontWeight:'bold',color:p.color}}>{p.items.length}</div>
                  <div style={{fontSize:12,color:'#888'}}>{p.name} ({p.weight}%)</div>
                </div>
              ))}
            </div>
            <button onClick={() => setPhase('scoring')} style={{padding:'14px 40px',background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:16,fontWeight:700,cursor:'pointer'}}>Start Assessment →</button>
          </div>
        )}

        {phase === 'scoring' && (
          <div>
            {/* Pillar Tabs */}
            <div style={{display:'flex',gap:4,marginBottom:16}}>
              {PILLARS.map((p,i) => (
                <button key={p.name} onClick={() => setPillarIdx(i)} style={{flex:1,padding:'10px',borderRadius:8,border:'none',fontSize:13,fontWeight:600,cursor:'pointer',background:i===pillarIdx?p.color:'#e5e7eb',color:i===pillarIdx?'#fff':'#666'}}>
                  {p.name} ({p.weight}%)
                </button>
              ))}
            </div>

            {/* Questions */}
            {currentPillar.items.map((item: any, idx: number) => (
              <div key={item.id} style={{background:'#fff',borderRadius:10,padding:16,marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:14,fontWeight:600}}>{idx+1}. {item.q}</span>
                  <span style={{fontSize:18,fontWeight:'bold',color:scores[item.id]>=7?'#16a34a':scores[item.id]>=5?'#f59e0b':'#dc2626',width:30,textAlign:'right'}}>{scores[item.id]||'—'}</span>
                </div>
                <p style={{fontSize:12,color:'#888',marginBottom:8}}>{item.desc}</p>
                <input type="range" min="1" max="10" value={scores[item.id]||5} onChange={e => setScores({...scores,[item.id]:parseInt(e.target.value)})} style={{width:'100%',accentColor:currentPillar.color}} />
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#ccc'}}><span>1 — Low</span><span>10 — Expert</span></div>
              </div>
            ))}

            {/* Navigation */}
            <div style={{display:'flex',gap:8,marginTop:16}}>
              {pillarIdx > 0 && <button onClick={() => setPillarIdx(pillarIdx-1)} style={{padding:14,background:'#f3f4f6',border:'none',borderRadius:8,fontSize:14,cursor:'pointer'}}>← Previous</button>}
              {pillarIdx < 2 ? (
                <button onClick={() => setPillarIdx(pillarIdx+1)} style={{flex:1,padding:14,background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer'}}>Next: {PILLARS[pillarIdx+1]?.name} →</button>
              ) : (
                <button onClick={handleFinish} disabled={saving} style={{flex:1,padding:14,background:saving?'#d4a855':'#16a34a',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:saving?'wait':'pointer'}}>{saving?'Calculating...':'See My Results →'}</button>
              )}
            </div>
          </div>
        )}

        {phase === 'results' && results && (
          <div>
            <div style={{background:'#0D1B2A',borderRadius:12,padding:24,color:'#fff',textAlign:'center',marginBottom:16}}>
              <p style={{fontSize:12,color:'#888'}}>Your ASK™ Score</p>
              <p style={{fontSize:48,fontWeight:'bold',color:results.band.color}}>{results.overall.toFixed(1)}</p>
              <p style={{fontSize:18,fontWeight:600,color:results.band.color}}>{results.band.label}</p>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
              {[{label:'Attitude',val:results.aAvg,w:35,color:'#2563eb'},{label:'Skill',val:results.sAvg,w:35,color:'#16a34a'},{label:'Knowledge',val:results.kAvg,w:30,color:'#9333ea'}].map(p => (
                <div key={p.label} style={{background:'#fff',borderRadius:10,padding:16,textAlign:'center'}}>
                  <p style={{fontSize:12,color:'#888'}}>{p.label} ({p.w}%)</p>
                  <p style={{fontSize:28,fontWeight:'bold',color:p.color}}>{p.val.toFixed(1)}</p>
                  <div style={{height:6,background:'#e5e7eb',borderRadius:3,marginTop:8}}><div style={{width:`${p.val*10}%`,height:6,background:p.color,borderRadius:3}} /></div>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <div style={{background:'#f0fdf4',borderRadius:10,padding:16}}>
                <h3 style={{fontSize:13,fontWeight:700,color:'#16a34a',marginBottom:8}}>💪 Top 3 Strengths</h3>
                {results.strengths.map((s: string,i: number) => <p key={i} style={{fontSize:12,marginBottom:4}}>✓ {s}</p>)}
              </div>
              <div style={{background:'#fef2f2',borderRadius:10,padding:16}}>
                <h3 style={{fontSize:13,fontWeight:700,color:'#dc2626',marginBottom:8}}>⚠️ Development Areas</h3>
                {results.gaps.map((s: string,i: number) => <p key={i} style={{fontSize:12,marginBottom:4}}>✗ {s}</p>)}
              </div>
            </div>

            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <Link href={`/dashboard/chat?prompt=${encodeURIComponent(`Based on my ASK competency assessment, my weakest areas are: ${results.gaps.join(', ')}. Help me create a 3-month development plan.`)}`} style={{padding:'10px 20px',background:'#C8943E',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>💬 Get Development Plan</Link>
              <button onClick={() => {
                const txt = `ASK™ Competency Assessment\nOverall: ${results.overall.toFixed(1)}/10 — ${results.band.label}\nAttitude: ${results.aAvg.toFixed(1)} | Skill: ${results.sAvg.toFixed(1)} | Knowledge: ${results.kAvg.toFixed(1)}\n\nStrengths: ${results.strengths.join(', ')}\nDevelopment: ${results.gaps.join(', ')}`
                try{navigator.clipboard.writeText(txt)}catch(e){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta)}
                alert('Copied!')
              }} style={{padding:'10px 20px',background:'#f3f4f6',borderRadius:8,fontSize:13,fontWeight:600,border:'none',cursor:'pointer'}}>📋 Copy</button>
              <button onClick={() => {setPhase('scoring');setPillarIdx(2)}} style={{padding:'10px 20px',background:'#fff',border:'1px solid #ddd',borderRadius:8,fontSize:13,cursor:'pointer'}}>← Edit Scores</button>
              <button onClick={() => {setPhase('intro');setScores({});setPillarIdx(0)}} style={{padding:'10px 20px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:8,fontSize:13,cursor:'pointer',color:'#dc2626'}}>↻ Start Fresh</button>
              <Link href="/dashboard" style={{padding:'10px 20px',background:'#0D1B2A',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>← Dashboard</Link>
            </div>
          </div>
        )}
      </div>
      <div style={{position:'fixed',bottom:24,left:24,zIndex:9999}}>
        <button onClick={() => router.back()} style={{display:'flex',alignItems:'center',gap:6,padding:'12px 20px',background:'#0D1B2A',color:'#fff',borderRadius:40,boxShadow:'0 4px 16px rgba(0,0,0,0.25)',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>← Back</button>
      </div>

      <CalendlyButton />
    </div>
  )
}
