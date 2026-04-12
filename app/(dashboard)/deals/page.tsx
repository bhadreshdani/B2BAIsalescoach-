'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import Header from '@/components/layout/Header';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  won: 'bg-green-50 text-green-700',
  lost: 'bg-red-50 text-red-700',
  stalled: 'bg-amber-50 text-amber-700',
};

export default function DealsPage() {
  const [user, setUser] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const { data: userDeals } = await supabase
        .from('deals')
        .select('*, sessions(count)')
        .eq('user_id', authUser.id)
        .order('updated_at', { ascending: false });

      setUser(profile);
      setDeals(userDeals || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your deals...</p>
        </div>
      </div>
    );
  }

  const canStart = user?.plan === 'pro' || (user?.sessions_used || 0) < 3;

  return (
    <div className="min-h-screen bg-cream font-sans text-navy">
      <Header
        userName={user?.name || 'User'}
        plan={user?.plan || 'free'}
        sessionsUsed={user?.sessions_used || 0}
      />

      <div className="max-w-[760px] mx-auto px-5 py-7">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="font-serif text-[26px] mb-1">Your deals</h1>
            <p className="text-sm text-gray-500">Track deals, get coaching, review past sessions.</p>
          </div>
          <Link href={canStart ? '/deals/new' : '/upgrade'} className="btn-gold !text-sm">
            + New deal
          </Link>
        </div>

        {/* Freemium nudge */}
        {user?.plan !== 'pro' && user?.sessions_used >= 2 && (
          <div className="bg-gold/5 rounded-xl px-5 py-3.5 mb-5 flex justify-between items-center border border-gold/15">
            <div className="flex items-center gap-2.5">
              <svg className="w-[18px] h-[18px] text-gold flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 20h20M4 20l2-14 4 6 2-8 2 8 4-6 2 14" />
              </svg>
              <div>
                <p className="text-sm font-medium">
                  {user?.sessions_used >= 3 ? "You've used all free sessions" : `${3 - user?.sessions_used} free session left`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Upgrade to Pro for unlimited coaching.</p>
              </div>
            </div>
            <Link href="/upgrade" className="btn-gold !text-xs !py-2 !px-4">Upgrade</Link>
          </div>
        )}

        {/* Deal list */}
        {deals.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            <p className="text-gray-500 mb-4">No deals yet. Create your first one to start coaching.</p>
            <Link href="/deals/new" className="btn-gold !text-sm">+ Create your first deal</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {deals.map((deal) => (
              <Link key={deal.id} href={`/deals/${deal.id}`}
                className="card hover:border-gold hover:-translate-y-px transition-all duration-200 cursor-pointer block">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gold">{deal.deal_code}</span>
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[deal.status] || ''}`}>
                        {deal.status}
                      </span>
                    </div>
                    <p className="text-base font-medium mb-1.5">{deal.name}</p>
                    <div className="flex gap-3.5 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                        {deal.industry}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                        {deal.sessions?.[0]?.count || 0} sessions
                      </span>
                    </div>
                  </div>
                  <svg className="w-[18px] h-[18px] text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
