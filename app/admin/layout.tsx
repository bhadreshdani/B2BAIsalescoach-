import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex font-sans text-navy">
      <aside className="w-[240px] bg-charcoal min-h-screen py-6 flex flex-col flex-shrink-0">
        <div className="px-5 pb-6">
          <span className="font-serif text-base text-cream tracking-wide">BHADRESH DANI</span>
          <div className="w-8 h-[1.5px] bg-gold my-2" />
          <span className="text-[10px] font-medium tracking-[1.5px] text-gold uppercase">Admin dashboard</span>
        </div>
        <nav className="flex-1">
          {[
            { href: '/admin/overview', label: 'Overview' },
            { href: '/admin/knowledge', label: 'Knowledge base' },
            { href: '/admin/feedback', label: 'Feedback' },
            { href: '/admin/users', label: 'Users' },
            { href: '/admin/test', label: 'Test coaching' },
            { href: '/admin/settings', label: 'Settings' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="block px-5 py-2.5 text-sm text-gray-400 hover:text-cream hover:bg-white/5 transition">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 pt-4 border-t border-white/10">
          <Link href="/deals" className="text-xs text-gray-500 hover:text-gold transition">← Back to app</Link>
        </div>
      </aside>
      <main className="flex-1 bg-cream p-7 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
