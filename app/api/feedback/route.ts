import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, userId, rating, comment } = body;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('feedback')
    .insert({ session_id: sessionId, user_id: userId, rating, comment })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const supabase = createServerClient();

  let query = supabase
    .from('feedback')
    .select('*, sessions(challenge, situation, deal_id), users(name, email)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
