import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream font-sans text-navy">
      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-5 bg-white border-b border-gray-100">
        <div>
          <span className="font-serif text-lg tracking-wide">BHADRESH DANI</span>
          <span className="block text-[10px] font-medium tracking-[2px] text-gray-500 uppercase mt-0.5">AI Sales Coach</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="px-5 py-2 text-sm font-medium border border-navy rounded-md hover:bg-gray-50 transition">Log in</Link>
          <Link href="/auth/signup" className="btn-gold !py-2 !px-5 !text-sm">Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-20 px-6 max-w-[680px] mx-auto">
        <div className="inline-block bg-gold/10 rounded-full px-4 py-1.5 mb-6">
          <span className="text-xs font-medium text-gold tracking-wide">Based on "B2B Sales Transformation 2.0"</span>
        </div>
        <h1 className="font-serif text-[42px] leading-tight mb-5">
          Stop guessing.<br />Start closing.
        </h1>
        <div className="w-[60px] h-0.5 bg-gold mx-auto mb-6" />
        <p className="text-lg text-gray-500 leading-relaxed mb-9 max-w-[520px] mx-auto">
          An AI-powered coaching platform that diagnoses your real sales problems and gives you exact scripts, strategies, and next steps.
        </p>
        <Link href="/auth/signup" className="btn-gold !py-3.5 !px-9 !text-base">
          Start your free coaching session →
        </Link>
        <p className="text-sm text-gray-500 mt-3">3 free sessions per month. No credit card required.</p>
      </section>

      {/* How it works */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-[800px] mx-auto">
          <p className="text-center text-[11px] font-medium tracking-[2px] text-gold uppercase mb-2">How it works</p>
          <h2 className="text-center font-serif text-[28px] mb-3">Not a chatbot. A thinking coach.</h2>
          <div className="w-[60px] h-0.5 bg-gold mx-auto mb-6" />
          <p className="text-center text-[15px] text-gray-500 max-w-[500px] mx-auto mb-12 leading-relaxed">
            This platform asks before answering, diagnoses before advising, and gives you actions — not generic tips.
          </p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { title: 'Pick your challenge', desc: 'Select pricing pressure, closing deals, or let the AI diagnose your real problem.' },
              { title: 'Answer 3–4 questions', desc: 'Guided diagnosis narrows your broad problem into a specific, coachable situation.' },
              { title: 'Get exact coaching', desc: "What's wrong, why, what to do, what to say, and what to track — from a proven methodology." },
            ].map((item, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-gold font-serif text-xl">{i + 1}</span>
                </div>
                <h3 className="font-serif text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaching output preview */}
      <section className="py-16 px-6 bg-cream">
        <div className="max-w-[700px] mx-auto">
          <p className="text-center text-[11px] font-medium tracking-[2px] text-gold uppercase mb-2">Every coaching response includes</p>
          <h2 className="text-center font-serif text-[28px] mb-3">Coaching, not conversation</h2>
          <div className="w-[60px] h-0.5 bg-gold mx-auto mb-10" />
          <div className="bg-white rounded-xl p-8 border border-gray-200 max-w-[520px] mx-auto">
            {[
              { label: "What's going wrong", text: 'Clear diagnosis of the real issue' },
              { label: "Why it's happening", text: 'Root cause based on proven frameworks' },
              { label: 'What to do', text: 'Step-by-step action plan' },
              { label: 'What to say', text: 'Exact scripts for your next conversation' },
              { label: 'What to track', text: 'Measurable outcomes to monitor' },
            ].map((item, i) => (
              <div key={i} className="border-l-[3px] border-gold pl-4 py-2.5 mb-4 last:mb-0">
                <p className="text-[11px] font-medium text-gold tracking-wide mb-1">{item.label}</p>
                <p className="text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-charcoal py-16 px-6">
        <div className="max-w-[600px] mx-auto text-center">
          <p className="text-[11px] font-medium tracking-[2px] text-gold uppercase mb-2">Methodology</p>
          <h2 className="font-serif text-[28px] text-cream mb-6">Built on decades of real B2B sales experience</h2>
          <div className="w-[60px] h-0.5 bg-gold mx-auto mb-8" />
          <div className="grid grid-cols-3 gap-6 mb-10">
            {[
              { num: '500+', label: 'Sales professionals coached' },
              { num: '20+', label: 'Years of B2B experience' },
              { num: '92%', label: 'Report improved close rates' },
            ].map((s, i) => (
              <div key={i}>
                <p className="font-serif text-3xl text-gold mb-1">{s.num}</p>
                <p className="text-sm text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[700px] mx-auto">
          <p className="text-center text-[11px] font-medium tracking-[2px] text-gold uppercase mb-2">Pricing</p>
          <h2 className="text-center font-serif text-[28px] mb-3">Start free. Upgrade when you see results.</h2>
          <div className="w-[60px] h-0.5 bg-gold mx-auto mb-10" />
          <div className="grid grid-cols-2 gap-5 max-w-[560px] mx-auto">
            <div className="border border-gray-200 rounded-xl p-7">
              <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-1">Free</p>
              <p className="font-serif text-3xl mb-1">₹0</p>
              <p className="text-sm text-gray-500 mb-5">per month</p>
              {['3 coaching sessions/month', 'Challenge diagnosis', 'Basic coaching output'].map(f => (
                <div key={f} className="flex gap-2.5 items-start mb-2.5">
                  <span className="text-gold text-[8px] mt-1.5">■</span>
                  <span className="text-sm text-gray-500">{f}</span>
                </div>
              ))}
              <Link href="/auth/signup" className="btn-outline !w-full mt-4 !text-sm">Get started</Link>
            </div>
            <div className="border-2 border-gold rounded-xl p-7 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-[11px] font-bold px-3.5 py-1 rounded-full tracking-wide">RECOMMENDED</div>
              <p className="text-xs font-medium text-gold tracking-wide uppercase mb-1">Pro</p>
              <p className="font-serif text-3xl mb-1">₹2,999</p>
              <p className="text-sm text-gray-500 mb-5">per month</p>
              {['Unlimited coaching sessions', 'Full "what to say" scripts', 'Saved deal history', 'Deep follow-up coaching'].map(f => (
                <div key={f} className="flex gap-2.5 items-start mb-2.5">
                  <span className="text-gold text-[8px] mt-1.5">■</span>
                  <span className="text-sm text-gray-500">{f}</span>
                </div>
              ))}
              <Link href="/auth/signup" className="btn-gold !w-full mt-4 !text-sm">Start free trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal py-10 text-center">
        <span className="font-serif text-base text-cream">BHADRESH DANI</span>
        <p className="text-xs text-gray-400 mt-2">Execution Partner for Scale-Up Founders</p>
        <div className="w-10 h-px bg-gold mx-auto my-4" />
        <p className="text-[11px] text-gray-500">© 2026 Bhadresh Dani. All rights reserved.</p>
      </footer>
    </div>
  );
}
