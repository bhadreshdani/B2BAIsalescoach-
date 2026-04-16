import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledge } from '@/lib/pinecone';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  try {
    const results = await searchKnowledge({ query, topK: 5 });
    return NextResponse.json({ chunks: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 });
  }
}
