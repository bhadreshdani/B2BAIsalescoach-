'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CalendlyButton from '@/components/CalendlyButton'

const DEDUCTIONS = [
  {id:'sundays',label:'Sundays',default:52},
  {id:'saturdays',label:'Non-Working Saturdays',default:26},
  {id:'public_holidays',label:'Public Holidays',default:15},
  {id:'personal_leave',label:'Personal/Sick Leave',default:10},
  {id:'training_days',label:'Training Days',default:5},
  {id:'internal_meetings',label:'Internal Meeting Days',default:10},
  {id:'travel_days',label:'Non-Productive Travel Days',default:5},
  {id:'admin_days',label:'Admin/Reporting Days',default:5},
  {id:'festivals',label:'Festival/Regional Holidays',default:5},
  {id:'other',label:'Other Non-Working Days',default:3},
]
const FY_OPTIONS = [
  {label:'April to March (India standard)',sm:3,sl:'Apr',em:'Mar'},
  {label:'January to December',sm:0,sl:'Jan',em:'Dec'},
  {label:'October to September',sm:9,sl:'Oct',em:'Sep'},
]
const Q_SPLIT = [
  {label:'Standard',values:[20,25,25,30]},
  {label:'Even',values:[25,25,25,25]},
  {label:'Back-loaded',values:[15,20,30,35]},
  {label:'Front-loaded',values:[30,25,25,20]},
]

export default function VelocityPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [phase, setPhase] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [fyType, setFyType] = useState(0)
  const [fyYear, setFyYear] = useState(new Date().getFullYear())
  const [deductions, setDeductions] = useState<Record<string,number>>(Object.fromEntries(DEDUCTIONS.map(d=>[d.id,d.default])))
  const [workStartHr, setWorkStartHr] = useState(9)
  const [workEndHr, setWorkEndHr] = useState(18)
  const [annualTarget, setAnnualTarget] = useState('')
  const [salesTimePct, setSalesTimePct] = useState(100)
  const [billingDone, setBillingDone] = useState('')
  const [openOrders, setOpenOrders] = useState('')
  const [retainerBusiness, setRetainerBusiness] = useState('')
  const [regularPipeline, setRegularPipeline] = useState('')
  const [regularAvgDeal, setRegularAvgDeal] = useState('')
  const [regularCycleWeeks, setRegularCycleWeeks] = useState('')
  const [hasProjectBiz, setHasProjectBiz] = useState(false)
  const [projectPipeline, setProjectPipeline] = useState('')
  const [projectAvgDeal, setProjectAvgDeal] = useState('')
  const [projectCycleWeeks, setProjectCycleWeeks] = useState('')
  const [visitsPerEnquiry, setVisitsPerEnquiry] = useState('')
  const [enquiryToOffer, setEnquiryToOffer] = useState('')
  const [offerToOrder, setOfferToOrder] = useState('')
  const [hrsPerVisit, setHrsPerVisit] = useState('')
  const [deliveryWeeks, setDeliveryWeeks] = useState('')
  const [qSplit, setQSplit] = useState(0)
  const [results, setResults] = useState<any>(null)

  useEffect(() => { async function init() { const sb=createClient(); const{data:{user:u}}=await sb.auth.getUser(); if(!u){router.push('/auth/login');return}; setUser(u); const{data:p}=await sb.from('profiles').select('annual_target,sales_time_percentage').eq('id',u.id).single(); if(p?.annual_target)setAnnualTarget(String(p.annual_target)); if(p?.sales_time_percentage)setSalesTimePct(p.sales_time_percentage) }; init() }, [router])

  const totalDed = Object.values(deductions).reduce((s,v)=>s+v,0)
  const workDays = 365 - totalDed
  const prodHrs = workEndHr - workStartHr
  const daysPerWk = deductions.saturdays >= 26 ? 5 : 6
  const workWeeks = Math.round(workDays / daysPerWk)
  const fy = FY_OPTIONS[fyType]
  const fyStart = new Date(fyYear, fy.sm, 1)
  const fyEnd = new Date(fy.sm===0 ? fyYear : fyYear+1, fy.sm===0 ? 12 : fy.sm, 0)
  const now = new Date()
  const remRatio = Math.max(0, Math.min(1, (fyEnd.getTime()-now.getTime()) / (fyEnd.getTime()-fyStart.getTime())))
  const remDays = Math.round(workDays * remRatio)
  const remWeeks = Math.round(remDays / daysPerWk)

  function calcROTIS() {
    const t = parseFloat(annualTarget)||0
    const hrs = workDays * prodHrs * (salesTimePct/100)
    return hrs > 0 ? t / hrs : 0
  }

  function calcVelocity() {
    const t=parseFloat(annualTarget)||0; const bill=parseFloat(billingDone)||0; const oo=parseFloat(openOrders)||0; const ret=parseFloat(retainerBusiness)||0
    const secured=bill+oo+ret; const shortfall=Math.max(0,t-secured)
    const rp=parseFloat(regularPipeline)||0; const rd=parseFloat(regularAvgDeal)||1; const rc=parseFloat(regularCycleWeeks)||8
    const pp=hasProjectBiz?(parseFloat(projectPipeline)||0):0; const pd=hasProjectBiz?(parseFloat(projectAvgDeal)||1):0
    const totalPipe=rp+pp; const wAvgDeal=totalPipe>0?(rp*rd+pp*pd)/(rp+pp||1):rd
    const eto=parseFloat(enquiryToOffer)||50; const oto=parseFloat(offerToOrder)||30
    const vpe=parseFloat(visitsPerEnquiry)||3; const hpv=parseFloat(hrsPerVisit)||2
    const ordN=shortfall/wAvgDeal; const offN=ordN/(oto/100); const enqN=offN/(eto/100); const visN=enqN*vpe
    const vpw=remWeeks>0?visN/remWeeks:0; const hpw=vpw*hpv
    const availWkHrs=prodHrs*daysPerWk*(salesTimePct/100)
    const cov=shortfall>0?totalPipe/shortfall:0; const pctA=t>0?((bill+oo)/t)*100:0
    const qv=Q_SPLIT[qSplit].values; const qT=qv.map((p: number)=>t*p/100)
    const baseRev=totalPipe*((eto/100)*(oto/100)); const levers=[
      {name:'Better Conversion Rate',gain:totalPipe*0.05},{name:'Bigger Deal Size',gain:baseRev*0.05},
      {name:'More Visits/Prospects',gain:baseRev*0.04},{name:'Shorter Sales Cycle',gain:baseRev*0.03}
    ].sort((a,b)=>b.gain-a.gain)
    return { shortfall,secured,totalPipe,wAvgDeal,ordN:Math.ceil(ordN),offN:Math.ceil(offN),enqN:Math.ceil(enqN),visN:Math.ceil(visN),
      vpw:vpw.toFixed(1),hpw:hpw.toFixed(1),opw:(ordN/(remWeeks||1)).toFixed(1),ofw:(offN/(remWeeks||1)).toFixed(1),eqw:(enqN/(remWeeks||1)).toFixed(1),
      feasible:hpw<=availWkHrs,cov:cov.toFixed(1),pctA:pctA.toFixed(0),cod:Math.round(shortfall/(remWeeks||1)),remDays,remWeeks,
      levers,rotis:calcROTIS(),qT,mT:t/12,availWkHrs:availWkHrs.toFixed(0),
      vpm:(vpw*4.3).toFixed(0),eqm:((enqN/(remWeeks||1))*4.3).toFixed(0),opm:((ordN/(remWeeks||1))*4.3).toFixed(0)
    }
  }

  async function handleFinish() {
    setSaving(true); const r=calcVelocity(); setResults(r)
    await fetch('/api/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id,rotis_hourly:r.rotis,annual_target:parseFloat(annualTarget),velocity_completed:true})})
    await fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id,modelType:'velocity',factors:{annualTarget:parseFloat(annualTarget),rotis:r.rotis,visitsPerWeek:r.vpw},totalScore:r.rotis,classification:r.feasible?'Feasible':'Stretch'})}).catch(()=>{})
    setSaving(false); setPhase(4)
  }

  function fmt(v:number){if(v>=10000000)return'\u20B9'+(v/10000000).toFixed(1)+' Cr';if(v>=100000)return'\u20B9'+(v/100000).toFixed(1)+' L';return'\u20B9'+Math.round(v).toLocaleString()}

  if(!user) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>

  return (
    <div style={{minHeight:'100vh',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      <header data-sticky="true" style={{background:'#0D1B2A',color:'#fff',padding:'12px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <a href="/dashboard" style={{display:'flex',alignItems:'center',gap:4,color:'#C8943E',fontSize:13,textDecoration:'none',fontWeight:600,background:'rgba(200,148,62,0.15)',padding:'6px 12px',borderRadius:6}}>🏠 Home</a>
          <span style={{color:'#444'}}>|</span>
          <h1 style={{fontSize:16,fontWeight:'bold'}}>🚀 Sales Velocity Engine</h1>
        </div>
        {phase>=1&&phase<=3&&<div style={{fontSize:12,color:'#888'}}>Phase {phase} of 3</div>}
      </header>

      <div style={{maxWidth:680,margin:'0 auto',padding:24}}>
        {/* INTRO */}
        {showIntro&&(<div style={{position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)'}}>
          <div style={{background:'#fff',borderRadius:16,padding:28,maxWidth:520,width:'90%',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
            <h2 style={{fontSize:20,fontWeight:700,color:'#0D1B2A',marginBottom:12}}>🚀 What is Sales Velocity Engine?</h2>
            <div style={{marginBottom:14}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#C8943E',marginBottom:4}}>ROTIS™ — Return on Time Investment in Sales</h3>
              <p style={{fontSize:13,color:'#444',lineHeight:1.6}}>ROTIS tells you how much <strong>each hour of your sales time is worth</strong>. If your ROTIS is ₹5,000/hr and you waste 2 hours, you have lost ₹10,000. It creates urgency and accountability.</p>
            </div>
            <div style={{marginBottom:14}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#C8943E',marginBottom:4}}>Sales Velocity — Your Weekly Activity Targets</h3>
              <p style={{fontSize:13,color:'#444',lineHeight:1.6}}>Answers: <strong>How many visits, enquiries, offers, and orders do I need per WEEK?</strong> Reverse-engineers your annual target into a simple weekly action plan.</p>
            </div>
            <div style={{background:'#f5f0e8',borderRadius:8,padding:12,marginBottom:14}}>
              <p style={{fontSize:12,color:'#666',lineHeight:1.6}}><strong>Why weekly for B2B?</strong> Unlike B2C, B2B sales cycles are weeks or months. Daily targets create unnecessary pressure. Weekly velocity gives you a realistic, actionable rhythm.</p>
            </div>
            <button onClick={()=>{setShowIntro(false);setPhase(1)}} style={{width:'100%',padding:14,background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer'}}>Let us Calculate My Velocity →</button>
          </div>
        </div>)}

        {/* Progress */}
        {phase>=1&&phase<=3&&(<div style={{display:'flex',gap:4,marginBottom:24}}>{['Working Days & Hours','ROTIS™','Velocity & Results'].map((l,i)=>(<div key={l} style={{flex:1,textAlign:'center'}}><div style={{height:6,borderRadius:3,background:phase>i+1?'#16a34a':phase===i+1?'#C8943E':'#e5e7eb',marginBottom:4}}/><span style={{fontSize:10,color:phase>=i+1?'#1B2A4A':'#ccc'}}>{l}</span></div>))}</div>)}

        {/* PHASE 1 */}
        {phase===1&&(<div style={{background:'#fff',borderRadius:12,padding:24}}>
          <h2 style={{fontSize:18,fontWeight:'bold',marginBottom:4}}>Phase 1: Your Working Calendar</h2>
          <div style={{background:'#f0f9ff',borderRadius:8,padding:12,marginBottom:16,border:'1px solid #bae6fd'}}>
            <p style={{fontSize:12,color:'#0369a1',lineHeight:1.6}}>📋 <strong>How to use:</strong> Select your financial year, office hours, and adjust non-working days to match YOUR reality. Most B2B professionals have only 220-250 actual selling days per year.</p>
          </div>
          <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600}}>Financial Year Type</label><select value={fyType} onChange={e=>setFyType(parseInt(e.target.value))} style={{width:'100%',padding:10,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}>{FY_OPTIONS.map((f,i)=><option key={i} value={i}>{f.label}</option>)}</select></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
            <div><label style={{fontSize:12,fontWeight:600}}>Start Year</label><select value={fyYear} onChange={e=>setFyYear(parseInt(e.target.value))} style={{width:'100%',padding:10,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}>{[2024,2025,2026,2027,2028].map(y=><option key={y} value={y}>{y}</option>)}</select></div>
            <div style={{display:'flex',alignItems:'flex-end'}}><p style={{fontSize:13,color:'#C8943E',fontWeight:600}}>FY: {fy.sl} {fyYear} to {fy.em} {fy.sm===0?fyYear:fyYear+1}</p></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
            <div><label style={{fontSize:12,fontWeight:600}}>Office Start Time</label><select value={workStartHr} onChange={e=>setWorkStartHr(parseInt(e.target.value))} style={{width:'100%',padding:10,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}>{[7,8,9,10].map(h=><option key={h} value={h}>{h}:00 AM</option>)}</select></div>
            <div><label style={{fontSize:12,fontWeight:600}}>Office End Time</label><select value={workEndHr} onChange={e=>setWorkEndHr(parseInt(e.target.value))} style={{width:'100%',padding:10,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}>{[16,17,18,19,20].map(h=><option key={h} value={h}>{h>12?h-12:h}:00 PM</option>)}</select></div>
          </div>
          <p style={{fontSize:12,color:'#C8943E',fontWeight:600,marginBottom:14}}>Productive hours/day: {prodHrs} hrs</p>
          <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>Non-Working Days</h3>
          {DEDUCTIONS.map(d=>(<div key={d.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><label style={{fontSize:13}}>{d.label}</label><div style={{display:'flex',alignItems:'center',gap:8}}><input type="range" min="0" max={d.id==='sundays'?52:60} value={deductions[d.id]} onChange={e=>setDeductions({...deductions,[d.id]:parseInt(e.target.value)})} style={{width:100,accentColor:'#C8943E'}}/><span style={{fontSize:13,fontWeight:600,width:30,textAlign:'right'}}>{deductions[d.id]}</span></div></div>))}
          <div style={{borderTop:'2px solid #0D1B2A',paddingTop:12,marginTop:12}}>
            <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:15,fontWeight:700}}>Working Days: {workDays}</span><span style={{fontSize:13,color:'#C8943E',fontWeight:600}}>Weeks: {workWeeks}</span></div>
            <p style={{fontSize:12,color:'#888'}}>Remaining: {remDays} days ({remWeeks} weeks) in this FY</p>
          </div>
          <button onClick={()=>setPhase(2)} style={{width:'100%',marginTop:16,padding:14,background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer'}}>Next: Calculate ROTIS™ →</button>
        </div>)}

        {/* PHASE 2 */}
        {phase===2&&(<div style={{background:'#fff',borderRadius:12,padding:24}}>
          <h2 style={{fontSize:18,fontWeight:'bold',marginBottom:4}}>Phase 2: ROTIS™ Calculator</h2>
          <p style={{fontSize:13,color:'#888',marginBottom:16}}>Return on Time Investment in Sales — your hourly value</p>
          <div style={{marginBottom:16}}><label style={{fontSize:14,fontWeight:600}}>Annual Sales Target (₹)</label><input type="number" value={annualTarget} onChange={e=>setAnnualTarget(e.target.value)} placeholder="e.g. 50000000" style={{width:'100%',padding:12,border:'1px solid #ddd',borderRadius:8,fontSize:15,marginTop:6}}/>{annualTarget&&<p style={{fontSize:12,color:'#C8943E',marginTop:4}}>{fmt(parseFloat(annualTarget))}</p>}</div>
          <div style={{marginBottom:16}}><label style={{fontSize:14,fontWeight:600}}>% Time on Sales: {salesTimePct}%</label><input type="range" min="10" max="100" step="5" value={salesTimePct} onChange={e=>setSalesTimePct(parseInt(e.target.value))} style={{width:'100%',accentColor:'#C8943E'}}/><p style={{fontSize:12,color:'#888'}}>100% for full-time sales. Lower for owners/leaders with other responsibilities.</p>{salesTimePct<100&&<p style={{fontSize:12,color:'#f97316',fontWeight:600,marginTop:4}}>With only {salesTimePct}% time on sales, your per-hour value goes UP — every sales hour must count!</p>}</div>
          {annualTarget&&(<div style={{background:'#0D1B2A',borderRadius:10,padding:20,color:'#fff',textAlign:'center',marginBottom:16}}><p style={{fontSize:12,color:'#888'}}>Your ROTIS™</p><p style={{fontSize:36,fontWeight:'bold',color:'#C8943E'}}>₹{Math.round(calcROTIS()).toLocaleString()}/hr</p><p style={{fontSize:12,color:'#f97316',marginTop:8}}>Every hour you waste costs you ₹{Math.round(calcROTIS()).toLocaleString()}</p></div>)}
          <div style={{display:'flex',gap:8}}><button onClick={()=>setPhase(1)} style={{padding:14,background:'#f3f4f6',border:'none',borderRadius:8,fontSize:14,cursor:'pointer'}}>← Back</button><button onClick={()=>setPhase(3)} disabled={!annualTarget} style={{flex:1,padding:14,background:annualTarget?'#C8943E':'#ccc',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:annualTarget?'pointer':'default'}}>Next: Velocity Engine →</button></div>
        </div>)}

        {/* PHASE 3 */}
        {phase===3&&(<div style={{background:'#fff',borderRadius:12,padding:24}}>
          <h2 style={{fontSize:18,fontWeight:'bold',marginBottom:4}}>Phase 3: Sales Velocity Engine</h2>
          <p style={{fontSize:13,color:'#888',marginBottom:16}}>Enter your numbers — we calculate your <strong>weekly</strong> activity targets</p>
          <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>📊 Year-to-Date</h3>
          {[{l:'Billing Done (₹)',v:billingDone,s:setBillingDone},{l:'Unexecuted Open Orders (₹)',v:openOrders,s:setOpenOrders},{l:'Retainer/Repeat Expected (₹)',v:retainerBusiness,s:setRetainerBusiness}].map(f=>(<div key={f.l} style={{marginBottom:10}}><label style={{fontSize:13,fontWeight:600}}>{f.l}</label><input type="number" value={f.v} onChange={e=>f.s(e.target.value)} style={{width:'100%',padding:10,border:'1px solid #ddd',borderRadius:8,fontSize:14,marginTop:4}}/>{f.v&&parseFloat(f.v)>0&&<p style={{fontSize:11,color:'#C8943E'}}>{fmt(parseFloat(f.v))}</p>}</div>))}
          <h3 style={{fontSize:14,fontWeight:700,marginTop:14,marginBottom:8}}>📦 Regular / OEM / Channel Business</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
            <div><label style={{fontSize:12,fontWeight:600}}>Pipeline (₹)</label><input type="number" value={regularPipeline} onChange={e=>setRegularPipeline(e.target.value)} style={{width:'100%',padding:8,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}/></div>
            <div><label style={{fontSize:12,fontWeight:600}}>Avg Deal (₹)</label><input type="number" value={regularAvgDeal} onChange={e=>setRegularAvgDeal(e.target.value)} style={{width:'100%',padding:8,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}/></div>
            <div><label style={{fontSize:12,fontWeight:600}}>Cycle (weeks)</label><input type="number" value={regularCycleWeeks} onChange={e=>setRegularCycleWeeks(e.target.value)} style={{width:'100%',padding:8,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}/></div>
          </div>
          <div style={{background:'#fef3e2',borderRadius:8,padding:10,marginBottom:14}}><label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}><input type="checkbox" checked={hasProjectBiz} onChange={e=>setHasProjectBiz(e.target.checked)} style={{width:18,height:18,accentColor:'#C8943E'}}/><span style={{fontSize:13,fontWeight:600}}>I also have Large Project Business</span></label></div>
          {hasProjectBiz&&(<div style={{marginBottom:14}}><h3 style={{fontSize:14,fontWeight:700,color:'#9333ea',marginBottom:8}}>🏗️ Project Business</h3><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}><div><label style={{fontSize:12,fontWeight:600}}>Pipeline (₹)</label><input type="number" value={projectPipeline} onChange={e=>setProjectPipeline(e.target.value)} style={{width:'100%',padding:8,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}/></div><div><label style={{fontSize:12,fontWeight:600}}>Avg Deal (₹)</label><input type="number" value={projectAvgDeal} onChange={e=>setProjectAvgDeal(e.target.value)} style={{width:'100%',padding:8,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}/></div><div><label style={{fontSize:12,fontWeight:600}}>Cycle (weeks)</label><input type="number" value={projectCycleWeeks} onChange={e=>setProjectCycleWeeks(e.target.value)} style={{width:'100%',padding:8,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}/></div></div></div>)}
          <h3 style={{fontSize:14,fontWeight:700,marginTop:14,marginBottom:8}}>🔄 Conversion Metrics</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            {[{l:'Visits per Enquiry',v:visitsPerEnquiry,s:setVisitsPerEnquiry},{l:'Enquiry to Offer (%)',v:enquiryToOffer,s:setEnquiryToOffer},{l:'Offer to Order (%)',v:offerToOrder,s:setOfferToOrder},{l:'Hours per Visit',v:hrsPerVisit,s:setHrsPerVisit},{l:'Delivery (weeks)',v:deliveryWeeks,s:setDeliveryWeeks}].map(f=>(<div key={f.l}><label style={{fontSize:12,fontWeight:600}}>{f.l}</label><input type="number" value={f.v} onChange={e=>f.s(e.target.value)} style={{width:'100%',padding:8,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}/></div>))}
          </div>
          <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600}}>Quarterly Target Split</label><select value={qSplit} onChange={e=>setQSplit(parseInt(e.target.value))} style={{width:'100%',padding:10,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}>{Q_SPLIT.map((q,i)=><option key={i} value={i}>{q.label}: Q1={q.values[0]}% Q2={q.values[1]}% Q3={q.values[2]}% Q4={q.values[3]}%</option>)}</select></div>
          <div style={{display:'flex',gap:8}}><button onClick={()=>setPhase(2)} style={{padding:14,background:'#f3f4f6',border:'none',borderRadius:8,fontSize:14,cursor:'pointer'}}>← Back</button><button onClick={handleFinish} disabled={saving} style={{flex:1,padding:14,background:saving?'#d4a855':'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:saving?'wait':'pointer'}}>{saving?'Calculating...':'Calculate My Weekly Velocity →'}</button></div>
        </div>)}

        {/* PHASE 4: Results */}
        {phase===4&&results&&(<div>
          <div style={{background:'#0D1B2A',borderRadius:12,padding:24,color:'#fff',textAlign:'center',marginBottom:16}}><h2 style={{fontSize:20,fontWeight:'bold',marginBottom:4}}>Your Sales Velocity Dashboard</h2><p style={{fontSize:36,fontWeight:'bold',color:'#C8943E'}}>₹{Math.round(results.rotis).toLocaleString()}/hr</p><p style={{fontSize:13,color:'#888'}}>ROTIS™ — Make every hour count</p><p style={{fontSize:12,color:'#86efac',marginTop:8}}>Secured: {fmt(results.secured)} | New Orders: {fmt(results.shortfall)}</p></div>
          <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>📅 Weekly Activity Targets</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:16}}>{[{l:'Visits/Week',v:results.vpw,c:'#2563eb'},{l:'Enquiries/Week',v:results.eqw,c:'#16a34a'},{l:'Offers/Week',v:results.ofw,c:'#9333ea'},{l:'Orders/Week',v:results.opw,c:'#C8943E'}].map(m=>(<div key={m.l} style={{background:'#fff',borderRadius:10,padding:16,textAlign:'center'}}><p style={{fontSize:12,color:'#888'}}>{m.l}</p><p style={{fontSize:28,fontWeight:'bold',color:m.c}}>{m.v}</p></div>))}</div>
          <div style={{background:'#fff',borderRadius:10,padding:16,marginBottom:16}}><h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>📊 Monthly Targets</h3><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}><div><span style={{fontSize:11,color:'#888'}}>Visits/Month</span><p style={{fontSize:18,fontWeight:700}}>{results.vpm}</p></div><div><span style={{fontSize:11,color:'#888'}}>Enquiries/Month</span><p style={{fontSize:18,fontWeight:700}}>{results.eqm}</p></div><div><span style={{fontSize:11,color:'#888'}}>Revenue/Month</span><p style={{fontSize:18,fontWeight:700}}>{fmt(results.mT)}</p></div></div></div>
          <div style={{background:'#fff',borderRadius:10,padding:16,marginBottom:16}}><h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>📈 Quarterly Targets</h3><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{results.qT.map((t:number,i:number)=>(<div key={i} style={{textAlign:'center',background:'#f5f0e8',borderRadius:8,padding:10}}><p style={{fontSize:12,color:'#888'}}>Q{i+1} ({Q_SPLIT[qSplit].values[i]}%)</p><p style={{fontSize:16,fontWeight:700,color:'#C8943E'}}>{fmt(t)}</p></div>))}</div></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
            <div style={{background:'#fff',borderRadius:10,padding:16}}><h3 style={{fontSize:13,fontWeight:700,marginBottom:8}}>Pipeline Health</h3><p style={{fontSize:11,color:'#888'}}>Coverage</p><p style={{fontSize:20,fontWeight:700}}>{results.cov}x</p><p style={{fontSize:11,color:'#888',marginTop:8}}>Achieved</p><p style={{fontSize:20,fontWeight:700}}>{results.pctA}%</p></div>
            <div style={{background:results.feasible?'#f0fdf4':'#fef2f2',borderRadius:10,padding:16,border:results.feasible?'1px solid #86efac':'1px solid #fca5a5'}}><p style={{fontSize:14,fontWeight:700,color:results.feasible?'#16a34a':'#dc2626'}}>{results.feasible?'✅ FEASIBLE':'⚠️ STRETCH'}</p><p style={{fontSize:12,color:'#666',marginTop:4}}>Need {results.hpw} hrs/week</p><p style={{fontSize:12,color:'#666'}}>Available: {results.availWkHrs} hrs/week</p><p style={{fontSize:12,color:'#C8943E',marginTop:8,fontWeight:600}}>Cost of delay: {fmt(results.cod)}/week</p></div>
          </div>
          <div style={{background:'#fff',borderRadius:10,padding:16,marginBottom:16}}><h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>🔥 #1 Growth Lever</h3><p style={{fontSize:16,fontWeight:700,color:'#C8943E'}}>{results.levers[0]?.name}</p><p style={{fontSize:13,color:'#666'}}>A 5% improvement adds {fmt(Math.round(results.levers[0]?.gain||0))} to revenue</p></div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button onClick={()=>setPhase(3)} style={{padding:'10px 16px',background:'#fff',border:'1px solid #ddd',borderRadius:8,fontSize:13,cursor:'pointer'}}>← Edit</button><Link href="/dashboard" style={{padding:'10px 16px',background:'#0D1B2A',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>← Dashboard</Link></div>
        </div>)}
      </div>
      <p style={{textAlign:"center",fontSize:11,color:"#000",fontStyle:"italic",padding:"12px 0"}}>AI can make mistakes. Please verify coaching content before you execute.</p>
      <CalendlyButton />
    </div>
  )
}
