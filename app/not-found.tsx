export default function NotFound() {
  return (
    <div style={{padding:40,textAlign:'center',fontFamily:'Arial,sans-serif'}}>
      <h1 style={{fontSize:48,fontWeight:'bold',color:'#ccc'}}>404</h1>
      <p style={{fontSize:16,color:'#666'}}>Page not found</p>
      <a href="/admin/prompts" style={{color:'#2563eb',fontSize:14}}>Go to Admin Panel</a>
    </div>
  )
}
