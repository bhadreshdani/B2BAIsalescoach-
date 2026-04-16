'use client';

export default function AdminSettings() {
  return (
    <div>
      <h1 className="font-serif text-[26px] mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-7">Configure your coaching platform.</p>

      <div className="max-w-[560px] space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h3 className="text-[15px] font-medium mb-1">Freemium limits</h3>
          <p className="text-sm text-gray-500 mb-4">Control how many free coaching sessions users get per month.</p>
          <div className="flex items-center gap-4 mb-3">
            <label className="text-sm font-medium min-w-[160px]">Free sessions/month</label>
            <select defaultValue="3" className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-sans">
              {[1, 2, 3, 5].map(n => <option key={n} value={n}>{n} sessions</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium min-w-[160px]">Pro price (₹/month)</label>
            <input type="number" defaultValue="2999" className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-sans w-[120px]" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h3 className="text-[15px] font-medium mb-1">Coaching configuration</h3>
          <p className="text-sm text-gray-500 mb-4">Fine-tune how the AI coaching behaves.</p>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">Active challenges</label>
            <div className="flex gap-2">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Pricing pressure</span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Closing deals</span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200 transition">+ Add challenge</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Coaching tone</label>
            <select defaultValue="warm-firm" className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-sans">
              <option value="warm-firm">Warm but firm (recommended)</option>
              <option value="direct">Direct and blunt</option>
              <option value="supportive">Supportive and encouraging</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h3 className="text-[15px] font-medium mb-1">API connections</h3>
          <p className="text-sm text-gray-500 mb-4">Status of external services.</p>
          {[
            { name: 'Anthropic (Claude AI)', status: 'connected' },
            { name: 'Pinecone (Knowledge search)', status: 'connected' },
            { name: 'Supabase (Database)', status: 'connected' },
            { name: 'Stripe (Payments)', status: 'not configured' },
          ].map((svc, i) => (
            <div key={i} className={`flex justify-between items-center py-2 ${i < 3 ? 'border-b border-gray-50' : ''}`}>
              <span className="text-sm">{svc.name}</span>
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                svc.status === 'connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>{svc.status === 'connected' ? 'Connected' : 'Not configured'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
