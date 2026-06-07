import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, ADMIN_EMAIL } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin.from('system_prompts').select('*').order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, content, is_active } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const updateData: any = { updated_at: new Date().toISOString(), updated_by: ADMIN_EMAIL }
  if (content !== undefined) updateData.content = content
  if (is_active !== undefined) updateData.is_active = is_active
  const { data, error } = await supabaseAdmin.from('system_prompts').update(updateData).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, category, content, sort_order } = body
  if (!name || !content) return NextResponse.json({ error: 'Missing name or content' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('system_prompts').insert({ name, category: category || 'custom', content, sort_order: sort_order || 99, updated_by: ADMIN_EMAIL }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
