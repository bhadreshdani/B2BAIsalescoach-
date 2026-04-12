'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Header from '@/components/layout/Header';

export default function UpgradePage() {
  const router = useRouter();
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

  const handleUpgrade = async () => {
    // In production, this would redirect to Stripe Checkout
    // For now, we update the plan directly
    const supabase = createClient();
    await supabase.from('users').update({ plan: 'pro' }).eq('id', user.id);
    router.push('/deals');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-cream font-sans text-navy">
      <Header userName={user?.name || 'User'} plan={user?.plan || 'free'} sessionsUsed={user?.sessions_used || 0} back="/deals" title="Upgrade to Pro" subtitle="Unlock unlimited coaching" />
      <div className="max-w-[560px] mx-auto px-5 py-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 20h20M4 20l2-14 4 6 2-8 2 8 4-6 2 14" /></svg>
          </div>
          <h1 className="font-serif text-[28px] mb-2">Unlock your full potential</h1>
          <p className="text-[15px] text-gray-500 leading-relaxed">Pro gives you unlimited coaching, full scripts, and complete deal history.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-1">Free</p>
            <p className="font-serif text-[28px] mb-4">₹0</p>
            {['3 sessions/month', 'Basic diagnosis', 'Limited coaching'].map(f => (
              <div key={f} className="flex gap-2 items-start mb-2"><span className="text-gray-400 text-[8px] mt-1.5">■</span><span className="text-sm text-gray-500">{f}</span></div>
            ))}
            <p className="text-xs text-gray-400 italic mt-4">Current plan</p>
          </div>
          <div className="card !border-2 !border-gold relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gold text-white text-[10px] font-bold px-3 py-0.5 rounded-full tracking-wide">RECOMMENDED</div>
            <p className="text-xs font-medium text-gold tracking-wide uppercase mb-1">Pro</p>
            <p className="font-serif text-[28px] mb-0.5">₹2,999</p>
            <p className="text-xs text-gray-500 mb-4">per month</p>
            {['Unlimited coaching sessions', 'Full "what to say" scripts', 'Complete deal history', 'Deep follow-up coaching', 'Priority support'].map(f => (
              <div key={f} className="flex gap-2 items-start mb-2">
                <svg className="w-3.5 h-3.5 text-green flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                <span className="text-sm">{f}</span>
              </div>
            ))}
            <button onClick={handleUpgrade} className="btn-gold w-full mt-4">Upgrade now</button>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-5">Cancel anytime. No long-term commitment.</p>
      </div>
    </div>
  );
}
