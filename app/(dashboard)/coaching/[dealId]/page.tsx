'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { CHALLENGES, type ChallengeId } from '@/lib/coaching-data';
import Header from '@/components/layout/Header';

export default function CoachingFlowPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.dealId as string;
  const scrollRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Flow state
  const [step, setStep] = useState(0); // 0=challenge, 1=diagnosis, 2=reveal, 3=situation, 4=reflection, 5=coaching, 6=feedback
  const [challenge, setChallenge] = useState<ChallengeId | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentAns, setCurrentAns] = useState<number | null>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [situation, setSituation] = useState<string | null>(null);
  const [reflection, setReflection] = useState({ issue: '', tried: '' });
  const [coaching, setCoaching] = useState<any>(null);
  const [coachRevealed, setCoachRevealed] = useState(0);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      const { data: dealData } = await supabase.from('deals').select('*').eq('id', dealId).single();
      setUser(profile);
      setDeal(dealData);
      setLoading(false);
    }
    load();
  }, [dealId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [step, coachRevealed, currentAns, answers]);

  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!deal) return <div className="min-h-screen bg-cream flex items-center justify-center text-gray-500">Deal not found</div>;

  const cData = challenge ? CHALLENGES[challenge] : null;
  const firstName = user?.name?.split(' ')[0] || '';

  const generateCoaching = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          dealId: deal.id,
          challenge: cData?.title,
          diagnosisUser: diagnosis?.userPerception || cData?.title,
          diagnosis: diagnosis?.aiDiagnosis || 'Value communication gap',
          situation: cData?.situations.find(s => s.id === situation)?.title || situation,
          reflection,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCoaching(data.coaching);
      setSessionId(data.sessionId);
      setStep(5);
      // Reveal sections sequentially
      [500, 1400, 2300, 3200, 4100].forEach((d, i) => setTimeout(() => setCoachRevealed(i + 1), d));
    } catch (err: any) {
      console.error('Coaching error:', err);
      // Fallback: use static coaching if API fails
      setCoaching({
        wrong: 'Unable to generate personalised coaching at this moment. Please try again.',
        why: 'There was an issue connecting to the coaching engine.',
        steps: ['Check your internet connection', 'Try again in a few moments', 'If the issue persists, contact support'],
        script: 'Please try generating the coaching again.',
        track: 'N/A',
      });
      setStep(5);
      [500, 1400, 2300, 3200, 4100].forEach((d, i) => setTimeout(() => setCoachRevealed(i + 1), d));
    }
    setGenerating(false);
  };

  const submitFeedback = async () => {
    if (sessionId) {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: user.id,
          rating: feedbackRating,
          comment: feedbackComment,
        }),
      });
    }
    setFeedbackDone(true);
  };

  const CoachBubble = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`coach-bubble animate-fade-in ${className}`}>
      <div className="coach-avatar"><span className="text-cream text-[11px] font-bold">BD</span></div>
      <div className="coach-content">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream font-sans text-navy flex flex-col">
      <Header
        userName={user?.name || 'User'}
        plan={user?.plan || 'free'}
        sessionsUsed={user?.sessions_used || 0}
        back={`/deals/${deal.id}`}
        title={deal.name}
        subtitle={`${deal.deal_code} · ${deal.industry}`}
      />

      {/* Progress bar */}
      {step > 0 && step <= 6 && (
        <div className="px-5 pt-2.5 max-w-[640px] mx-auto w-full">
          <div className="flex gap-[3px]">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={`flex-1 h-[3px] rounded-sm transition-colors ${i < step ? 'bg-gold' : 'bg-navy/10'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-3.5 pb-10">
        <div className="max-w-[640px] mx-auto">

          {/* Step 0: Challenge selection */}
          {step === 0 && (
            <div>
              <CoachBubble>
                <p className="text-sm leading-relaxed">
                  {firstName ? `${firstName}, l` : 'L'}et's work on <strong className="font-medium">{deal.name}</strong>. What challenge are you facing?
                </p>
              </CoachBubble>
              <div className="ml-[46px] animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {Object.entries(CHALLENGES).map(([key, c]) => (
                  <button key={key} onClick={() => setChallenge(key as ChallengeId)}
                    className={`block w-full text-left px-[18px] py-3.5 mb-2 rounded-xl transition-all font-sans ${
                      challenge === key ? 'bg-gold/5 border-2 border-gold' : 'bg-white border border-gray-200 hover:border-gray-300'
                    }`}>
                    <p className="text-[15px] font-medium mb-0.5">{c.title}</p>
                    <p className="text-sm text-gray-500">{c.description}</p>
                  </button>
                ))}
                {challenge && (
                  <div className="mt-2.5 animate-fade-in">
                    <button onClick={() => setStep(1)} className="btn-gold">Continue →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Diagnosis questions */}
          {step === 1 && cData && (
            <div>
              <CoachBubble>
                <p className="text-sm">Let me ask {cData.questions.length} quick questions to diagnose what's really going on.</p>
              </CoachBubble>

              {answers.map((ans, qi) => (
                <div key={qi}>
                  <CoachBubble><p className="text-sm">{cData.questions[qi].question}</p></CoachBubble>
                  <div className="ml-[46px] mb-3 animate-fade-in">
                    <div className="inline-block bg-gold/10 rounded-[12px_12px_2px_12px] px-3.5 py-2.5">
                      <p className="text-sm">{cData.questions[qi].options[ans]}</p>
                    </div>
                  </div>
                </div>
              ))}

              {answers.length < cData.questions.length && (
                <div>
                  <CoachBubble>
                    <p className="text-sm text-gold font-medium mb-1">Question {answers.length + 1} of {cData.questions.length}</p>
                    <p className="text-sm">{cData.questions[answers.length].question}</p>
                  </CoachBubble>
                  <div className="ml-[46px] animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {cData.questions[answers.length].options.map((opt, i) => (
                      <button key={i} onClick={() => setCurrentAns(i)}
                        className={`block w-full text-left px-4 py-2.5 mb-1.5 rounded-lg text-sm transition-all font-sans ${
                          currentAns === i ? 'bg-gold/5 border-2 border-gold' : 'bg-white border border-gray-200'
                        }`}>{opt}</button>
                    ))}
                    {currentAns !== null && (
                      <div className="mt-2 animate-fade-in">
                        <button onClick={() => {
                          const n = [...answers, currentAns]; setAnswers(n); setCurrentAns(null);
                          if (n.length >= cData.questions.length) {
                            // Generate diagnosis via API or use defaults
                            setDiagnosis({ userPerception: cData.title, aiDiagnosis: 'Value communication gap',
                              explanation: 'Based on your answers, the root cause runs deeper than what it appears on the surface.' });
                            setTimeout(() => setStep(2), 500);
                          }
                        }} className="btn-gold">
                          {answers.length + 1 < cData.questions.length ? 'Next →' : 'Show diagnosis →'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Diagnosis reveal */}
          {step === 2 && diagnosis && (
            <div>
              <CoachBubble><p className="text-sm font-medium">Here's what I found.</p></CoachBubble>
              <div className="ml-[46px] animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                  <div className="bg-amber-50 rounded-xl px-3.5 py-3 text-center">
                    <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wide mb-1">You think</p>
                    <p className="font-serif text-[15px] font-medium text-amber-900">{diagnosis.userPerception}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl px-3.5 py-3 text-center">
                    <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wide mb-1">AI diagnosis</p>
                    <p className="font-serif text-[15px] font-medium text-emerald-900">{diagnosis.aiDiagnosis}</p>
                  </div>
                </div>
                <div className="card !mb-3.5"><p className="text-sm leading-relaxed">{diagnosis.explanation}</p></div>
                <button onClick={() => setStep(3)} className="btn-gold">I agree — continue →</button>
              </div>
            </div>
          )}

          {/* Step 3: Situation */}
          {step === 3 && cData && (
            <div>
              <CoachBubble><p className="text-sm">Which situation best describes this deal right now?</p></CoachBubble>
              <div className="ml-[46px] animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {cData.situations.map(s => (
                  <button key={s.id} onClick={() => setSituation(s.id)}
                    className={`block w-full text-left px-4 py-3 mb-1.5 rounded-lg text-sm transition-all font-sans ${
                      situation === s.id ? 'bg-gold/5 border-2 border-gold' : 'bg-white border border-gray-200'
                    }`}>
                    <p className="font-medium">{s.title}</p>
                    {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}
                  </button>
                ))}
                {situation && (
                  <div className="mt-2.5 animate-fade-in">
                    <button onClick={() => setStep(4)} className="btn-gold">Continue →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Reflection */}
          {step === 4 && (
            <div>
              <CoachBubble>
                <p className="text-sm font-medium mb-1">Before I coach you, think first.</p>
                <p className="text-sm text-gray-500">What's your read on this situation?</p>
              </CoachBubble>
              <div className="ml-[46px] card animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="mb-3.5">
                  <label className="block text-sm font-medium mb-1.5">What do you think is the real issue?</label>
                  <textarea value={reflection.issue} onChange={e => setReflection(r => ({ ...r, issue: e.target.value }))}
                    placeholder="What's really going on in this deal?"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gold resize-y min-h-[64px] font-sans leading-relaxed" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5">What have you already tried?</label>
                  <textarea value={reflection.tried} onChange={e => setReflection(r => ({ ...r, tried: e.target.value }))}
                    placeholder="What approaches have you taken?"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gold resize-y min-h-[64px] font-sans leading-relaxed" />
                </div>
                <button disabled={!reflection.issue.trim() || generating} onClick={generateCoaching} className="btn-gold w-full">
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating coaching...
                    </span>
                  ) : 'Show me the coaching ⚡'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Coaching output */}
          {step === 5 && coaching && (
            <div>
              <CoachBubble>
                <p className="text-sm">Here's your coaching for <strong className="font-medium">{deal.name}</strong>, tailored for {deal.industry}.</p>
              </CoachBubble>
              <div className="ml-[46px]">
                {[
                  { key: 'wrong', label: "What's going wrong", borderColor: 'border-red-400', labelColor: 'text-red-700' },
                  { key: 'why', label: "Why it's happening", borderColor: 'border-gold', labelColor: 'text-amber-700' },
                ].map((sec, i) => coachRevealed >= i + 1 && (
                  <div key={sec.key} className="card !mb-2.5 animate-fade-in">
                    <div className={`coaching-block ${sec.borderColor}`}>
                      <p className={`text-[10px] font-medium ${sec.labelColor} uppercase tracking-wide mb-1`}>{sec.label}</p>
                      <p className="text-sm leading-relaxed">{coaching[sec.key]}</p>
                    </div>
                  </div>
                ))}

                {coachRevealed >= 3 && (
                  <div className="card !mb-2.5 animate-fade-in">
                    <div className="coaching-block border-green">
                      <p className="text-[10px] font-medium text-green uppercase tracking-wide mb-1.5">What to do</p>
                      {coaching.steps?.map((s: string, i: number) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <span className="w-5 h-5 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0 text-[11px] font-medium text-green">{i + 1}</span>
                          <p className="text-sm leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {coachRevealed >= 4 && (
                  <div className="bg-navy/[0.03] rounded-xl px-5 py-4 border-[1.5px] border-gold/15 mb-2.5 animate-fade-in">
                    <div className="coaching-block border-navy">
                      <p className="text-[10px] font-medium text-navy uppercase tracking-wide mb-1">What to say</p>
                      <p className="text-sm leading-[1.8] italic">"{coaching.script}"</p>
                    </div>
                  </div>
                )}

                {coachRevealed >= 5 && (
                  <>
                    <div className="card !mb-5 animate-fade-in">
                      <div className="coaching-block border-purple-500">
                        <p className="text-[10px] font-medium text-purple-600 uppercase tracking-wide mb-1">What to track</p>
                        <p className="text-sm leading-relaxed">{coaching.track}</p>
                      </div>
                    </div>
                    <div className="text-center animate-fade-in">
                      <button onClick={() => setStep(6)} className="btn-gold">Done — give feedback →</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Feedback */}
          {step === 6 && !feedbackDone && (
            <div>
              <CoachBubble><p className="text-sm">How was this coaching session?</p></CoachBubble>
              <div className="ml-[46px] card animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex justify-center gap-1.5 mb-3.5">
                  {[1,2,3,4,5].map(i => (
                    <button key={i} onClick={() => setFeedbackRating(i)}
                      className={`p-0.5 transition-transform ${feedbackRating >= i ? 'scale-110' : ''}`}>
                      <svg className={`w-[30px] h-[30px] ${i <= feedbackRating ? 'text-gold' : 'text-gray-300'}`}
                        viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  ))}
                </div>
                <textarea value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)}
                  placeholder="What worked? What could be better?"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gold resize-y min-h-[56px] font-sans mb-3" />
                <button disabled={!feedbackRating} onClick={submitFeedback} className="btn-gold w-full">Submit feedback</button>
              </div>
            </div>
          )}

          {step === 6 && feedbackDone && (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 className="font-serif text-[22px] mb-2">Session saved to {deal.deal_code}</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">Go apply this coaching. Come back anytime for follow-up.</p>
              <div className="flex gap-2.5 justify-center flex-wrap">
                <button onClick={() => router.push(`/deals/${deal.id}`)} className="btn-gold">← Back to deal</button>
                <button onClick={() => {
                  setStep(0); setChallenge(null); setAnswers([]); setCurrentAns(null);
                  setDiagnosis(null); setSituation(null); setReflection({ issue: '', tried: '' });
                  setCoaching(null); setCoachRevealed(0); setFeedbackRating(0); setFeedbackComment('');
                  setFeedbackDone(false); setSessionId(null);
                }} className="btn-outline">↻ New session</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
