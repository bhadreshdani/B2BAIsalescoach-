'use client'
import { useState } from 'react'

interface StarRatingProps {
  userId: string
  sessionId?: string
  onComplete: () => void
}

export default function StarRating({ userId, sessionId, onComplete }: StarRatingProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (rating === 0) return
    setSaving(true)
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, sessionId, rating, comment }),
    }).catch(() => {})
    setSaving(false)
    onComplete()
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',fontFamily:'Arial,sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,maxWidth:400,width:'90%',textAlign:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
        <p style={{fontSize:32,marginBottom:8}}>⭐</p>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Rate this session</h2>
        <p style={{fontSize:13,color:'#888',marginBottom:20}}>Your feedback helps B2BsalesBUDDY serve you better</p>
        
        <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:20}}>
          {[1,2,3,4,5].map(star => (
            <button key={star} onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
              style={{fontSize:36,background:'none',border:'none',cursor:'pointer',transition:'transform 0.15s',transform:((hover||rating)>=star)?'scale(1.2)':'scale(1)'}}>
              {(hover || rating) >= star ? '⭐' : '☆'}
            </button>
          ))}
        </div>

        <div style={{marginBottom:20}}>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="How can I serve you better? (Optional)"
            rows={3}
            style={{width:'100%',padding:'10px 14px',border:'1px solid #ddd',borderRadius:8,fontSize:13,resize:'none',outline:'none'}} />
        </div>

        <button onClick={handleSubmit} disabled={rating===0||saving}
          style={{width:'100%',padding:14,background:rating===0?'#ccc':'#C8943E',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:rating===0?'default':'pointer'}}>
          {saving ? 'Submitting...' : rating === 0 ? 'Select a rating' : 'Submit Rating →'}
        </button>
      </div>
    </div>
  )
}
