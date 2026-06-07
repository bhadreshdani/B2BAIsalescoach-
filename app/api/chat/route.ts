import { NextRequest } from 'next/server'
import { getCoachingResponse } from '@/lib/anthropic'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { message, userId, sessionId, dealId, conversationHistory = [] } = await request.json()
    if (!message || !userId) return new Response(JSON.stringify({ error: 'Missing message or userId' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    if (sessionId) {
      await supabaseAdmin.from('chat_messages').insert({ user_id: userId, session_id: sessionId, deal_id: dealId || null, role: 'user', content: message })
    }
    let dealContext = ''
    if (dealId) {
      const { data: deal } = await supabaseAdmin.from('deals').select('*').eq('id', dealId).single()
      if (deal) dealContext = [deal.name ? `Deal: ${deal.name}` : '', deal.industry ? `Industry: ${deal.industry}` : '', deal.customer_type ? `Type: ${deal.customer_type}` : '', deal.stage ? `Stage: Step ${deal.stage}` : '', deal.impact_score ? `IMPACT: ${deal.impact_score}` : ''].filter(Boolean).join('\n')
    }
    const stream = await getCoachingResponse(userId, message, conversationHistory, dealContext)
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' } })
  } catch (error: any) { return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } }) }
}
