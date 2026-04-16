'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, sessions: 0, feedback: 0, docs: 0, avgRating: '—' });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [users, sessions, feedback, docs] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('sessions').select('id', { count: 'exact', head: true }),
        supabase.from('feedback').select('rating'),
        supabase.from('knowledge_docs').select('id', { count: 'exact', head: true }),
      ]);
      const ratings = feedback.data || [];
      const avg = ratings.length > 0 ? (ratings.reduce((s: number, f: any) => s + f.rating, 0) / ratings.length).toFixed(1) : '—';
      setStats({
        users: users.count || 0,
        sessions: sessions.count || 0,
        feedback: ratings.length,
        docs: docs.count || 0,
        avgRating: avg,
      });
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="font-serif text-[26px] mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-7">Welcome back. Here's how your coaching platform is performing.</p>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total users', value: stats.users },
          { label: 'Total sessions', value: stats.sessions },
          { label: 'Avg rating', value: stats.avgRating },
          { label: 'Knowledge docs', value: stats.docs },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
            <p className="font-serif text-[28px]">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
