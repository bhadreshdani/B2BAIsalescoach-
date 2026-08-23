'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setErrors({ email: 'Invalid email or password' });
      setLoading(false);
      return;
    }

    // Check if onboarding is completed
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('onboarding_completed').eq('id', data.user.id).single();
      if (profile && !profile.onboarding_completed) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
    router.refresh();
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',fontFamily:'Arial,sans-serif'}}>
      <div style={{flex:1,background:'#0D1B2A',display:'flex',flexDirection:'column',justifyContent:'center',padding:'48px 40px',color:'#fff'}}>
        <h1 style={{fontSize:22,fontWeight:'bold',color:'#C8943E',marginBottom:24}}>B2BsalesBUDDY</h1>
        <p style={{fontSize:26,lineHeight:1.4,marginBottom:16}}>Welcome back.</p>
        <p style={{fontSize:14,color:'#999',lineHeight:1.6,maxWidth:320}}>Continue your coaching journey. Your deals and session history are waiting for you.</p>
      </div>

      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'40px',background:'#f5f0e8'}}>
        <div style={{width:'100%',maxWidth:400}}>
          <h2 style={{fontSize:24,fontWeight:'bold',marginBottom:4}}>Log in</h2>
          <p style={{fontSize:14,color:'#888',marginBottom:28}}>Continue your coaching journey.</p>

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Email Address</label>
              <input type="email" placeholder="you@company.com" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                style={{width:'100%',padding:'12px 16px',border:errors.email?'1px solid #ef4444':'1px solid #ddd',borderRadius:8,fontSize:14,outline:'none'}} />
              {errors.email && <p style={{fontSize:12,color:'#ef4444',marginTop:4}}>{errors.email}</p>}
            </div>

            <div style={{marginBottom:8}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Password</label>
              <input type="password" placeholder="Your password" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                style={{width:'100%',padding:'12px 16px',border:errors.password?'1px solid #ef4444':'1px solid #ddd',borderRadius:8,fontSize:14,outline:'none'}} />
              {errors.password && <p style={{fontSize:12,color:'#ef4444',marginTop:4}}>{errors.password}</p>}
            </div>

            <div style={{textAlign:'right',marginBottom:20}}>
              <Link href="/auth/forgot-password" style={{fontSize:12,color:'#C8943E',textDecoration:'none'}}>Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading}
              style={{width:'100%',padding:'14px',background:loading?'#d4a855':'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:loading?'default':'pointer'}}>
              {loading ? 'Logging in...' : 'Log In →'}
            </button>
          </form>

          <p style={{fontSize:13,color:'#888',textAlign:'center',marginTop:20}}>
            Don't have an account? <Link href="/auth/signup" style={{color:'#C8943E',fontWeight:600,textDecoration:'none'}}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
