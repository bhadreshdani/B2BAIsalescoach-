'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import Header from '@/components/layout/Header';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      setUser(data);
    }
    load();
  }, []);

  if (!user) return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  const profile = user.profile_data || {};
  const firstName = user.name?.split(' ')[0] || 'U';

  return (
    <div className="min-h-screen bg-cream font-sans text-navy">
      <Header userName={user.name} plan={user.plan} sessionsUsed={user.sessions_used} back="/deals" title="Profile settings" subtitle="Manage your account" />
      <div className="max-w-[520px] mx-auto px-5 py-8">
        {/* Profile card */}
        <div className="card mb-4">
          <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center">
              <span className="text-cream text-lg font-semibold">{firstName[0]}</span>
            </div>
            <div>
              <p className="text-base font-medium">{user.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{user.plan === 'pro' ? 'Pro plan' : 'Free plan'} · {user.years_total || '—'} years experience</p>
            </div>
          </div>
          {[
            { label: 'Email', value: user.email },
            { label: 'Industries', value: profile.industries?.join(', ') || '—' },
            { label: 'Product category', value: profile.productCategory || '—' },
            { label: 'Customer types', value: profile.customerTypes?.join(', ') || '—' },
            { label: 'Competitors', value: profile.competitors?.join(', ') || '—' },
          ].map(f => (
            <div key={f.label} className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-500">{f.label}</span>
              <span className="text-sm font-medium text-right max-w-[60%]">{f.value}</span>
            </div>
          ))}
        </div>

        {/* Subscription */}
        <div className="card mb-4">
          <h3 className="text-[15px] font-medium mb-1">Subscription</h3>
          <p className="text-sm text-gray-500 mb-3.5">
            {user.plan === 'pro' ? "You're on Pro — unlimited coaching." : `Free plan — ${3 - user.sessions_used} sessions remaining this month.`}
          </p>
          {user.plan !== 'pro' && (
            <Link href="/upgrade" className="btn-gold !text-sm !py-2 !px-4">Upgrade to Pro</Link>
          )}
        </div>

        {/* Usage */}
        <div className="card">
          <h3 className="text-[15px] font-medium mb-3">Usage this month</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sessions', value: user.sessions_used },
              { label: 'Plan', value: user.plan === 'pro' ? 'Pro' : 'Free' },
              { label: 'Member since', value: new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) },
            ].map(m => (
              <div key={m.label} className="bg-soft-white rounded-lg px-3 py-2.5 text-center">
                <p className="text-[11px] text-gray-500 mb-0.5">{m.label}</p>
                <p className="text-lg font-medium">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
