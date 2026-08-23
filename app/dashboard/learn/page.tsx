'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STEPS = [
  {n:1,name:'Prospecting',icon:'🔍',frameworks:['Golden Hour','Platinum Hour','IQL/MQL/SQL'],
   concepts:['Daily prospecting discipline — dedicate first hour to outreach','Lead qualification: Information Qualified → Marketing Qualified → Sales Qualified','Cold calling scripts, LinkedIn outreach, referral systems','Building a prospect database with systematic follow-up'],
   scripts:['Opening line: "I work with [similar companies] who struggle with [problem]. Would you be open to a quick conversation about how they solved it?"','Referral ask: "Who else in your network faces similar challenges with [problem]?"']},
  {n:2,name:'ICP & Qualification',icon:'🎯',frameworks:['IMPACT Score™','A1-E Classification'],
   concepts:['6-factor weighted scoring: Impact(25%), Match(20%), Power(20%), Appetite(15%), Credit(10%), Terrain(10%)','Customer classification: A1 (must pursue) → A2 → B → C → D/E (avoid)','Allocate 40% of time to A1 customers, 5% to C/D','Qualification prevents wasted ROTIS on wrong prospects'],
   scripts:['Qualifying question: "What is driving the urgency for this project right now?"','Budget probe: "Have you allocated a budget for this, or are we building the business case together?"']},
  {n:3,name:'Visit Planning & Velocity',icon:'📊',frameworks:['ROTIS™','Sales Velocity Engine™','Growth Lever Finder'],
   concepts:['ROTIS = Annual Target ÷ Working Days ÷ Productive Hours = Your hourly value','Velocity Engine: 11 inputs → 11 outputs → exact visits per day needed','Growth Lever Finder: Which 5% improvement gives maximum revenue impact?','Weekly planning: Day-wise customer visit schedule based on IMPACT priority'],
   scripts:['ROTIS reminder: "Is this meeting worth ₹X/hour of my time?"','Weekly review: "Did I hit my visit target this week? Where did I lose time?"']},
  {n:4,name:'Pre-Call Preparation',icon:'📋',frameworks:['KYCW™','DISCOVER™ D-I-S-C Prep','SIIS Formula'],
   concepts:['KYCW: Know Your Customer Well — 3 layers of research before every meeting','DISCOVER prep: D-Disarm questions, I-Investigate angles, S-Surface strategies, C-Cost probes','SIIS: 90-second elevator pitch — Situation, Impact, Implication, Solution','Meeting objective: Never enter without a clear "what I want to achieve"'],
   scripts:['SIIS pitch: "Companies in [industry] are facing [situation]. This impacts their [metric] by [amount]. If not addressed, [implication]. Our [solution] has helped [reference] achieve [result]."']},
  {n:5,name:'Rapport & Influencing',icon:'🤝',frameworks:['RAPPORT™ 7-Step','Cialdini 7 Principles','DISC Profiling'],
   concepts:['Read profile → Adapt communication → Persuasion principles → Pace & lead → Open personal connection → Resonate → Trust stage','DISC: Dominant (be direct), Influencer (be enthusiastic), Steady (be patient), Conscientious (be detailed)','Cialdini: Reciprocity, Commitment, Social Proof, Authority, Liking, Scarcity, Unity','Trust stages: Stranger → Acquaintance → Professional → Trusted → Partner'],
   scripts:['Opening rapport: "Before we talk business, I noticed [personal/company achievement]. Congratulations!"','Reciprocity: "I came across this [article/report] relevant to your industry. Thought of you."']},
  {n:6,name:'Discovery & Stakeholders',icon:'🔬',frameworks:['DISCOVER™ Full','Stakeholder Mapping'],
   concepts:['D-Disarm: Create comfort. I-Investigate: Deep questioning. S-Surface: Uncover hidden needs','C-Cost: Quantify the problem. O-Organise stakeholders. V-Validate understanding. E-Exit with next steps','7 stakeholder types: Champion, Economic Buyer, Technical Buyer, User Buyer, Coach, Blocker, Influencer','3 customer approaches: New customer, Existing (grow), At-risk (retain)'],
   scripts:['Cost question: "What is this problem costing you per month in downtime/efficiency/waste?"','Stakeholder probe: "Besides yourself, who else will be involved in making this decision?"']},
  {n:6.1,name:'Key Account Planning',icon:'📐',frameworks:['STRATEGIC™ 10-Phase'],
   concepts:['For accounts above ₹5 Cr annual potential','10 phases: Scope, Target, Research, Engage, Assess, Track, Execute, Grow, Innovate, Champion','Quarterly business review structure','Joint development roadmap with key accounts'],
   scripts:['QBR opening: "Let me share how we have performed against our commitments this quarter, and then I would like to understand your plans for next year."']},
  {n:7,name:'Value Proposition',icon:'💎',frameworks:['VALUE™','CPV Elevation','TVO Calculator','STORY™'],
   concepts:['VALUE: Visualise outcome → Assemble proof → Leverage differentiators → Unify stakeholders → Earn commitment','CPV: 6 techniques to elevate Customer Perceived Value above price','TVO: Total Value of Ownership — quantify savings over 5 years vs competition','STORY: Situation → Trouble → Outcome → Relevance → Your turn'],
   scripts:['TVO pitch: "Our solution costs ₹X more upfront, but saves ₹Y per year in [energy/labour/downtime]. Over 5 years, you actually save ₹Z."','STORY: "A [similar company] faced [same problem]. They were losing [amount]. After using our solution, they achieved [result]. Your situation is very similar."']},
  {n:8,name:'Proposal & Pricing',icon:'📄',frameworks:['OFFER™','Rule of 3 Pricing'],
   concepts:['OFFER: Outline scope → Frame value → Format professionally → Explain ROI → Request decision','Rule of 3: Present Good-Better-Best options (anchor high, guide to middle)','Never send proposal without presenting in person first','Include TVO comparison in every proposal — make price feel like investment'],
   scripts:['Price presentation: "I have put together three options. Let me walk you through each one and explain what is included."','Urgency: "This pricing is valid until [date] because [genuine reason — raw material increase, capacity booking]."']},
  {n:9,name:'Objection Handling',icon:'🛡️',frameworks:['A-L-S-P-E-C-C™'],
   concepts:['A-Acknowledge: "I understand your concern." L-Listen: Let them finish completely','S-Surface: "Is this the only concern, or is there something else?" P-Probe: "Help me understand — what specifically concerns you?"','E-Evidence: Provide proof (reference, data, demo). C-Confirm: "Does this address your concern?"','C-Close: Move to next step. Never leave an objection hanging.','10 root causes of objections: Price, Trust, Timing, Competition, Authority, Need, Risk, Budget, Politics, Inertia'],
   scripts:['Price objection: "I understand price is important. Let me show you the total cost of ownership comparison — because the cheapest option often ends up being the most expensive."','Competition: "We respect [competitor]. Here is what makes us different specifically for your application: [3 differentiators]."']},
  {n:10,name:'Negotiation & Closing',icon:'🏆',frameworks:['NEGOTIATE™ 9-Step','Deal Win Probability Score™','BATNA/ZOPA'],
   concepts:['NEGOTIATE: Needs assessment → Establish limits → Ground rules → Options → Terms → Invest in relationship → Agree → Trade → Execute','BATNA: Best Alternative To Negotiated Agreement — know YOUR and THEIR alternatives','ZOPA: Zone Of Possible Agreement — where your ranges overlap','13 closing techniques: Assumptive, Alternative, Urgency, Summary, Trial, etc.','Never discount without getting something in return — TRADE, not GIVE'],
   scripts:['Trade: "I can offer [concession] if you can commit to [order quantity/timeline/payment terms]."','Assumptive close: "Shall we go with the 3-year AMC package, or would you prefer to start with 1 year?"']},
  {n:11,name:'Post-Sales & Growth',icon:'📈',frameworks:['EVOLVE™ 6-Phase','Customer Evolution Score™','Customer Success Matrix'],
   concepts:['EVOLVE: Engage → Validate → Optimise → Leverage → Value-add → Expand','Customer Evolution: First-Time → Repeat → Loyal → Advocate → Partner','Customer Success Matrix: 15 KPIs for service excellence','NPS: Net Promoter Score — track and improve customer loyalty','Cross-sell and up-sell within existing accounts is 5x cheaper than new acquisition'],
   scripts:['QBR: "In the last quarter, here is what we delivered [metrics]. For next quarter, here is what I propose we work on together."','Referral: "Since you have seen the results, would you be comfortable introducing me to [similar company]?"']},
]

const CROSS_STEPS = [
  {name:'Follow-Up Mastery',icon:'🔄',framework:'PULSE™',desc:'Purpose, Unique, Layered, Spaced, Escalate — 12 value-add types for follow-ups that work'},
  {name:'Neuroscience of Selling',icon:'🧠',framework:'Brain Science',desc:'System 1/2 thinking, SCARF model, cognitive biases, buyer psychology across all 11 steps'},
]

export default function LearnPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [selectedStep, setSelectedStep] = useState<number|null>(null)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [showFrameworks, setShowFrameworks] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      const saved = localStorage.getItem('learnCompleted')
      if (saved) setCompleted(new Set(JSON.parse(saved)))
    }
    init()
  }, [router])

  function toggleComplete(stepN: number) {
    const next = new Set(completed)
    if (next.has(stepN)) next.delete(stepN); else next.add(stepN)
    setCompleted(next)
    localStorage.setItem('learnCompleted', JSON.stringify([...next]))
  }

  const step = STEPS.find(s => s.n === selectedStep)

  if (!user) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>

  return (
    <div style={{minHeight:'100vh',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      <header style={{background:'#0D1B2A',color:'#fff',padding:'12px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={() => { if (selectedStep) setSelectedStep(null); else if (showFrameworks) setShowFrameworks(false); else window.location.href='/dashboard' }}
            style={{color:'#888',fontSize:13,background:'none',border:'none',cursor:'pointer'}}>← Back</button>
          <span style={{color:'#444'}}>|</span>
          <h1 style={{fontSize:16,fontWeight:'bold'}}>📚 Learn the 11-Step Staircase</h1>
        </div>
        <button onClick={() => {setShowFrameworks(!showFrameworks); setSelectedStep(null)}}
          style={{fontSize:12,color:'#C8943E',background:'rgba(200,148,62,0.1)',border:'none',padding:'6px 12px',borderRadius:6,cursor:'pointer'}}>
          {showFrameworks ? 'Show Staircase' : '📋 All 24 Frameworks'}
        </button>
      </header>

      <div style={{maxWidth:720,margin:'0 auto',padding:24}}>
        {/* Framework Quick Reference */}
        {showFrameworks && !selectedStep && (
          <div>
            <h2 style={{fontSize:20,fontWeight:'bold',marginBottom:16}}>24 Proprietary Frameworks</h2>
            {STEPS.map(s => (
              <div key={s.n} style={{marginBottom:12}}>
                <p style={{fontSize:12,fontWeight:700,color:'#888',marginBottom:6}}>STEP {s.n}: {s.name.toUpperCase()}</p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {s.frameworks.map(f => (
                    <button key={f} onClick={() => { setSelectedStep(s.n); setShowFrameworks(false) }}
                      style={{padding:'6px 14px',background:'#fff',border:'1px solid #e5e7eb',borderRadius:20,fontSize:12,cursor:'pointer',color:'#1B2A4A'}}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{marginTop:16}}>
              <p style={{fontSize:12,fontWeight:700,color:'#888',marginBottom:6}}>CROSS-STEP</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {CROSS_STEPS.map(c => (
                  <span key={c.name} style={{padding:'6px 14px',background:'#fef3e2',border:'1px solid #C8943E',borderRadius:20,fontSize:12,color:'#92400e'}}>{c.framework}: {c.name}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Staircase View */}
        {!selectedStep && !showFrameworks && (
          <div>
            <div style={{textAlign:'center',marginBottom:24}}>
              <h2 style={{fontSize:20,fontWeight:'bold'}}>The 11-Step Sales Staircase</h2>
              <p style={{fontSize:13,color:'#888'}}>Click any step to learn the frameworks, concepts, and scripts</p>
              <p style={{fontSize:12,color:'#16a34a',marginTop:4}}>{completed.size} of {STEPS.length} steps completed</p>
            </div>

            {/* Visual Staircase */}
            <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:24}}>
              {[...STEPS].reverse().map((s, i) => {
                const isComplete = completed.has(s.n)
                const width = 40 + (STEPS.length - i) * 5
                return (
                  <button key={s.n} onClick={() => setSelectedStep(s.n)}
                    style={{width:`${width}%`,marginLeft:'auto',padding:'12px 16px',borderRadius:8,border:'none',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',
                      background:isComplete?'#16a34a':'#fff',color:isComplete?'#fff':'#1B2A4A',
                      boxShadow:'0 1px 3px rgba(0,0,0,0.08)',transition:'transform 0.15s',
                    }}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:18}}>{s.icon}</span>
                      <div>
                        <span style={{fontSize:13,fontWeight:700}}>Step {s.n}: {s.name}</span>
                        <div style={{fontSize:11,color:isComplete?'rgba(255,255,255,0.7)':'#888',marginTop:2}}>{s.frameworks.join(' · ')}</div>
                      </div>
                    </div>
                    <span style={{fontSize:14}}>{isComplete ? '✅' : '→'}</span>
                  </button>
                )
              })}
            </div>

            {/* Cross-Step Modules */}
            <h3 style={{fontSize:14,fontWeight:700,color:'#888',marginBottom:8}}>CROSS-STEP MODULES</h3>
            {CROSS_STEPS.map(c => (
              <div key={c.name} style={{background:'#fef3e2',borderRadius:8,padding:14,marginBottom:8,display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:24}}>{c.icon}</span>
                <div><div style={{fontSize:14,fontWeight:600}}>{c.name}</div><div style={{fontSize:12,color:'#888'}}>{c.framework} — {c.desc}</div></div>
              </div>
            ))}
          </div>
        )}

        {/* Step Detail Page */}
        {selectedStep && step && (
          <div>
            <div style={{background:'#0D1B2A',borderRadius:12,padding:24,color:'#fff',marginBottom:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <p style={{fontSize:12,color:'#C8943E'}}>STEP {step.n}</p>
                  <h2 style={{fontSize:22,fontWeight:'bold',marginTop:4}}>{step.icon} {step.name}</h2>
                  <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                    {step.frameworks.map(f => (
                      <span key={f} style={{padding:'4px 12px',background:'rgba(200,148,62,0.2)',borderRadius:16,fontSize:12,color:'#C8943E'}}>{f}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => toggleComplete(step.n)}
                  style={{padding:'8px 16px',background:completed.has(step.n)?'#16a34a':'rgba(255,255,255,0.1)',border:'none',borderRadius:8,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                  {completed.has(step.n) ? '✅ Completed' : '○ Mark Complete'}
                </button>
              </div>
            </div>

            {/* Key Concepts */}
            <div style={{background:'#fff',borderRadius:10,padding:20,marginBottom:12}}>
              <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>📖 Key Concepts</h3>
              {step.concepts.map((c: string, i: number) => (
                <div key={i} style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
                  <span style={{color:'#C8943E',fontSize:14,marginTop:2}}>→</span>
                  <p style={{fontSize:13,lineHeight:1.6,color:'#444'}}>{c}</p>
                </div>
              ))}
            </div>

            {/* Scripts & Templates */}
            {step.scripts && step.scripts.length > 0 && (
              <div style={{background:'#fff',borderRadius:10,padding:20,marginBottom:12}}>
                <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>📝 Scripts & Templates</h3>
                {step.scripts.map((s: string, i: number) => (
                  <div key={i} style={{background:'#f9fafb',borderRadius:8,padding:14,marginBottom:8,borderLeft:'3px solid #C8943E'}}>
                    <p style={{fontSize:13,lineHeight:1.6,color:'#333',fontStyle:'italic'}}>"{s}"</p>
                    <button onClick={() => {
                      try{navigator.clipboard.writeText(s)}catch(e){const ta=document.createElement('textarea');ta.value=s;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta)}
                      alert('Script copied!')
                    }} style={{fontSize:11,color:'#C8943E',background:'none',border:'none',cursor:'pointer',marginTop:6}}>📋 Copy Script</button>
                  </div>
                ))}
              </div>
            )}

            {/* Video Placeholder */}
            <div style={{background:'#fff',borderRadius:10,padding:20,marginBottom:12,textAlign:'center'}}>
              <p style={{fontSize:32,marginBottom:8}}>🎥</p>
              <p style={{fontSize:14,fontWeight:600,color:'#888'}}>Video Coming Soon</p>
              <p style={{fontSize:12,color:'#bbb'}}>A 5-minute video walkthrough by Bhadresh Dani will be added here</p>
            </div>

            {/* Actions */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <Link href={`/dashboard/chat?prompt=${encodeURIComponent(`I want to learn about Step ${step.n}: ${step.name}. Explain the ${step.frameworks[0]} framework in detail with examples relevant to my industry. My name is already in your context.`)}`}
                style={{padding:'10px 20px',background:'#C8943E',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>💬 Ask Coach About This</Link>
              <Link href={`/dashboard/scorecard${step.n===2?'':'?model='+['','','impact','','kycw','','','','','','dealwin',''][step.n]}`}
                style={{padding:'10px 20px',background:'#9333ea',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>📊 Practice Scoring</Link>
              <button onClick={() => setSelectedStep(null)} style={{padding:'10px 20px',background:'#f3f4f6',border:'none',borderRadius:8,fontSize:13,cursor:'pointer'}}>← Back to Staircase</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
