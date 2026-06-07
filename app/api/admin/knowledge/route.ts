export const maxDuration = 60
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin.from('knowledge_chunks').select('id, source, step_number, category, subcategory, created_at').order('step_number').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const grouped: Record<string, any> = {}
  for (const chunk of data || []) {
    const src = chunk.source || 'Unknown'
    if (!grouped[src]) grouped[src] = { source: src, step_number: chunk.step_number, category: chunk.category, chunks: 0 }
    grouped[src].chunks++
  }
  return NextResponse.json({ documents: Object.values(grouped), totalChunks: data?.length || 0 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, source, step_number, category, subcategory, customer_type, industry } = body
    if (!content || !source) return NextResponse.json({ error: 'Missing content or source' }, { status: 400 })
    const chunks = chunkDocument(content)
    const records = chunks.map(c => ({ content: c.trim(), source, step_number: step_number || null, category: category || 'general', subcategory: subcategory || null, customer_type: customer_type || null, industry: industry || null, keywords: extractKeywords(c) }))
    const { data, error } = await supabaseAdmin.from('knowledge_chunks').insert(records).select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, source, chunksCreated: data?.length || 0, message: `Uploaded "${source}" — split into ${data?.length} chunks` })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function DELETE(request: NextRequest) {
  const { source } = await request.json()
  if (!source) return NextResponse.json({ error: 'Missing source' }, { status: 400 })
  const { error } = await supabaseAdmin.from('knowledge_chunks').delete().eq('source', source)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

function chunkDocument(text: string): string[] {
  const sections = text.split(/(?=^## |^### |^={3,})/gm).filter(s => s.trim().length > 50)
  const chunks: string[] = []; let current = ''
  for (const section of sections) {
    if (current.length + section.length > 1500 && current.length >= 200) { chunks.push(current.trim()); current = section }
    else current += '\n\n' + section
  }
  if (current.trim().length >= 200) chunks.push(current.trim())
  if (chunks.length === 0) {
    const paras = text.split(/\n\n+/).filter(p => p.trim().length > 50); let chunk = ''
    for (const p of paras) { if (chunk.length + p.length > 1500 && chunk.length >= 200) { chunks.push(chunk.trim()); chunk = p } else chunk += '\n\n' + p }
    if (chunk.trim().length >= 200) chunks.push(chunk.trim())
  }
  return chunks.length > 0 ? chunks : [text.trim()]
}

function extractKeywords(text: string): string[] {
  const stop = new Set(['the','a','an','is','are','was','were','be','been','have','has','had','do','does','did','will','would','shall','should','may','might','must','can','could','i','me','my','we','our','you','your','he','him','she','her','it','its','they','them','this','that','what','which','who','how','when','where','why','and','but','or','for','so','to','of','in','on','at','by','with','from','about','not','no','all','each','every','both','few','more','most','other','some'])
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w => w.length > 3 && !stop.has(w))
  const freq: Record<string,number> = {}; for (const w of words) freq[w] = (freq[w]||0) + 1
  return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,20).map(([w]) => w)
}
