import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Generational tone adaptation
function getGenerationTone(yearsExp: string): string {
  const yrs = parseInt(yearsExp?.replace('+', '').split('-').pop() || '0');
  const approxAge = 22 + yrs;
  if (approxAge <= 27) return 'casual and energetic — this is a young professional early in their career. Use modern language, be encouraging, keep it punchy.';
  if (approxAge <= 42) return 'balanced and professional — this person has solid experience. Be direct, respect their knowledge, push them to the next level.';
  if (approxAge <= 58) return 'respectful and experienced — this is a seasoned professional. Acknowledge their expertise, offer frameworks that complement what they know, avoid being patronising.';
  return 'deferential and strategic — this is a veteran with deep industry knowledge. Focus on structured frameworks and strategic angles, not basics.';
}

// Build the coaching system prompt
export function buildCoachingPrompt(params: {
  userProfile: {
    name: string;
    yearsTotal: string;
    yearsSales: string;
    industries: string[];
    productCategory: string;
    customerTypes: string[];
    competitors: string[];
    industryChallenges: string;
    customerNeeds: string;
    buyingCriteria: string;
  };
  dealInfo: {
    name: string;
    industry: string;
  };
  challenge: string;
  diagnosis: string;
  situation: string;
  reflection: {
    issue: string;
    tried: string;
  };
  knowledgeChunks: string[];
}): string {
  const tone = getGenerationTone(params.userProfile.yearsTotal);

  return `You are Bhadresh Dani's AI Sales Coach, built on the "B2B Sales Transformation 2.0" methodology. You are coaching a real B2B sales professional through a specific deal situation.

## YOUR COACHING STYLE
- Tone: ${tone}
- Always be direct and actionable — no generic advice
- Every response must be grounded in the user's specific context
- You diagnose before advising, ask before answering
- You are warm but firm — empathetic to their struggle, but unflinching about what must change

## USER PROFILE
- Name: ${params.userProfile.name}
- Total experience: ${params.userProfile.yearsTotal} years
- Sales experience: ${params.userProfile.yearsSales} years
- Industries served: ${params.userProfile.industries.join(', ')}
- Product/service: ${params.userProfile.productCategory}
- Customer types: ${params.userProfile.customerTypes.join(', ')}
- Competitors: ${params.userProfile.competitors.join(', ')}
- Industry challenges: ${params.userProfile.industryChallenges}
- Customer needs: ${params.userProfile.customerNeeds}
- Buying criteria: ${params.userProfile.buyingCriteria}

## CURRENT DEAL
- Deal: ${params.dealInfo.name}
- Industry: ${params.dealInfo.industry}
- Challenge: ${params.challenge}
- AI Diagnosis: ${params.diagnosis}
- Specific situation: ${params.situation}

## USER'S REFLECTION
- What they think is the real issue: ${params.reflection.issue}
- What they've already tried: ${params.reflection.tried}

## KNOWLEDGE BASE CONTEXT
The following excerpts are from Bhadresh Dani's methodology. Use these to inform your coaching:

${params.knowledgeChunks.map((chunk, i) => `[Source ${i + 1}]: ${chunk}`).join('\n\n')}

## YOUR RESPONSE FORMAT
Respond in valid JSON with exactly this structure:
{
  "wrong": "What is going wrong in this specific situation. Be specific to their deal, their industry (${params.dealInfo.industry}), and their customer type. 2-3 sentences.",
  "why": "Why this is happening — the root cause. Reference their specific context. 2-3 sentences.",
  "steps": ["Step 1 — specific action", "Step 2 — specific action", "Step 3 — specific action", "Step 4 — specific action"],
  "script": "The exact words they should say in their next conversation with the customer. This must be a natural, professional script they can use immediately. Include placeholders like [customer name] or [specific number] where appropriate. 3-5 sentences.",
  "track": "What to track after applying this coaching. Include 3 specific, measurable indicators. 2-3 sentences."
}

CRITICAL RULES:
- Every recommendation must reference the user's specific industry (${params.dealInfo.industry}), product (${params.userProfile.productCategory}), and competitors (${params.userProfile.competitors.join(', ')})
- Scripts must sound natural for B2B conversations in India
- Steps must be actionable within the next 48 hours
- Never give generic advice — always tie back to their specific deal context
- Respond ONLY with the JSON object, no other text`;
}

// Generate coaching response
export async function generateCoaching(systemPrompt: string): Promise<{
  wrong: string;
  why: string;
  steps: string[];
  script: string;
  track: string;
}> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: 'Generate the coaching response for this situation based on the context provided in your system prompt.',
      },
    ],
    system: systemPrompt,
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => {
      if (block.type === 'text') return block.text;
      return '';
    })
    .join('');

  // Parse JSON response, stripping any markdown fences
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

// Generate diagnosis based on user answers
export async function generateDiagnosis(params: {
  challenge: string;
  answers: { question: string; answer: string }[];
  userProfile: {
    industries: string[];
    productCategory: string;
    competitors: string[];
  };
}): Promise<{
  userPerception: string;
  aiDiagnosis: string;
  explanation: string;
}> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Based on these diagnostic answers for a "${params.challenge}" challenge, provide a diagnosis.

Questions and answers:
${params.answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')}

User context: Sells ${params.userProfile.productCategory} in ${params.userProfile.industries.join(', ')}. Competes with ${params.userProfile.competitors.join(', ')}.

Respond in JSON:
{
  "userPerception": "What the user thinks the problem is (2-4 words)",
  "aiDiagnosis": "The actual root cause (2-4 words)",
  "explanation": "2-3 sentences explaining the gap between perception and reality"
}

Respond ONLY with JSON.`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => {
      if (block.type === 'text') return block.text;
      return '';
    })
    .join('');

  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}
