'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CalendlyButton from '@/components/CalendlyButton'

const MODELS: Record<string, { name:string; step:string; factors: {id:string;label:string;weight:number;desc:string}[]; bands: {min:number;max:number;label:string;color:string}[] }> = {
  impact: { name:'IMPACT Score™', step:'Step 2', factors:[
    {id:'I',label:'Impact / Revenue Potential',weight:25,desc:'What is the estimated annual purchase potential from this customer? Consider: order size, repeat frequency, and growth potential. Score 1-3 = below ₹5L/year, 4-6 = ₹5L-25L/year, 7-8 = ₹25L-1Cr/year, 9-10 = above ₹1Cr/year.'},
    {id:'M',label:'Match / Fit',weight:20,desc:'How well does your product or solution match their actual requirement? Consider: technical fit, application suitability, capacity match, and specification compliance. Score 1-3 = poor fit (need heavy customisation), 7-8 = good fit, 9-10 = perfect match.'},
    {id:'P',label:'Power / Decision-Maker Access',weight:20,desc:'Can you reach and influence the actual decision-maker (not just the contact person)? Score 1-3 = only talking to junior staff, 4-6 = have access to influencer but not decision-maker, 7-8 = met decision-maker once, 9-10 = direct relationship with MD/CEO/final authority.'},
    {id:'A',label:'Appetite / Urgency',weight:15,desc:'How urgently does the customer need to buy? Is there a project deadline, budget expiry, or pain point driving urgency? Score 1-3 = no urgency (exploring), 4-6 = planning stage (6+ months), 7-8 = active evaluation (1-3 months), 9-10 = immediate need (buying this month).'},
    {id:'C',label:'Credit / Payment Risk',weight:10,desc:'What is the payment risk? Consider: company financial health, payment track record, credit terms acceptable to you. Score 1-3 = high risk (bad payment history or unknown), 4-6 = moderate (some delays), 7-8 = good payer, 9-10 = excellent (advance payment or blue-chip company).'},
    {id:'T',label:'Terrain / Competition',weight:10,desc:'How strong is competition for this specific deal? Score 1-3 = very strong competitor already entrenched, 4-6 = 2-3 competitors actively quoting, 7-8 = limited competition, 9-10 = no competition or you are the preferred/specified brand.'},
  ], bands:[{min:8.5,max:10,label:'A1 — Must Pursue',color:'#16a34a'},{min:6.5,max:8.4,label:'A2 — High Potential',color:'#2563eb'},{min:5,max:6.4,label:'B — Moderate',color:'#f59e0b'},{min:3.5,max:4.9,label:'C — Low Priority',color:'#f97316'},{min:0,max:3.4,label:'D/E — Avoid',color:'#dc2626'}]},
  dealwin: { name:'Deal Win Probability™', step:'Step 10', factors:[
    {id:'VC',label:'Value Concurrence',weight:20,desc:'Has the customer agreed your value justifies the price?'},
    {id:'BS',label:'Buying Signals',weight:15,desc:'Are you seeing positive buying signals?'},
    {id:'DM',label:'Decision-Maker Access',weight:15,desc:'Have you engaged the final decision-maker?'},
    {id:'CP',label:'Competitive Position',weight:15,desc:'How strong is your position vs competitors?'},
    {id:'UR',label:'Urgency',weight:10,desc:'Is there a compelling event or deadline?'},
    {id:'OR',label:'Objections Resolved',weight:10,desc:'Have all major objections been addressed?'},
    {id:'BL',label:'Body Language / Engagement',weight:10,desc:'Is the customer engaged and responsive?'},
    {id:'ZA',label:'ZOPA Alignment',weight:5,desc:'Is there overlap in acceptable price ranges?'},
  ], bands:[{min:8.5,max:10,label:'Close Now — 85-95%',color:'#16a34a'},{min:7,max:8.4,label:'Strong — 65-80%',color:'#2563eb'},{min:5.5,max:6.9,label:'Moderate — 40-60%',color:'#f59e0b'},{min:3.5,max:5.4,label:'Weak — 15-35%',color:'#f97316'},{min:0,max:3.4,label:'Unlikely — <15%',color:'#dc2626'}]},
  rapport: { name:'RAPPORT Score™', step:'Step 5', factors:[
    {id:'RP',label:'Read the Profile (DISC)',weight:10,desc:'Have you identified the buyers DISC personality style and adapted your approach? Score 1-3 = no profiling, 4-6 = basic awareness, 7-8 = adapted communication, 9-10 = fully profiled and tailored.'},
    {id:'AC',label:'Adapt Communication',weight:15,desc:'Are you matching their communication style — pace, detail level, formality? Score 1-3 = one-style-fits-all, 7-8 = mostly adapted, 9-10 = perfectly mirrored.'},
    {id:'PP',label:'Persuasion Principles',weight:15,desc:'Are you using Cialdinis principles (reciprocity, social proof, authority, scarcity)? Score 1-3 = none, 4-6 = 1-2 principles, 7-8 = 3-4 principles, 9-10 = all relevant principles applied.'},
    {id:'PL',label:'Pace & Lead',weight:10,desc:'Are you matching the buyers energy first, then gradually leading them? Score 1-3 = pushing too fast, 7-8 = good pacing, 9-10 = natural pace-and-lead.'},
    {id:'OC',label:'Open Personal Connection',weight:15,desc:'Have you found personal common ground beyond business? Score 1-3 = purely transactional, 7-8 = some personal rapport, 9-10 = genuine personal bond.'},
    {id:'RB',label:'Resonate & Bond',weight:20,desc:'Does the buyer see you as a trusted advisor, not just a vendor? Score 1-3 = vendor only, 4-6 = respected supplier, 7-8 = preferred partner, 9-10 = trusted advisor.'},
    {id:'TS',label:'Trust Stage Assessment',weight:15,desc:'What trust stage are you at? Score 1-3 = stranger, 4-5 = acquaintance, 6-7 = professional, 8-9 = trusted, 10 = partner.'},
  ], bands:[{min:8,max:10,label:'Strong Rapport — Trusted',color:'#16a34a'},{min:6,max:7.9,label:'Good — Building Trust',color:'#2563eb'},{min:4,max:5.9,label:'Developing — Needs Work',color:'#f59e0b'},{min:0,max:3.9,label:'Weak — Start Building',color:'#dc2626'}]},
  discover: { name:'DISCOVER Score™', step:'Step 6', factors:[
    {id:'DD',label:'Disarm — Create Comfort',weight:15,desc:'Did you create a safe environment for the buyer to share openly? Score 1-3 = formal/stiff, 7-8 = comfortable conversation, 9-10 = buyer opened up freely.'},
    {id:'DI',label:'Investigate — Deep Questions',weight:20,desc:'Did you ask layered questions that uncovered root needs, not just surface wants? Score 1-3 = surface questions only, 7-8 = good depth, 9-10 = uncovered hidden needs.'},
    {id:'DS',label:'Surface — Hidden Needs',weight:15,desc:'Did you uncover needs the buyer did not initially mention? Score 1-3 = only discussed stated needs, 7-8 = found 1-2 hidden needs, 9-10 = completely mapped all needs.'},
    {id:'DC',label:'Cost — Quantify the Problem',weight:15,desc:'Can you put a ₹ value on the buyers problem? Score 1-3 = no cost quantified, 7-8 = rough estimate, 9-10 = precise cost of problem documented.'},
    {id:'DO',label:'Organise — Map Stakeholders',weight:15,desc:'Have you identified ALL decision-makers and influencers? Score 1-3 = know only 1 contact, 4-6 = know 2-3, 7-8 = mapped full committee, 9-10 = know each persons role and preference.'},
    {id:'DV',label:'Validate — Confirm Understanding',weight:10,desc:'Did you summarise and get buyers confirmation of needs? Score 1-3 = no validation, 7-8 = verbal confirmation, 9-10 = written/email confirmation.'},
    {id:'DE',label:'Exit — Clear Next Steps',weight:10,desc:'Did you leave with agreed next steps and timeline? Score 1-3 = vague "we will be in touch", 7-8 = clear next meeting, 9-10 = documented action plan with dates.'},
  ], bands:[{min:8,max:10,label:'Excellent Discovery',color:'#16a34a'},{min:6,max:7.9,label:'Good — Some Gaps',color:'#2563eb'},{min:4,max:5.9,label:'Incomplete — Dig Deeper',color:'#f59e0b'},{min:0,max:3.9,label:'Poor — Redo Discovery',color:'#dc2626'}]},
  value: { name:'VALUE Score™', step:'Step 7', factors:[
    {id:'VV',label:'Visualise Outcome',weight:20,desc:'Can the buyer clearly picture life AFTER implementing your solution? Score 1-3 = abstract/vague, 7-8 = clear picture, 9-10 = buyer is excited about the outcome.'},
    {id:'VA',label:'Assemble Proof',weight:20,desc:'Do you have concrete evidence — case studies, references, data, demos? Score 1-3 = claims only, 4-6 = some proof, 7-8 = strong proof package, 9-10 = overwhelming evidence.'},
    {id:'VL',label:'Leverage Differentiators',weight:20,desc:'Is your unique advantage clearly articulated vs competition? Score 1-3 = "we are also good", 7-8 = 2-3 clear differentiators, 9-10 = unique position competitors cannot match.'},
    {id:'VU',label:'Unify Stakeholders',weight:20,desc:'Are all stakeholders aligned on the value of your solution? Score 1-3 = only 1 person sees value, 4-6 = mixed views, 7-8 = majority aligned, 9-10 = unanimous support.'},
    {id:'VE',label:'Earn the Right to Price',weight:20,desc:'Has value been established BEFORE price is discussed? Score 1-3 = price came up before value, 7-8 = value mostly established, 9-10 = buyer says "this is worth it" before seeing price.'},
  ], bands:[{min:8,max:10,label:'Strong Value — Price Justified',color:'#16a34a'},{min:6,max:7.9,label:'Good — Strengthen Proof',color:'#2563eb'},{min:4,max:5.9,label:'Weak — Needs CPV Elevation',color:'#f59e0b'},{min:0,max:3.9,label:'No Value Built — Do Not Quote Yet',color:'#dc2626'}]},
  evolution: { name:'Customer Evolution Score™', step:'Step 11', factors:[
    {id:'RP2',label:'Repeat Purchase',weight:15,desc:'Does the customer buy from you regularly? Score 1-3 = one-time buyer, 4-6 = occasional, 7-8 = regular repeat, 9-10 = automatic reorder.'},
    {id:'PS',label:'Price Sensitivity',weight:10,desc:'How price-sensitive is this customer with you? Score 1-3 = always negotiates hard, 4-6 = compares sometimes, 7-8 = rarely questions price, 9-10 = trusts your pricing completely.'},
    {id:'SW',label:'Share of Wallet',weight:15,desc:'What % of their total spend in your category comes to you? Score 1-3 = less than 20%, 4-6 = 20-50%, 7-8 = 50-80%, 9-10 = 80%+ sole supplier.'},
    {id:'IS',label:'Information Sharing',weight:10,desc:'Does the customer share plans, forecasts, and insider info with you? Score 1-3 = shares nothing, 7-8 = shares relevant info, 9-10 = treats you as insider.'},
    {id:'RB2',label:'Referral Behaviour',weight:15,desc:'Does the customer actively refer you to others? Score 1-3 = never, 4-6 = if asked, 7-8 = sometimes proactively, 9-10 = regularly champions you.'},
    {id:'RD',label:'Relationship Depth',weight:10,desc:'At how many levels do you have relationships? Score 1-3 = one contact only, 4-6 = 2-3 contacts, 7-8 = multiple levels, 9-10 = CEO to operator.'},
    {id:'JD',label:'Joint Development',weight:10,desc:'Do you co-develop solutions or share roadmaps? Score 1-3 = purely transactional, 7-8 = some collaboration, 9-10 = joint development partner.'},
    {id:'TN',label:'Tenure & Loyalty',weight:10,desc:'How long has this customer been with you? Score 1-3 = less than 1 year, 4-6 = 1-3 years, 7-8 = 3-5 years, 9-10 = 5+ years loyal.'},
    {id:'SR',label:'Switching Resistance',weight:5,desc:'How difficult would it be for them to switch away from you? Score 1-3 = easy to switch, 7-8 = some switching cost, 9-10 = deeply integrated and hard to replace.'},
  ], bands:[{min:8.6,max:10,label:'Stage 5 — Partner',color:'#16a34a'},{min:7.6,max:8.5,label:'Stage 4 — Advocate',color:'#2563eb'},{min:6.1,max:7.5,label:'Stage 3 — Loyal',color:'#f59e0b'},{min:3.1,max:6,label:'Stage 2 — Repeat',color:'#f97316'},{min:0,max:3,label:'Stage 1 — First-Time',color:'#dc2626'}]},
  kycw: { name:'KYCW Readiness™', step:'Step 4', factors:[
    {id:'CK',label:'Company Knowledge',weight:15,desc:'How well do you know the company background?'},
    {id:'PK',label:'Person Knowledge',weight:15,desc:'Do you know the people you will meet?'},
    {id:'CTX',label:'Context Knowledge',weight:15,desc:'Do you understand their current situation?'},
    {id:'DP',label:'DISCOVER Prep',weight:15,desc:'Have you prepared your discovery questions?'},
    {id:'SM',label:'Stakeholder Mapping',weight:10,desc:'Have you identified all stakeholders?'},
    {id:'SK',label:'Sales Kit Customised',weight:10,desc:'Is your presentation tailored to them?'},
    {id:'SI',label:'SIIS Pitch Ready',weight:10,desc:'Can you deliver your elevator pitch?'},
    {id:'MO',label:'Meeting Objective Clear',weight:10,desc:'Do you have a clear meeting objective?'},
  ], bands:[{min:8,max:10,label:'Ready to Go',color:'#16a34a'},{min:5,max:7.9,label:'Partially Ready',color:'#f59e0b'},{min:0,max:4.9,label:'Not Ready — Prepare More',color:'#dc2626'}]},
}

const MODEL_LIST = [
  {id:'impact',icon:'🎯',name:'IMPACT Score™',step:'Step 2',desc:'Qualify prospects'},
  {id:'kycw',icon:'📋',name:'KYCW Readiness™',step:'Step 4',desc:'Meeting preparation'},
  {id:'rapport',icon:'🤝',name:'RAPPORT Score™',step:'Step 5',desc:'Relationship strength'},
  {id:'discover',icon:'🔬',name:'DISCOVER Score™',step:'Step 6',desc:'Discovery quality'},
  {id:'value',icon:'💎',name:'VALUE Score™',step:'Step 7',desc:'Value proposition strength'},
  {id:'dealwin',icon:'🏆',name:'Deal Win Probability™',step:'Step 10',desc:'Closing readiness'},
  {id:'evolution',icon:'📈',name:'Customer Evolution™',step:'Step 11',desc:'Relationship stage'},
]

function ScorecardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [deals, setDeals] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string|null>(null)
  const [selectedDeal, setSelectedDeal] = useState<string>('')
  const [scores, setScores] = useState<Record<string,number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [fromStep, setFromStep] = useState<string>('')

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      const res = await fetch(`/api/deals?userId=${u.id}`)
      const d = await res.json()
      setDeals(Array.isArray(d) ? d : [])
      const dealParam = searchParams.get('deal')
      if (dealParam) setSelectedDeal(dealParam)
      const modelParam = searchParams.get('model')
      if (modelParam && MODELS[modelParam]) setSelectedModel(modelParam)
      const fromParam = searchParams.get('from')
      if (fromParam) setFromStep(fromParam)
    }
    init()
  }, [router, searchParams])

  const model = selectedModel ? MODELS[selectedModel] : null
  const allAnswered = model ? model.factors.every((f: any) => scores[f.id] !== undefined) : false

  function calcTotal(): number {
    if (!model) return 0
    return model.factors.reduce((sum: number, f: any) => sum + (scores[f.id] || 0) * (f.weight / 100), 0)
  }

  function getClassification(total: number): { label: string; color: string } {
    if (!model) return { label: '', color: '#888' }
    for (const b of model.bands) { if (total >= b.min) return { label: b.label, color: b.color } }
    return { label: 'Unclassified', color: '#888' }
  }

  async function handleSubmit() {
    if (!model || !user) return
    setSaving(true)
    const total = parseFloat(calcTotal().toFixed(1))
    const cls = getClassification(total)
    const sorted = model.factors.map((f: any) => ({ id: f.id, label: f.label, score: scores[f.id] || 0 })).sort((a: any, b: any) => b.score - a.score)
    const strengths = sorted.slice(0, 3).map((s: any) => `${s.label}: ${s.score}/10`)
    const gaps = sorted.slice(-3).reverse().map((s: any) => `${s.label}: ${s.score}/10`)

    await fetch('/api/scores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, dealId: selectedDeal || null, modelType: selectedModel, factors: scores, totalScore: total, classification: cls.label, strengths, gaps })
    })

    // Load history
    const hRes = await fetch(`/api/scores?userId=${user.id}&model=${selectedModel}${selectedDeal ? `&dealId=${selectedDeal}` : ''}`)
    setHistory(await hRes.json())
    setSaving(false); setSubmitted(true)
  }

  if (!user) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>

  const total = calcTotal()
  const cls = getClassification(total)

  return (
    <div style={{minHeight:'100vh',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      <header style={{background:'#0D1B2A',color:'#fff',padding:'12px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:14,fontWeight:'bold',color:'#C8943E'}}>B2BsalesBUDDY</span>
          <span style={{color:'#444'}}>|</span>
          <a href="/dashboard" style={{display:'flex',alignItems:'center',gap:4,color:'#C8943E',fontSize:13,textDecoration:'none',fontWeight:600,background:'rgba(200,148,62,0.15)',padding:'6px 12px',borderRadius:6}}>🏠 Home</a>
          <span style={{color:'#444'}}>|</span>
          <h1 style={{fontSize:16,fontWeight:'bold'}}>📊 Scorecard</h1>
        </div>
      </header>

      <div style={{maxWidth:700,margin:'0 auto',padding:24}}>
        {!selectedModel ? (
          <>
            <h2 style={{fontSize:20,fontWeight:'bold',marginBottom:8}}>Select a Scoring Model</h2>
            <p style={{fontSize:14,color:'#888',marginBottom:20}}>Choose a model to score your prospect, deal readiness, or customer relationship.</p>

            {/* Deal Selector */}
            {deals.length > 0 && (
              <div style={{marginBottom:20,background:'#fff',borderRadius:10,padding:16}}>
                <label style={{fontSize:13,fontWeight:600}}>Link to a Deal (Optional)</label>
                <select value={selectedDeal} onChange={e=>setSelectedDeal(e.target.value)} style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:6}}>
                  <option value="">No deal — standalone score</option>
                  {deals.map((d: any) => <option key={d.id} value={d.id}>{d.name}{d.company?` (${d.company})`:''}</option>)}
                </select>
              </div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {MODEL_LIST.map(m => (
                <button key={m.id} onClick={() => { setSelectedModel(m.id); setScores({}); setSubmitted(false) }}
                  style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',background:'#fff',border:'2px solid #e5e7eb',borderRadius:12,cursor:'pointer',textAlign:'left'}}>
                  <span style={{fontSize:28}}>{m.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:700}}>{m.name}</div>
                    <div style={{fontSize:12,color:'#888'}}>{m.step} — {m.desc}</div>
                  </div>
                  <span style={{fontSize:13,color:'#C8943E'}}>Score →</span>
                </button>
              ))}
            </div>
          </>
        ) : submitted ? (
          /* Results Screen */
          <div>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:100,height:100,borderRadius:'50%',border:`4px solid ${cls.color}`,marginBottom:12}}>
                <span style={{fontSize:28,fontWeight:'bold',color:cls.color}}>{total.toFixed(1)}</span>
              </div>
              <h2 style={{fontSize:20,fontWeight:'bold'}}>{model?.name}</h2>
              <p style={{fontSize:16,fontWeight:600,color:cls.color,marginTop:4}}>{cls.label}</p>
            </div>

            {/* Factor Breakdown */}
            <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16}}>
              <h3 style={{fontSize:14,fontWeight:700,marginBottom:12}}>Factor Scores</h3>
              {model?.factors.map((f: any) => (
                <div key={f.id} style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                  <span style={{fontSize:12,width:180,color:'#666'}}>{f.label}</span>
                  <div style={{flex:1,height:8,background:'#e5e7eb',borderRadius:4}}>
                    <div style={{width:`${(scores[f.id]||0)*10}%`,height:8,background:(scores[f.id]||0)>=7?'#16a34a':(scores[f.id]||0)>=5?'#f59e0b':'#dc2626',borderRadius:4}} />
                  </div>
                  <span style={{fontSize:13,fontWeight:600,width:30,textAlign:'right'}}>{scores[f.id]||0}</span>
                </div>
              ))}
            </div>

            {/* Strengths & Gaps */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <div style={{background:'#f0fdf4',borderRadius:10,padding:16}}>
                <h3 style={{fontSize:13,fontWeight:700,color:'#16a34a',marginBottom:8}}>💪 Top 3 Strengths</h3>
                {model?.factors.map((f: any) => ({...f, score: scores[f.id]||0})).sort((a: any,b: any) => b.score-a.score).slice(0,3).map((f: any) => (
                  <p key={f.id} style={{fontSize:12,marginBottom:4}}>✓ {f.label}: <strong>{f.score}/10</strong></p>
                ))}
              </div>
              <div style={{background:'#fef2f2',borderRadius:10,padding:16}}>
                <h3 style={{fontSize:13,fontWeight:700,color:'#dc2626',marginBottom:8}}>⚠️ Top 3 Gaps</h3>
                {model?.factors.map((f: any) => ({...f, score: scores[f.id]||0})).sort((a: any,b: any) => a.score-b.score).slice(0,3).map((f: any) => (
                  <p key={f.id} style={{fontSize:12,marginBottom:4}}>✗ {f.label}: <strong>{f.score}/10</strong></p>
                ))}
              </div>
            </div>

            {/* History */}
            {history.length > 1 && (
              <div style={{background:'#fff',borderRadius:10,padding:16,marginBottom:16}}>
                <h3 style={{fontSize:13,fontWeight:700,marginBottom:8}}>📈 Score History</h3>
                {history.slice(0,5).map((h: any, i: number) => (
                  <div key={h.id} style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#666',marginBottom:4}}>
                    <span>{new Date(h.created_at).toLocaleDateString()}</span>
                    <span style={{fontWeight:600,color:i===0?cls.color:'#888'}}>{h.total_score?.toFixed(1)} — {h.classification}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <Link href={`/dashboard/chat?prompt=${encodeURIComponent(`Coach me on improving my weakest areas from my ${model?.name} assessment. My lowest scores were in: ${model?.factors.map((f: any) => ({...f,score:scores[f.id]||0})).sort((a: any,b: any) => a.score-b.score).slice(0,3).map((f: any) => `${f.label} (${f.score}/10)`).join(', ')}`)}`}
                style={{padding:'10px 20px',background:'#C8943E',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>💬 Coach Me on Weak Areas</Link>
              <button onClick={() => {
                  const sorted = model?.factors.map((f: any) => ({...f, score: scores[f.id]||0})).sort((a: any,b: any) => b.score-a.score) || []
                  const strengths = sorted.slice(0,3).map((f: any) => `  ✓ ${f.label}: ${f.score}/10`).join('\n')
                  const gaps = sorted.slice(-3).reverse().map((f: any) => `  ✗ ${f.label}: ${f.score}/10`).join('\n')
                  const allFactors = (model?.factors || []).map((f: any) => `  ${f.label} (${f.weight}%): ${scores[f.id]||0}/10`).join('\n')
                  const fullText = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${model?.name} — Assessment Report\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nOverall Score: ${total.toFixed(1)} / 10\nClassification: ${cls.label}\n${selectedDeal ? `Deal: ${deals.find((d: any)=>d.id===selectedDeal)?.name || ''}\n` : ''}Date: ${new Date().toLocaleDateString()}\n\n📊 Factor Scores:\n${allFactors}\n\n💪 Top 3 Strengths:\n${strengths}\n\n⚠️ Top 3 Gaps (Focus Areas):\n${gaps}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPowered by B2BsalesBUDDY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                  try { navigator.clipboard.writeText(fullText) } catch(e) { const ta=document.createElement('textarea');ta.value=fullText;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta) }
                  alert('Full score report copied to clipboard!')
                }}
                style={{padding:'10px 20px',background:'#f3f4f6',borderRadius:8,fontSize:13,fontWeight:600,border:'none',cursor:'pointer'}}>📋 Copy Full Report</button>
              {fromStep && <Link href={`/dashboard/learn`} style={{padding:'10px 20px',background:'#0D1B2A',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>← Back to Learn</Link>}
              <button onClick={() => { setSelectedModel(null); setScores({}); setSubmitted(false) }}
                style={{padding:'10px 20px',background:'#fff',border:'1px solid #ddd',borderRadius:8,fontSize:13,cursor:'pointer'}}>← All Models</button>
            </div>
          </div>
        ) : (
          /* Scoring Screen with Sliders */
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <h2 style={{fontSize:20,fontWeight:'bold'}}>{model?.name}</h2>
                <p style={{fontSize:13,color:'#888'}}>{model?.step} — Score each factor 1-10</p>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:28,fontWeight:'bold',color:cls.color}}>{total.toFixed(1)}</div>
                <div style={{fontSize:11,color:cls.color}}>{cls.label}</div>
              </div>
            </div>

            {model?.factors.map((f: any, i: number) => (
              <div key={f.id} style={{background:'#fff',borderRadius:10,padding:16,marginBottom:10,boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:14,fontWeight:600}}>{f.label}</span>
                  <span style={{fontSize:11,color:'#888'}}>Weight: {f.weight}%</span>
                </div>
                <p style={{fontSize:12,color:'#888',marginBottom:10}}>{f.desc}</p>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:12,color:'#ccc'}}>1</span>
                  <input type="range" min="1" max="10" value={scores[f.id]||5}
                    onChange={e => setScores({...scores, [f.id]: parseInt(e.target.value)})}
                    style={{flex:1,accentColor:'#C8943E'}} />
                  <span style={{fontSize:12,color:'#ccc'}}>10</span>
                  <span style={{fontSize:20,fontWeight:'bold',width:40,textAlign:'center',color:(scores[f.id]||5)>=7?'#16a34a':(scores[f.id]||5)>=5?'#f59e0b':'#dc2626'}}>{scores[f.id]||5}</span>
                </div>
              </div>
            ))}

            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button onClick={handleSubmit} disabled={saving}
                style={{flex:1,padding:'14px',background:saving?'#d4a855':'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:saving?'wait':'pointer'}}>
                {saving ? 'Calculating...' : `Calculate ${model?.name} →`}
              </button>
              <button onClick={() => { setSelectedModel(null); setScores({}) }}
                style={{padding:'14px 20px',background:'#f3f4f6',border:'none',borderRadius:8,fontSize:14,cursor:'pointer'}}>Cancel</button>
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

export default function ScorecardPage() {
  return <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>}><ScorecardInner /></Suspense>
}
