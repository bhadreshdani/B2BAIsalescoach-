'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email'); return }
    setLoading(true); setError('');

    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (err) { setError(err.message); setLoading(false); return }
    setSent(true); setLoading(false);
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f0e8',fontFamily:'Arial,sans-serif'}}>
      <div style={{width:'100%',maxWidth:400,padding:40}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:36,marginBottom:8}}>🎯</div>
          <h1 style={{fontSize:22,fontWeight:'bold',color:'#C8943E'}}>B2BsalesBUDDY</h1>
          <p style={{fontSize:12,color:'#888'}}>Your Personal AI Sales Coach</p>
        </div>
        <h1 style={{fontSize:24,fontWeight:'bold',marginBottom:8}}>Forgot Password?</h1>

        {sent ? (
          <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:20,textAlign:'center'}}>
            <p style={{fontSize:32,marginBottom:12}}>📧</p>
            <p style={{fontSize:15,fontWeight:600,color:'#16a34a',marginBottom:8}}>Reset link sent!</p>
            <p style={{fontSize:13,color:'#666'}}>Check your email at <strong>{email}</strong> and click the reset link.</p>
            <Link href="/auth/login" style={{display:'inline-block',marginTop:16,fontSize:13,color:'#C8943E',fontWeight:600,textDecoration:'none'}}>← Back to Login</Link>
          </div>
        ) : (
          <>
            <p style={{fontSize:14,color:'#888',marginBottom:24}}>Enter your email and we'll send you a password reset link.</p>
            <form onSubmit={handleSubmit}>
              <div style={{marginBottom:16}}>
                <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Email Address</label>
                <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)}
                  style={{width:'100%',padding:'12px 16px',border:'1px solid #ddd',borderRadius:8,fontSize:14,outline:'none'}} />
                {error && <p style={{fontSize:12,color:'#ef4444',marginTop:4}}>{error}</p>}
              </div>
              <button type="submit" disabled={loading}
                style={{width:'100%',padding:'14px',background:loading?'#d4a855':'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:loading?'default':'pointer'}}>
                {loading ? 'Sending...' : 'Send Reset Link →'}
              </button>
            </form>
            <p style={{fontSize:13,color:'#888',textAlign:'center',marginTop:20}}>
              Remember your password? <Link href="/auth/login" style={{color:'#C8943E',fontWeight:600,textDecoration:'none'}}>Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
