'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CalendlyButton from '@/components/CalendlyButton'

const DEDUCTIONS = [
  {id:'sundays',label:'Sundays',def:52},
  {id:'saturdays',label:'Non-Working Saturdays',def:26},
  {id:'public_holidays',label:'Public Holidays',def:15},
  {id:'personal_leave',label:'Personal / Sick Leave',def:10},
  {id:'training',label:'Training Days',def:5},
  {id:'meetings',label:'Internal Meeting Days',def:10},
  {id:'travel',label:'Non-Productive Travel',def:5},
  {id:'admin',label:'Admin / Reporting',def:5},
  {id:'festivals',label:'Festival / Regional',def:5},
  {id:'other',label:'Other',def:3},
]

const FY_OPTS = [
  {label:'April to March (India)',sl:'Apr',em:'Mar',sm:3},
  {label:'January to December',sl:'Jan',em:'Dec',sm:0},
  {label:'October to September',sl:'Oct',em:'Sep',sm:9},
]

const Q_SPLITS = [
  {label:'Standard (20-25-25-30)',v:[20,25,25,30]},
  {label:'Even (25-25-25-25)',v:[25,25,25,25]},
  {label:'Back-loaded (15-20-30-35)',v:[15,20,30,35]},
  {label:'Front-loaded (30-25-25-20)',v:[30,25,25,20]},
]

const CURR: Record<string,string> = {'INR':'₹','USD':'$','EUR':'€','GBP':'£','AED':'د.إ','SGD':'S$'}

export default function VelocityPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [phase, setPhase] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const [saving, setSaving] = useState(false)

  // Phase 1
  const [fyIdx, setFyIdx] = useState(0)
  const [fyYear, setFyYear] = useState(2026)
  const [ded, setDed] = useState<Record<string,number>>(Object.fromEntries(DEDUCTIONS.map(d=>[d.id,d.def])))
  const [startHr, setStartHr] = useState(9)
  const [endHr, setEndHr] = useState(18)

  // Phase 2
  const [curr, setCurr] = useState('INR')
  const [target, setTarget] = useState('')
  const [salesPct, setSalesPct] = useState(100)

  // Phase 3 - YTD
  const [orderBooking, setOrderBooking] = useState('')
  const [billing, setBilling] = useState('')
  const [openOrders, setOpenOrders] = useState('')
  const [retainer, setRetainer] = useState('')

  // Product Sale
  const [showProduct, setShowProduct] = useState(true)
  const [pPipe, setPPipe] = useState('')
  const [pDeal, setPDeal] = useState('')
  const [pCycle, setPCycle] = useState('')
  const [pVpe, setPVpe] = useState('')
  const [pEto, setPEto] = useState('')
  const [pOto, setPOto] = useState('')
  const [pHpv, setPHpv] = useState('')
  const [pDeliv, setPDeliv] = useState('')

  // Project Sale
  const [showProject, setShowProject] = useState(false)
  const [jPipe, setJPipe] = useState('')
  const [jDeal, setJDeal] = useState('')
  const [jCycle, setJCycle] = useState('')
  const [jVpe, setJVpe] = useState('')
  const [jEto, setJEto] = useState('')
  const [jOto, setJOto] = useState('')
  const [jHpv, setJHpv] = useState('')
  const [jDeliv, setJDeliv] = useState('')

  const [qIdx, setQIdx] = useState(0)
  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    if (orderBooking && billing) {
      const oo = Math.max(0, (parseFloat(orderBooking) || 0) - (parseFloat(billing) || 0))
      setOpenOrders(String(oo))
    }
  }, [orderBooking, billing])

  useEffect(() => {
    (async () => {
      const sb = createClient()
      const { data: { user: u } } = await sb.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      const { data: p } = await sb.from('profiles').select('annual_target,sales_time_percentage').eq('id', u.id).single()
      if (p?.annual_target) setTarget(String(p.annual_target))
      if (p?.sales_time_percentage) setSalesPct(p.sales_time_percentage)
    })()
  }, [router])

  const sym = CURR[curr] || '₹'
  const totalDed = Object.values(ded).reduce((a, b) => a + b, 0)
  const wDays = 365 - totalDed
  const hrs = endHr - startHr
  const dpw = ded.saturdays >= 26 ? 5 : 6
  const wWeeks = Math.round(wDays / dpw)
  const fy = FY_OPTS[fyIdx]
  const fyS = new Date(fyYear, fy.sm, 1)
  const fyE = new Date(fy.sm === 0 ? fyYear : fyYear + 1, fy.sm === 0 ? 12 : fy.sm, 0)
  const remR = Math.max(0, Math.min(1, (fyE.getTime() - Date.now()) / (fyE.getTime() - fyS.getTime())))
  const remD = Math.round(wDays * remR)
  const remW = Math.round(remD / dpw)

  function f(v: number) {
    if (curr === 'INR') { if (v >= 1e7) return sym + (v / 1e7).toFixed(1) + ' Cr'; if (v >= 1e5) return sym + (v / 1e5).toFixed(1) + ' L' }
    return sym + Math.round(v).toLocaleString()
  }
  function fi(s: string) {
    const n = parseFloat(s); if (!n || n <= 0) return ''
    if (curr === 'INR') { if (n >= 1e7) return sym + (n / 1e7).toFixed(2) + ' Cr'; if (n >= 1e5) return sym + (n / 1e5).toFixed(2) + ' L' }
    return sym + n.toLocaleString()
  }

  function rotis() {
    const t = parseFloat(target) || 0
    const h = wDays * hrs * (salesPct / 100)
    return h > 0 ? t / h : 0
  }

  function calc() {
    const t = parseFloat(target) || 0
    const b = parseFloat(billing) || 0, oo = parseFloat(openOrders) || 0, ret = parseFloat(retainer) || 0
    const sec = b + oo + ret, short = Math.max(0, t - sec)
    const ob = parseFloat(orderBooking) || 0
    const balBilling = Math.max(0, ob - b)

    // Product sale
    const pp = parseFloat(pPipe) || 0, pd = parseFloat(pDeal) || 1
    const pe = parseFloat(pEto) || 50, po = parseFloat(pOto) || 30, pv = parseFloat(pVpe) || 3, ph = parseFloat(pHpv) || 2

    // Project sale
    const jp = showProject ? (parseFloat(jPipe) || 0) : 0, jd = showProject ? (parseFloat(jDeal) || 1) : 0
    const je = showProject ? (parseFloat(jEto) || 40) : pe, jo = showProject ? (parseFloat(jOto) || 25) : po
    const jv = showProject ? (parseFloat(jVpe) || 8) : pv, jh = showProject ? (parseFloat(jHpv) || 3) : ph

    const totalP = pp + jp
    const pShare = totalP > 0 ? pp / totalP : 1, jShare = totalP > 0 ? jp / totalP : 0
    const pShort = short * pShare, jShort = short * jShare

    // Product velocity
    const pOrd = pd > 0 ? pShort / pd : 0, pOff = pOrd / (po / 100), pEnq = pOff / (pe / 100), pVis = pEnq * pv
    // Project velocity
    const jOrd = jd > 0 ? jShort / jd : 0, jOff = jOrd / (jo / 100), jEnq = jOff / (je / 100), jVis = jEnq * jv

    const totOrd = pOrd + jOrd, totOff = pOff + jOff, totEnq = pEnq + jEnq, totVis = pVis + jVis
    const vpw = remW > 0 ? totVis / remW : 0
    const hpw = remW > 0 ? ((pVis * ph + jVis * jh) / remW) : 0
    const avail = hrs * dpw * (salesPct / 100)

    const qv = Q_SPLITS[qIdx].v, qT = qv.map(x => t * x / 100)
    const cov = short > 0 ? totalP / short : 0
    const pctA = t > 0 ? ((b + oo) / t) * 100 : 0
    const baseRev = totalP * ((pe / 100) * (po / 100))
    const levers = [
      { n: 'Better Conversion Rate', g: totalP * 0.05 }, { n: 'Bigger Deal Size', g: baseRev * 0.05 },
      { n: 'More Visits / Prospects', g: baseRev * 0.04 }, { n: 'Shorter Sales Cycle', g: baseRev * 0.03 }
    ].sort((a, b) => b.g - a.g)

    return {
      short, sec, totalP, balBilling,
      totOrd: Math.ceil(totOrd), totOff: Math.ceil(totOff), totEnq: Math.ceil(totEnq), totVis: Math.ceil(totVis),
      vpw: vpw.toFixed(1), hpw: hpw.toFixed(1),
      opw: (totOrd / (remW || 1)).toFixed(1), ofw: (totOff / (remW || 1)).toFixed(1),
      eqw: (totEnq / (remW || 1)).toFixed(1),
      // Product split
      pVpw: (pVis / (remW || 1)).toFixed(1), pEqw: (pEnq / (remW || 1)).toFixed(1),
      pOfw: (pOff / (remW || 1)).toFixed(1), pOpw: (pOrd / (remW || 1)).toFixed(1),
      // Project split
      jVpw: (jVis / (remW || 1)).toFixed(1), jEqw: (jEnq / (remW || 1)).toFixed(1),
      jOfw: (jOff / (remW || 1)).toFixed(1), jOpw: (jOrd / (remW || 1)).toFixed(1),
      hasProj: showProject, ok: hpw <= avail, cov: cov.toFixed(1), pctA: pctA.toFixed(0),
      cod: Math.round(short / (remW || 1)), remD, remW, r: rotis(), qT, mT: t / 12, avail: avail.toFixed(0),
      vpm: (vpw * 4.3).toFixed(0), eqm: ((totEnq / (remW || 1)) * 4.3).toFixed(0),
      levers,
    }
  }

  async function finish() {
    setSaving(true); const r = calc(); setResults(r)
    await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, rotis_hourly: r.r, annual_target: parseFloat(target), velocity_completed: true }) })
    setSaving(false); setPhase(4)
  }

  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading...</p></div>

  const InputN = ({ label, val, set, ph }: { label: string, val: string, set: (v: string) => void, ph?: string }) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 12, fontWeight: 600 }}>{label}</label>
      <input type="text" inputMode="numeric" value={val} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g,''); set(v) }} placeholder={ph}
        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8, fontSize: 13, marginTop: 4 }} />
      {val && parseFloat(val) > 0 && <p style={{ fontSize: 10, color: '#C8943E' }}>{fi(val)}</p>}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', fontFamily: 'Arial,sans-serif' }}>
      <header data-sticky="true" style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0D1B2A', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#C8943E', fontSize: 13, textDecoration: 'none', fontWeight: 600, background: 'rgba(200,148,62,0.15)', padding: '6px 12px', borderRadius: 6 }}>🏠 Home</a>
          <span style={{ color: '#444' }}>|</span>
          <h1 style={{ fontSize: 16, fontWeight: 'bold' }}>🚀 Sales Velocity Engine</h1>
        </div>
        {phase >= 1 && phase <= 3 && <span style={{ fontSize: 12, color: '#888' }}>Phase {phase} of 3</span>}
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: 24 }}>

        {/* INTRO POPUP */}
        {showIntro && <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 520, width: '90%' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>🚀 What is Sales Velocity Engine?</h2>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#C8943E', marginBottom: 4 }}>ROTIS™ — Return on Time Investment in Sales</h3>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, marginBottom: 14 }}>ROTIS tells you how much <b>each hour of your sales time is worth</b>. If your ROTIS is {sym}5,000/hr and you waste 2 hours, you have lost {sym}10,000.</p>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#C8943E', marginBottom: 4 }}>Sales Velocity — Weekly Activity Targets</h3>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, marginBottom: 14 }}>Answers: <b>How many visits, enquiries, offers, and orders do I need per WEEK?</b> Reverse-engineers your annual target into a simple weekly action plan.</p>
            <div style={{ background: '#f5f0e8', borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}><b>Why weekly for B2B?</b> B2B sales cycles are weeks or months. Weekly velocity gives you a realistic, actionable rhythm.</p>
            </div>
            <button onClick={() => { setShowIntro(false); setPhase(1) }} style={{ width: '100%', padding: 14, background: '#C8943E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Let us Calculate My Velocity →</button>
          </div>
        </div>}

        {/* PROGRESS BAR */}
        {phase >= 1 && phase <= 3 && <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {['Working Days', 'ROTIS™', 'Velocity'].map((l, i) => <div key={l} style={{ flex: 1, textAlign: 'center' }}><div style={{ height: 6, borderRadius: 3, background: phase > i + 1 ? '#16a34a' : phase === i + 1 ? '#C8943E' : '#e5e7eb', marginBottom: 4 }} /><span style={{ fontSize: 10 }}>{l}</span></div>)}
        </div>}

        {/* PHASE 1: WORKING DAYS */}
        {phase === 1 && <div style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>Phase 1: Your Working Calendar</h2>
          <div style={{ background: '#f0f9ff', borderRadius: 8, padding: 12, marginBottom: 16, border: '1px solid #bae6fd' }}>
            <p style={{ fontSize: 12, color: '#0369a1', lineHeight: 1.6 }}>📋 <b>Adjust sliders</b> to match YOUR actual non-working days. Most B2B professionals have only 220-250 selling days/year.</p>
          </div>
          <div style={{ marginBottom: 14 }}><label style={{ fontSize: 13, fontWeight: 600 }}>Financial Year</label><select value={fyIdx} onChange={e => setFyIdx(parseInt(e.target.value))} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, fontSize: 13, marginTop: 4 }}>{FY_OPTS.map((f, i) => <option key={i} value={i}>{f.label}</option>)}</select></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600 }}>Start Year</label><select value={fyYear} onChange={e => setFyYear(parseInt(e.target.value))} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, fontSize: 13, marginTop: 4 }}>{[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}</select></div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}><p style={{ fontSize: 13, color: '#C8943E', fontWeight: 600 }}>FY: {fy.sl} {fyYear} to {fy.em} {fy.sm === 0 ? fyYear : fyYear + 1}</p></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600 }}>Office Start</label><select value={startHr} onChange={e => setStartHr(parseInt(e.target.value))} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, fontSize: 13, marginTop: 4 }}>{[7, 8, 9, 10].map(h => <option key={h} value={h}>{h}:00 AM</option>)}</select></div>
            <div><label style={{ fontSize: 12, fontWeight: 600 }}>Office End</label><select value={endHr} onChange={e => setEndHr(parseInt(e.target.value))} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, fontSize: 13, marginTop: 4 }}>{[16, 17, 18, 19, 20].map(h => <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 PM</option>)}</select></div>
          </div>
          <p style={{ fontSize: 12, color: '#C8943E', fontWeight: 600, marginBottom: 14 }}>Productive hours/day: {hrs} hrs</p>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Non-Working Days</h3>
          {DEDUCTIONS.map(d => <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}><label style={{ fontSize: 12 }}>{d.label}</label><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="range" min="0" max={d.id === 'sundays' ? 52 : 60} value={ded[d.id]} onChange={e => setDed({ ...ded, [d.id]: parseInt(e.target.value) })} style={{ width: 100, accentColor: '#C8943E' }} /><span style={{ fontSize: 13, fontWeight: 600, width: 28, textAlign: 'right' }}>{ded[d.id]}</span></div></div>)}
          <div style={{ borderTop: '2px solid #0D1B2A', paddingTop: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 15, fontWeight: 700 }}>Working Days: {wDays}</span><span style={{ fontSize: 13, color: '#C8943E', fontWeight: 600 }}>Weeks: {wWeeks}</span></div>
            <p style={{ fontSize: 12, color: '#888' }}>Remaining: {remD} days ({remW} weeks)</p>
          </div>
          <button onClick={() => setPhase(2)} style={{ width: '100%', marginTop: 16, padding: 14, background: '#C8943E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Next: ROTIS™ →</button>
        </div>}

        {/* PHASE 2: ROTIS */}
        {phase === 2 && <div style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>Phase 2: ROTIS™</h2>
          <div style={{ marginBottom: 14 }}><label style={{ fontSize: 13, fontWeight: 600 }}>Currency</label><select value={curr} onChange={e => setCurr(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, fontSize: 13, marginTop: 4 }}>{Object.entries(CURR).map(([c, s]) => <option key={c} value={c}>{c} ({s})</option>)}</select></div>
          <InputN label={`Annual Sales Target (${sym})`} val={target} set={setTarget} ph="e.g. 50000000" />
          <div style={{ marginBottom: 16 }}><label style={{ fontSize: 13, fontWeight: 600 }}>% Time on Sales: {salesPct}%</label><input type="range" min="10" max="100" step="5" value={salesPct} onChange={e => setSalesPct(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#C8943E' }} />{salesPct < 100 && <p style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>With {salesPct}% time, your per-hour value goes UP — every hour counts!</p>}</div>
          {target && <div style={{ background: '#0D1B2A', borderRadius: 10, padding: 20, color: '#fff', textAlign: 'center', marginBottom: 16 }}><p style={{ fontSize: 12, color: '#888' }}>Your ROTIS™</p><p style={{ fontSize: 36, fontWeight: 'bold', color: '#C8943E' }}>{sym}{Math.round(rotis()).toLocaleString()}/hr</p><p style={{ fontSize: 12, color: '#f97316', marginTop: 8 }}>Every wasted hour = {sym}{Math.round(rotis()).toLocaleString()} lost</p></div>}
          <div style={{ display: 'flex', gap: 8 }}><button onClick={() => setPhase(1)} style={{ padding: 14, background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer' }}>← Back</button><button onClick={() => setPhase(3)} disabled={!target} style={{ flex: 1, padding: 14, background: target ? '#C8943E' : '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: target ? 'pointer' : 'default' }}>Next: Velocity →</button></div>
        </div>}

        {/* PHASE 3: VELOCITY */}
        {phase === 3 && <div style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>Phase 3: Sales Velocity</h2>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Enter numbers to calculate <b>weekly</b> targets</p>

          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📊 Year-to-Date</h3>
          <InputN label={`Total Order Booking (${sym})`} val={orderBooking} set={setOrderBooking} />
          <InputN label={`Billing Done (${sym})`} val={billing} set={setBilling} />
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12,fontWeight:600}}>Unexecuted Open Orders ({sym}) <span style={{fontSize:10,color:'#888',fontWeight:400}}>— auto-calculated</span></label>
            <input type="text" value={openOrders} readOnly style={{width:'100%',padding:8,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4,background:'#f9fafb',color:'#666'}} />
            {openOrders && parseFloat(openOrders) > 0 && <p style={{fontSize:10,color:'#C8943E'}}>{fi(openOrders)}</p>}
          </div>
          <InputN label={`Retainer / Repeat Expected (${sym})`} val={retainer} set={setRetainer} />

          {(billing || openOrders) && <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, marginBottom: 14, border: '1px solid #86efac' }}>
            <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Secured: {f((parseFloat(billing) || 0) + (parseFloat(openOrders) || 0) + (parseFloat(retainer) || 0))}</p>
            <p style={{ fontSize: 12, color: '#C8943E', fontWeight: 600 }}>Balance orders for target: {f(Math.max(0, (parseFloat(target) || 0) - (parseFloat(billing) || 0) - (parseFloat(openOrders) || 0) - (parseFloat(retainer) || 0)))}</p>
            {orderBooking && billing && <p style={{ fontSize: 11, color: '#888' }}>Pending for billing: {f(Math.max(0, (parseFloat(orderBooking) || 0) - (parseFloat(billing) || 0)))}</p>}
          </div>}

          {/* PRODUCT SALE */}
          <div style={{ background: '#fffbeb', borderRadius: 8, padding: 10, marginBottom: 8 }}><label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}><input type="checkbox" checked={showProduct} onChange={e => setShowProduct(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#C8943E' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#C8943E' }}>📦 Product Sale (Regular / OEM / Channel)</span></label></div>
          {showProduct && <div style={{ border: '1px solid #C8943E', borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <InputN label={`Pipeline (${sym})`} val={pPipe} set={setPPipe} />
              <InputN label={`Avg Deal (${sym})`} val={pDeal} set={setPDeal} />
              <InputN label="Cycle (weeks)" val={pCycle} set={setPCycle} />
            </div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#C8943E', marginBottom: 6 }}>Conversion Metrics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <InputN label="Visits per Enquiry" val={pVpe} set={setPVpe} ph="e.g. 3" />
              <InputN label="Enquiry to Offer (%)" val={pEto} set={setPEto} ph="e.g. 50" />
              <InputN label="Offer to Order (%)" val={pOto} set={setPOto} ph="e.g. 30" />
              <InputN label="Hours per Visit" val={pHpv} set={setPHpv} ph="incl. travel" />
              <InputN label="Delivery (weeks)" val={pDeliv} set={setPDeliv} ph="order to billing" />
            </div>
          </div>}

          {/* PROJECT SALE */}
          <div style={{ background: '#faf5ff', borderRadius: 8, padding: 10, marginBottom: 8 }}><label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}><input type="checkbox" checked={showProject} onChange={e => setShowProject(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#9333ea' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#9333ea' }}>🏗️ Large Project Sale</span></label></div>
          {showProject && <div style={{ border: '1px solid #9333ea', borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <InputN label={`Pipeline (${sym})`} val={jPipe} set={setJPipe} />
              <InputN label={`Avg Deal (${sym})`} val={jDeal} set={setJDeal} />
              <InputN label="Cycle (weeks)" val={jCycle} set={setJCycle} />
            </div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#9333ea', marginBottom: 6 }}>Conversion Metrics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <InputN label="Visits per Project Enquiry" val={jVpe} set={setJVpe} ph="e.g. 8 (consultants, EPC)" />
              <InputN label="Enquiry to Offer (%)" val={jEto} set={setJEto} ph="e.g. 40" />
              <InputN label="Offer to Order (%)" val={jOto} set={setJOto} ph="e.g. 25" />
              <InputN label="Hours per Visit" val={jHpv} set={setJHpv} ph="e.g. 3" />
              <InputN label="Delivery (weeks)" val={jDeliv} set={setJDeliv} ph="e.g. 16" />
            </div>
          </div>}

          <div style={{ marginBottom: 14 }}><label style={{ fontSize: 13, fontWeight: 600 }}>Quarterly Split</label><select value={qIdx} onChange={e => setQIdx(parseInt(e.target.value))} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, fontSize: 13, marginTop: 4 }}>{Q_SPLITS.map((q, i) => <option key={i} value={i}>{q.label}</option>)}</select></div>
          <div style={{ display: 'flex', gap: 8 }}><button onClick={() => setPhase(2)} style={{ padding: 14, background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer' }}>← Back</button><button onClick={finish} disabled={saving} style={{ flex: 1, padding: 14, background: '#C8943E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Calculating...' : 'Calculate Weekly Velocity →'}</button></div>
        </div>}

        {/* PHASE 4: RESULTS */}
        {phase === 4 && results && <div>
          <div style={{ background: '#0D1B2A', borderRadius: 12, padding: 24, color: '#fff', textAlign: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>Sales Velocity Dashboard</h2>
            <p style={{ fontSize: 36, fontWeight: 'bold', color: '#C8943E' }}>{sym}{Math.round(results.r).toLocaleString()}/hr</p>
            <p style={{ fontSize: 12, color: '#86efac', marginTop: 8 }}>Secured: {f(results.sec)} | Need: {f(results.short)}</p>
            {results.balBilling > 0 && <p style={{ fontSize: 11, color: '#fbbf24' }}>Pending billing: {f(results.balBilling)}</p>}
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📅 Combined Weekly Targets</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
            {[{ l: 'Visits/Week', v: results.vpw, c: '#2563eb' }, { l: 'Enquiries/Week', v: results.eqw, c: '#16a34a' }, { l: 'Offers/Week', v: results.ofw, c: '#9333ea' }, { l: 'Orders/Week', v: results.opw, c: '#C8943E' }].map(m => <div key={m.l} style={{ background: '#fff', borderRadius: 10, padding: 16, textAlign: 'center' }}><p style={{ fontSize: 12, color: '#888' }}>{m.l}</p><p style={{ fontSize: 28, fontWeight: 'bold', color: m.c }}>{m.v}</p></div>)}
          </div>

          {results.hasProj && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: '2px solid #C8943E' }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#C8943E', marginBottom: 8 }}>📦 Product Sale / Week</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[{ l: 'Visits', v: results.pVpw }, { l: 'Enquiries', v: results.pEqw }, { l: 'Offers', v: results.pOfw }, { l: 'Orders', v: results.pOpw }].map(x => <div key={x.l}><span style={{ fontSize: 10, color: '#888' }}>{x.l}</span><p style={{ fontSize: 16, fontWeight: 700 }}>{x.v}</p></div>)}
              </div>
            </div>
            <div style={{ background: '#faf5ff', borderRadius: 10, padding: 14, border: '2px solid #9333ea' }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#9333ea', marginBottom: 8 }}>🏗️ Project Sale / Week</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[{ l: 'Visits', v: results.jVpw }, { l: 'Enquiries', v: results.jEqw }, { l: 'Offers', v: results.jOfw }, { l: 'Orders', v: results.jOpw }].map(x => <div key={x.l}><span style={{ fontSize: 10, color: '#888' }}>{x.l}</span><p style={{ fontSize: 16, fontWeight: 700 }}>{x.v}</p></div>)}
              </div>
            </div>
          </div>}

          <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16 }}><h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📊 Monthly</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}><div><span style={{ fontSize: 11, color: '#888' }}>Visits</span><p style={{ fontSize: 18, fontWeight: 700 }}>{results.vpm}</p></div><div><span style={{ fontSize: 11, color: '#888' }}>Enquiries</span><p style={{ fontSize: 18, fontWeight: 700 }}>{results.eqm}</p></div><div><span style={{ fontSize: 11, color: '#888' }}>Revenue</span><p style={{ fontSize: 18, fontWeight: 700 }}>{f(results.mT)}</p></div></div></div>

          <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16 }}><h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📈 Quarterly</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>{results.qT.map((t: number, i: number) => <div key={i} style={{ textAlign: 'center', background: '#f5f0e8', borderRadius: 8, padding: 10 }}><p style={{ fontSize: 12, color: '#888' }}>Q{i + 1} ({Q_SPLITS[qIdx].v[i]}%)</p><p style={{ fontSize: 16, fontWeight: 700, color: '#C8943E' }}>{f(t)}</p></div>)}</div></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 16 }}><p style={{ fontSize: 11, color: '#888' }}>Coverage</p><p style={{ fontSize: 20, fontWeight: 700 }}>{results.cov}x</p><p style={{ fontSize: 11, color: '#888', marginTop: 8 }}>Achieved</p><p style={{ fontSize: 20, fontWeight: 700 }}>{results.pctA}%</p></div>
            <div style={{ background: results.ok ? '#f0fdf4' : '#fef2f2', borderRadius: 10, padding: 16, border: results.ok ? '1px solid #86efac' : '1px solid #fca5a5' }}><p style={{ fontSize: 14, fontWeight: 700, color: results.ok ? '#16a34a' : '#dc2626' }}>{results.ok ? '✅ FEASIBLE' : '⚠️ STRETCH'}</p><p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Need {results.hpw} hrs/week</p><p style={{ fontSize: 12, color: '#666' }}>Available: {results.avail} hrs</p><p style={{ fontSize: 12, color: '#C8943E', fontWeight: 600, marginTop: 8 }}>Delay cost: {f(results.cod)}/week</p></div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16 }}><h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>🔥 #1 Growth Lever</h3><p style={{ fontSize: 16, fontWeight: 700, color: '#C8943E' }}>{results.levers[0]?.n}</p><p style={{ fontSize: 13, color: '#666' }}>5% improvement adds {f(Math.round(results.levers[0]?.g || 0))}</p></div>

          <div style={{ display: 'flex', gap: 8 }}><button onClick={() => setPhase(3)} style={{ padding: '10px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>← Edit</button><Link href="/dashboard" style={{ padding: '10px 16px', background: '#0D1B2A', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>← Dashboard</Link></div>
        </div>}
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: '#000', fontStyle: 'italic', padding: '12px 0' }}>AI can make mistakes. Please verify coaching content before you execute.</p>
      <CalendlyButton />
    </div>
  )
}
