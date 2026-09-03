export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = 'bhadreshdani69@gmail.com'
import { testCoachingWithDebug } from '@/lib/anthropic'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    const result = await testCoachingWithDebug(message)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
