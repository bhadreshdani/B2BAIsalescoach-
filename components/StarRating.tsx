'use client'
import { useState } from 'react'

interface StarRatingProps {
  userId: string
  onComplete: () => void
  onSkip?: () => void
}

export default function StarRating({ userId, onComplete, onSkip }: StarRatingProps) {
  const [step, setStep] = useState(1) // 1=stars, 2=NPS, 3=text
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [nps, setNps] = useState(-1)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    setSaving(true)
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, rating, nps, comment }),
    }).catch(() => {})
    setSaving(false)
    onComplete()
  }

  function handleSkip() {
    // Mark as skipped — will ask again next session
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, rating: 0, nps: -1, comment: '', skipped: true }),
    }).catch(() => {})
    if (onSkip) onSkip()
    else onComplete()
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',fontFamily:'Arial,sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,padding:28,maxWidth:420,width:'90%',textAlign:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
        
        {/* Step 1: Star Rating */}
        {step === 1 && <>
          <p style={{fontSize:36,marginBottom:8}}>⭐</p>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Rate your experience</h2>
          <p style={{fontSize:12,color:'#888',marginBottom:16}}>How was your session with B2BsalesBUDDY?</p>
          <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:20}}>
            {[1,2,3,4,5].map(star => (
              <button key={star} onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
                style={{fontSize:36,background:'none',border:'none',cursor:'pointer',transition:'transform 0.15s',transform:((hover||rating)>=star)?'scale(1.2)':'scale(1)'}}>
                {(hover || rating) >= star ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          <button onClick={() => { if (rating > 0) setStep(2) }} disabled={rating === 0}
            style={{width:'100%',padding:12,background:rating===0?'#ccc':'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:rating===0?'default':'pointer',marginBottom:8}}>
            Next →
          </button>
          <button onClick={handleSkip} style={{background:'none',border:'none',color:'#888',fontSize:12,cursor:'pointer'}}>Skip for now</button>
        </>}

        {/* Step 2: NPS Score */}
        {step === 2 && <>
          <h2 style={{fontSize:16,fontWeight:700,marginBottom:4}}>How likely are you to recommend B2BsalesBUDDY?</h2>
          <p style={{fontSize:12,color:'#888',marginBottom:16}}>0 = Not at all likely | 10 = Extremely likely</p>
          <div style={{display:'flex',justifyContent:'center',gap:4,marginBottom:8,flexWrap:'wrap'}}>
            {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={() => setNps(n)}
                style={{width:36,height:36,borderRadius:'50%',border:nps===n?'2px solid #C8943E':'1px solid #ddd',
                  background:nps===n?(n<=6?'#fef2f2':n<=8?'#fffbeb':'#f0fdf4'):'#fff',
                  fontSize:13,fontWeight:nps===n?700:400,cursor:'pointer',
                  color:nps===n?(n<=6?'#dc2626':n<=8?'#C8943E':'#16a34a'):'#666'}}>
                {n}
              </button>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16,padding:'0 8px'}}>
            <span style={{fontSize:10,color:'#dc2626'}}>Not likely</span>
            <span style={{fontSize:10,color:'#16a34a'}}>Very likely</span>
          </div>
          <button onClick={() => { if (nps >= 0) setStep(3) }} disabled={nps < 0}
            style={{width:'100%',padding:12,background:nps<0?'#ccc':'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:nps<0?'default':'pointer',marginBottom:8}}>
            Next →
          </button>
          <button onClick={() => setStep(1)} style={{background:'none',border:'none',color:'#888',fontSize:12,cursor:'pointer'}}>← Back</button>
        </>}

        {/* Step 3: Text Feedback */}
        {step === 3 && <>
          <h2 style={{fontSize:16,fontWeight:700,marginBottom:4}}>How can I serve you better?</h2>
          <p style={{fontSize:12,color:'#888',marginBottom:12}}>Your feedback helps us improve (optional)</p>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Share your thoughts, suggestions, or areas for improvement..."
            rows={4}
            style={{width:'100%',padding:'10px 14px',border:'1px solid #ddd',borderRadius:8,fontSize:13,resize:'none',outline:'none',marginBottom:16,fontFamily:'Arial,sans-serif'}} />
          <div style={{display:'flex',gap:8,marginBottom:12,justifyContent:'center',fontSize:12,color:'#888'}}>
            <span>Rating: {'⭐'.repeat(rating)}</span>
            <span>|</span>
            <span>NPS: {nps}/10</span>
          </div>
          <button onClick={handleSubmit} disabled={saving}
            style={{width:'100%',padding:14,background:'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer'}}>
            {saving ? 'Submitting...' : 'Submit Feedback ✓'}
          </button>
          <button onClick={() => setStep(2)} style={{background:'none',border:'none',color:'#888',fontSize:12,cursor:'pointer',marginTop:8}}>← Back</button>
        </>}
      </div>
    </div>
  )
}
