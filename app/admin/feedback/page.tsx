'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('feedback')
        .select('*, sessions(challenge, situation, deal_id), users:user_id(name, email)')
        .order('created_at', { ascending: false })
        .limit(50);
      setFeedback(data || []);
    }
    load();
  }, []);

  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : '—';

  return (
    <div>
      <h1 className="font-serif text-[26px] mb-1">User feedback</h1>
      <p className="text-sm text-gray-500 mb-7">See how users rate the coaching and what they're saying.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Average rating', value: avgRating },
          { label: 'Total reviews', value: feedback.length },
          { label: 'Found helpful (4-5★)', value: feedback.filter(f => f.rating >= 4).length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
            <p className="font-serif text-[28px]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {feedback.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-gray-500">No feedback yet. It will appear here once users complete coaching sessions.</p>
          </div>
        ) : feedback.map((f, i) => (
          <div key={f.id} className={`px-6 py-5 ${i < feedback.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-sm font-medium">{(f.users as any)?.name || 'User'}</span>
                  <span className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} className={`w-3.5 h-3.5 ${s <= f.rating ? 'text-gold' : 'text-gray-200'}`} viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {f.sessions?.challenge && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-navy/5 text-navy">{f.sessions.challenge}</span>}
                  {f.sessions?.situation && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gold/10 text-amber-700">{f.sessions.situation}</span>}
                </div>
              </div>
              <span className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString()}</span>
            </div>
            {f.comment && (
              <div className="border-l-2 border-gold pl-3 mt-2.5" style={{ borderRadius: 0 }}>
                <p className="text-sm text-gray-600 leading-relaxed">{f.comment}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
