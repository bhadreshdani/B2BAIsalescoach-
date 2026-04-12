'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', yearsTotal: '', yearsSales: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Please enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (!form.yearsTotal) e.yearsTotal = 'Please select';
    if (!form.yearsSales) e.yearsSales = 'Please select';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          years_total: form.yearsTotal,
          years_sales: form.yearsSales,
        },
      },
    });

    if (error) {
      setErrors({ email: error.message });
      setLoading(false);
      return;
    }

    // Update user profile with experience data
    if (data.user) {
      await supabase.from('users').update({
        name: form.name,
        years_total: form.yearsTotal,
        years_sales: form.yearsSales,
      }).eq('id', data.user.id);
    }

    setLoading(false);
    router.push('/deals?onboard=true');
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 text-sm border rounded-lg outline-none font-sans transition ${
      errors[field] ? 'border-red-400' : 'border-gray-300 focus:border-gold'
    }`;

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left brand panel */}
      <div className="flex-1 bg-charcoal flex flex-col justify-center px-10 py-12 min-h-screen">
        <span className="font-serif text-xl text-cream tracking-wide">BHADRESH DANI</span>
        <div className="w-8 h-[1.5px] bg-gold my-6" />
        <p className="font-serif text-[26px] text-cream leading-snug mb-4">
          A senior sales coach<br />guiding you through<br />every deal.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed max-w-[300px]">
          Diagnose real problems. Get contextual coaching. Close more deals.
        </p>
        <div className="mt-12 space-y-3">
          {['Ask before answering', 'Diagnose before advising', 'Context over generic responses'].map(t => (
            <div key={t} className="flex gap-2.5 items-center">
              <svg className="w-4 h-4 text-gold flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="text-sm text-cream">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-10 py-8 bg-cream overflow-y-auto">
        <div className="w-full max-w-[400px]">
          <h2 className="font-serif text-2xl mb-1">Create your account</h2>
          <p className="text-sm text-gray-500 mb-7">Start with 3 free coaching sessions.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full name</label>
              <input type="text" placeholder="Your full name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass('name')} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Email address</label>
              <input type="email" placeholder="you@company.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass('email')} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} placeholder="Minimum 8 characters" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} className={`${inputClass('password')} pr-10`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {showPw ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><line x1="1" y1="1" x2="23" y2="23" /></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                  </svg>
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Total experience</label>
                <select value={form.yearsTotal} onChange={e => setForm({ ...form, yearsTotal: e.target.value })}
                  className={`${inputClass('yearsTotal')} ${!form.yearsTotal ? 'text-gray-400' : ''}`}>
                  <option value="">Select</option>
                  {['0-2', '3-5', '6-10', '11-15', '16-20', '20+'].map(y => (
                    <option key={y} value={y}>{y} years</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Sales experience</label>
                <select value={form.yearsSales} onChange={e => setForm({ ...form, yearsSales: e.target.value })}
                  className={`${inputClass('yearsSales')} ${!form.yearsSales ? 'text-gray-400' : ''}`}>
                  <option value="">Select</option>
                  {['0-2', '3-5', '6-10', '11-15', '16-20', '20+'].map(y => (
                    <option key={y} value={y}>{y} years</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full !mt-5">
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-gold font-medium">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
