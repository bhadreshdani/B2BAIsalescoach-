'use client';

import { useState } from 'react';

export default function AdminTest() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const quickQueries = [
    'Customer asking for 15% discount on injection moulding machine',
    'Deal stuck for 3 weeks, purchase head not responding',
    'Competitor quoting 30% lower on same specification',
  ];

  async function runTest() {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      // Search knowledge base
      const res = await fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Failed to search. Make sure you have documents uploaded.' });
    }
    setLoading(false);
  }

  return (
    <div>
      <h1 className="font-serif text-[26px] mb-1">Test coaching</h1>
      <p className="text-sm text-gray-500 mb-7">Test how the AI responds using your knowledge base. See which content gets retrieved.</p>

      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 mb-6">
        <label className="block text-sm font-medium mb-2">Enter a test scenario</label>
        <div className="flex gap-2.5">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder='e.g. "My customer is an OEM buyer asking for 15% discount"'
            onKeyDown={e => e.key === 'Enter' && runTest()}
            className="flex-1 px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gold font-sans" />
          <button onClick={runTest} disabled={loading || !query.trim()} className="btn-gold whitespace-nowrap !text-sm">
            {loading ? 'Searching...' : 'Test query'}
          </button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {quickQueries.map(q => (
            <button key={q} onClick={() => setQuery(q)}
              className="text-xs px-3 py-1.5 bg-soft-white rounded-full text-gray-500 hover:bg-gray-200 transition font-sans">
              {q.length > 50 ? q.slice(0, 50) + '...' : q}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-10">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Searching knowledge base...</p>
        </div>
      )}

      {result && !result.error && (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <h3 className="text-[15px] font-medium">Retrieved from knowledge base</h3>
            <span className="text-xs text-gray-500">— {result.chunks?.length || 0} relevant chunks found</span>
          </div>

          {(result.chunks || []).map((chunk: any, i: number) => (
            <div key={i} className="bg-navy/[0.03] rounded-lg px-4 py-3.5 mb-2.5 last:mb-0">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{chunk.source}</span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {Math.round(chunk.score * 100)}% match
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed italic">"{chunk.content?.slice(0, 300)}{chunk.content?.length > 300 ? '...' : ''}"</p>
            </div>
          ))}

          {(!result.chunks || result.chunks.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-6">No matching content found. Upload more documents to improve coverage.</p>
          )}
        </div>
      )}

      {result?.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="text-sm text-red-700">{result.error}</p>
        </div>
      )}
    </div>
  );
}
