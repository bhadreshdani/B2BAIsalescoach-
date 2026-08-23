'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DAILY_TIPS = [
  "Every 5% discount impacts EBIT by ~8%. Trade — never give.",
  "80% of deals close after the 6th follow-up. Most salespeople stop at 2.",
  "The best time to ask for a referral is within 48 hours of delivering value.",
  "Your ROTIS tells you if a meeting is worth your time. Calculate it daily.",
  "Price objections at Step 9 usually started at Step 6. Trace upstream.",
  "The buyer's brain decides emotionally (System 1) then justifies logically (System 2).",
  "A1 customers deserve 40% of your time. C/D customers deserve 5%.",
  "Every follow-up should ADD VALUE. 'Just checking in' destroys credibility.",
]

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tip] = useState(DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)])

  function formatCurrency(val: number): string {
    if (val >= 10000000) return (val / 10000000).toFixed(1) + ' Cr'
    if (val >= 100000) return (val / 100000).toFixed(1) + ' L'
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K'
    return val.toLocaleString()
  }

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p && !p.onboarding_completed) { router.push('/onboarding'); return }
      setProfile(p)

      const { data: d } = await supabase.from('deals').select('*').eq('user_id', user.id).eq('status', 'active').order('updated_at', { ascending: false }).limit(5)
      setDeals(d || [])
      setLoading(false)
    }
    loadData()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p>Loading...</p></div>

  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'
  const firstName = profile?.name?.split(' ')[0] || 'there'
  const lastLogin = profile?.last_login_at ? new Date(profile.last_login_at) : null
  const daysSinceLogin = lastLogin ? Math.floor((Date.now() - lastLogin.getTime()) / (1000*60*60*24)) : 0
  const showVelocityNudge = !profile?.velocity_completed

  return (
    <div style={{minHeight:'100vh',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      {/* Header */}
      <header style={{background:'#0D1B2A',color:'#fff',padding:'16px 24px'}}>
        <div style={{maxWidth:960,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h1 style={{fontSize:18,fontWeight:'bold'}}>B2BsalesBUDDY</h1>
            <p style={{fontSize:11,color:'#C8943E'}}>Your AI Sales Coach</p>
          </div>
          <div style={{textAlign:'right'}}>
            <p style={{fontSize:14}}>{greeting}, {firstName}!</p>
            {profile?.rotis_hourly ? (
              <p style={{fontSize:12,color:'#C8943E'}}>ROTIS™: ₹{Math.round(profile.rotis_hourly).toLocaleString()}/hr</p>
            ) : (
              <Link href="/dashboard/chat" style={{fontSize:11,color:'#888',textDecoration:'underline'}}>Calculate your ROTIS™ →</Link>
            )}
          </div>
        </div>
      </header>

      <div style={{maxWidth:960,margin:'0 auto',padding:24}}>
        {/* Welcome Message */}
        {daysSinceLogin > 7 ? (
          <div style={{background:'#fff',borderRadius:10,padding:20,marginBottom:20,border:'1px solid #e5e7eb'}}>
            <p style={{fontSize:16,fontWeight:600,marginBottom:8}}>Welcome back, {firstName}! 👋 It's been {daysSinceLogin} days.</p>
            <p style={{fontSize:13,color:'#666'}}>I'd suggest: Update your Sales Velocity Engine → Check your deal pipeline → Re-run Growth Lever Finder</p>
          </div>
        ) : (
          <div style={{background:'#fff',borderRadius:10,padding:16,marginBottom:20,border:'1px solid #e5e7eb'}}>
            <p style={{fontSize:16,fontWeight:600}}>Welcome back, {firstName}! 👋 Ready to move deals forward?</p>
            {deals.length > 0 && <p style={{fontSize:13,color:'#666',marginTop:4}}>You have {deals.length} active deal{deals.length>1?'s':''} in your pipeline.</p>}
          </div>
        )}

        {/* Velocity Nudge */}
        {showVelocityNudge && (
          <div style={{background:'#fef3c7',borderRadius:10,padding:16,marginBottom:20,border:'1px solid #fbbf24',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <p style={{fontSize:14,fontWeight:600,color:'#92400e'}}>⚡ Calculate your ROTIS™</p>
              <p style={{fontSize:12,color:'#a16207'}}>This 10-minute exercise tells you exactly how many visits per day you need to hit your target.</p>
            </div>
            <Link href="/dashboard/velocity" style={{padding:'8px 16px',background:'#C8943E',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none',whiteSpace:'nowrap'}}>Start Now →</Link>
          </div>
        )}

        {/* Tier 1 — 4 Primary Mode Cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
          {[
            { icon: '💬', title: 'Ask\nBUDDY', desc: 'Ask anything about sales', href: '/dashboard/chat', color: '#2563eb' },
            { icon: '🎯', title: 'Coach\na Deal', desc: 'Structured deal coaching', href: '/dashboard/deals', color: '#16a34a' },
            { icon: '📊', title: 'Score\nSomething', desc: '7 scoring models', href: '/dashboard/scorecard', color: '#9333ea' },
            { icon: '📚', title: 'Learn\n11 Steps', desc: 'Framework library', href: '/dashboard/chat?mode=learn', color: '#dc2626' },
          ].map((mode) => (
            <Link key={mode.title} href={mode.href} style={{background:'#fff',borderRadius:12,padding:20,textAlign:'center',textDecoration:'none',color:'#1B2A4A',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',border:'2px solid transparent',cursor:'pointer',transition:'border 0.2s'}}>
              <div style={{fontSize:32,marginBottom:8}}>{mode.icon}</div>
              <div style={{fontSize:14,fontWeight:700,whiteSpace:'pre-line',lineHeight:1.3}}>{mode.title}</div>
              <p style={{fontSize:11,color:'#888',marginTop:6}}>{mode.desc}</p>
            </Link>
          ))}
        </div>

        {/* Tier 2 — Growth Tools */}
        <div style={{marginBottom:24}}>
          <h3 style={{fontSize:13,fontWeight:600,color:'#888',marginBottom:12,textTransform:'uppercase',letterSpacing:1}}>Growth & Performance Tools</h3>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              { icon: '🚀', title: 'My Sales Velocity Engine', desc: 'Calculate daily activity targets & ROTIS™', href: '/dashboard/velocity' },
              { icon: '🔥', title: 'My Competency Assessment (ASK™)', desc: 'Assess Attitude, Skill, Knowledge gaps', href: '/dashboard/assessment' },
              { icon: '⚖️', title: 'My Work-Life Balance', desc: 'Wheel of Life assessment & action plan', href: '/dashboard/balance' },
            ].map((tool) => (
              <Link key={tool.title} href={tool.href} style={{display:'flex',alignItems:'center',gap:16,background:'#fff',borderRadius:10,padding:'14px 20px',textDecoration:'none',color:'#1B2A4A',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <span style={{fontSize:24}}>{tool.icon}</span>
                <div><div style={{fontSize:14,fontWeight:600}}>{tool.title}</div><p style={{fontSize:12,color:'#888',marginTop:2}}>{tool.desc}</p></div>
              </Link>
            ))}
          </div>
        </div>

        {/* Active Deals */}
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{fontSize:13,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:1}}>My Active Deals</h3>
            <Link href="/dashboard/deals?new=true" style={{fontSize:12,color:'#C8943E',textDecoration:'none',fontWeight:600}}>+ New Deal</Link>
          </div>
          {deals.length > 0 ? (
            <div style={{display:'flex',gap:12,overflowX:'auto'}}>
              {deals.map((deal: any) => (
                <Link key={deal.id} href={'/dashboard/deals'} style={{minWidth:180,background:'#fff',borderRadius:10,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,0.04)',textDecoration:'none',color:'#1B2A4A',cursor:'pointer'}}>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{deal.name}</div>
                  {deal.company && <div style={{fontSize:11,color:'#888'}}>{deal.company}</div>}
                  {deal.deal_value && <div style={{fontSize:12,color:'#C8943E',fontWeight:600,marginTop:4}}>₹{formatCurrency(deal.deal_value)}</div>}
                  <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:6}}>
                    {deal.impact_score && <span style={{fontSize:11,background:'#dbeafe',color:'#2563eb',padding:'2px 8px',borderRadius:12}}>IMPACT: {deal.impact_score}</span>}
                    {deal.dealwin_score && <span style={{fontSize:11,background:'#fef3c7',color:'#92400e',padding:'2px 8px',borderRadius:12}}>Win: {deal.dealwin_score}%</span>}
                    {deal.stage && <span style={{fontSize:11,background:'#f3f4f6',color:'#666',padding:'2px 8px',borderRadius:12}}>Step {deal.stage}</span>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{background:'#fff',borderRadius:10,padding:24,textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
              <p style={{fontSize:14,color:'#888',marginBottom:12}}>No active deals yet</p>
              <Link href="/dashboard/deals?new=true" style={{fontSize:13,color:'#fff',background:'#C8943E',padding:'8px 20px',borderRadius:8,textDecoration:'none',fontWeight:600}}>Start Coaching a Deal →</Link>
            </div>
          )}
        </div>

        {/* Daily Tip */}
        <div style={{background:'#0D1B2A',borderRadius:10,padding:'16px 20px',color:'#fff'}}>
          <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
            <span style={{fontSize:20}}>💡</span>
            <div>
              <p style={{fontSize:12,color:'#C8943E',fontWeight:600,marginBottom:4}}>TODAY'S TIP</p>
              <p style={{fontSize:14,lineHeight:1.5}}>{tip}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:24,paddingTop:16,borderTop:'1px solid #ddd'}}>
          <Link href="/admin/prompts" style={{fontSize:12,color:'#888'}}>Admin Panel</Link>
          <button onClick={handleLogout} style={{fontSize:12,color:'#888',background:'none',border:'none',cursor:'pointer'}}>Log Out</button>
        </div>
      </div>
    </div>
  )
}
