'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CalendlyButton from '@/components/CalendlyButton'

function formatCurrency(val: number): string {
  if (val >= 10000000) return (val / 10000000).toFixed(1) + ' Cr'
  if (val >= 100000) return (val / 100000).toFixed(1) + ' L'
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K'
  return val.toLocaleString()
}

const STAGES = [{n:1,name:'Prospecting'},{n:2,name:'Qualification'},{n:3,name:'Planning'},{n:4,name:'Preparation'},{n:5,name:'Rapport'},{n:6,name:'Discovery'},{n:7,name:'Value Proposition'},{n:8,name:'Proposal'},{n:9,name:'Objection Handling'},{n:10,name:'Negotiation & Closing'},{n:11,name:'Post-Sales'}]
const INDUSTRIES = ['Manufacturing — Plastics, Metals, Machine Tools','Chemical / Pharmaceutical','E-Mobility / EV / New Technology','Material Handling / Printing & Packaging','SaaS / Software / IT Services','Agriculture / Agri-Tech','Food & Beverage / FMCG Manufacturing','Oil & Gas / Energy / Petrochemical','Construction / Real Estate / Infrastructure','Healthcare / Medical Devices','Textiles / Apparel','Automotive / Auto Components','Logistics / Warehousing / Supply Chain','Education / EdTech','Renewable Energy / Solar / Wind','BFSI','Hospitality / Hotels / Facility Management','HVAC / Refrigeration / Cold Chain','Water Treatment / Environment','Aerospace / Defence']
const CUSTOMER_TYPES = ['End Users','OEMs (Original Equipment Manufacturers)','EPC Contractors','Consultants / Specifiers','Panel Builders / System Integrators','Channel Partners / Distributors','Dealers / Retailers','Government / PSU']

const CHALLENGES = STAGES.map(s => ({ value: s.name, label: `Step ${s.n}: ${s.name}` }))

function DealsInner() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [expandedDeal, setExpandedDeal] = useState<string|null>(null)
  const [newDeal, setNewDeal] = useState({ name:'', company:'', industry:'', customer_type:'', deal_value:'', stage:1 })
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')
  const [showOtherIndustry, setShowOtherIndustry] = useState(false)
  const [showOtherCustomer, setShowOtherCustomer] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      await loadDeals(u.id)
      if (searchParams.get('new') === 'true') setShowNew(true)
    }
    init()
  }, [router, searchParams])

  async function loadDeals(userId: string) {
    const res = await fetch(`/api/deals?userId=${userId}`)
    const data = await res.json()
    setDeals(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function createDeal() {
    if (!newDeal.name.trim()) { setCreateError('Deal name is required'); return }
    setSaving(true); setCreateError('')
    try {
      const res = await fetch('/api/deals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...newDeal, deal_value: newDeal.deal_value ? parseFloat(newDeal.deal_value) : 0, status: 'active' })
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error || 'Failed to create deal. Please try again.'); setSaving(false); return }
      setShowNew(false); setNewDeal({ name:'', company:'', industry:'', customer_type:'', deal_value:'', stage:1 })
      setShowOtherIndustry(false); setShowOtherCustomer(false)
      await loadDeals(user.id)
    } catch (err) {
      setCreateError('Network error. Please check your connection and try again.')
    }
    setSaving(false)
  }

  async function updateStage(dealId: string, stage: number) {
    await fetch('/api/deals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: dealId, stage }) })
    await loadDeals(user.id)
  }

  function stageColor(stage: number) {
    if (stage <= 3) return '#3b82f6'
    if (stage <= 6) return '#f59e0b'
    if (stage <= 9) return '#8b5cf6'
    return '#16a34a'
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>

  return (
    <div style={{minHeight:'100vh',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      <header style={{background:'#0D1B2A',color:'#fff',padding:'12px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:14,fontWeight:'bold',color:'#C8943E'}}>B2BsalesBUDDY</span>
          <span style={{color:'#444'}}>|</span>
          <a href="/dashboard" style={{display:'flex',alignItems:'center',gap:4,color:'#C8943E',fontSize:13,textDecoration:'none',fontWeight:600,background:'rgba(200,148,62,0.15)',padding:'6px 12px',borderRadius:6}}>🏠 Home</a>
          <span style={{color:'#444'}}>|</span>
          <h1 style={{fontSize:16,fontWeight:'bold'}}>🎯 Deal Coach</h1>
        </div>
        <button onClick={() => setShowNew(true)} style={{padding:'8px 16px',background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>+ New Deal</button>
      </header>

      <div style={{maxWidth:800,margin:'0 auto',padding:24}}>
        {/* New Deal Form */}
        {showNew && (
          <div style={{background:'#fff',borderRadius:12,padding:24,marginBottom:24,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <h2 style={{fontSize:18,fontWeight:'bold',marginBottom:16}}>Create New Deal</h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div><label style={{fontSize:12,fontWeight:600}}>Deal Name *</label><input value={newDeal.name} onChange={e=>setNewDeal({...newDeal,name:e.target.value})} placeholder="e.g. Mahindra Servo Drives" style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}} /></div>
              <div><label style={{fontSize:12,fontWeight:600}}>Company</label><input value={newDeal.company} onChange={e=>setNewDeal({...newDeal,company:e.target.value})} placeholder="e.g. Mahindra Forgings" style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}} /></div>
              <div>
                <label style={{fontSize:12,fontWeight:600}}>Industry</label>
                <select value={showOtherIndustry ? '__other__' : newDeal.industry} onChange={e => { if (e.target.value === '__other__') { setShowOtherIndustry(true); setNewDeal({...newDeal, industry: ''}) } else { setShowOtherIndustry(false); setNewDeal({...newDeal, industry: e.target.value}) } }} style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}>
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  <option value="__other__">Other (type below)</option>
                </select>
                {showOtherIndustry && <input value={newDeal.industry} onChange={e=>setNewDeal({...newDeal,industry:e.target.value})} placeholder="Type your industry..." style={{width:'100%',padding:'10px 12px',border:'1px solid #C8943E',borderRadius:8,fontSize:13,marginTop:6}} />}
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600}}>Customer Type</label>
                <select value={showOtherCustomer ? '__other__' : newDeal.customer_type} onChange={e => { if (e.target.value === '__other__') { setShowOtherCustomer(true); setNewDeal({...newDeal, customer_type: ''}) } else { setShowOtherCustomer(false); setNewDeal({...newDeal, customer_type: e.target.value}) } }} style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}>
                  <option value="">Select Customer Type</option>
                  {CUSTOMER_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__other__">Other (type below)</option>
                </select>
                {showOtherCustomer && <input value={newDeal.customer_type} onChange={e=>setNewDeal({...newDeal,customer_type:e.target.value})} placeholder="Type customer type..." style={{width:'100%',padding:'10px 12px',border:'1px solid #C8943E',borderRadius:8,fontSize:13,marginTop:6}} />}
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600}}>Deal Value (₹)</label>
                <input type="number" value={newDeal.deal_value} onChange={e=>setNewDeal({...newDeal,deal_value:e.target.value})} placeholder="e.g. 5000000" style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}} />
                {newDeal.deal_value && parseFloat(newDeal.deal_value) > 0 && <p style={{fontSize:11,color:'#C8943E',marginTop:3,fontWeight:600}}>{parseFloat(newDeal.deal_value)>=10000000?'₹'+(parseFloat(newDeal.deal_value)/10000000).toFixed(1)+' Cr':parseFloat(newDeal.deal_value)>=100000?'₹'+(parseFloat(newDeal.deal_value)/100000).toFixed(1)+' L':'₹'+parseFloat(newDeal.deal_value).toLocaleString()}</p>}
              </div>
              <div><label style={{fontSize:12,fontWeight:600}}>Current Stage</label><select value={newDeal.stage} onChange={e=>setNewDeal({...newDeal,stage:parseInt(e.target.value)})} style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}>{STAGES.map(s=><option key={s.n} value={s.n}>Step {s.n}: {s.name}</option>)}</select></div>
            </div>
            {createError && <p style={{color:'#dc2626',fontSize:12,marginBottom:12,padding:'8px 12px',background:'#fef2f2',borderRadius:6}}>{createError}</p>}
            <div style={{display:'flex',gap:8}}>
              <button onClick={createDeal} disabled={saving} style={{padding:'10px 24px',background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer'}}>{saving?'Creating...':'Create Deal'}</button>
              <button onClick={()=>setShowNew(false)} style={{padding:'10px 24px',background:'#f3f4f6',border:'none',borderRadius:8,fontSize:14,cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        )}

        {/* Deal List */}
        {deals.length === 0 ? (
          <div style={{textAlign:'center',padding:60}}>
            <p style={{fontSize:48,marginBottom:16}}>🎯</p>
            <p style={{fontSize:18,fontWeight:600,marginBottom:8}}>No deals yet</p>
            <p style={{fontSize:14,color:'#888',marginBottom:24}}>Create your first deal and start getting structured coaching</p>
            <button onClick={()=>setShowNew(true)} style={{padding:'12px 28px',background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>+ Create Your First Deal</button>
          </div>
        ) : (
          <div>
            {deals.map((deal: any) => (
              <div key={deal.id} style={{background:'#fff',borderRadius:12,marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,0.04)',overflow:'hidden'}}>
                {/* Clickable Header */}
                <div onClick={() => setExpandedDeal(expandedDeal===deal.id ? null : deal.id)} 
                  style={{padding:20,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <h3 style={{fontSize:16,fontWeight:700}}>{deal.name}</h3>
                    <p style={{fontSize:13,color:'#888'}}>{[deal.company, deal.industry, deal.customer_type].filter(Boolean).join(' · ')}</p>
                    {deal.deal_value && <p style={{fontSize:13,color:'#C8943E',fontWeight:600,marginTop:4}}>₹{formatCurrency(Number(deal.deal_value))}</p>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:11,padding:'4px 10px',borderRadius:12,background:deal.status==='active'?'#dcfce7':'#fee2e2',color:deal.status==='active'?'#16a34a':'#dc2626'}}>{deal.status}</span>
                    <span style={{fontSize:16,color:'#888'}}>{expandedDeal===deal.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Staircase Minimap — always visible */}
                <div style={{padding:'0 20px 12px'}}>
                  <div style={{display:'flex',gap:2,marginBottom:4}}>
                    {STAGES.map(s => (
                      <button key={s.n} onClick={(e) => { e.stopPropagation(); updateStage(deal.id, s.n) }} title={`Step ${s.n}: ${s.name}`}
                        style={{flex:1,height:8,borderRadius:4,background:s.n<=deal.stage?stageColor(deal.stage):'#e5e7eb',cursor:'pointer',border:'none',transition:'background 0.2s'}} />
                    ))}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <p style={{fontSize:11,color:'#888'}}>Step {deal.stage} — {deal.stage_name || STAGES.find(s=>s.n===deal.stage)?.name}</p>
                    <div style={{display:'flex',gap:6}}>
                      {deal.impact_score && <span style={{fontSize:11,background:'#dbeafe',color:'#2563eb',padding:'2px 8px',borderRadius:12}}>IMPACT: {deal.impact_score}</span>}
                      {deal.dealwin_score && <span style={{fontSize:11,background:'#fef3c7',color:'#92400e',padding:'2px 8px',borderRadius:12}}>Win: {deal.dealwin_score}%</span>}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedDeal===deal.id && (
                  <div style={{padding:'0 20px 20px',borderTop:'1px solid #f3f4f6'}}>
                    <p style={{fontSize:13,color:'#666',marginTop:12,marginBottom:4}}>Select a coaching challenge for this deal:</p>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:16}}>
                      {STAGES.map(s => (
                        <Link key={s.n} href={`/dashboard/chat?deal=${deal.id}&dealName=${encodeURIComponent(deal.name)}&prompt=${encodeURIComponent(`I need coaching on Step ${s.n}: ${s.name} for my deal "${deal.name}"${deal.company ? ` with ${deal.company}` : ''}${deal.industry ? ` in ${deal.industry} industry` : ''}`)}`}
                          style={{padding:'8px 12px',border:s.n===deal.stage?'2px solid #C8943E':'1px solid #e5e7eb',borderRadius:8,fontSize:12,textDecoration:'none',color:'#1B2A4A',background:s.n===deal.stage?'#fef3e2':'#fff'}}>
                          Step {s.n}: {s.name}
                        </Link>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <Link href={`/dashboard/chat?deal=${deal.id}&dealName=${encodeURIComponent(deal.name)}`} style={{padding:'10px 20px',background:'#0D1B2A',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>💬 Free Coach This Deal</Link>
                      <Link href={`/dashboard/scorecard?deal=${deal.id}`} style={{padding:'10px 20px',background:'#9333ea',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>📊 Score This Deal</Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{position:'fixed',bottom:24,left:24,zIndex:9999}}>
        <button onClick={() => window.history.back()} style={{display:'flex',alignItems:'center',gap:6,padding:'12px 20px',background:'#0D1B2A',color:'#fff',borderRadius:40,boxShadow:'0 4px 16px rgba(0,0,0,0.25)',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>← Back</button>
      </div>

      <CalendlyButton />
    </div>
  )
}

export default function DealsPage() {
  return <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>}><DealsInner /></Suspense>
}
