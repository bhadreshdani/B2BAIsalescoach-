import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...profileData } = body
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    // Calculate generation from experience
    const yearsMap: Record<string, number> = { '0-2': 1, '3-5': 4, '6-10': 8, '11-15': 13, '16-20': 18, '21-25': 23, '25+': 28, '20+': 25 }
    const midpoint = yearsMap[profileData.years_total] || 5
    const approxAge = 22 + midpoint
    let generation = 'millennial'
    if (approxAge <= 27) generation = 'gen_z'
    else if (approxAge <= 37) generation = 'millennial'
    else if (approxAge <= 47) generation = 'gen_x'
    else generation = 'boomer'

    const updateData = {
      ...profileData,
      approx_age: approxAge,
      generation,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
