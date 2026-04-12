'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Header from '@/components/layout/Header';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  won: 'bg-green-50 text-green-700',
  lost: 'bg-red-50 text-red-700',
  stalled: 'bg-amber-50 text-amber-700',
};

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [deal, setDeal] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      const { data: dealData } = await supabase.from('deals').select('*').eq('id', dealId).single();
      const { data: sessData } = await supabase
        .from('sessions')
        .select('*, feedback(rating, comment)')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      setUser(profile);
      setDeal(dealData);
      setSessions(sessData || []);
      setLoading(false);
    }
    load();
  }, [dealId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!deal) return <div className="min-h-screen bg-cream flex items-center justify-center text-gray-500">Deal not found</div>;

  const canStart = user?.plan === 'pro' || (user?.sessions_used || 0) < 3;
  const avgRating = sessions.length > 0
    ? (sessions.reduce((s, x) => s + (x.feedback?.[0]?.rating || 0), 0) / sessions.filter(s => s.feedback?.[0]).length).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen bg-cream font-sans text-navy">
      <Header
        userName={user?.name || 'User'}
        plan={user?.plan || 'free'}
        sessionsUsed={user?.sessions_used || 0}
        back="/deals"
        title={deal.name}
        subtitle={`${deal.deal_code} · ${deal.industry}`}
      />

      <div className="max-w-[700px] mx-auto px-5 py-7">
        {/* Deal info card */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-medium text-gold">{deal.deal_code}</span>
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[deal.status] || ''}`}>
                  {deal.status}
                </span>
              </div>
              <h2 className="font-serif text-[22px] mb-1">{deal.name}</h2>
              <p className="text-sm text-gray-500">{deal.industry}</p>
            </div>
            <Link href={canStart ? `/coaching/${deal.id}` : '/upgrade'} className="btn-gold !text-sm !py-2 !px-4">
              ⚡ New session
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Sessions', value: sessions.length },
              { label: 'Avg rating', value: avgRating },
              { label: 'Created', value: new Date(deal.created_at).toLocaleDateString() },
            ].map(m => (
              <div key={m.label} className="bg-soft-white rounded-lg px-3.5 py-2.5 text-center">
                <p className="text-[11px] text-gray-500 mb-0.5">{m.label}</p>
                <p className="text-lg font-medium">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Session history */}
        <div className="flex items-center gap-2 mb-3.5">
          <svg className="w-4 h-4 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <h3 className="text-[15px] font-medium">Coaching history</h3>
        </div>

        {sessions.length === 0 ? (
          <div className="card text-center py-10">
            <svg className="w-7 h-7 text-gray-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <p className="text-sm text-gray-500">No coaching sessions yet. Start your first one above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sessions.map(sess => {
              const rating = sess.feedback?.[0]?.rating;
              const coaching = sess.coaching_output;
              return (
                <div key={sess.id} className="card !p-0 overflow-hidden">
                  <button onClick={() => setExpanded(expanded === sess.id ? null : sess.id)}
                    className="w-full px-5 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">{new Date(sess.created_at).toLocaleDateString()}</span>
                        {rating && (
                          <span className="flex gap-0.5">
                            {[1,2,3,4,5].map(i => (
                              <svg key={i} className={`w-3 h-3 ${i <= rating ? 'text-gold' : 'text-gray-300'}`}
                                viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            ))}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">{sess.challenge} — {sess.situation}</p>
                      <p className="text-xs text-gray-500">Diagnosis: {sess.diagnosis_ai}</p>
                    </div>
                    <svg className={`w-[18px] h-[18px] text-gray-400 transition-transform ${expanded === sess.id ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {expanded === sess.id && coaching && (
                    <div className="px-5 pb-4 border-t border-gray-100">
                      <div className="coaching-block border-gold mt-3">
                        <p className="text-[10px] font-medium text-gold tracking-wide uppercase mb-1">Coaching summary</p>
                        <p className="text-sm leading-relaxed">{coaching.wrong}</p>
                        <p className="text-sm leading-relaxed mt-2 text-gray-500 italic">Script: "{coaching.script?.slice(0, 150)}..."</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
