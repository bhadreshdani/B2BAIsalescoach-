'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('onboarding_completed').eq('id', user.id).single()
        if (profile?.onboarding_completed) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
      } else {
        router.push('/auth/login')
      }
      setChecking(false)
    }
    checkAuth()
  }, [router])

  if (checking) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <h1 style={{fontSize:24,fontWeight:'bold',marginBottom:8}}>B2BsalesBUDDY</h1>
        <p style={{color:'#888'}}>Loading...</p>
      </div>
    </div>
  )
  return null
}
