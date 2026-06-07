'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const tabs = [
    { href: '/admin/prompts', label: 'System Prompts' },
    { href: '/admin/knowledge', label: 'Knowledge Base' },
  ]
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb'}}>
      <header style={{background:'#fff',borderBottom:'1px solid #e5e7eb'}}>
        <div style={{maxWidth:960,margin:'0 auto',padding:'16px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><h1 style={{fontSize:18,fontWeight:'bold'}}>B2BsalesBUDDY — Admin</h1></div>
          <Link href="/" style={{fontSize:13,color:'#2563eb'}}>← Back to App</Link>
        </div>
        <div style={{maxWidth:960,margin:'0 auto',padding:'0 24px',display:'flex',gap:4}}>
          {tabs.map(t=>(
            <Link key={t.href} href={t.href} style={{padding:'8px 16px',fontSize:13,fontWeight:600,borderRadius:'8px 8px 0 0',background:pathname===t.href?'#f9fafb':'transparent',color:pathname===t.href?'#2563eb':'#888',textDecoration:'none',border:pathname===t.href?'1px solid #e5e7eb':'none',borderBottom:pathname===t.href?'1px solid #f9fafb':'none'}}>
              {t.label}
            </Link>
          ))}
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
