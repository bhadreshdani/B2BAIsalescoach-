'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function formatCurrency(val: number): string {
  if (val >= 10000000) return (val / 10000000).toFixed(1) + ' Cr'
  if (val >= 100000) return (val / 100000).toFixed(1) + ' L'
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K'
  return val.toLocaleString()
}

const STAGES = [{n:1,name:'Prospecting'},{n:2,name:'Qualification'},{n:3,name:'Planning'},{n:4,name:'Preparation'},{n:5,name:'Rapport'},{n:6,name:'Discovery'},{n:7,name:'Value Proposition'},{n:8,name:'Proposal'},{n:9,name:'Objection Handling'},{n:10,name:'Negotiation & Closing'},{n:11,name:'Post-Sales'}]
const CHALLENGES = STAGES.map(s => ({ value: s.name, label: `Step ${s.n}: ${s.name}` }))

export default function DealsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newDeal, setNewDeal] = useState({ name:'', company:'', industry:'', customer_type:'', deal_value:'', stage:1 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      await loadDeals(u.id)
    }
    init()
  }, [router])

  async function loadDeals(userId: string) {
    const res = await fetch(`/api/deals?userId=${userId}`)
    const data = await res.json()
    setDeals(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function createDeal() {
    if (!newDeal.name.trim()) return
    setSaving(true)
    await fetch('/api/deals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, ...newDeal, deal_value: newDeal.deal_value ? parseFloat(newDeal.deal_value) : null })
    })
    setShowNew(false); setNewDeal({ name:'', company:'', industry:'', customer_type:'', deal_value:'', stage:1 })
    await loadDeals(user.id); setSaving(false)
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
          <Link href="/dashboard" style={{color:'#888',fontSize:13,textDecoration:'none'}}>← Home</Link>
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
              <div><label style={{fontSize:12,fontWeight:600}}>Industry</label><input value={newDeal.industry} onChange={e=>setNewDeal({...newDeal,industry:e.target.value})} placeholder="e.g. Automotive" style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}} /></div>
              <div><label style={{fontSize:12,fontWeight:600}}>Customer Type</label><input value={newDeal.customer_type} onChange={e=>setNewDeal({...newDeal,customer_type:e.target.value})} placeholder="e.g. OEM, End User" style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}} /></div>
              <div><label style={{fontSize:12,fontWeight:600}}>Deal Value (₹)</label><input type="number" value={newDeal.deal_value} onChange={e=>setNewDeal({...newDeal,deal_value:e.target.value})} placeholder="e.g. 5000000" style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}} /></div>
              <div><label style={{fontSize:12,fontWeight:600}}>Current Stage</label><select value={newDeal.stage} onChange={e=>setNewDeal({...newDeal,stage:parseInt(e.target.value)})} style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginTop:4}}>{STAGES.map(s=><option key={s.n} value={s.n}>Step {s.n}: {s.name}</option>)}</select></div>
            </div>
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
              <div key={deal.id} style={{background:'#fff',borderRadius:12,padding:20,marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div>
                    <h3 style={{fontSize:16,fontWeight:700}}>{deal.name}</h3>
                    <p style={{fontSize:13,color:'#888'}}>{[deal.company, deal.industry, deal.customer_type].filter(Boolean).join(' · ')}</p>
                    {deal.deal_value && <p style={{fontSize:13,color:'#C8943E',fontWeight:600,marginTop:4}}>₹{formatCurrency(Number(deal.deal_value))}</p>}
                  </div>
                  <span style={{fontSize:11,padding:'4px 10px',borderRadius:12,background:deal.status==='active'?'#dcfce7':'#fee2e2',color:deal.status==='active'?'#16a34a':'#dc2626'}}>{deal.status}</span>
                </div>

                {/* Staircase Minimap */}
                <div style={{display:'flex',gap:2,marginBottom:12}}>
                  {STAGES.map(s => (
                    <button key={s.n} onClick={() => updateStage(deal.id, s.n)} title={`Step ${s.n}: ${s.name}`}
                      style={{flex:1,height:8,borderRadius:4,background:s.n<=deal.stage?stageColor(deal.stage):'#e5e7eb',cursor:'pointer',border:'none',transition:'background 0.2s'}} />
                  ))}
                </div>
                <p style={{fontSize:11,color:'#888',marginBottom:12}}>Stage: Step {deal.stage} — {deal.stage_name || STAGES.find(s=>s.n===deal.stage)?.name}</p>

                {/* Scores */}
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                  {deal.impact_score && <span style={{fontSize:12,background:'#dbeafe',color:'#2563eb',padding:'4px 10px',borderRadius:12}}>IMPACT: {deal.impact_score} ({deal.impact_classification})</span>}
                  {deal.dealwin_score && <span style={{fontSize:12,background:'#fef3c7',color:'#92400e',padding:'4px 10px',borderRadius:12}}>Win: {deal.dealwin_score}%</span>}
                </div>

                {/* Actions */}
                <div style={{display:'flex',gap:8}}>
                  <Link href={`/dashboard/chat?deal=${deal.id}&dealName=${encodeURIComponent(deal.name)}`} style={{padding:'8px 16px',background:'#0D1B2A',color:'#fff',borderRadius:8,fontSize:12,fontWeight:600,textDecoration:'none'}}>💬 Coach This Deal</Link>
                  <Link href={`/dashboard/scorecard?deal=${deal.id}`} style={{padding:'8px 16px',background:'#f3f4f6',color:'#1B2A4A',borderRadius:8,fontSize:12,fontWeight:600,textDecoration:'none'}}>📊 Score</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
