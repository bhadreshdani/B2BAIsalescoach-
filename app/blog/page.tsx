'use client'
import Link from 'next/link'

const POSTS = [
  { title: 'Coming Soon: B2B Sales Tips & Frameworks', date: '', desc: 'We are preparing insightful articles on B2B sales methodology, frameworks, and real-world case studies. Stay tuned!', slug: '' },
]

export default function BlogPage() {
  return (
    <div style={{minHeight:'100vh',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif',color:'#1B2A4A'}}>
      <nav style={{background:'#0D1B2A',padding:'14px 0',borderBottom:'1px solid rgba(200,148,62,0.2)'}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'0 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <Link href="/" style={{textDecoration:'none'}}>
            <span style={{fontFamily:'Georgia,serif',fontSize:22,color:'#C8943E',fontWeight:700}}>🎯 B2BsalesBUDDY</span>
          </Link>
          <div style={{display:'flex',gap:20,alignItems:'center'}}>
            <Link href="/#features" style={{color:'#ccc',textDecoration:'none',fontSize:13}}>Features</Link>
            <Link href="/#pricing" style={{color:'#ccc',textDecoration:'none',fontSize:13}}>Pricing</Link>
            <Link href="/blog" style={{color:'#C8943E',textDecoration:'none',fontSize:13,fontWeight:600}}>Blog</Link>
            <Link href="/auth/login" style={{color:'#ccc',textDecoration:'none',fontSize:13}}>Login</Link>
            <Link href="/auth/signup" style={{background:'#C8943E',color:'#fff',padding:'8px 20px',borderRadius:6,textDecoration:'none',fontSize:13,fontWeight:600}}>Start Free Trial</Link>
          </div>
        </div>
      </nav>

      <section style={{padding:'60px 24px',maxWidth:800,margin:'0 auto'}}>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:36,marginBottom:8}}>🎯 B2BsalesBUDDY Blog</h1>
        <p style={{fontSize:15,color:'#888',marginBottom:40}}>B2B sales insights, frameworks, and strategies for Indian sales professionals</p>

        <div style={{background:'#F5F0E8',borderRadius:12,padding:32,textAlign:'center'}}>
          <p style={{fontSize:48,marginBottom:12}}>📝</p>
          <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Blog Coming Soon!</h2>
          <p style={{fontSize:14,color:'#666',lineHeight:1.8,maxWidth:500,margin:'0 auto 20px'}}>We are preparing insightful articles on B2B sales methodology, frameworks, objection handling, negotiation tactics, and real-world case studies from Indian B2B markets.</p>
          <p style={{fontSize:13,color:'#C8943E',fontWeight:600}}>Join our WhatsApp community for daily tips in the meantime:</p>
          <a href="https://chat.whatsapp.com/FPBo1Vj2P6jG8Siztvlbrf" target="_blank" style={{display:'inline-block',background:'#25D366',color:'#fff',padding:'10px 24px',borderRadius:8,textDecoration:'none',fontSize:14,fontWeight:600,marginTop:12}}>Join B2BsalesBUDDY Community</a>
        </div>
      </section>

      <footer style={{background:'#0A1628',color:'#6B7280',padding:'24px',fontSize:12,textAlign:'center'}}>
        <p>© 2026 Bhadresh Dani. Powered by B2B Sales Transformation 2.0</p>
      </footer>
    </div>
  )
}
