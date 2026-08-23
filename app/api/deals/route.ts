import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('deals').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { userId, name, company, industry, customer_type, deal_value, stage } = body
  if (!userId || !name) return NextResponse.json({ error: 'Missing userId or name' }, { status: 400 })
  const stageNames: Record<number,string> = {1:'Prospecting',2:'Qualification',3:'Planning',4:'Preparation',5:'Rapport',6:'Discovery',7:'Value Proposition',8:'Proposal',9:'Objection Handling',10:'Negotiation',11:'Post-Sales'}
  const { data, error } = await supabaseAdmin
    .from('deals').insert({ user_id: userId, name, company, industry, customer_type, deal_value, stage: stage||1, stage_name: stageNames[stage||1]||'Prospecting' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const stageNames: Record<number,string> = {1:'Prospecting',2:'Qualification',3:'Planning',4:'Preparation',5:'Rapport',6:'Discovery',7:'Value Proposition',8:'Proposal',9:'Objection Handling',10:'Negotiation',11:'Post-Sales'}
  if (updates.stage) updates.stage_name = stageNames[updates.stage] || ''
  updates.updated_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin.from('deals').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
