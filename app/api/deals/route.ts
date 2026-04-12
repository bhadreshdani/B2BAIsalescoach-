import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET all deals for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('deals')
    .select('*, sessions(count)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST create a new deal
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, dealCode, name, industry } = body;

  if (!userId || !dealCode || !name || !industry) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('deals')
    .insert({
      user_id: userId,
      deal_code: dealCode,
      name,
      industry,
      status: 'active',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH update deal status
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { dealId, status } = body;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('deals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', dealId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
