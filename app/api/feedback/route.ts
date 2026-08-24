import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { userId, sessionId, rating, comment } = await request.json()
  if (!userId || !rating) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const { error } = await supabaseAdmin.from('feedback').insert({
    user_id: userId, session_id: sessionId || null, rating, comment: comment || null
  })

  // Update profile: clear the pending rating
  await supabaseAdmin.from('profiles').update({
    last_rating_session_id: null, sessions_used: supabaseAdmin.rpc ? undefined : undefined
  }).eq('id', userId).then(() => {})

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const { data } = await supabaseAdmin.from('profiles').select('last_rating_session_id').eq('id', userId).single()
  return NextResponse.json({ pendingRating: !!data?.last_rating_session_id })
}
