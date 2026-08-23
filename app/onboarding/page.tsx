'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const INDUSTRIES = ['Manufacturing — Plastics, Metals, Machine Tools','Chemical / Pharmaceutical','E-Mobility / EV / New Technology','Material Handling / Printing & Packaging','SaaS / Software / IT Services','Agriculture / Agri-Tech','Food & Beverage / FMCG Manufacturing','Oil & Gas / Energy / Petrochemical','Construction / Real Estate / Infrastructure','Healthcare / Medical Devices','Textiles / Apparel','Automotive / Auto Components','Logistics / Warehousing / Supply Chain','Education / EdTech','Renewable Energy / Solar / Wind','BFSI','Hospitality / Hotels / Facility Management','HVAC / Refrigeration / Cold Chain','Water Treatment / Environment','Aerospace / Defence']
const PRODUCTS = ['Plastic Machinery','Machine Tools (CNC)','Textile Machinery','Food Processing Equipment','Electrical Panels / Switchgear','Motors / Drives / Servo / Automation','Pumps / Valves','Wires / Cables / Electrical','SaaS / Cloud Software','IT Infrastructure','IoT / Industry 4.0','ERP / CRM Software','Consulting / Professional Services','Chemicals / Polymers','Metals / Steel / Aluminium','HVAC / Refrigeration','Solar / Renewable Energy','Medical Devices','Material Handling Equipment','Earth Moving / Construction Equipment']
const CUSTOMER_TYPES = ['End Users','OEMs (Original Equipment Manufacturers)','EPC Contractors','Consultants / Specifiers','Panel Builders / System Integrators','Channel Partners / Distributors','Dealers / Retailers','Government / PSU']
const CHALLENGES = ['High energy costs','Labour shortage','Price pressure','FX fluctuation','Regulatory compliance','Quality consistency','Machine downtime','Supply chain disruption','Capacity expansion','Digital transformation','Environmental compliance','Safety / hazards','Working capital constraints','Talent retention','Technology obsolescence']
const BUYING_CRITERIA = ['Price / TCO','Quality / Reliability','Faster delivery','After-sales service','Machine uptime / MTBF','Energy efficiency','Technical superiority','Brand reputation','Customisation','Local service presence','Financing / payment terms','Training / commissioning','Warranty coverage','Certifications','Long-term partnership']
const DESIGNATIONS = ['Sales Executive / Sales Officer','Senior SE / Key Account Manager','Area / Regional Sales Manager','Zonal / National Sales Manager','Sales Head / VP Sales / Director','CRO / Chief Business Officer','BD Manager / BD Head','SME Owner / Founder / CEO / MD']
const EXP_OPTIONS = ['0-2','3-5','6-10','11-15','16-20','21-25','25+']
const SALES_EXP = ['0-1','2-3','4-5','6-10','11-15','16-20','20+']

interface Question { id: string; text: string; type: 'text'|'select'|'multi'|'competitors'; options?: string[]; optional?: boolean }
const QUESTIONS: Question[] = [
  { id: 'organisation', text: "Which organisation do you work with?", type: 'text' },
  { id: 'designation', text: "What is your designation or area of responsibility?", type: 'select', options: DESIGNATIONS },
  { id: 'sales_time_percentage', text: "As a business leader, what percentage of your working time do you personally spend on sales-related activities?", type: 'select', options: ['10%','20%','30%','40%','50%','60%','70%','80%','90%','100%'], optional: true },
  { id: 'years_total', text: "How many years of total professional experience do you have?", type: 'select', options: EXP_OPTIONS },
  { id: 'years_sales', text: "How many of those years have been in sales or business development?", type: 'select', options: SALES_EXP },
  { id: 'linkedin_url', text: "Would you like to share your LinkedIn profile URL? (Optional — you can skip)", type: 'text', optional: true },
  { id: 'country', text: "Which country are you based in?", type: 'text' },
  { id: 'industries', text: "Which industries do your customers belong to? (Select all that apply)", type: 'multi', options: INDUSTRIES },
  { id: 'product_category', text: "What product or service do you sell? (Select all that apply)", type: 'multi', options: PRODUCTS },
  { id: 'customer_types', text: "What type of customers do you typically sell to? (Select all that apply)", type: 'multi', options: CUSTOMER_TYPES },
  { id: 'competitors', text: "Who are your top 2-3 closest competitors?", type: 'competitors' },
  { id: 'industry_challenges', text: "What typical challenges do your customers face? (Select all that apply)", type: 'multi', options: CHALLENGES },
  { id: 'buying_criteria', text: "What criteria matter most when customers choose you vs competitors? (Select top 5)", type: 'multi', options: BUYING_CRITERIA },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [currentInput, setCurrentInput] = useState('')
  const [selectedMulti, setSelectedMulti] = useState<string[]>([])
  const [competitors, setCompetitors] = useState(['','',''])
  const [saving, setSaving] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single()
      if (profile?.onboarding_completed) { router.push('/dashboard'); return }
      setUser({ ...u, name: profile?.name || u.user_metadata?.name || u.email?.split('@')[0] })
    }
    init()
  }, [router])

  const q = QUESTIONS[step]

  function shouldSkipQuestion(questionId: string): boolean {
    if (questionId === 'sales_time_percentage') {
      const designation = answers['designation'] || ''
      const isOwner = designation.includes('Owner') || designation.includes('CEO') || designation.includes('MD') || designation.includes('Founder')
      return !isOwner
    }
    return false
  }

  function handleNext() {
    if (q.type === 'multi') {
      if (selectedMulti.length === 0 && !q.optional) return
      setAnswers({ ...answers, [q.id]: selectedMulti })
      setSelectedMulti([])
    } else if (q.type === 'competitors') {
      setAnswers({ ...answers, [q.id]: competitors.filter((c: string) => c.trim()) })
    } else {
      if (!currentInput.trim() && !q.optional) return
      setAnswers({ ...answers, [q.id]: currentInput.trim() })
      setCurrentInput('')
    }
    let nextStep = step + 1
    while (nextStep < QUESTIONS.length && shouldSkipQuestion(QUESTIONS[nextStep].id)) {
      nextStep++
    }
    if (nextStep < QUESTIONS.length) setStep(nextStep)
    else handleSubmit()
  }

  function handleSkip() {
    setAnswers({ ...answers, [q.id]: q.type === 'multi' ? [] : '' })
    setCurrentInput('')
    setSelectedMulti([])
    let nextStep = step + 1
    while (nextStep < QUESTIONS.length && shouldSkipQuestion(QUESTIONS[nextStep].id)) {
      nextStep++
    }
    if (nextStep < QUESTIONS.length) setStep(nextStep)
    else handleSubmit()
  }

  const [showSummary, setShowSummary] = useState(false)
  const [finalData, setFinalData] = useState<Record<string, any>>({})

  async function handleSubmit() {
    setSaving(true)
    const finalAnswers = { ...answers }
    if (q.type === 'multi') finalAnswers[q.id] = selectedMulti
    else if (q.type === 'competitors') finalAnswers[q.id] = competitors.filter((c: string) => c.trim())
    else finalAnswers[q.id] = currentInput.trim()

    // Convert sales_time_percentage to number
    if (finalAnswers.sales_time_percentage) {
      finalAnswers.sales_time_percentage = parseInt(finalAnswers.sales_time_percentage)
    }

    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, ...finalAnswers }),
    })
    setFinalData(finalAnswers)
    setSaving(false)
    setShowSummary(true)
  }

  function toggleMulti(item: string) {
    setSelectedMulti(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])
  }

  if (!user) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>

  // O5/O6: Show profile summary after onboarding
  if (showSummary) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      <div style={{maxWidth:540,padding:40,textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:16}}>🎉</div>
        <h1 style={{fontSize:24,fontWeight:'bold',color:'#1B2A4A',marginBottom:16}}>Excellent, {user.name?.split(' ')[0]}!</h1>
        <div style={{background:'#fff',borderRadius:12,padding:24,textAlign:'left',marginBottom:24,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <p style={{fontSize:15,lineHeight:1.8,color:'#444'}}>
            I now have a clear picture of your world:
            <br/><br/>
            You're a <strong>{finalData.designation || 'sales professional'}</strong> at <strong>{finalData.organisation || 'your company'}</strong>, 
            with <strong>{finalData.years_sales || 'several'} years</strong> in sales.
            {finalData.industries?.length > 0 && <><br/><br/>Your customers are in <strong>{finalData.industries.slice(0,3).join(', ')}</strong>.</>}
            {finalData.competitors?.length > 0 && <><br/>You compete against <strong>{finalData.competitors.join(', ')}</strong>.</>}
            <br/><br/>
            I'll use all of this to give you coaching that's specific to YOUR reality — not generic advice.
          </p>
        </div>
        <p style={{fontSize:14,color:'#666',marginBottom:24}}>I recommend we start with your <strong>Sales Velocity Engine</strong> — it takes 10 minutes and tells you exactly how many visits per day you need to hit your target.</p>
        <div style={{display:'flex',gap:12,justifyContent:'center'}}>
          <button onClick={() => router.push('/dashboard/chat?mode=velocity')}
            style={{padding:'14px 28px',background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer'}}>
            🚀 Start Velocity Engine
          </button>
          <button onClick={() => router.push('/dashboard')}
            style={{padding:'14px 28px',background:'#fff',color:'#1B2A4A',border:'1px solid #ddd',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>
            Explore Platform
          </button>
        </div>
      </div>
    </div>
  )

  if (showWelcome) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#0D1B2A 0%,#1B2A4A 100%)',fontFamily:'Arial,sans-serif'}}>
      <div style={{maxWidth:540,padding:40,textAlign:'center',color:'#fff'}}>
        <div style={{fontSize:48,marginBottom:16}}>🎯</div>
        <h1 style={{fontSize:28,fontWeight:'bold',marginBottom:8}}>Welcome aboard, {user.name}!</h1>
        <p style={{fontSize:15,color:'#C8943E',fontWeight:600,marginBottom:24}}>I'm B2BsalesBUDDY — Your Personal AI Sales Coach</p>
        <div style={{textAlign:'left',background:'rgba(255,255,255,0.08)',borderRadius:12,padding:24,marginBottom:24}}>
          <p style={{fontSize:14,marginBottom:16,color:'#ddd'}}>What makes me different?</p>
          {['I DIAGNOSE root causes, not just symptoms','I PRESCRIBE specific actions with proprietary frameworks','I TRACK your progress through measurable scores','I help you build BALANCED WORK & LIFE','I assess competency GAPS and recommend development plans','I calculate your exact DAILY ACTIVITY TARGETS'].map((t,i) => (
            <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:8}}>
              <span style={{color:'#C8943E',fontSize:14,marginTop:2}}>→</span>
              <span style={{fontSize:13,color:'#ccc'}}>{t}</span>
            </div>
          ))}
        </div>
        <p style={{fontSize:13,color:'#999',marginBottom:24}}>I'd like to know a few things about you. It takes about 3-4 minutes.</p>
        <button onClick={() => setShowWelcome(false)} style={{padding:'12px 40px',background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:16,fontWeight:600,cursor:'pointer'}}>
          Let's Begin →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      <div style={{maxWidth:600,margin:'0 auto',padding:'40px 24px'}}>
        {/* Progress */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:32}}>
          <span style={{fontSize:12,color:'#888'}}>Question {step + 1} of {QUESTIONS.length}</span>
          <div style={{flex:1,height:4,background:'#e5e7eb',borderRadius:4}}>
            <div style={{width:`${((step+1)/QUESTIONS.length)*100}%`,height:4,background:'#C8943E',borderRadius:4,transition:'width 0.3s'}} />
          </div>
        </div>

        {/* Question */}
        <div style={{background:'#fff',borderRadius:12,padding:32,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <p style={{fontSize:18,fontWeight:600,marginBottom:24,color:'#1B2A4A'}}>{q.text}</p>

          {q.type === 'text' && (
            <input type="text" value={currentInput} onChange={e => setCurrentInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
              placeholder={q.id === 'linkedin_url' ? 'https://linkedin.com/in/yourprofile' : 'Type your answer...'}
              autoFocus
              style={{width:'100%',padding:'12px 16px',border:'1px solid #ddd',borderRadius:8,fontSize:15,outline:'none'}} />
          )}

          {q.type === 'select' && (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {q.options?.map(opt => (
                <button key={opt} onClick={() => { setCurrentInput(opt); setTimeout(handleNext, 200) }}
                  style={{padding:'12px 16px',border:currentInput===opt?'2px solid #C8943E':'1px solid #ddd',borderRadius:8,textAlign:'left',fontSize:14,background:currentInput===opt?'#fef3e2':'#fff',cursor:'pointer'}}>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === 'multi' && (
            <div style={{display:'flex',flexWrap:'wrap',gap:8,maxHeight:300,overflowY:'auto'}}>
              {q.options?.map(opt => (
                <button key={opt} onClick={() => toggleMulti(opt)}
                  style={{padding:'8px 14px',border:selectedMulti.includes(opt)?'2px solid #C8943E':'1px solid #ddd',borderRadius:20,fontSize:13,background:selectedMulti.includes(opt)?'#fef3e2':'#fff',cursor:'pointer'}}>
                  {selectedMulti.includes(opt) ? '✓ ' : ''}{opt}
                </button>
              ))}
            </div>
          )}

          {q.type === 'competitors' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[0,1,2].map(i => (
                <input key={i} type="text" value={competitors[i]} placeholder={`Competitor ${i+1}${i===2?' (optional)':''}`}
                  onChange={e => { const c = [...competitors]; c[i] = e.target.value; setCompetitors(c) }}
                  style={{padding:'12px 16px',border:'1px solid #ddd',borderRadius:8,fontSize:14,outline:'none'}} />
              ))}
            </div>
          )}

          {/* Buttons */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:24}}>
            <div>
              {step > 0 && <button onClick={() => setStep(step-1)} style={{padding:'8px 16px',fontSize:13,color:'#888',background:'none',border:'none',cursor:'pointer'}}>← Back</button>}
            </div>
            <div style={{display:'flex',gap:8}}>
              {q.optional && <button onClick={handleSkip} style={{padding:'10px 20px',fontSize:14,color:'#888',background:'#f3f4f6',border:'none',borderRadius:8,cursor:'pointer'}}>Skip</button>}
              <button onClick={handleNext} disabled={saving}
                style={{padding:'10px 28px',fontSize:14,fontWeight:600,color:'#fff',background:saving?'#d4a855':'#C8943E',border:'none',borderRadius:8,cursor:saving?'wait':'pointer'}}>
                {saving ? 'Saving...' : step === QUESTIONS.length - 1 ? 'Finish →' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
