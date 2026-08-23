'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DEDUCTIONS = [
  {id:'sundays',label:'Sundays',default:52},
  {id:'public_holidays',label:'Public Holidays',default:15},
  {id:'personal_leave',label:'Personal/Sick Leave',default:10},
  {id:'training_days',label:'Training Days',default:5},
  {id:'internal_meetings',label:'Internal Meeting Days',default:10},
  {id:'travel_days',label:'Non-Productive Travel Days',default:5},
  {id:'admin_days',label:'Admin/Reporting Days',default:5},
  {id:'festivals',label:'Festival/Regional Holidays',default:5},
  {id:'other',label:'Other Non-Working Days',default:3},
]

export default function VelocityPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [phase, setPhase] = useState(1)
  const [saving, setSaving] = useState(false)

  // Phase 1: Working Days
  const [deductions, setDeductions] = useState<Record<string,number>>(Object.fromEntries(DEDUCTIONS.map(d=>[d.id,d.default])))
  
  // Phase 2: ROTIS
  const [annualTarget, setAnnualTarget] = useState('')
  const [salesTimePct, setSalesTimePct] = useState(100)
  const [productiveHours, setProductiveHours] = useState(8)

  // Phase 3: Velocity Engine (11 inputs)
  const [achieved, setAchieved] = useState('')
  const [billingDone, setBillingDone] = useState('')
  const [openOrders, setOpenOrders] = useState('')
  const [retainerBusiness, setRetainerBusiness] = useState('')
  const [pipeline, setPipeline] = useState('')
  const [avgDealSize, setAvgDealSize] = useState('')
  const [visitsPerEnquiry, setVisitsPerEnquiry] = useState('')
  const [enquiryToOffer, setEnquiryToOffer] = useState('')
  const [offerToOrder, setOfferToOrder] = useState('')
  const [avgCycleWeeks, setAvgCycleWeeks] = useState('')
  const [hrsPerVisit, setHrsPerVisit] = useState('')
  const [availableHrs, setAvailableHrs] = useState('8')
  const [improvePct, setImprovePct] = useState('5')

  // Results
  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      const { data: profile } = await supabase.from('profiles').select('annual_target,sales_time_percentage').eq('id', u.id).single()
      if (profile?.annual_target) setAnnualTarget(String(profile.annual_target))
      if (profile?.sales_time_percentage) setSalesTimePct(profile.sales_time_percentage)
    }
    init()
  }, [router])

  const totalDeductions = Object.values(deductions).reduce((s,v)=>s+v, 0)
  const totalDays = 365
  const workingDays = totalDays - totalDeductions
  const remainingMonths = 12 - new Date().getMonth()
  const remainingDays = Math.round(workingDays * (remainingMonths / 12))

  function calcROTIS() {
    const target = parseFloat(annualTarget) || 0
    const adjustedTarget = target * (salesTimePct / 100)
    const totalHours = workingDays * productiveHours
    return totalHours > 0 ? adjustedTarget / totalHours : 0
  }

  function calcVelocity() {
    const target = parseFloat(annualTarget) || 0
    const ach = parseFloat(achieved) || 0
    const billing = parseFloat(billingDone) || 0
    const openOrd = parseFloat(openOrders) || 0
    const retainer = parseFloat(retainerBusiness) || 0
    const secured = billing + openOrd + retainer
    const shortfall = target - ach - secured
    const avgDeal = parseFloat(avgDealSize) || 1
    const eto = parseFloat(enquiryToOffer) || 50
    const oto = parseFloat(offerToOrder) || 30
    const conv = (eto / 100) * (oto / 100) * 100
    const vpe = parseFloat(visitsPerEnquiry) || 3
    const hpv = parseFloat(hrsPerVisit) || 2
    const avlHrs = parseFloat(availableHrs) || 8
    const impPct = parseFloat(improvePct) || 5

    const ordersNeeded = shortfall / avgDeal
    const offersNeeded = ordersNeeded / (oto / 100)
    const enquiriesNeeded = offersNeeded / (eto / 100)
    const visitsNeeded = enquiriesNeeded * vpe
    const visitsPerDay = remainingDays > 0 ? visitsNeeded / remainingDays : 0
    const hrsNeeded = visitsPerDay * hpv
    const feasible = hrsNeeded <= avlHrs

    const coverageRatio = (parseFloat(pipeline) || 0) / (shortfall || 1)
    const pctAchieved = target > 0 ? (ach / target) * 100 : 0
    const costOfDelay = remainingDays > 0 ? shortfall / remainingDays : 0

    // Growth Lever: which 5% improvement moves revenue most
    const baseRevenue = (parseFloat(pipeline) || 0) * (conv / 100)
    const leverConversion = (parseFloat(pipeline) || 0) * ((conv + impPct) / 100) - baseRevenue
    const leverDealSize = baseRevenue * (impPct / 100)
    const leverVisits = baseRevenue * (impPct / 100) * 0.8
    const leverCycle = baseRevenue * (impPct / 100) * 0.6
    const levers = [
      { name: 'Better Conversion Rate', gain: leverConversion },
      { name: 'Bigger Deal Size', gain: leverDealSize },
      { name: 'More Visits/Prospects', gain: leverVisits },
      { name: 'Shorter Sales Cycle', gain: leverCycle },
    ].sort((a, b) => b.gain - a.gain)

    return {
      shortfall: Math.max(0, shortfall), secured, ordersNeeded: Math.ceil(Math.max(0, ordersNeeded)), offersNeeded: Math.ceil(offersNeeded),
      enquiriesNeeded: Math.ceil(enquiriesNeeded), visitsNeeded: Math.ceil(visitsNeeded),
      visitsPerDay: visitsPerDay.toFixed(1), hrsNeeded: hrsNeeded.toFixed(1),
      feasible, coverageRatio: coverageRatio.toFixed(1), pctAchieved: pctAchieved.toFixed(0),
      costOfDelay: Math.round(costOfDelay), remainingDays, levers,
      rotis: calcROTIS(), ordersPerDay: (ordersNeeded / (remainingDays || 1)).toFixed(2),
      offersPerDay: (offersNeeded / (remainingDays || 1)).toFixed(2),
      enquiriesPerDay: (enquiriesNeeded / (remainingDays || 1)).toFixed(2),
    }
  }

  async function handleFinish() {
    setSaving(true)
    const r = calcVelocity()
    setResults(r)

    // Save to profile
    await fetch('/api/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, rotis_hourly: r.rotis, annual_target: parseFloat(annualTarget), velocity_completed: true })
    })

    // Save snapshot
    await fetch('/api/onboarding', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, rotis_hourly: r.rotis, annual_target: parseFloat(annualTarget), velocity_completed: true })
    })

    setSaving(false)
    setPhase(5)
  }

  function formatCurrency(val: number): string {
    if (val >= 10000000) return '₹' + (val / 10000000).toFixed(1) + ' Cr'
    if (val >= 100000) return '₹' + (val / 100000).toFixed(1) + ' L'
    if (val >= 1000) return '₹' + (val / 1000).toFixed(1) + 'K'
    return '₹' + val.toLocaleString()
  }

  if (!user) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>

  return (
    <div style={{minHeight:'100vh',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      <header style={{background:'#0D1B2A',color:'#fff',padding:'12px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={() => {
            if (phase > 1 && phase < 5) setPhase(phase - 1)
            else if (phase === 5) setPhase(3)
            else window.location.href = '/dashboard'
          }} style={{color:'#888',fontSize:13,background:'none',border:'none',cursor:'pointer'}}>← Back</button>
          <span style={{color:'#444'}}>|</span>
          <h1 style={{fontSize:16,fontWeight:'bold'}}>🚀 Sales Velocity Engine</h1>
        </div>
        <div style={{fontSize:12,color:'#888'}}>Phase {Math.min(phase, 4)} of 4</div>
      </header>

      <div style={{maxWidth:640,margin:'0 auto',padding:24}}>
        {/* Progress */}
        <div style={{display:'flex',gap:4,marginBottom:24}}>
          {['Working Days','ROTIS','Velocity','Results'].map((label,i) => (
            <div key={label} style={{flex:1,textAlign:'center'}}>
              <div style={{height:6,borderRadius:3,background:phase>i+1?'#16a34a':phase===i+1?'#C8943E':'#e5e7eb',marginBottom:4}} />
              <span style={{fontSize:10,color:phase>=i+1?'#1B2A4A':'#ccc'}}>{label}</span>
            </div>
          ))}
        </div>

        {/* Phase 1: Working Days */}
        {phase === 1 && (
          <div style={{background:'#fff',borderRadius:12,padding:24}}>
            <h2 style={{fontSize:18,fontWeight:'bold',marginBottom:4}}>Phase 1: Working Days Calculator</h2>
            <p style={{fontSize:13,color:'#888',marginBottom:16}}>Adjust the deductions to match your reality. Today: {new Date().toLocaleDateString()}</p>
            {DEDUCTIONS.map(d => (
              <div key={d.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <label style={{fontSize:14}}>{d.label}</label>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <input type="range" min="0" max="60" value={deductions[d.id]} onChange={e=>setDeductions({...deductions,[d.id]:parseInt(e.target.value)})} style={{width:120,accentColor:'#C8943E'}} />
                  <span style={{fontSize:14,fontWeight:600,width:30,textAlign:'right'}}>{deductions[d.id]}</span>
                </div>
              </div>
            ))}
            <div style={{borderTop:'2px solid #0D1B2A',paddingTop:12,marginTop:12,display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:16,fontWeight:700}}>Working Days: {workingDays}</span>
              <span style={{fontSize:14,color:'#C8943E'}}>Remaining this year: {remainingDays}</span>
            </div>
            <button onClick={()=>setPhase(2)} style={{width:'100%',marginTop:16,padding:14,background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer'}}>Next: Calculate ROTIS →</button>
          </div>
        )}

        {/* Phase 2: ROTIS */}
        {phase === 2 && (
          <div style={{background:'#fff',borderRadius:12,padding:24}}>
            <h2 style={{fontSize:18,fontWeight:'bold',marginBottom:4}}>Phase 2: ROTIS™ Calculator</h2>
            <p style={{fontSize:13,color:'#888',marginBottom:16}}>Return on Time Investment in Sales — your hourly value</p>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:14,fontWeight:600}}>Annual Sales Target (₹)</label>
              <input type="number" value={annualTarget} onChange={e=>setAnnualTarget(e.target.value)} placeholder="e.g. 50000000" style={{width:'100%',padding:12,border:'1px solid #ddd',borderRadius:8,fontSize:15,marginTop:6}} />
              {annualTarget && <p style={{fontSize:12,color:'#C8943E',marginTop:4}}>{formatCurrency(parseFloat(annualTarget))}</p>}
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:14,fontWeight:600}}>% Time on Sales Activities: {salesTimePct}%</label>
              <input type="range" min="10" max="100" step="5" value={salesTimePct} onChange={e=>setSalesTimePct(parseInt(e.target.value))} style={{width:'100%',accentColor:'#C8943E'}} />
              <p style={{fontSize:12,color:'#888'}}>100% for full-time sales. Lower for SME owners/leaders with other responsibilities.</p>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:14,fontWeight:600}}>Productive Hours per Day: {productiveHours}</label>
              <input type="range" min="4" max="12" value={productiveHours} onChange={e=>setProductiveHours(parseInt(e.target.value))} style={{width:'100%',accentColor:'#C8943E'}} />
            </div>
            {annualTarget && (
              <div style={{background:'#0D1B2A',borderRadius:10,padding:20,color:'#fff',textAlign:'center',marginBottom:16}}>
                <p style={{fontSize:12,color:'#888'}}>Your ROTIS™</p>
                <p style={{fontSize:36,fontWeight:'bold',color:'#C8943E'}}>₹{Math.round(calcROTIS()).toLocaleString()}/hr</p>
                <p style={{fontSize:13,color:'#999'}}>Every hour you waste costs you ₹{Math.round(calcROTIS()).toLocaleString()}</p>
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setPhase(1)} style={{padding:14,background:'#f3f4f6',border:'none',borderRadius:8,fontSize:14,cursor:'pointer'}}>← Back</button>
              <button onClick={()=>setPhase(3)} disabled={!annualTarget} style={{flex:1,padding:14,background:annualTarget?'#C8943E':'#ccc',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:annualTarget?'pointer':'default'}}>Next: Velocity Engine →</button>
            </div>
          </div>
        )}

        {/* Phase 3: Velocity Inputs */}
        {phase === 3 && (
          <div style={{background:'#fff',borderRadius:12,padding:24}}>
            <h2 style={{fontSize:18,fontWeight:'bold',marginBottom:4}}>Phase 3: Sales Velocity Engine</h2>
            <p style={{fontSize:13,color:'#888',marginBottom:16}}>Enter your current numbers to calculate daily activity targets</p>
            {[
              {label:'Revenue Achieved So Far (₹)',val:achieved,set:setAchieved,hint:'Year-to-date order booking'},
              {label:'Billing Done Till Now (₹)',val:billingDone,set:setBillingDone,hint:'Total billing/invoicing done this year'},
              {label:'Unexecuted Open Orders (₹)',val:openOrders,set:setOpenOrders,hint:'Open orders that can be billed this financial year'},
              {label:'Retainer / Repeat Business Expected (₹)',val:retainerBusiness,set:setRetainerBusiness,hint:'Expected from annual rate contracts or repeat customers'},
              {label:'Current Pipeline Value (₹)',val:pipeline,set:setPipeline,hint:'Total value of active opportunities'},
              {label:'Average Deal Size (₹)',val:avgDealSize,set:setAvgDealSize,hint:'Typical order value'},
              {label:'Visits Needed per Enquiry',val:visitsPerEnquiry,set:setVisitsPerEnquiry,hint:'How many visits to generate 1 enquiry?'},
              {label:'Enquiry to Offer Rate (%)',val:enquiryToOffer,set:setEnquiryToOffer,hint:'What % of enquiries become formal offers?'},
              {label:'Offer to Order Rate (%)',val:offerToOrder,set:setOfferToOrder,hint:'What % of offers convert to orders?'},
              {label:'Average Sales Cycle (weeks)',val:avgCycleWeeks,set:setAvgCycleWeeks,hint:'From first contact to order'},
              {label:'Hours per Customer Visit',val:hrsPerVisit,set:setHrsPerVisit,hint:'Including travel + meeting time'},
            ].map(f => (
              <div key={f.label} style={{marginBottom:14}}>
                <label style={{fontSize:13,fontWeight:600}}>{f.label}</label>
                <input type="number" value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.hint} style={{width:'100%',padding:10,border:'1px solid #ddd',borderRadius:8,fontSize:14,marginTop:4}} />
                {f.val && parseFloat(f.val) > 0 && f.label.includes('₹') && <p style={{fontSize:11,color:'#C8943E',marginTop:2}}>{parseFloat(f.val)>=10000000?'₹'+(parseFloat(f.val)/10000000).toFixed(1)+' Cr':parseFloat(f.val)>=100000?'₹'+(parseFloat(f.val)/100000).toFixed(1)+' L':'₹'+parseFloat(f.val).toLocaleString()}</p>}
              </div>
            ))}
            {/* Show calculated deduction summary */}
            {(billingDone || openOrders || retainerBusiness) && (
              <div style={{background:'#f0fdf4',borderRadius:8,padding:12,marginBottom:14,border:'1px solid #86efac'}}>
                <p style={{fontSize:12,fontWeight:600,color:'#16a34a',marginBottom:4}}>Secured Business Summary:</p>
                <p style={{fontSize:12,color:'#666'}}>
                  Billing: {formatCurrency(parseFloat(billingDone)||0)} + Open Orders: {formatCurrency(parseFloat(openOrders)||0)} + Retainer: {formatCurrency(parseFloat(retainerBusiness)||0)}
                  = <strong>{formatCurrency((parseFloat(billingDone)||0)+(parseFloat(openOrders)||0)+(parseFloat(retainerBusiness)||0))}</strong> secured
                </p>
                <p style={{fontSize:12,color:'#C8943E',fontWeight:600,marginTop:4}}>
                  Remaining target for new orders: {formatCurrency(Math.max(0, (parseFloat(annualTarget)||0) - (parseFloat(achieved)||0) - (parseFloat(billingDone)||0) - (parseFloat(openOrders)||0) - (parseFloat(retainerBusiness)||0)))}
                </p>
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setPhase(2)} style={{padding:14,background:'#f3f4f6',border:'none',borderRadius:8,fontSize:14,cursor:'pointer'}}>← Back</button>
              <button onClick={handleFinish} disabled={saving} style={{flex:1,padding:14,background:saving?'#d4a855':'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:saving?'wait':'pointer'}}>{saving?'Calculating...':'Calculate My Velocity →'}</button>
            </div>
          </div>
        )}

        {/* Phase 5: Results Dashboard */}
        {phase === 5 && results && (
          <div>
            <div style={{background:'#0D1B2A',borderRadius:12,padding:24,color:'#fff',textAlign:'center',marginBottom:16}}>
              <h2 style={{fontSize:20,fontWeight:'bold',marginBottom:4}}>Your Sales Velocity Dashboard</h2>
              <p style={{fontSize:36,fontWeight:'bold',color:'#C8943E'}}>₹{Math.round(results.rotis).toLocaleString()}/hr</p>
              <p style={{fontSize:13,color:'#888'}}>ROTIS™ — Make every hour count</p>
              {results.secured > 0 && <p style={{fontSize:12,color:'#86efac',marginTop:8}}>Secured: {formatCurrency(results.secured)} | Shortfall: {formatCurrency(results.shortfall)}</p>}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:16}}>
              {[
                {label:'Visits/Day',value:results.visitsPerDay,color:'#2563eb'},
                {label:'Enquiries/Day',value:results.enquiriesPerDay,color:'#16a34a'},
                {label:'Offers/Day',value:results.offersPerDay,color:'#9333ea'},
                {label:'Orders/Day',value:results.ordersPerDay,color:'#C8943E'},
              ].map(m => (
                <div key={m.label} style={{background:'#fff',borderRadius:10,padding:16,textAlign:'center'}}>
                  <p style={{fontSize:12,color:'#888'}}>{m.label}</p>
                  <p style={{fontSize:28,fontWeight:'bold',color:m.color}}>{m.value}</p>
                </div>
              ))}
            </div>

            <div style={{background:'#fff',borderRadius:10,padding:16,marginBottom:16}}>
              <h3 style={{fontSize:14,fontWeight:700,marginBottom:12}}>📊 Pipeline Health</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                <div><span style={{fontSize:12,color:'#888'}}>Coverage Ratio</span><p style={{fontSize:18,fontWeight:700}}>{results.coverageRatio}x</p></div>
                <div><span style={{fontSize:12,color:'#888'}}>% Achieved</span><p style={{fontSize:18,fontWeight:700}}>{results.pctAchieved}%</p></div>
                <div><span style={{fontSize:12,color:'#888'}}>Cost of Delay</span><p style={{fontSize:18,fontWeight:700,color:'#dc2626'}}>{formatCurrency(results.costOfDelay)}/day</p></div>
                <div><span style={{fontSize:12,color:'#888'}}>Days Left</span><p style={{fontSize:18,fontWeight:700}}>{results.remainingDays}</p></div>
              </div>
            </div>

            <div style={{background:results.feasible?'#f0fdf4':'#fef2f2',borderRadius:10,padding:16,marginBottom:16,border:results.feasible?'1px solid #86efac':'1px solid #fca5a5'}}>
              <p style={{fontSize:14,fontWeight:700,color:results.feasible?'#16a34a':'#dc2626'}}>{results.feasible?'✅ FEASIBLE':'⚠️ NOT FEASIBLE'}</p>
              <p style={{fontSize:13,color:'#666'}}>You need {results.hrsNeeded} hrs/day for visits. You have {availableHrs} hrs available.</p>
            </div>

            <div style={{background:'#fff',borderRadius:10,padding:16,marginBottom:16}}>
              <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>🔥 #1 Growth Lever</h3>
              <p style={{fontSize:16,fontWeight:700,color:'#C8943E'}}>{results.levers[0]?.name}</p>
              <p style={{fontSize:13,color:'#666'}}>A {improvePct}% improvement here adds {formatCurrency(Math.round(results.levers[0]?.gain || 0))} to your revenue</p>
            </div>

            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button onClick={() => {
                const txt = `Sales Velocity Dashboard\nROTIS: ₹${Math.round(results.rotis).toLocaleString()}/hr\nVisits/Day: ${results.visitsPerDay}\nEnquiries/Day: ${results.enquiriesPerDay}\nShortfall: ${formatCurrency(results.shortfall)}\nCoverage: ${results.coverageRatio}x | Achieved: ${results.pctAchieved}%\nCost of Delay: ${formatCurrency(results.costOfDelay)}/day\nFeasible: ${results.feasible?'Yes':'No'}\n#1 Lever: ${results.levers[0]?.name}`
                try{navigator.clipboard.writeText(txt)}catch(e){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta)}
                alert('Copied!')
              }} style={{padding:'10px 20px',background:'#f3f4f6',borderRadius:8,fontSize:13,fontWeight:600,border:'none',cursor:'pointer'}}>📋 Copy Report</button>
              <Link href="/dashboard/chat?prompt=Based+on+my+Sales+Velocity+Engine+results,+help+me+plan+my+week" style={{padding:'10px 20px',background:'#C8943E',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>📅 Plan My Week</Link>
              <Link href="/dashboard" style={{padding:'10px 20px',background:'#0D1B2A',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>← Dashboard</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
