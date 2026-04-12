import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { buildCoachingPrompt, generateCoaching } from '@/lib/anthropic';
import { searchKnowledge } from '@/lib/pinecone';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      dealId,
      challenge,
      diagnosis,
      situation,
      reflection,
    } = body;

    const supabase = createServerClient();

    // 1. Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Check session limits (free tier)
    if (user.plan === 'free' && user.sessions_used >= parseInt(process.env.FREE_SESSION_LIMIT || '3')) {
      return NextResponse.json({ error: 'Session limit reached. Upgrade to Pro for unlimited coaching.' }, { status: 403 });
    }

    // 3. Get deal info
    const { data: deal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // 4. Search knowledge base for relevant content
    const knowledgeResults = await searchKnowledge({
      query: `${challenge} ${situation} ${reflection.issue} ${deal.industry}`,
      challenge: challenge,
      situation: situation,
      topK: 5,
    });

    const knowledgeChunks = knowledgeResults.map((r) => r.content);

    // 5. Build prompt and generate coaching
    const profile = user.profile_data || {};
    const systemPrompt = buildCoachingPrompt({
      userProfile: {
        name: user.name,
        yearsTotal: user.years_total || '5-10',
        yearsSales: user.years_sales || '3-5',
        industries: profile.industries || [],
        productCategory: profile.productCategory || '',
        customerTypes: profile.customerTypes || [],
        competitors: profile.competitors || [],
        industryChallenges: profile.industryChallenges || '',
        customerNeeds: profile.customerNeeds || '',
        buyingCriteria: profile.buyingCriteria || '',
      },
      dealInfo: {
        name: deal.name,
        industry: deal.industry,
      },
      challenge,
      diagnosis,
      situation,
      reflection,
      knowledgeChunks,
    });

    const coachingOutput = await generateCoaching(systemPrompt);

    // 6. Save session to database
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        deal_id: dealId,
        challenge,
        diagnosis_user: body.diagnosisUser || challenge,
        diagnosis_ai: diagnosis,
        situation,
        context: { industry: deal.industry, deal_name: deal.name },
        reflection,
        coaching_output: coachingOutput,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session save error:', sessionError);
    }

    // 7. Increment session count
    await supabase
      .from('users')
      .update({ sessions_used: user.sessions_used + 1 })
      .eq('id', userId);

    return NextResponse.json({
      coaching: coachingOutput,
      sessionId: session?.id,
      knowledgeSources: knowledgeResults.map((r) => ({
        source: r.source,
        score: Math.round(r.score * 100),
      })),
    });
  } catch (error: any) {
    console.error('Coaching API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate coaching' },
      { status: 500 }
    );
  }
}
