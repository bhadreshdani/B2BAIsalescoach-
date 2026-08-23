'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SPOKES = [
  {id:'career',label:'Career & Work',icon:'💼',questions:['Satisfaction with current role','Growth opportunities in career','Work challenge and engagement','Recognition for contributions','Alignment with career goals']},
  {id:'financial',label:'Financial Health',icon:'💰',questions:['Income meets your needs','Savings and investments','Debt management','Financial security feeling','Progress toward financial goals']},
  {id:'health',label:'Health & Fitness',icon:'💪',questions:['Physical energy levels','Exercise regularity','Sleep quality','Diet and nutrition','Stress management']},
  {id:'family',label:'Family & Relationships',icon:'❤️',questions:['Quality time with family','Communication with partner','Relationship with children','Connection with parents/siblings','Work-life boundaries']},
  {id:'fun',label:'Fun & Recreation',icon:'🎯',questions:['Hobbies and interests','Vacation and breaks','Laughter and enjoyment','New experiences','Creative expression']},
  {id:'growth',label:'Personal Growth',icon:'📚',questions:['Learning new skills','Reading and education','Self-awareness','Mindfulness practice','Personal development goals']},
  {id:'social',label:'Social & Community',icon:'🤝',questions:['Friendships and social circle','Community involvement','Networking activity','Giving back and helping others','Sense of belonging']},
  {id:'spiritual',label:'Spiritual & Purpose',icon:'🙏',questions:['Sense of meaning and purpose','Inner peace and calm','Gratitude practice','Values alignment in daily life','Connection to something bigger']},
]

export default function BalancePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [phase, setPhase] = useState<'intro'|'current'|'desired'|'importance'|'results'>('intro')
  const [spokeIdx, setSpokeIdx] = useState(0)
  const [currentScores, setCurrentScores] = useState<Record<string,number[]>>({})
  const [desiredScores, setDesiredScores] = useState<Record<string,number>>({})
  const [importance, setImportance] = useState<Record<string,number>>(Object.fromEntries(SPOKES.map(s=>[s.id,Math.round(100/SPOKES.length)])))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
    }
    init()
  }, [router])

  const spoke = SPOKES[spokeIdx]
  const importanceTotal = Object.values(importance).reduce((s,v) => s+v, 0)

  function spokeAvg(spokeId: string): number {
    const scores = currentScores[spokeId]
    if (!scores || scores.length === 0) return 0
    return scores.reduce((s,v) => s+v, 0) / scores.length
  }

  function overallCurrent(): number {
    return SPOKES.reduce((s,sp) => s + spokeAvg(sp.id), 0) / SPOKES.length
  }

  function gapAnalysis() {
    return SPOKES.map(sp => {
      const current = parseFloat(spokeAvg(sp.id).toFixed(1))
      const desired = desiredScores[sp.id] || 10
      const gap = desired - current
      const weight = importance[sp.id] || 12.5
      const weightedGap = gap * (weight / 100)
      return { ...sp, current, desired, gap: parseFloat(gap.toFixed(1)), weight, weightedGap: parseFloat(weightedGap.toFixed(2)) }
    }).sort((a,b) => b.weightedGap - a.weightedGap)
  }

  async function handleFinish() {
    setSaving(true)
    const overall = parseFloat(overallCurrent().toFixed(1))
    await fetch('/api/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, wheel_score: overall })
    })
    setSaving(false)
    setPhase('results')
  }

  // Simple spider diagram using CSS
  function SpiderDiagram() {
    const gaps = gapAnalysis()
    const size = 280
    const center = size / 2
    const radius = 110
    return (
      <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Grid circles */}
          {[2,4,6,8,10].map(v => (
            <circle key={v} cx={center} cy={center} r={radius*v/10} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
          ))}
          {/* Spoke lines */}
          {SPOKES.map((_,i) => {
            const angle = (Math.PI * 2 * i / SPOKES.length) - Math.PI/2
            return <line key={i} x1={center} y1={center} x2={center+radius*Math.cos(angle)} y2={center+radius*Math.sin(angle)} stroke="#e5e7eb" strokeWidth="0.5" />
          })}
          {/* Current polygon (red) */}
          <polygon points={SPOKES.map((sp,i) => {
            const angle = (Math.PI * 2 * i / SPOKES.length) - Math.PI/2
            const val = spokeAvg(sp.id) / 10
            return `${center+radius*val*Math.cos(angle)},${center+radius*val*Math.sin(angle)}`
          }).join(' ')} fill="rgba(220,38,38,0.15)" stroke="#dc2626" strokeWidth="2" />
          {/* Desired polygon (green dashed) */}
          <polygon points={SPOKES.map((sp,i) => {
            const angle = (Math.PI * 2 * i / SPOKES.length) - Math.PI/2
            const val = (desiredScores[sp.id]||10) / 10
            return `${center+radius*val*Math.cos(angle)},${center+radius*val*Math.sin(angle)}`
          }).join(' ')} fill="rgba(22,163,74,0.08)" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="5,3" />
          {/* Labels */}
          {SPOKES.map((sp,i) => {
            const angle = (Math.PI * 2 * i / SPOKES.length) - Math.PI/2
            const lx = center + (radius+20)*Math.cos(angle)
            const ly = center + (radius+20)*Math.sin(angle)
            return <text key={sp.id} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#666">{sp.icon}</text>
          })}
        </svg>
      </div>
    )
  }

  if (!user) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>

  return (
    <div style={{minHeight:'100vh',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      <header style={{background:'#0D1B2A',color:'#fff',padding:'12px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={() => {
            if (phase === 'current' && spokeIdx > 0) setSpokeIdx(spokeIdx - 1)
            else if (phase === 'current' && spokeIdx === 0) setPhase('intro')
            else if (phase === 'desired') { setPhase('current'); setSpokeIdx(7) }
            else if (phase === 'importance') setPhase('desired')
            else if (phase === 'results') setPhase('importance')
            else window.location.href = '/dashboard'
          }} style={{color:'#888',fontSize:13,background:'none',border:'none',cursor:'pointer'}}>← Back</button>
          <span style={{color:'#444'}}>|</span>
          <h1 style={{fontSize:16,fontWeight:'bold'}}>⚖️ Work-Life Balance — Wheel of Life</h1>
        </div>
      </header>

      <div style={{maxWidth:640,margin:'0 auto',padding:24}}>
        {phase === 'intro' && (
          <div style={{background:'#fff',borderRadius:12,padding:32,textAlign:'center'}}>
            <p style={{fontSize:48,marginBottom:16}}>⚖️</p>
            <h2 style={{fontSize:22,fontWeight:'bold',marginBottom:8}}>BALANCE™ Wheel of Life</h2>
            <p style={{fontSize:14,color:'#888',marginBottom:24}}>Assess 8 life dimensions, set your desired state, and create a plan to close the gaps.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:24}}>
              {SPOKES.map(s => (
                <div key={s.id} style={{textAlign:'center',padding:8}}>
                  <div style={{fontSize:24}}>{s.icon}</div>
                  <div style={{fontSize:10,color:'#888'}}>{s.label}</div>
                </div>
              ))}
            </div>
            <p style={{fontSize:13,color:'#888',marginBottom:24}}>40 questions (5 per spoke) + desired state + importance weights</p>
            <button onClick={() => setPhase('current')} style={{padding:'14px 40px',background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:16,fontWeight:700,cursor:'pointer'}}>Start Assessment →</button>
          </div>
        )}

        {phase === 'current' && (
          <div>
            <div style={{display:'flex',gap:4,marginBottom:16,overflowX:'auto'}}>
              {SPOKES.map((s,i) => (
                <button key={s.id} onClick={() => setSpokeIdx(i)} style={{padding:'8px 12px',borderRadius:8,border:'none',fontSize:11,fontWeight:600,cursor:'pointer',background:i===spokeIdx?'#C8943E':'#e5e7eb',color:i===spokeIdx?'#fff':'#666',whiteSpace:'nowrap'}}>
                  {s.icon} {s.label.split(' ')[0]}
                </button>
              ))}
            </div>

            <div style={{background:'#fff',borderRadius:12,padding:24}}>
              <h3 style={{fontSize:16,fontWeight:'bold',marginBottom:4}}>{spoke.icon} {spoke.label}</h3>
              <p style={{fontSize:13,color:'#888',marginBottom:16}}>Rate your CURRENT state (1 = very poor, 10 = excellent)</p>
              {spoke.questions.map((q: string, qi: number) => (
                <div key={qi} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:13}}>{q}</span>
                    <span style={{fontSize:16,fontWeight:'bold',color:(currentScores[spoke.id]?.[qi]||5)>=7?'#16a34a':(currentScores[spoke.id]?.[qi]||5)>=5?'#f59e0b':'#dc2626'}}>{currentScores[spoke.id]?.[qi]||5}</span>
                  </div>
                  <input type="range" min="1" max="10" value={currentScores[spoke.id]?.[qi]||5}
                    onChange={e => { const s = {...currentScores}; if(!s[spoke.id]) s[spoke.id]=[5,5,5,5,5]; s[spoke.id][qi]=parseInt(e.target.value); setCurrentScores(s) }}
                    style={{width:'100%',accentColor:'#C8943E'}} />
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:16}}>
                {spokeIdx > 0 && <button onClick={() => setSpokeIdx(spokeIdx-1)} style={{padding:12,background:'#f3f4f6',border:'none',borderRadius:8,fontSize:13,cursor:'pointer'}}>← Previous</button>}
                {spokeIdx < 7 ? (
                  <button onClick={() => setSpokeIdx(spokeIdx+1)} style={{flex:1,padding:12,background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer'}}>Next: {SPOKES[spokeIdx+1]?.icon} {SPOKES[spokeIdx+1]?.label.split(' ')[0]} →</button>
                ) : (
                  <button onClick={() => { setSpokeIdx(0); setPhase('desired') }} style={{flex:1,padding:12,background:'#16a34a',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer'}}>Next: Set Desired State →</button>
                )}
              </div>
            </div>
          </div>
        )}

        {phase === 'desired' && (
          <div style={{background:'#fff',borderRadius:12,padding:24}}>
            <h2 style={{fontSize:18,fontWeight:'bold',marginBottom:4}}>Set Your Desired State</h2>
            <p style={{fontSize:13,color:'#888',marginBottom:16}}>Where do you WANT to be in each dimension? (Your ideal score)</p>
            {SPOKES.map(sp => (
              <div key={sp.id} style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <span style={{fontSize:20,width:30}}>{sp.icon}</span>
                <span style={{fontSize:13,flex:1}}>{sp.label}</span>
                <span style={{fontSize:12,color:'#888'}}>Now: {spokeAvg(sp.id).toFixed(1)}</span>
                <input type="range" min="1" max="10" value={desiredScores[sp.id]||8} onChange={e => setDesiredScores({...desiredScores,[sp.id]:parseInt(e.target.value)})} style={{width:100,accentColor:'#16a34a'}} />
                <span style={{fontSize:16,fontWeight:'bold',color:'#16a34a',width:30,textAlign:'right'}}>{desiredScores[sp.id]||8}</span>
              </div>
            ))}
            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button onClick={() => setPhase('current')} style={{padding:12,background:'#f3f4f6',border:'none',borderRadius:8,fontSize:13,cursor:'pointer'}}>← Back</button>
              <button onClick={() => setPhase('importance')} style={{flex:1,padding:12,background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer'}}>Next: Set Importance →</button>
            </div>
          </div>
        )}

        {phase === 'importance' && (
          <div style={{background:'#fff',borderRadius:12,padding:24}}>
            <h2 style={{fontSize:18,fontWeight:'bold',marginBottom:4}}>Importance Weightage</h2>
            <p style={{fontSize:13,color:'#888',marginBottom:4}}>How important is each dimension to you? Distribute 100 points.</p>
            <p style={{fontSize:14,fontWeight:700,color:importanceTotal===100?'#16a34a':'#dc2626',marginBottom:16}}>Total: {importanceTotal} / 100 {importanceTotal===100?'✓':'— adjust to reach 100'}</p>
            {SPOKES.map(sp => (
              <div key={sp.id} style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                <span style={{fontSize:18}}>{sp.icon}</span>
                <span style={{fontSize:13,flex:1}}>{sp.label}</span>
                <input type="range" min="0" max="50" value={importance[sp.id]||12} onChange={e => setImportance({...importance,[sp.id]:parseInt(e.target.value)})} style={{width:120,accentColor:'#C8943E'}} />
                <span style={{fontSize:14,fontWeight:'bold',width:30,textAlign:'right'}}>{importance[sp.id]}%</span>
              </div>
            ))}
            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button onClick={() => setPhase('desired')} style={{padding:12,background:'#f3f4f6',border:'none',borderRadius:8,fontSize:13,cursor:'pointer'}}>← Back</button>
              <button onClick={handleFinish} disabled={saving||importanceTotal!==100} style={{flex:1,padding:12,background:importanceTotal===100?(saving?'#d4a855':'#16a34a'):'#ccc',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:importanceTotal===100?'pointer':'default'}}>{saving?'Calculating...':'See My Results →'}</button>
            </div>
          </div>
        )}

        {phase === 'results' && (
          <div>
            <div style={{background:'#0D1B2A',borderRadius:12,padding:24,color:'#fff',textAlign:'center',marginBottom:16}}>
              <p style={{fontSize:12,color:'#888'}}>Overall Life Balance Score</p>
              <p style={{fontSize:48,fontWeight:'bold',color:'#C8943E'}}>{overallCurrent().toFixed(1)}/10</p>
              <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:8}}>
                <span style={{fontSize:12,color:'#dc2626'}}>● Current</span>
                <span style={{fontSize:12,color:'#16a34a'}}>- - Desired</span>
              </div>
            </div>

            <SpiderDiagram />

            {/* Gap Analysis Table */}
            <div style={{background:'#fff',borderRadius:10,padding:16,marginBottom:16}}>
              <h3 style={{fontSize:14,fontWeight:700,marginBottom:12}}>📊 Gap Analysis (sorted by weighted priority)</h3>
              <div style={{fontSize:11,color:'#888',display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr',gap:4,marginBottom:8,fontWeight:600}}>
                <span>Spoke</span><span>Now</span><span>Want</span><span>Gap</span><span>Wt%</span><span>Priority</span>
              </div>
              {gapAnalysis().map((g,i) => (
                <div key={g.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr',gap:4,marginBottom:6,fontSize:12,padding:'4px 0',borderBottom:'1px solid #f3f4f6'}}>
                  <span>{g.icon} {g.label}</span>
                  <span style={{color:'#dc2626'}}>{g.current}</span>
                  <span style={{color:'#16a34a'}}>{g.desired}</span>
                  <span style={{fontWeight:600}}>{g.gap}</span>
                  <span>{g.weight}%</span>
                  <span style={{fontWeight:700,color:i<3?'#dc2626':'#888'}}>{i<3?'🔥 HIGH':'—'}</span>
                </div>
              ))}
            </div>

            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <Link href={`/dashboard/chat?prompt=${encodeURIComponent(`Based on my Wheel of Life assessment, my top 3 priority areas are: ${gapAnalysis().slice(0,3).map(g=>`${g.label} (current: ${g.current}, desired: ${g.desired}, gap: ${g.gap})`).join(', ')}. Help me create a 21-day challenge with daily habits for each priority area.`)}`} style={{padding:'10px 20px',background:'#C8943E',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>💬 Get 21-Day Challenge</Link>
              <button onClick={() => {
                const gaps = gapAnalysis()
                const txt = `BALANCE™ Wheel of Life Assessment\nOverall: ${overallCurrent().toFixed(1)}/10\n\n${gaps.map(g=>`${g.icon} ${g.label}: Current=${g.current} → Desired=${g.desired} (Gap: ${g.gap}, Weight: ${g.weight}%)`).join('\n')}\n\nTop 3 Priorities:\n${gaps.slice(0,3).map((g,i)=>`${i+1}. ${g.label} — Gap: ${g.gap}, Weighted: ${g.weightedGap}`).join('\n')}`
                try{navigator.clipboard.writeText(txt)}catch(e){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta)}
                alert('Copied!')
              }} style={{padding:'10px 20px',background:'#f3f4f6',borderRadius:8,fontSize:13,fontWeight:600,border:'none',cursor:'pointer'}}>📋 Copy</button>
              <Link href="/dashboard" style={{padding:'10px 20px',background:'#0D1B2A',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>← Dashboard</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
