'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { INDUSTRIES } from '@/lib/coaching-data';
import Header from '@/components/layout/Header';

export default function NewDealPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dealCode, setDealCode] = useState('');
  const [dealName, setDealName] = useState('');
  const [industry, setIndustry] = useState('');
  const [industryOther, setIndustryOther] = useState('');
  const [loading, setLoading] = useState(false);

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

  const profileIndustries = user?.profile_data?.industries || [];
  const industryOptions = profileIndustries.length > 0
    ? [...profileIndustries.filter((i: string) => i !== 'Other'), 'Other']
    : INDUSTRIES;

  const isValid = dealCode.trim() && dealName.trim() && industry && (industry !== 'Other' || industryOther.trim());

  const handleCreate = async () => {
    if (!isValid || !user) return;
    setLoading(true);

    const finalIndustry = industry === 'Other' ? industryOther : industry;
    const supabase = createClient();

    const { data: deal, error } = await supabase
      .from('deals')
      .insert({
        user_id: user.id,
        deal_code: dealCode.toUpperCase(),
        name: dealName,
        industry: finalIndustry,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Create deal error:', error);
      setLoading(false);
      return;
    }

    router.push(`/coaching/${deal.id}`);
  };

  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div className="min-h-screen bg-cream font-sans text-navy">
      <Header
        userName={user?.name || 'User'}
        plan={user?.plan || 'free'}
        sessionsUsed={user?.sessions_used || 0}
        back="/deals"
        title="New deal"
        subtitle="Create and start coaching"
      />

      <div className="max-w-[500px] mx-auto px-5 py-8">
        {/* Coach bubble */}
        <div className="coach-bubble animate-fade-in">
          <div className="coach-avatar"><span className="text-cream text-[11px] font-bold">BD</span></div>
          <div className="coach-content">
            <p className="text-sm leading-relaxed">
              {firstName ? `${firstName}, l` : 'L'}et's set up a new deal. Use the customer's initials for the ID so you can find it easily.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="ml-[46px] card animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">Deal ID</label>
            <input placeholder="e.g. TPL-005" value={dealCode}
              onChange={e => setDealCode(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gold tracking-widest font-sans" />
            <p className="text-xs text-gray-500 mt-1">Use customer initials + number</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">Deal name</label>
            <input placeholder="e.g. Tata Projects — Injection Moulding Line" value={dealName}
              onChange={e => setDealName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gold font-sans" />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium mb-1.5">Industry for this deal</label>
            <div className="flex flex-wrap gap-1.5">
              {industryOptions.map((ind: string) => (
                <button key={ind} onClick={() => { setIndustry(ind); if (ind !== 'Other') setIndustryOther(''); }}
                  className={`chip ${industry === ind ? 'chip-on' : 'chip-off'}`}>
                  {ind}
                </button>
              ))}
            </div>
            {industry === 'Other' && (
              <input placeholder="Please specify the industry" value={industryOther}
                onChange={e => setIndustryOther(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gold font-sans mt-2.5" />
            )}
          </div>

          <button disabled={!isValid || loading} onClick={handleCreate} className="btn-gold w-full">
            {loading ? 'Creating...' : 'Create deal and start coaching ⚡'}
          </button>
        </div>
      </div>
    </div>
  );
}
