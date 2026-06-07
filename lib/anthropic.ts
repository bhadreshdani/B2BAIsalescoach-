import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from './supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function loadSystemPrompt(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('system_prompts').select('name, content').eq('is_active', true).order('sort_order')
  if (error || !data || data.length === 0) return 'You are a B2B sales coach.'
  return data.map((s: any) => s.content).join('\n\n')
}

export async function searchKnowledge(query: string, limit: number = 5): Promise<string> {
  const stopWords = new Set(['the','a','an','is','are','was','were','be','been','have','has','had','do','does','did','will','would','shall','should','may','might','must','can','could','i','me','my','we','our','you','your','he','him','his','she','her','it','its','they','them','this','that','these','those','what','which','who','how','when','where','why','and','but','or','for','so','yet','to','of','in','on','at','by','with','from','about','not','no','all','each','every','both','few','more','most','other','some','such','than','too','very','just','also','into'])
  const keywords = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))
  if (keywords.length === 0) return ''
  const { data } = await supabaseAdmin
    .from('knowledge_chunks').select('content, source, step_number, category')
    .or(keywords.slice(0,3).map((k: any) => `content.ilike.%${k}%`).join(','))
    .limit(limit)
  if (!data || data.length === 0) return ''
  return data.map((c: any) => c.content).join('\n\n---\n\n')
}

export async function buildUserContext(userId: string): Promise<string> {
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single()
  if (!profile) return ''
  return [
    profile.name ? `User: ${profile.name}` : '',
    profile.designation ? `Role: ${profile.designation}` : '',
    profile.organisation ? `Organisation: ${profile.organisation}` : '',
    profile.years_sales ? `Sales Experience: ${profile.years_sales} years` : '',
    profile.generation ? `Generation: ${profile.generation}` : '',
    profile.industries?.length ? `Industries: ${profile.industries.join(', ')}` : '',
    profile.product_category?.length ? `Products: ${profile.product_category.join(', ')}` : '',
    profile.customer_types?.length ? `Customer Types: ${profile.customer_types.join(', ')}` : '',
    profile.competitors?.length ? `Competitors: ${profile.competitors.join(', ')}` : '',
    profile.rotis_hourly ? `ROTIS: Rs${Math.round(profile.rotis_hourly)}/hour` : '',
    profile.ask_score ? `ASK Score: ${profile.ask_score}/10` : '',
  ].filter(Boolean).join('\n')
}

export async function getCoachingResponse(userId: string, userMessage: string, conversationHistory: Array<{role:string;content:string}>, dealContext?: string): Promise<ReadableStream> {
  const systemPrompt = await loadSystemPrompt()
  const knowledgeContext = await searchKnowledge(userMessage)
  const userContext = await buildUserContext(userId)
  const fullSystemPrompt = [systemPrompt, userContext ? `\n\nUSER CONTEXT:\n${userContext}` : '', dealContext ? `\n\nDEAL CONTEXT:\n${dealContext}` : '', knowledgeContext ? `\n\nRELEVANT COACHING KNOWLEDGE (use as YOUR expertise):\n${knowledgeContext}` : ''].filter(Boolean).join('\n')
  const messages = [...conversationHistory, { role: 'user', content: userMessage }].map((m: any) => ({ role: m.role as 'user'|'assistant', content: m.content }))
  const stream = anthropic.messages.stream({ model: 'claude-sonnet-4-20250514', max_tokens: 2048, system: fullSystemPrompt, messages })
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') controller.enqueue(encoder.encode(event.delta.text))
        }
        controller.close()
      } catch (error) { controller.error(error) }
    },
  })
}

export async function testCoachingWithDebug(userMessage: string) {
  const systemPrompt = await loadSystemPrompt()
  const knowledgeContext = await searchKnowledge(userMessage)
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514', max_tokens: 2048,
    system: systemPrompt + (knowledgeContext ? `\n\nRELEVANT KNOWLEDGE:\n${knowledgeContext}` : ''),
    messages: [{ role: 'user', content: userMessage }],
  })
  const text = response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
  return { coaching: text, debug: { systemPromptLength: systemPrompt.length, knowledgeChunksFound: knowledgeContext ? knowledgeContext.split('---').length : 0, knowledgePreview: knowledgeContext ? knowledgeContext.substring(0, 500) : 'None found', model: 'claude-sonnet-4-20250514', tokensUsed: response.usage } }
}
