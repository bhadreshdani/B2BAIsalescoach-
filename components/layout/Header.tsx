'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface HeaderProps {
  userName: string;
  plan: 'free' | 'pro';
  sessionsUsed: number;
  maxSessions?: number;
  back?: string;
  title?: string;
  subtitle?: string;
}

export default function Header({ userName, plan, sessionsUsed, maxSessions = 3, back, title, subtitle }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const firstName = userName?.split(' ')[0] || 'User';
  const remaining = maxSessions - sessionsUsed;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-5 py-3 flex justify-between items-center flex-shrink-0">
      <div className="flex items-center gap-3">
        {back && (
          <Link href={back} className="text-navy hover:text-gold transition">
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
        )}
        <div>
          {title ? (
            <>
              <span className="text-sm font-medium text-navy">{title}</span>
              {subtitle && <span className="block text-[11px] text-gold">{subtitle}</span>}
            </>
          ) : (
            <>
              <span className="font-serif text-base text-navy">BHADRESH DANI</span>
              <span className="block text-[9px] font-medium tracking-[1.5px] text-gold uppercase">AI Sales Coach</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Session counter */}
        {plan === 'pro' ? (
          <span className="text-xs text-green font-medium">Pro — unlimited</span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-[60px] h-1 rounded-sm bg-navy/10 overflow-hidden">
              <div className={`h-full rounded-sm transition-all duration-400 ${remaining <= 1 ? 'bg-red-500' : 'bg-gold'}`}
                style={{ width: `${(sessionsUsed / maxSessions) * 100}%` }} />
            </div>
            <span className={`text-xs font-medium ${remaining <= 1 ? 'text-red-500' : 'text-gray-500'}`}>
              {remaining} of {maxSessions} free left
            </span>
          </div>
        )}

        {/* Avatar + menu */}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}
            className="w-[34px] h-[34px] rounded-full bg-navy flex items-center justify-center border-none cursor-pointer">
            <span className="text-cream text-xs font-semibold">{firstName[0]}</span>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-11 bg-white rounded-xl border border-gray-200 w-[200px] z-50 overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-navy">{userName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{plan === 'pro' ? 'Pro plan' : 'Free plan'}</p>
                </div>
                <Link href="/profile" onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-navy hover:bg-gray-50 transition">
                  Profile settings
                </Link>
                {plan !== 'pro' && (
                  <Link href="/upgrade" onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gold font-medium hover:bg-gray-50 transition">
                    Upgrade to Pro
                  </Link>
                )}
                <button onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition border-t border-gray-100">
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
