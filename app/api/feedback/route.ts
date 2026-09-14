import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { userId, rating, nps, comment, skipped } = await request.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  if (skipped) {
    // Mark feedback as pending for next session
    await supabaseAdmin.from('profiles').update({ feedback_pending: true }).eq('id', userId)
    return NextResponse.json({ success: true, skipped: true })
  }

  // Save feedback
  const { error } = await supabaseAdmin.from('feedback').insert({
    user_id: userId,
    rating: rating || null,
    nps_score: nps >= 0 ? nps : null,
    comment: comment || null,
  })

  // Mark feedback as completed
  await supabaseAdmin.from('profiles').update({ 
    feedback_pending: false,
    last_feedback_at: new Date().toISOString()
  }).eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  const action = request.nextUrl.searchParams.get('action')

  // Get averages for admin
  if (action === 'averages') {
    const { data: feedbacks } = await supabaseAdmin.from('feedback').select('rating, nps_score') as { data: any[] | null }
    if (feedbacks && feedbacks.length > 0) {
      const ratings = feedbacks.filter(f => f.rating > 0)
      const npses = feedbacks.filter(f => f.nps_score !== null && f.nps_score >= 0)
      const avgRating = ratings.length > 0 ? ratings.reduce((s, f) => s + f.rating, 0) / ratings.length : 0
      const avgNps = npses.length > 0 ? npses.reduce((s, f) => s + f.nps_score, 0) / npses.length : 0
      const promoters = npses.filter(f => f.nps_score >= 9).length
      const detractors = npses.filter(f => f.nps_score <= 6).length
      const npsScore = npses.length > 0 ? Math.round((promoters - detractors) / npses.length * 100) : 0
      return NextResponse.json({ 
        avgRating: avgRating.toFixed(1), 
        avgNps: avgNps.toFixed(1),
        npsScore,
        totalFeedbacks: feedbacks.length,
        totalRatings: ratings.length,
        totalNps: npses.length
      })
    }
    return NextResponse.json({ avgRating: '0', avgNps: '0', npsScore: 0, totalFeedbacks: 0 })
  }

  // Check if user needs to give feedback
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  
  const { data: profile } = await supabaseAdmin.from('profiles').select('feedback_pending, last_feedback_at, created_at').eq('id', userId).single()
  
  if (!profile) return NextResponse.json({ needsFeedback: false })

  // First time user (no feedback ever)
  const neverGaveFeedback = !profile.last_feedback_at
  
  // Skipped last time
  const skippedLastTime = profile.feedback_pending === true

  // Repeat user: last feedback > 30 min ago
  const lastFB = profile.last_feedback_at ? new Date(profile.last_feedback_at) : null
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
  const repeatUser = lastFB && lastFB < thirtyMinAgo

  return NextResponse.json({ 
    needsFeedback: neverGaveFeedback || skippedLastTime || repeatUser 
  })
}
