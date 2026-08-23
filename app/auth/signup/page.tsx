'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const pwChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
  };
  const pwValid = pwChecks.length && pwChecks.upper && pwChecks.number && pwChecks.special;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Please enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!pwValid) e.password = 'Password does not meet all requirements';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    });

    if (error) {
      setErrors({ email: error.message });
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').update({ name: form.name }).eq('id', data.user.id);
    }

    setLoading(false);
    router.push('/onboarding');
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',fontFamily:'Arial,sans-serif'}}>
      <div style={{flex:1,background:'#0D1B2A',display:'flex',flexDirection:'column',justifyContent:'center',padding:'48px 40px',color:'#fff'}}>
        <h1 style={{fontSize:22,fontWeight:'bold',color:'#C8943E',marginBottom:24}}>B2BsalesBUDDY</h1>
        <p style={{fontSize:26,lineHeight:1.4,marginBottom:16}}>Your Personal AI<br/>Sales Coach</p>
        <p style={{fontSize:14,color:'#999',lineHeight:1.6,maxWidth:320}}>Powered by the Amazon #1 Best Seller "B2B Sales Transformation 2.0" by Bhadresh Dani</p>
        <div style={{marginTop:40}}>
          {['21+ proprietary frameworks','7 interactive scoring models','18 industry-specific coaching profiles','Personalised to YOUR product, industry & customers'].map(t => (
            <div key={t} style={{display:'flex',gap:10,alignItems:'center',marginBottom:12}}>
              <span style={{color:'#C8943E'}}>✓</span>
              <span style={{fontSize:13,color:'#ccc'}}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'40px',background:'#f5f0e8'}}>
        <div style={{width:'100%',maxWidth:400}}>
          <h2 style={{fontSize:24,fontWeight:'bold',marginBottom:4}}>Create your account</h2>
          <p style={{fontSize:14,color:'#888',marginBottom:28}}>Start your AI coaching journey — takes 30 seconds</p>

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Full Name</label>
              <input type="text" placeholder="Your full name" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                style={{width:'100%',padding:'12px 16px',border:errors.name?'1px solid #ef4444':'1px solid #ddd',borderRadius:8,fontSize:14,outline:'none'}} />
              {errors.name && <p style={{fontSize:12,color:'#ef4444',marginTop:4}}>{errors.name}</p>}
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Email Address</label>
              <input type="email" placeholder="you@company.com" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                style={{width:'100%',padding:'12px 16px',border:errors.email?'1px solid #ef4444':'1px solid #ddd',borderRadius:8,fontSize:14,outline:'none'}} />
              {errors.email && <p style={{fontSize:12,color:'#ef4444',marginTop:4}}>{errors.email}</p>}
            </div>

            <div style={{marginBottom:8}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Password</label>
              <div style={{position:'relative'}}>
                <input type={showPw?'text':'password'} placeholder="Create a strong password" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  style={{width:'100%',padding:'12px 16px',paddingRight:44,border:errors.password?'1px solid #ef4444':'1px solid #ddd',borderRadius:8,fontSize:14,outline:'none'}} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#888'}}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p style={{fontSize:12,color:'#ef4444',marginTop:4}}>{errors.password}</p>}
            </div>

            <div style={{background:'#fff',borderRadius:8,padding:12,marginBottom:20,border:'1px solid #eee'}}>
              <p style={{fontSize:11,color:'#888',marginBottom:8}}>Password requirements:</p>
              {[
                { check: pwChecks.length, label: 'Minimum 8 characters' },
                { check: pwChecks.upper, label: 'At least 1 uppercase letter (A-Z)' },
                { check: pwChecks.number, label: 'At least 1 number (0-9)' },
                { check: pwChecks.special, label: 'At least 1 special character (!@#$...)' },
              ].map(r => (
                <div key={r.label} style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                  <span style={{fontSize:14,color:r.check?'#16a34a':'#ccc'}}>{r.check ? '✓' : '○'}</span>
                  <span style={{fontSize:12,color:r.check?'#16a34a':'#888'}}>{r.label}</span>
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading || !pwValid}
              style={{width:'100%',padding:'14px',background:loading||!pwValid?'#d4a855':'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:loading||!pwValid?'default':'pointer'}}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <p style={{fontSize:13,color:'#888',textAlign:'center',marginTop:20}}>
            Already have an account? <Link href="/auth/login" style={{color:'#C8943E',fontWeight:600,textDecoration:'none'}}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
