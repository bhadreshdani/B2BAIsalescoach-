'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const ADMIN_EMAIL = 'bhadreshdani69@gmail.com'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) { router.push('/auth/login'); return }
      if (user.email !== ADMIN_EMAIL) { router.push('/dashboard'); return }
      
      setAuthorized(true)
      setChecking(false)
    }
    checkAdmin()
  }, [router])

  if (checking) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial,sans-serif'}}>
      <p>Verifying admin access...</p>
    </div>
  )

  if (!authorized) return null

  return (
    <div style={{minHeight:'100vh',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      <header style={{background:'#0D1B2A',color:'#fff',padding:'12px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <Link href="/dashboard" style={{color:'#C8943E',fontSize:14,fontWeight:600,textDecoration:'none'}}>🏠 Home</Link>
          <span style={{color:'#444'}}>|</span>
          <h1 style={{fontSize:16,fontWeight:'bold'}}>⚙️ Admin Panel</h1>
        </div>
        <div style={{display:'flex',gap:8}}>
          <Link href="/admin/prompts" 
            style={{padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none',
              background: pathname === '/admin/prompts' ? '#C8943E' : 'rgba(255,255,255,0.1)',
              color: '#fff'}}>
            System Prompts
          </Link>
          <Link href="/admin/knowledge"
            style={{padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none',
              background: pathname === '/admin/knowledge' ? '#C8943E' : 'rgba(255,255,255,0.1)',
              color: '#fff'}}>
            Knowledge Base
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}
