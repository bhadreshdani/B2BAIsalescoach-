'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setErrors({ email: 'Invalid email or password' });
      setLoading(false);
      return;
    }

    router.push('/deals');
    router.refresh();
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 text-sm border rounded-lg outline-none font-sans transition ${
      errors[field] ? 'border-red-400' : 'border-gray-300 focus:border-gold'
    }`;

  return (
    <div className="min-h-screen flex font-sans">
      <div className="flex-1 bg-charcoal flex flex-col justify-center px-10 py-12">
        <span className="font-serif text-xl text-cream tracking-wide">BHADRESH DANI</span>
        <div className="w-8 h-[1.5px] bg-gold my-6" />
        <p className="font-serif text-[26px] text-cream leading-snug mb-4">
          Welcome back.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed max-w-[300px]">
          Continue your coaching journey. Your deals and session history are waiting for you.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-10 py-8 bg-cream">
        <div className="w-full max-w-[400px]">
          <h2 className="font-serif text-2xl mb-1">Log in</h2>
          <p className="text-sm text-gray-500 mb-7">Continue your coaching journey.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email address</label>
              <input type="email" placeholder="you@company.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass('email')} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input type="password" placeholder="Your password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass('password')} />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-5">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-gold font-medium">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
