'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const FEATURES = [
  { icon: '💬', title: 'Ask BUDDY', desc: 'Get instant, framework-backed coaching for any sales situation. Personalised to your industry, product, and customer.' },
  { icon: '🎯', title: 'Coach a Deal', desc: 'Create a real deal, get personalised coaching for YOUR customer. Structured 11-step journey from prospecting to post-sales with visual staircase tracking and deal winning probability.' },
  { icon: '📊', title: 'Score Everything', desc: '7 scoring models — IMPACT, KYCW, RAPPORT, DISCOVER, VALUE, Deal Win, Customer Evolution.' },
  { icon: '🚀', title: 'Sales Velocity', desc: 'Calculate your ROTIS (per-hour value), weekly targets, and find your #1 growth lever. Get a personalised weekly activity plan.' },
  { icon: '🔥', title: 'ASK Assessment', desc: '31 questions across Attitude, Skill, Knowledge. Get a personalised development plan.' },
  { icon: '⚖️', title: 'Work-Life Balance', desc: 'Wheel of Life with spider diagram, gap analysis, and a 21-day improvement challenge.' },
  { icon: '📚', title: 'Learn 11 Steps', desc: 'Master all 24 proprietary frameworks with scripts, templates, and practice tools. Create a customised Sales Playbook for your organisation.' },
]

const PAINS = [
  { icon: '😤', title: 'Deals Stuck in Pipeline', desc: 'Months pass with no diagnosis of what is blocking closure.' },
  { icon: '💸', title: 'Price Pressure Kills Margins', desc: 'Every negotiation becomes a discount battle.' },
  { icon: '🎯', title: 'No Daily/Weekly Clarity', desc: 'How many visits per week? Most teams run on gut feel.' },
  { icon: '📊', title: 'No Scoring, No Priority', desc: 'A1 customers and time-wasters get equal attention.' },
  { icon: '🔄', title: 'Follow-Ups Go Nowhere', desc: '"Just checking in" messages that destroy credibility.' },
  { icon: '⚖️', title: 'Work-Life Imbalance', desc: 'Sales targets consume everything. Health and family suffer.' },
  { icon: '📋', title: 'No Sales Process or Playbook', desc: 'Every salesperson sells their own way. No playbook, no consistency, no repeatability.' },
  { icon: '📉', title: 'Order Forecast Struggles', desc: 'Pipeline reviews become guesswork. No data-driven order forecasting.' },
  { icon: '🎓', title: 'Training Doesn\'t Sustain', desc: 'Expensive training creates excitement that fades in weeks. No daily reinforcement.' },
]

const FRAMEWORKS = ['IMPACT Score','ROTIS','KYCW','DISCOVER','RAPPORT','VALUE','STORY','CPV Elevation','OFFER','A-L-S-P-E-C-C','NEGOTIATE','Deal Win Probability','EVOLVE','PULSE','ASK','BALANCE','Sales Velocity Engine','Growth Lever Finder','Golden Hour','SIIS','STRATEGIC','Customer Success Matrix','Customer Evolution Score','SCARF Neuroscience']

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (user) router.push('/dashboard')
      else setChecking(false)
    })
  }, [router])

  if (checking) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0D1B2A'}}><p style={{color:'#C8943E',fontSize:18,fontFamily:'Georgia,serif'}}>🎯 B2BsalesBUDDY</p></div>

  return (
    <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif',color:'#1B2A4A',overflowX:'hidden'}}>

      {/* NAV */}
      <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(13,27,42,0.97)',backdropFilter:'blur(8px)',padding:'14px 0',borderBottom:'1px solid rgba(200,148,62,0.2)'}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'0 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <span style={{fontFamily:'Georgia,serif',fontSize:22,color:'#C8943E',fontWeight:700}}>🎯 B2BsalesBUDDY</span>
            <span style={{fontSize:11,color:'#6B7280',marginLeft:8}}>Your Personal AI Sales Coach</span>
          </div>
          <div style={{display:'flex',gap:24,alignItems:'center'}}>
            <a href="#features" style={{color:'#ccc',textDecoration:'none',fontSize:13}}>Features</a>
            <a href="#pricing" style={{color:'#ccc',textDecoration:'none',fontSize:13}}>Pricing</a>
            <a href="#frameworks" style={{color:'#ccc',textDecoration:'none',fontSize:13}}>Frameworks</a>
            <Link href="/blog" style={{color:'#ccc',textDecoration:'none',fontSize:13}}>Blog</Link>
            <Link href="/auth/login" style={{color:'#C8943E',textDecoration:'none',fontSize:13,fontWeight:600}}>Login</Link>
            <Link href="/auth/signup" style={{background:'#C8943E',color:'#fff',padding:'8px 20px',borderRadius:6,textDecoration:'none',fontSize:13,fontWeight:600}}>Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{background:'linear-gradient(135deg,#0D1B2A 0%,#1B2A4A 50%,#0D1B2A 100%)',color:'#fff',padding:'80px 24px 60px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'radial-gradient(circle at 30% 50%, rgba(200,148,62,0.08) 0%, transparent 60%)',pointerEvents:'none'}} />
        <div style={{maxWidth:800,margin:'0 auto',position:'relative',zIndex:1}}>
          <div style={{display:'inline-block',background:'rgba(200,148,62,0.15)',border:'1px solid rgba(200,148,62,0.3)',borderRadius:20,padding:'6px 16px',fontSize:12,color:'#C8943E',marginBottom:12}}>Powered by Amazon #1 Best Seller</div>
          <p style={{fontFamily:'Georgia,serif',fontSize:14,color:'#C8943E',fontWeight:600,marginBottom:24}}>"B2B Sales Transformation 2.0: Master the Art of Customer Acquisition and Retention"</p>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:48,lineHeight:1.15,marginBottom:20,fontWeight:700}}>Stop Guessing.<br/><span style={{color:'#C8943E'}}>Start Coaching Every Deal to Close.</span></h1>
          <p style={{fontSize:18,color:'#94a3b8',lineHeight:1.7,marginBottom:36,maxWidth:650,margin:'0 auto 36px'}}>The first AI sales coach built for Indian B2B professionals. Trained on 24 proprietary frameworks across 30+ industry verticals. Available 24/7 at the cost of a coffee per day.</p>
          <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/auth/signup" style={{background:'#C8943E',color:'#fff',padding:'14px 36px',borderRadius:8,textDecoration:'none',fontSize:16,fontWeight:700}}>Start 7-Day Free Trial</Link>
            <a href="#features" style={{background:'transparent',color:'#C8943E',padding:'14px 36px',borderRadius:8,textDecoration:'none',fontSize:16,fontWeight:600,border:'1px solid #C8943E'}}>See How It Works</a>
          </div>
          <p style={{fontSize:12,color:'#6B7280',marginTop:16}}>No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section style={{background:'#F5F0E8',padding:'16px 24px',textAlign:'center'}}>
        <p style={{fontSize:13,color:'#888'}}>Trusted by <strong style={{color:'#0D1B2A'}}>B2B sales professionals</strong> across Manufacturing, Automation, Pharma, Chemical, Automotive, E-Mobility, Material Handling, Oil & Gas, Construction, Healthcare, FMCG, SaaS, BFSI, Renewable Energy, HVAC, Semiconductor, Data Centre, Logistics, Textiles, Education, Aerospace & Defence, Power & Energy, Food Processing, Packaging, Printing, Water & Wastewater, Mining & Metals, Plastics & Rubber, Electronics, Cement & Building Materials</p>
      </section>

      {/* PAIN POINTS */}
      <section style={{padding:'60px 24px',maxWidth:1100,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <p style={{fontSize:12,color:'#C8943E',fontWeight:700,letterSpacing:2,marginBottom:8}}>THE PROBLEM</p>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:32,marginBottom:12}}>Sound Familiar?</h2>
          <p style={{fontSize:15,color:'#888',maxWidth:600,margin:'0 auto'}}>These are the daily struggles of B2B sales professionals across India. We built B2BsalesBUDDY to solve every one of them.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
          {PAINS.map(p => (
            <div key={p.title} style={{background:'#fff',borderRadius:10,padding:'20px 24px',borderLeft:'4px solid #dc2626',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <span style={{fontSize:24}}>{p.icon}</span>
              <h3 style={{fontSize:15,fontWeight:700,margin:'8px 0 4px'}}>{p.title}</h3>
              <p style={{fontSize:13,color:'#666',lineHeight:1.6}}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{background:'#0D1B2A',color:'#fff',padding:'60px 24px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:40}}>
            <p style={{fontSize:12,color:'#C8943E',fontWeight:700,letterSpacing:2,marginBottom:8}}>7 COACHING MODES</p>
            <h2 style={{fontFamily:'Georgia,serif',fontSize:32,marginBottom:12}}>One Platform. Complete Sales Coaching.</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
            {FEATURES.map((f, idx) => (
              <div key={f.title} style={{background:'rgba(255,255,255,0.05)',borderRadius:10,padding:'24px',border:'1px solid rgba(200,148,62,0.15)',gridColumn:idx===FEATURES.length-1?'1 / -1':'auto',maxWidth:idx===FEATURES.length-1?500:'none',margin:idx===FEATURES.length-1?'0 auto':'0'}}>
                <span style={{fontSize:32}}>{f.icon}</span>
                <h3 style={{fontSize:16,fontWeight:700,margin:'12px 0 8px',color:'#C8943E'}}>{f.title}</h3>
                <p style={{fontSize:13,color:'#94a3b8',lineHeight:1.7}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{padding:'60px 24px',background:'#F5F0E8'}}>
        <div style={{maxWidth:800,margin:'0 auto',textAlign:'center'}}>
          <p style={{fontSize:12,color:'#C8943E',fontWeight:700,letterSpacing:2,marginBottom:8}}>GET STARTED IN 3 MINUTES</p>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:32,marginBottom:40}}>How It Works</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
            {[
              {n:'1',title:'Sign Up Free',desc:'Create your account in 30 seconds. No credit card needed.'},
              {n:'2',title:'Tell Us About You',desc:'Quick onboarding captures your industry, products, experience, and challenges.'},
              {n:'3',title:'Start Coaching',desc:'Get personalised, framework-backed coaching for every sales situation.'},
            ].map(s => (
              <div key={s.n}>
                <div style={{width:48,height:48,borderRadius:'50%',background:'#C8943E',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,margin:'0 auto 12px'}}>{s.n}</div>
                <h3 style={{fontSize:15,fontWeight:700,marginBottom:6}}>{s.title}</h3>
                <p style={{fontSize:13,color:'#666',lineHeight:1.6}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FRAMEWORKS */}
      <section id="frameworks" style={{padding:'40px 24px',background:'#1B2A4A',color:'#fff'}}>
        <div style={{maxWidth:1100,margin:'0 auto',textAlign:'center'}}>
          <p style={{fontSize:12,color:'#C8943E',fontWeight:700,letterSpacing:2,marginBottom:8}}>YOUR UNFAIR ADVANTAGE</p>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:28,marginBottom:20}}>24 Proprietary Frameworks Inside</h2>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
            {FRAMEWORKS.map(f => (
              <span key={f} style={{background:'rgba(200,148,62,0.12)',border:'1px solid rgba(200,148,62,0.25)',borderRadius:20,padding:'6px 14px',fontSize:12,color:'#C8943E'}}>{f}</span>
            ))}
          </div>
          <p style={{fontSize:13,color:'#6B7280',marginTop:20}}>Not generic AI. Battle-tested B2B sales methodology from 29+ years of industrial selling experience.</p>
        </div>
      </section>

      {/* RESULTS */}
      <section style={{padding:'60px 24px',textAlign:'center'}}>
        <div style={{maxWidth:800,margin:'0 auto'}}>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:32,marginBottom:40}}>Why Sales Leaders and SME Professionals Choose 🎯 B2BsalesBUDDY</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
            {[
              {num:'24/7',label:'Always-On Coach',sub:'No scheduling. No waiting. Coaching when you need it.'},
              {num:'24',label:'Proprietary Frameworks',sub:'Not found in any other AI tool. Built from real deals.'},
              {num:'11',label:'Step Sales Staircase',sub:'Structured path from prospect to lifelong partner.'},
            ].map(r => (
              <div key={r.num} style={{padding:24}}>
                <p style={{fontFamily:'Georgia,serif',fontSize:44,color:'#C8943E',fontWeight:700,lineHeight:1}}>{r.num}</p>
                <p style={{fontSize:14,fontWeight:700,margin:'8px 0 4px'}}>{r.label}</p>
                <p style={{fontSize:12,color:'#888',lineHeight:1.5}}>{r.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{padding:'60px 24px',background:'#F5F0E8'}}>
        <div style={{maxWidth:1000,margin:'0 auto',textAlign:'center'}}>
          <p style={{fontSize:12,color:'#C8943E',fontWeight:700,letterSpacing:2,marginBottom:8}}>SIMPLE PRICING</p>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:32,marginBottom:8}}>AI Coaching at 1/10th the Cost of a Sales Trainer</h2>
          <p style={{fontSize:14,color:'#888',marginBottom:36}}>Start free. No credit card. Cancel anytime.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,alignItems:'start'}}>
            {/* Starter */}
            <div style={{background:'#fff',borderRadius:12,padding:28,textAlign:'left',border:'1px solid #e5e7eb'}}>
              <p style={{fontSize:13,fontWeight:700,color:'#888'}}>STARTER</p>
              <p style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:700,margin:'8px 0 4px'}}>₹1,999<span style={{fontSize:14,color:'#888'}}>/mo</span></p>
              <p style={{fontSize:12,color:'#888',marginBottom:20}}>For individual salespeople</p>
              <div style={{fontSize:13,lineHeight:2.2,color:'#444'}}>
                {'50 coaching conversations,Learn 11-Step Staircase,3 Scorecard models,ASK Assessment (1/month),Work-Life Balance (1/month),Copy downloads,WhatsApp Community'.split(',').map(f => <div key={f}>✓ {f}</div>)}
              </div>
              <Link href="/auth/signup" style={{display:'block',textAlign:'center',padding:'12px',background:'#0D1B2A',color:'#fff',borderRadius:8,textDecoration:'none',fontSize:14,fontWeight:600,marginTop:20}}>Start Free Trial</Link>
            </div>
            {/* Professional */}
            <div style={{background:'#0D1B2A',borderRadius:12,padding:28,textAlign:'left',color:'#fff',border:'2px solid #C8943E',position:'relative'}}>
              <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'#C8943E',color:'#fff',padding:'4px 16px',borderRadius:12,fontSize:11,fontWeight:700}}>MOST POPULAR</div>
              <p style={{fontSize:13,fontWeight:700,color:'#C8943E'}}>PROFESSIONAL</p>
              <p style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:700,margin:'8px 0 4px'}}>₹4,999<span style={{fontSize:14,color:'#888'}}>/mo</span></p>
              <p style={{fontSize:12,color:'#888',marginBottom:20}}>For serious B2B sellers</p>
              <div style={{fontSize:13,lineHeight:2.2,color:'#ccc'}}>
                {'Unlimited coaching,Deal Coach (11 steps),Sales Velocity + ROTIS,All 7 Scorecard models,Unlimited ASK Assessment,PDF + Word downloads,1 coaching call/quarter,Priority support'.split(',').map(f => <div key={f} style={{color:'#fff'}}>✓ {f}</div>)}
              </div>
              <Link href="/auth/signup" style={{display:'block',textAlign:'center',padding:'12px',background:'#C8943E',color:'#fff',borderRadius:8,textDecoration:'none',fontSize:14,fontWeight:700,marginTop:20}}>Start Free Trial</Link>
            </div>
            {/* Enterprise */}
            <div style={{background:'#fff',borderRadius:12,padding:28,textAlign:'left',border:'1px solid #e5e7eb'}}>
              <p style={{fontSize:13,fontWeight:700,color:'#888'}}>ENTERPRISE</p>
              <p style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:700,margin:'8px 0 4px'}}>₹8,999<span style={{fontSize:14,color:'#888'}}>/user/mo</span></p>
              <p style={{fontSize:12,color:'#888',marginBottom:20}}>For sales teams (3+ users)</p>
              <div style={{fontSize:13,lineHeight:2.2,color:'#444'}}>
                {'Everything in Professional,Manager Dashboard,Team ASK Assessment,Monthly coaching call,Quarterly team workshop,Dedicated support,Custom branding,Data export'.split(',').map(f => <div key={f}>✓ {f}</div>)}
              </div>
              <a href="https://calendly.com/bhadreshdani/b2bsalesbuddy-coaching-call" style={{display:'block',textAlign:'center',padding:'12px',background:'#0D1B2A',color:'#fff',borderRadius:8,textDecoration:'none',fontSize:14,fontWeight:600,marginTop:20}}>Book a Demo</a>
            </div>
          </div>
        </div>
      </section>

      {/* AUTHOR / TRUST */}
      <section style={{padding:'60px 24px',textAlign:'center'}}>
        <div style={{maxWidth:700,margin:'0 auto'}}>
          
          <h2 style={{fontFamily:'Georgia,serif',fontSize:28,marginBottom:8}}>Built by a Practitioner. Not a Programmer.</h2>
          <p style={{fontSize:15,color:'#C8943E',fontWeight:600,marginBottom:16}}>The only AI sales coach built by someone who has actually sold ₹100+ Crore in B2B</p>
          <p style={{fontSize:14,color:'#666',lineHeight:1.8}}>30+ years of B2B sales in OEM, channel partner, large project sales across Manufacturing, Automation, and Industrial markets.</p>
          <p style={{fontSize:14,color:'#666',lineHeight:1.8,marginTop:12}}>Leadership experience at Danfoss and Bharat Bijlee. Author of the Amazon #1 Best Seller:</p>
          <p style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:700,color:'#C8943E',margin:'12px 0'}}>"B2B Sales Transformation 2.0: Master the Art of Customer Acquisition and Retention"</p>
          <p style={{fontSize:14,color:'#666',lineHeight:1.8}}>Every framework inside 🎯 B2BsalesBUDDY is battle-tested — from real deals, real negotiations, and real results in Indian B2B markets.</p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{background:'#0D1B2A',color:'#fff',padding:'60px 24px',textAlign:'center'}}>
        <div style={{maxWidth:600,margin:'0 auto'}}>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:32,marginBottom:12}}>Ready to <span style={{color:'#C8943E'}}>Transform</span> Your B2B Sales?</h2>
          <p style={{fontSize:15,color:'#94a3b8',marginBottom:28}}>Join hundreds of B2B sales professionals who are coaching every deal to close with AI-powered frameworks.</p>
          <Link href="/auth/signup" style={{display:'inline-block',background:'#C8943E',color:'#fff',padding:'16px 40px',borderRadius:8,textDecoration:'none',fontSize:17,fontWeight:700}}>Start Your 7-Day Free Trial</Link>
          <p style={{fontSize:12,color:'#6B7280',marginTop:12}}>No credit card required. Full Professional access for 7 days.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:'#0A1628',color:'#6B7280',padding:'32px 24px',fontSize:12}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
          <div>
            <span style={{fontFamily:'Georgia,serif',fontSize:16,color:'#C8943E'}}>🎯 B2BsalesBUDDY</span>
            <p style={{marginTop:4}}><span style={{fontFamily:'Georgia,serif',color:'#C8943E'}}>B2B Sales Transformation 2.0</span> — by Bhadresh Dani</p>
          </div>
          <div style={{display:'flex',gap:20}}>
            <Link href="/auth/login" style={{color:'#888',textDecoration:'none'}}>Login</Link>
            <Link href="/auth/signup" style={{color:'#888',textDecoration:'none'}}>Sign Up</Link>
            <a href="https://chat.whatsapp.com/FPBo1Vj2P6jG8Siztvlbrf" style={{color:'#888',textDecoration:'none'}}>Community</a>
            <Link href="/blog" style={{color:'#888',textDecoration:'none'}}>Blog</Link>
            <a href="https://calendly.com/bhadreshdani/b2bsalesbuddy-coaching-call" style={{color:'#888',textDecoration:'none'}}>Book a Call</a>
          </div>
          <p>© 2026 Bhadresh Dani. All rights reserved.</p>
        </div>
      </footer>

      <p style={{textAlign:'center',fontSize:11,color:'#000',fontStyle:'italic',padding:'8px 0',background:'#fff'}}>AI can make mistakes. Please verify coaching content before you execute.</p>
    </div>
  )
}
