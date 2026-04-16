'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      setUsers(data || []);
    }
    load();
  }, []);

  const proCount = users.filter(u => u.plan === 'pro').length;

  return (
    <div>
      <h1 className="font-serif text-[26px] mb-1">Users</h1>
      <p className="text-sm text-gray-500 mb-7">Manage your coaching platform users.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total users', value: users.length },
          { label: 'Pro subscribers', value: proCount },
          { label: 'Free users', value: users.length - proCount },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
            <p className="font-serif text-[28px]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['Name', 'Plan', 'Sessions', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${u.plan === 'pro' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.plan === 'pro' ? 'Pro' : 'Free'}
                  </span>
                </td>
                <td className="px-4 py-3">{u.sessions_used}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
