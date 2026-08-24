'use client'
export default function CalendlyButton() {
  return (
    <a href="https://calendly.com/bhadreshdani/b2bsalesbuddy-coaching-call" target="_blank" rel="noopener noreferrer"
      style={{position:'fixed',bottom:24,right:24,zIndex:9999,display:'flex',alignItems:'center',gap:8,padding:'12px 20px',background:'#0D1B2A',color:'#fff',borderRadius:40,boxShadow:'0 4px 16px rgba(0,0,0,0.2)',textDecoration:'none',fontSize:13,fontWeight:600}}>
      <span style={{fontSize:18}}>📞</span>
      <span>Book a Call with Bhadresh</span>
    </a>
  )
}
