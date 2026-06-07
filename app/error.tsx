'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{padding:40,textAlign:'center',fontFamily:'Arial,sans-serif'}}>
      <h2 style={{fontSize:20,fontWeight:'bold',color:'#dc2626',marginBottom:12}}>Something went wrong</h2>
      <p style={{color:'#666',marginBottom:16}}>{error.message}</p>
      <button onClick={reset} style={{padding:'8px 24px',background:'#2563eb',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14}}>Try again</button>
    </div>
  )
}
