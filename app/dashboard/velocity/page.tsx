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

function InputN({ label, val, set, ph, hint }: { label: string, val: string, set: (v: string) => void, ph?: string, hint?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 12, fontWeight: 600 }}>{label}</label>
      <input type="number" value={val}
        onChange={e => set(e.target.value)}
        onWheel={e => (e.target as HTMLElement).blur()}
        placeholder={ph}
        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8, fontSize: 13, marginTop: 4 }} />
      {hint && <p style={{ fontSize: 10, color: '#C8943E', marginTop: 2 }}>{hint}</p>}
    </div>
  )
}

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
  const [showPlan, setShowPlan] = useState(false)

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
      levers, sHr: startHr, eHr: endHr, dpw,
      // Values for display
      eqVal: Math.round((pEnq / (remW||1)) * pd + (jEnq / (remW||1)) * jd),
      ofVal: Math.round((pOff / (remW||1)) * pd + (jOff / (remW||1)) * jd),
      opVal: Math.round((pOrd / (remW||1)) * pd + (jOrd / (remW||1)) * jd),
      pOfVal: Math.round((pOff / (remW||1)) * pd),
      pOpVal: Math.round((pOrd / (remW||1)) * pd),
      jOfVal: Math.round((jOff / (remW||1)) * jd),
      jOpVal: Math.round((jOrd / (remW||1)) * jd),
      pEqVal: Math.round((pEnq / (remW||1)) * pd),
      jEqVal: Math.round((jEnq / (remW||1)) * jd),
    }
  }

  function getReportText(scope: string) {
    if (!results) return ''
    const r = results
    let text = 'B2BsalesBUDDY — Sales Velocity Report\n'
    text += '================================\n\n'
    text += 'ROTIS: ' + sym + Math.round(r.r).toLocaleString() + '/hr\n'
    text += 'Secured: ' + f(r.sec) + ' | Balance Needed: ' + f(r.short) + '\n\n'
    text += 'WEEKLY TARGETS\n'
    text += 'Visits/Week: ' + Math.ceil(parseFloat(r.vpw)) + '\n'
    text += 'Enquiries/Week: ' + Math.ceil(parseFloat(r.eqw)) + ' (Worth ' + f(r.eqVal) + ')\n'
    text += 'Offers/Week: ' + f(r.ofVal) + ' (' + Math.ceil(parseFloat(r.ofw)) + ' offers)\n'
    text += 'Orders/Week: ' + f(r.opVal) + ' (' + Math.ceil(parseFloat(r.opw)) + ' orders)\n\n'
    if (r.hasProj) {
      text += 'PRODUCT SALE: Visits ' + Math.ceil(parseFloat(r.pVpw)) + ' | Enquiries ' + Math.ceil(parseFloat(r.pEqw)) + ' | Offers ' + f(r.pOfVal) + ' | Orders ' + f(r.pOpVal) + '\n'
      text += 'PROJECT SALE: Visits ' + Math.ceil(parseFloat(r.jVpw)) + ' | Enquiries ' + Math.ceil(parseFloat(r.jEqw)) + ' | Offers ' + f(r.jOfVal) + ' | Orders ' + f(r.jOpVal) + '\n\n'
    }
    text += 'MONTHLY: Revenue ' + f(r.mT) + '\n'
    text += 'QUARTERLY: Q1 ' + f(r.qT[0]) + ' | Q2 ' + f(r.qT[1]) + ' | Q3 ' + f(r.qT[2]) + ' | Q4 ' + f(r.qT[3]) + '\n\n'
    text += 'Coverage: ' + r.cov + 'x | Achieved: ' + r.pctA + '% | ' + (r.ok ? 'FEASIBLE' : 'STRETCH') + '\n'
    text += 'Cost of Delay: ' + f(r.cod) + '/week\n'
    text += '#1 Growth Lever: ' + r.levers[0]?.n + '\n'
    if (scope === 'full') {
      text += '\n================================\nWEEKLY PLAN\n================================\n'
      text += 'Office: ' + r.sHr + ':00 to ' + r.eHr + ':00 | ' + r.dpw + ' days/week\n\n'
      text += r.sHr + ':00 — Plan the day\n'
      text += r.sHr + ':30-' + (r.sHr+2) + ':00 — Prospecting (Golden Hour)\n'
      text += (r.sHr+2) + ':00-' + (r.sHr+4) + ':00 — Customer visits\n'
      text += (r.sHr+4) + ':00-' + (r.sHr+5) + ':00 — Follow-ups\n'
      text += (r.sHr+5) + ':00-' + (r.sHr+7) + ':00 — Proposals & offers\n'
      text += (r.sHr+7) + ':00-' + r.eHr + ':00 — CRM & admin\n'
    }
    text += '\n---\nAI can make mistakes. Please verify before execution.\nPowered by B2B Sales Transformation 2.0'
    return text
  }

  function printReport(scope: string) {
    const text = getReportText(scope)
    const html = '<!DOCTYPE html><html><head><title>B2BsalesBUDDY_Velocity_Report</title><style>body{font-family:Arial;padding:40px;max-width:700px;margin:0 auto;color:#1B2A4A}h1{color:#C8943E;border-bottom:3px solid #C8943E;padding-bottom:8px}pre{white-space:pre-wrap;line-height:1.8;font-size:13px;font-family:Arial}</style></head><body><h1>B2BsalesBUDDY — Sales Velocity Report</h1><pre>' + text + '</pre></body></html>'
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (doc) { doc.open(); doc.write(html); doc.close(); setTimeout(() => { iframe.contentWindow?.print(); setTimeout(() => document.body.removeChild(iframe), 1000) }, 500) }
  }

  function downloadWord(scope: string) {
    const text = getReportText(scope)
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"><title>B2BsalesBUDDY_Velocity_Report</title><style>body{font-family:Calibri;margin:2cm;color:#1B2A4A}h1{color:#C8943E;border-bottom:3px solid #C8943E;padding-bottom:8px;font-size:18pt}pre{white-space:pre-wrap;font-family:Calibri;font-size:11pt;line-height:1.8}</style></head><body><h1>B2BsalesBUDDY — Sales Velocity Report</h1><pre>' + text + '</pre></body></html>'
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'B2BsalesBUDDY_Velocity_Report.doc'; a.click()
    URL.revokeObjectURL(url)
  }

  async function finish() {
    setSaving(true); const r = calc(); setResults(r)
    await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, rotis_hourly: r.r, annual_target: parseFloat(target), velocity_completed: true }) })
    setSaving(false); setPhase(4)
  }

  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading...</p></div>



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
          <InputN label={`Annual Sales Target (${sym})`} val={target} set={setTarget} ph="e.g. 50000000" hint={fi(target)} />
          <div style={{ marginBottom: 16 }}><label style={{ fontSize: 13, fontWeight: 600 }}>% Time on Sales: {salesPct}%</label><input type="range" min="10" max="100" step="5" value={salesPct} onChange={e => setSalesPct(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#C8943E' }} />{salesPct < 100 && <p style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>With {salesPct}% time, your per-hour value goes UP — every hour counts!</p>}</div>
          {target && <div style={{ background: '#0D1B2A', borderRadius: 10, padding: 20, color: '#fff', textAlign: 'center', marginBottom: 16 }}><p style={{ fontSize: 12, color: '#888' }}>Your ROTIS™</p><p style={{ fontSize: 36, fontWeight: 'bold', color: '#C8943E' }}>{sym}{Math.round(rotis()).toLocaleString()}/hr</p><p style={{ fontSize: 12, color: '#f97316', marginTop: 8 }}>Every wasted hour = {sym}{Math.round(rotis()).toLocaleString()} lost</p></div>}
          <div style={{ display: 'flex', gap: 8 }}><button onClick={() => setPhase(1)} style={{ padding: 14, background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer' }}>← Back</button><button onClick={() => setPhase(3)} disabled={!target} style={{ flex: 1, padding: 14, background: target ? '#C8943E' : '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: target ? 'pointer' : 'default' }}>Next: Velocity →</button></div>
        </div>}

        {/* PHASE 3: VELOCITY */}
        {phase === 3 && <div style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>Phase 3: Sales Velocity</h2>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Enter numbers to calculate <b>weekly</b> targets</p>

          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📊 Year-to-Date</h3>
          <InputN label={`Total Order Booking (${sym})`} val={orderBooking} set={setOrderBooking} hint={fi(orderBooking)} />
          <InputN label={`Billing Done (${sym})`} val={billing} set={setBilling} hint={fi(billing)} />
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12,fontWeight:600}}>Unexecuted Open Orders ({sym}) <span style={{fontSize:10,color:'#888',fontWeight:400}}>— auto-calculated</span></label>
            <input type="text" value={openOrders} readOnly style={{width:'100%',padding:8,border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4,background:'#f9fafb',color:'#666'}} />
            {openOrders && parseFloat(openOrders) > 0 && <p style={{fontSize:10,color:'#C8943E'}}>{fi(openOrders)}</p>}
          </div>
          <InputN label={`Retainer / Repeat Expected (${sym})`} val={retainer} set={setRetainer} hint={fi(retainer)} />

          {(billing || openOrders) && <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, marginBottom: 14, border: '1px solid #86efac' }}>
            <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Secured: {f((parseFloat(billing) || 0) + (parseFloat(openOrders) || 0) + (parseFloat(retainer) || 0))}</p>
            <p style={{ fontSize: 12, color: '#C8943E', fontWeight: 600 }}>Balance orders for target: {f(Math.max(0, (parseFloat(target) || 0) - (parseFloat(billing) || 0) - (parseFloat(openOrders) || 0) - (parseFloat(retainer) || 0)))}</p>
            {orderBooking && billing && <p style={{ fontSize: 11, color: '#888' }}>Pending for billing: {f(Math.max(0, (parseFloat(orderBooking) || 0) - (parseFloat(billing) || 0)))}</p>}
          </div>}

          {/* PRODUCT SALE */}
          <div style={{ background: '#fffbeb', borderRadius: 8, padding: 10, marginBottom: 8 }}><label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}><input type="checkbox" checked={showProduct} onChange={e => setShowProduct(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#C8943E' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#C8943E' }}>📦 Product Sale (Regular / OEM / Channel)</span></label></div>
          {showProduct && <div style={{ border: '1px solid #C8943E', borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <InputN label={`Pipeline (${sym})`} val={pPipe} set={setPPipe} hint={fi(pPipe)} />
              <InputN label={`Avg Deal (${sym})`} val={pDeal} set={setPDeal} hint={fi(pDeal)} />
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
              <InputN label={`Pipeline (${sym})`} val={jPipe} set={setJPipe} hint={fi(jPipe)} />
              <InputN label={`Avg Deal (${sym})`} val={jDeal} set={setJDeal} hint={fi(jDeal)} />
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
        {phase === 4 && results && <div id="velocity-results">
          <div style={{ background: '#0D1B2A', borderRadius: 12, padding: 24, color: '#fff', textAlign: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>Sales Velocity Dashboard</h2>
            <p style={{ fontSize: 36, fontWeight: 'bold', color: '#C8943E' }}>{sym}{Math.round(results.r).toLocaleString()}/hr</p>
            <p style={{ fontSize: 12, color: '#86efac', marginTop: 8 }}>Secured: {f(results.sec)} | Need: {f(results.short)}</p>
            {results.balBilling > 0 && <p style={{ fontSize: 11, color: '#fbbf24' }}>Pending billing: {f(results.balBilling)}</p>}
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📅 Combined Weekly Targets</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, textAlign: 'center' }}><p style={{ fontSize: 12, color: '#888' }}>Visits / Week</p><p style={{ fontSize: 28, fontWeight: 'bold', color: '#2563eb' }}>{Math.ceil(parseFloat(results.vpw))}</p></div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, textAlign: 'center' }}><p style={{ fontSize: 12, color: '#888' }}>Enquiries / Week</p><p style={{ fontSize: 28, fontWeight: 'bold', color: '#16a34a' }}>{Math.ceil(parseFloat(results.eqw))}</p><p style={{ fontSize: 11, color: '#16a34a' }}>Worth {f(results.eqVal)}</p></div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, textAlign: 'center' }}><p style={{ fontSize: 12, color: '#888' }}>Offers / Week</p><p style={{ fontSize: 24, fontWeight: 'bold', color: '#9333ea' }}>{f(results.ofVal)}</p><p style={{ fontSize: 11, color: '#888' }}>{Math.ceil(parseFloat(results.ofw))} offers</p></div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, textAlign: 'center' }}><p style={{ fontSize: 12, color: '#888' }}>Orders / Week</p><p style={{ fontSize: 24, fontWeight: 'bold', color: '#C8943E' }}>{f(results.opVal)}</p><p style={{ fontSize: 11, color: '#888' }}>{Math.ceil(parseFloat(results.opw))} orders</p></div>
          </div>

          {results.hasProj && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: '2px solid #C8943E' }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#C8943E', marginBottom: 8 }}>📦 Product Sale / Week</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div><span style={{ fontSize: 10, color: '#888' }}>Visits</span><p style={{ fontSize: 16, fontWeight: 700 }}>{Math.ceil(parseFloat(results.pVpw))}</p></div>
                <div><span style={{ fontSize: 10, color: '#888' }}>Enquiries</span><p style={{ fontSize: 16, fontWeight: 700 }}>{Math.ceil(parseFloat(results.pEqw))}</p><p style={{ fontSize: 9, color: '#C8943E' }}>{f(results.pEqVal)}</p></div>
                <div><span style={{ fontSize: 10, color: '#888' }}>Offers</span><p style={{ fontSize: 14, fontWeight: 700 }}>{f(results.pOfVal)}</p></div>
                <div><span style={{ fontSize: 10, color: '#888' }}>Orders</span><p style={{ fontSize: 14, fontWeight: 700 }}>{f(results.pOpVal)}</p></div>
              </div>
            </div>
            <div style={{ background: '#faf5ff', borderRadius: 10, padding: 14, border: '2px solid #9333ea' }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#9333ea', marginBottom: 8 }}>🏗️ Project Sale / Week</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div><span style={{ fontSize: 10, color: '#888' }}>Visits</span><p style={{ fontSize: 16, fontWeight: 700 }}>{Math.ceil(parseFloat(results.jVpw))}</p></div>
                <div><span style={{ fontSize: 10, color: '#888' }}>Enquiries</span><p style={{ fontSize: 16, fontWeight: 700 }}>{Math.ceil(parseFloat(results.jEqw))}</p><p style={{ fontSize: 9, color: '#9333ea' }}>{f(results.jEqVal)}</p></div>
                <div><span style={{ fontSize: 10, color: '#888' }}>Offers</span><p style={{ fontSize: 14, fontWeight: 700 }}>{f(results.jOfVal)}</p></div>
                <div><span style={{ fontSize: 10, color: '#888' }}>Orders</span><p style={{ fontSize: 14, fontWeight: 700 }}>{f(results.jOpVal)}</p></div>
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

          {/* PLAN MY WEEK TAB */}
          <button onClick={() => setShowPlan(!showPlan)} style={{ width: '100%', padding: 14, background: '#0D1B2A', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📅 Plan My Week</span><span style={{ fontSize: 12 }}>{showPlan ? '▲ Hide' : '▼ Show Details'}</span>
          </button>
          {showPlan && <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0D1B2A', marginBottom: 4 }}>📅 Your Weekly Action Plan</h3>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>Based on your velocity targets | Office: {results.sHr > 12 ? results.sHr-12 : results.sHr}:00 {results.sHr >= 12 ? 'PM' : 'AM'} to {results.eHr > 12 ? results.eHr-12 : results.eHr}:00 {results.eHr >= 12 ? 'PM' : 'AM'} | {results.dpw} days/week</p>

            {/* PROSPECTING & NEW BUSINESS */}
            <div style={{ background: '#fffbeb', borderRadius: 8, padding: 14, marginBottom: 12, borderLeft: '4px solid #C8943E' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>🔍 PROSPECTING & NEW BUSINESS</h4>
              <p style={{ fontSize: 12, color: '#444', lineHeight: 1.8 }}>
                → Make <b>{results.vpw} customer visits per week</b> ({(parseFloat(results.vpw) / results.dpw).toFixed(1)} per day){results.hasProj && <><br/>→ Product Sale visits: <b>{results.pVpw}/week</b> | Project Sale visits: <b>{results.jVpw}/week</b></>}
                <br/>→ Target <b>{results.eqw} new enquiries per week</b> from these visits{results.hasProj && <> (Product: {results.pEqw} + Project: {results.jEqw})</>}
                <br/>→ Spend the <b>first 2 hours</b> ({results.sHr > 12 ? results.sHr-12 : results.sHr}:00 - {results.sHr+2 > 12 ? results.sHr+2-12 : results.sHr+2}:00 {results.sHr+2 >= 12 ? 'PM' : 'AM'}) on prospecting — this is your <b>Golden Hour</b>
                <br/>→ Cold calls, LinkedIn outreach, referral follow-ups, territory mapping
                <br/>→ Minimum <b>10-15 prospecting calls</b> before your first meeting each day
              </p>
            </div>

            {/* ENQUIRY MANAGEMENT */}
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 14, marginBottom: 12, borderLeft: '4px solid #16a34a' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 8 }}>📞 ENQUIRY FOLLOW-UP & QUALIFICATION</h4>
              <p style={{ fontSize: 12, color: '#444', lineHeight: 1.8 }}>
                → Follow up on <b>all open enquiries within 24 hours</b> — speed wins in B2B
                <br/>→ Qualify using <b>DISCOVER™ framework</b>: Decision maker, Issues, Size, Competition, Outcome, Velocity, Evaluation process, Resources
                <br/>→ Schedule <b>discovery meetings</b> with qualified prospects — aim for {(parseFloat(results.eqw) * 0.7).toFixed(0)}-{results.eqw} per week
                <br/>→ Block <b>{results.sHr+2 > 12 ? results.sHr+2-12 : results.sHr+2}:00 - {results.sHr+3 > 12 ? results.sHr+3-12 : results.sHr+3}:00</b> daily for follow-up calls and emails
                <br/>→ Update CRM with every interaction — no orphan enquiries
              </p>
            </div>

            {/* OFFER & PROPOSAL */}
            <div style={{ background: '#fef3e2', borderRadius: 8, padding: 14, marginBottom: 12, borderLeft: '4px solid #C8943E' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#C8943E', marginBottom: 8 }}>📝 OFFERS, PROPOSALS & PRESENTATIONS</h4>
              <p style={{ fontSize: 12, color: '#444', lineHeight: 1.8 }}>
                → Prepare and submit <b>{results.ofw} offers/proposals per week</b>{results.hasProj && <> (Product: {results.pOfw} + Project: {results.jOfw})</>}
                <br/>→ Use <b>VALUE™ framework</b> before sending any commercial offer — build value first
                <br/>→ For large deals: <b>present the offer in person</b>, line by line — never email large proposals
                <br/>→ Submit <b>technical offer first</b>, then commercial after value is established
                <br/>→ Block <b>afternoon hours</b> ({results.sHr+5 > 12 ? results.sHr+5-12 : results.sHr+5}:00 - {results.sHr+6 > 12 ? results.sHr+6-12 : results.sHr+6}:00 PM) for proposal preparation
                <br/>→ Follow up on every proposal within <b>48 hours</b> of submission
              </p>
            </div>

            {/* ORDER CLOSURE */}
            <div style={{ background: '#faf5ff', borderRadius: 8, padding: 14, marginBottom: 12, borderLeft: '4px solid #9333ea' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b21a8', marginBottom: 8 }}>🎯 ORDER CLOSURE & NEGOTIATION</h4>
              <p style={{ fontSize: 12, color: '#444', lineHeight: 1.8 }}>
                → Close <b>{results.opw} orders per week</b> to stay on track{results.hasProj && <> (Product: {results.pOpw} + Project: {results.jOpw})</>}
                <br/>→ Use <b>NEGOTIATE™ framework</b> for every negotiation — never give discounts without getting something back
                <br/>→ Handle objections with <b>A-L-S-P-E-C-C™</b>: Acknowledge, Listen, Separate, Probe, Educate, Close, Confirm
                <br/>→ Weekly cost of delay: <b>{f(results.cod)}</b> — every week without closure costs you this much
                <br/>→ <b>Wednesday</b>: Review all deals in negotiation stage — push for closure
                <br/>→ <b>Friday</b>: Pipeline review — update deal stages, remove dead deals, forecast next week
              </p>
            </div>

            {results.hasProj && (
              <div style={{ background: '#faf5ff', borderRadius: 8, padding: 14, marginBottom: 12, borderLeft: '4px solid #7c3aed' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>🏗️ LARGE PROJECT ACTIVITIES</h4>
                <p style={{ fontSize: 12, color: '#444', lineHeight: 1.8 }}>
                  → Project visits need more stakeholders: <b>consultants, EPC contractors, end users, panel builders</b>
                  <br/>→ Allocate <b>1-2 dedicated days per week</b> for project-related visits and meetings
                  <br/>→ Each project enquiry needs <b>{results.jVpw && parseFloat(results.jVpw) > 0 ? Math.round(parseFloat(results.jVpw) / Math.max(0.1, parseFloat(results.jEqw))) : 8}+ visits</b> across multiple stakeholders
                  <br/>→ Maintain <b>stakeholder mapping</b> for each project — who influences, who decides, who blocks
                  <br/>→ Submit project proposals with <b>complete technical + commercial documentation</b>
                  <br/>→ Build relationships with specifying consultants — they drive 60% of project decisions
                </p>
              </div>
            )}

            {/* KEY ACCOUNT & RETENTION */}
            <div style={{ background: '#f0f9ff', borderRadius: 8, padding: 14, marginBottom: 12, borderLeft: '4px solid #2563eb' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>🤝 KEY ACCOUNT MANAGEMENT & RETENTION</h4>
              <p style={{ fontSize: 12, color: '#444', lineHeight: 1.8 }}>
                → Allocate <b>Wednesday mid-morning</b> for key account reviews — are your top 5 accounts growing?
                <br/>→ Schedule <b>quarterly business reviews</b> with top accounts
                <br/>→ Use <b>EVOLVE™ framework</b> for customer success and growth
                <br/>→ Track retainer business: <b>{f(parseFloat(retainer) || 0)}</b> expected — ensure nothing falls through
                <br/>→ Cross-sell and upsell opportunities — map customer's full requirement vs your portfolio
              </p>
            </div>

            {/* DAILY RHYTHM */}
            <div style={{ background: '#0D1B2A', borderRadius: 8, padding: 14, color: '#fff' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#C8943E', marginBottom: 8 }}>⏰ YOUR DAILY RHYTHM</h4>
              <p style={{ fontSize: 12, color: '#ddd', lineHeight: 2 }}>
                <b>{results.sHr > 12 ? results.sHr-12 : results.sHr}:00 {results.sHr >= 12 ? 'PM' : 'AM'}</b> — Plan the day: review targets, check pipeline, prioritise top 3 actions
                <br/><b>{results.sHr > 12 ? results.sHr-12 : results.sHr}:30 - {results.sHr+2 > 12 ? results.sHr+2-12 : results.sHr+2}:00</b> — 🔍 Prospecting (Golden Hour): calls, outreach, territory
                <br/><b>{results.sHr+2 > 12 ? results.sHr+2-12 : results.sHr+2}:00 - {results.sHr+4 > 12 ? results.sHr+4-12 : results.sHr+4}:00</b> — 📦 Customer visits (Product{results.hasProj ? ' + Project' : ''})
                <br/><b>{results.sHr+4 > 12 ? results.sHr+4-12 : results.sHr+4}:00 - {results.sHr+5 > 12 ? results.sHr+5-12 : results.sHr+5}:00</b> — 📞 Follow-ups: enquiries, offers, pending orders
                <br/><b>{results.sHr+5 > 12 ? results.sHr+5-12 : results.sHr+5}:00 - {results.sHr+7 > 12 ? results.sHr+7-12 : results.sHr+7}:00</b> — 📝 Proposals, quotations, technical submissions
                <br/><b>{results.sHr+7 > 12 ? results.sHr+7-12 : results.sHr+7}:00 - {results.eHr > 12 ? results.eHr-12 : results.eHr}:00 {results.eHr >= 12 ? 'PM' : 'AM'}</b> — 📊 CRM updates, emails, next-day planning
              </p>
            </div>
          </div>}

          {/* DOWNLOAD BUTTONS */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>📥 Download Your Velocity Report</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => { try { const el = document.getElementById('velocity-results'); if (el) navigator.clipboard.writeText(el.innerText); alert('Copied!') } catch(e) { alert('Please select and copy manually') } }} style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📋 Copy</button>
              <button onClick={() => printReport('last')} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📥 Results → PDF</button>
              <button onClick={() => printReport('full')} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📥 Full Report → PDF</button>
              <button onClick={() => downloadWord('last')} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📄 Results → Word</button>
              <button onClick={() => downloadWord('full')} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📄 Full Report → Word</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}><button onClick={() => setPhase(3)} style={{ padding: '10px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>← Edit</button><Link href="/dashboard" style={{ padding: '10px 16px', background: '#0D1B2A', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>← Dashboard</Link></div>
        </div>}
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: '#000', fontStyle: 'italic', padding: '12px 0' }}>AI can make mistakes. Please verify coaching content before you execute.</p>
      <CalendlyButton />
    </div>
  )
}
