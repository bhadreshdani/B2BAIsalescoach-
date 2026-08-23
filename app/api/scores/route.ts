import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  const dealId = request.nextUrl.searchParams.get('dealId')
  const modelType = request.nextUrl.searchParams.get('model')
  
  let query = supabaseAdmin.from('scores').select('*').order('created_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)
  if (dealId) query = query.eq('deal_id', dealId)
  if (modelType) query = query.eq('model_type', modelType)
  
  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { userId, dealId, modelType, factors, totalScore, classification, strengths, gaps, recommendations } = body
  if (!userId || !modelType || !factors) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('scores').insert({
    user_id: userId, deal_id: dealId || null, model_type: modelType,
    factors, total_score: totalScore, classification, strengths, gaps, recommendations
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update deal with latest score
  if (dealId) {
    const updateField: Record<string,string> = { impact: 'impact_score', dealwin: 'dealwin_score' }
    const classField: Record<string,string> = { impact: 'impact_classification', dealwin: 'dealwin_classification' }
    if (updateField[modelType]) {
      await supabaseAdmin.from('deals').update({ 
        [updateField[modelType]]: totalScore,
        [classField[modelType]]: classification,
        updated_at: new Date().toISOString()
      }).eq('id', dealId)
    }
  }
  return NextResponse.json(data)
}
