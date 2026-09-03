'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'bhadreshdani69@gmail.com'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      if (user.email !== ADMIN_EMAIL) {
        router.push('/dashboard')
        return
      }
      
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

  return <>{children}</>
}
