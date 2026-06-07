'use client'
import { useState, useEffect } from 'react'

export default function KnowledgeManager() {
  const [documents, setDocuments] = useState<any[]>([])
  const [totalChunks, setTotalChunks] = useState(0)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState('')
  const [source, setSource] = useState('')
  const [stepNumber, setStepNumber] = useState('')
  const [category, setCategory] = useState('framework')
  const [content, setContent] = useState('')

  useEffect(() => { loadDocs() }, [])

  async function loadDocs() {
    try { const res = await fetch('/api/admin/knowledge'); const data = await res.json(); setDocuments(data.documents || []); setTotalChunks(data.totalChunks || 0) } catch (err) { console.error(err) }
    setLoading(false)
  }

  async function handleFileRead(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setContent(await file.text())
    if (!source) setSource(file.name.replace(/\.(txt|md)$/, '').replace(/-/g, ' '))
  }

  async function handleUpload() {
    if (!content.trim() || !source.trim()) { setResult('Please provide source name and content'); return }
    setUploading(true); setResult('')
    try {
      const res = await fetch('/api/admin/knowledge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, source: source.trim(), step_number: stepNumber || null, category }) })
      const data = await res.json()
      if (data.success) { setResult('SUCCESS: ' + data.message); setContent(''); setSource(''); setStepNumber(''); await loadDocs() }
      else setResult('ERROR: ' + data.error)
    } catch (err: any) { setResult('ERROR: ' + err.message) }
    setUploading(false)
  }

  async function handleDelete(src: string) {
    if (!confirm('Delete all chunks for "' + src + '"?')) return
    await fetch('/api/admin/knowledge', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: src }) })
    await loadDocs()
  }

  return (
    <div style={{maxWidth:900,margin:'0 auto',padding:24,fontFamily:'Arial,sans-serif'}}>
      <h1 style={{fontSize:24,fontWeight:'bold',marginBottom:4}}>Knowledge Base Manager</h1>
      <p style={{color:'#888',marginBottom:24}}>Upload coaching documents. Auto-chunked for RAG retrieval.</p>
      <div style={{display:'flex',gap:24,marginBottom:24}}>
        <div style={{background:'#f0f9ff',padding:16,borderRadius:8,textAlign:'center'}}><div style={{fontSize:12,color:'#666'}}>Documents</div><div style={{fontSize:28,fontWeight:'bold',color:'#2563eb'}}>{documents.length}</div></div>
        <div style={{background:'#f0fdf4',padding:16,borderRadius:8,textAlign:'center'}}><div style={{fontSize:12,color:'#666'}}>Total Chunks</div><div style={{fontSize:28,fontWeight:'bold',color:'#16a34a'}}>{totalChunks}</div></div>
      </div>
      <div style={{border:'2px dashed #93c5fd',borderRadius:8,padding:24,marginBottom:32,background:'#eff6ff'}}>
        <h2 style={{fontSize:18,fontWeight:'bold',marginBottom:16}}>Upload Knowledge Document</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
          <div><label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:4}}>Source Name *</label><input type="text" value={source} onChange={e=>setSource(e.target.value)} placeholder="E.g. Step 9 — Objection Handling" style={{width:'100%',padding:'8px 12px',border:'1px solid #ccc',borderRadius:6,fontSize:13}} /></div>
          <div><label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:4}}>Step</label><select value={stepNumber} onChange={e=>setStepNumber(e.target.value)} style={{width:'100%',padding:'8px 12px',border:'1px solid #ccc',borderRadius:6,fontSize:13}}><option value="">Select...</option><option value="1">Step 1</option><option value="2">Step 2</option><option value="3">Step 3</option><option value="4">Step 4</option><option value="5">Step 5</option><option value="6">Step 6</option><option value="6A">Step 6A</option><option value="7">Step 7</option><option value="8">Step 8</option><option value="9">Step 9</option><option value="10">Step 10</option><option value="11">Step 11</option><option value="cross">Cross-Step</option><option value="growth">Growth</option></select></div>
          <div><label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:4}}>Category</label><select value={category} onChange={e=>setCategory(e.target.value)} style={{width:'100%',padding:'8px 12px',border:'1px solid #ccc',borderRadius:6,fontSize:13}}><option value="framework">Framework</option><option value="scoring">Scoring</option><option value="script">Script</option><option value="template">Template</option><option value="industry">Industry</option><option value="general">General</option></select></div>
        </div>
        <div style={{marginBottom:12}}><label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:4}}>Upload .txt or paste content</label><input type="file" accept=".txt,.md" onChange={handleFileRead} style={{fontSize:13,marginBottom:8,display:'block'}} /><textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Paste content here..." rows={10} style={{width:'100%',padding:'8px 12px',border:'1px solid #ccc',borderRadius:6,fontSize:12,fontFamily:'monospace'}} /><div style={{fontSize:11,color:'#999',marginTop:4}}>{content ? content.length + ' chars — ~' + Math.ceil(content.length/1500) + ' chunks' : 'No content'}</div></div>
        <button onClick={handleUpload} disabled={uploading} style={{padding:'10px 24px',background:uploading?'#93c5fd':'#2563eb',color:'#fff',border:'none',borderRadius:6,fontSize:14,fontWeight:600,cursor:uploading?'wait':'pointer'}}>{uploading?'Uploading...':'Upload & Chunk'}</button>
        {result && <p style={{marginTop:12,fontSize:14,fontWeight:600,color:result.startsWith('SUCCESS')?'#16a34a':'#dc2626'}}>{result}</p>}
      </div>
      <h2 style={{fontSize:18,fontWeight:'bold',marginBottom:12}}>Uploaded Documents</h2>
      {documents.length===0 ? <p style={{color:'#888',textAlign:'center',padding:40}}>No documents yet</p> : documents.map((d:any) => (
        <div key={d.source} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',border:'1px solid #e5e7eb',borderRadius:8,marginBottom:8}}>
          <div><div style={{fontWeight:600}}>{d.source}</div><div style={{fontSize:12,color:'#888'}}>{d.category} — {d.chunks} chunks</div></div>
          <button onClick={()=>handleDelete(d.source)} style={{padding:'4px 12px',fontSize:12,color:'#dc2626',border:'1px solid #fca5a5',borderRadius:4,background:'#fff',cursor:'pointer'}}>Delete</button>
        </div>
      ))}
    </div>
  )
}
