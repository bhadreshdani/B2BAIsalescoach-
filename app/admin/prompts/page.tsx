'use client'
import { useState, useEffect } from 'react'

export default function SystemPromptManager() {
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [testQuery, setTestQuery] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => { fetchPrompts() }, [])

  async function fetchPrompts() {
    const res = await fetch('/api/admin/prompts')
    const data = await res.json()
    setPrompts(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function savePrompt(id: string) {
    setSaving(true)
    await fetch('/api/admin/prompts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, content: editContent }) })
    setEditingId(null); await fetchPrompts(); setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch('/api/admin/prompts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: !current }) })
    await fetchPrompts()
  }

  async function runTest() {
    if (!testQuery.trim()) return
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch('/api/admin/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: testQuery }) })
      setTestResult(await res.json())
    } catch (err: any) { setTestResult({ error: err.message }) }
    setTesting(false)
  }

  if (loading) return <div style={{padding:40,textAlign:'center'}}>Loading...</div>

  return (
    <div style={{maxWidth:900,margin:'0 auto',padding:24,fontFamily:'Arial,sans-serif'}}>
      <h1 style={{fontSize:24,fontWeight:'bold',marginBottom:4}}>System Prompt Manager</h1>
      <p style={{color:'#888',marginBottom:24}}>Edit coaching behaviour. Changes take effect immediately.</p>
      <div style={{display:'flex',gap:24,marginBottom:24,padding:16,background:'#f9fafb',borderRadius:8}}>
        <div><div style={{fontSize:12,color:'#666'}}>Active</div><div style={{fontSize:28,fontWeight:'bold',color:'#16a34a'}}>{prompts.filter((p: any) =>p.is_active).length}/{prompts.length}</div></div>
        <div><div style={{fontSize:12,color:'#666'}}>Tokens</div><div style={{fontSize:28,fontWeight:'bold',color:'#2563eb'}}>{prompts.filter((p: any) =>p.is_active).reduce((s:number,p:any)=>s+Math.ceil((p.content||'').length/4),0)}</div></div>
      </div>
      {prompts.map((p:any) => (
        <div key={p.id} style={{border:'1px solid #e5e7eb',borderRadius:8,marginBottom:12,background:p.is_active?'#fff':'#f9fafb',opacity:p.is_active?1:0.6}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #e5e7eb'}}>
            <div><span style={{fontWeight:600}}>{p.name}</span> <span style={{fontSize:11,color:'#888',marginLeft:8}}>v{p.version} | {p.category}</span></div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>toggleActive(p.id,p.is_active)} style={{padding:'4px 12px',fontSize:12,borderRadius:4,border:'1px solid #ccc',background:p.is_active?'#dcfce7':'#f3f4f6',color:p.is_active?'#16a34a':'#888',cursor:'pointer'}}>{p.is_active?'Active':'Off'}</button>
              {editingId===p.id ? <><button onClick={()=>savePrompt(p.id)} disabled={saving} style={{padding:'4px 12px',fontSize:12,background:'#16a34a',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>{saving?'Saving...':'Save'}</button><button onClick={()=>setEditingId(null)} style={{padding:'4px 12px',fontSize:12,background:'#e5e7eb',border:'none',borderRadius:4,cursor:'pointer'}}>Cancel</button></> : <button onClick={()=>{setEditingId(p.id);setEditContent(p.content)}} style={{padding:'4px 12px',fontSize:12,background:'#dbeafe',color:'#2563eb',border:'none',borderRadius:4,cursor:'pointer'}}>Edit</button>}
            </div>
          </div>
          {editingId===p.id ? <textarea value={editContent} onChange={e=>setEditContent(e.target.value)} style={{width:'100%',padding:16,fontSize:12,fontFamily:'monospace',border:'none',resize:'vertical',minHeight:200}} /> : <pre style={{padding:16,fontSize:11,color:'#666',whiteSpace:'pre-wrap',fontFamily:'monospace',maxHeight:150,overflow:'hidden'}}>{(p.content||'').substring(0,400)}{(p.content||'').length>400?'...':''}</pre>}
        </div>
      ))}
      <div style={{marginTop:32,border:'2px dashed #ccc',borderRadius:8,padding:24}}>
        <h2 style={{fontSize:18,fontWeight:'bold',marginBottom:12}}>Test Coaching Query</h2>
        <div style={{display:'flex',gap:12}}>
          <input type="text" value={testQuery} onChange={e=>setTestQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&runTest()} placeholder='E.g. "How do I handle price objections?"' style={{flex:1,padding:'8px 16px',border:'1px solid #ccc',borderRadius:8,fontSize:14}} />
          <button onClick={runTest} disabled={testing} style={{padding:'8px 24px',background:testing?'#93c5fd':'#2563eb',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:testing?'wait':'pointer'}}>{testing?'Testing...':'Test'}</button>
        </div>
        {testResult && <div style={{marginTop:16}}>
          <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:8,padding:16,marginBottom:12}}>
            <h3 style={{fontSize:14,fontWeight:600,color:'#16a34a',marginBottom:8}}>Coaching Response:</h3>
            <div style={{fontSize:13,whiteSpace:'pre-wrap',lineHeight:1.6}}>{testResult.coaching||testResult.error}</div>
          </div>
          {testResult.debug && <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,padding:16}}>
            <h3 style={{fontSize:14,fontWeight:600,color:'#666',marginBottom:8}}>Debug:</h3>
            <div style={{fontSize:11,fontFamily:'monospace',color:'#888'}}>
              <p>System prompt: {testResult.debug.systemPromptLength} chars</p>
              <p>Knowledge chunks: {testResult.debug.knowledgeChunksFound}</p>
              <p>Tokens: in={testResult.debug.tokensUsed?.input_tokens} out={testResult.debug.tokensUsed?.output_tokens}</p>
            </div>
          </div>}
        </div>}
      </div>
    </div>
  )
}
