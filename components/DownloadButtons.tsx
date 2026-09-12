'use client'
import { useState } from 'react'

interface DownloadButtonsProps {
  title: string
  content: string
  filename?: string
  fullSession?: string
  userName?: string
  orgName?: string
  customerName?: string
}

export default function DownloadButtons({ title, content, filename, fullSession, userName, orgName, customerName }: DownloadButtonsProps) {
  const [generating, setGenerating] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const date = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' }).replace(/ /g,'-')
  const cleanTitle = title.replace('B2BsalesBUDDY ', '').replace('Coaching Session', 'Session').trim()
  const coachingType = cleanTitle.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ +/g, '-').substring(0, 30)
  const uName = (userName || 'User').replace(/[^a-zA-Z0-9]/g, '-')
  const fname = `B2BsalesBUDDY_${coachingType}_${uName}_${date}`

  async function downloadPDF() {
    setGenerating('pdf')
    try {
      const html = buildHTML(title, downloadContent, userName, orgName, customerName)
      const blob = new Blob([html], { type: 'text/html' })
      
      // Create a hidden iframe to print as PDF
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      document.body.appendChild(iframe)
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(html)
        iframeDoc.close()
        
        // Wait for content to render
        setTimeout(() => {
          iframe.contentWindow?.print()
          setTimeout(() => document.body.removeChild(iframe), 1000)
        }, 500)
      }
    } catch (e) {
      alert('To save as PDF: Use the Print dialog (Cmd+P) → Select "Save as PDF"')
    }
    setGenerating('')
  }

  async function downloadWord() {
    setGenerating('word')
    try {
      const html = buildWordHTML(title, downloadContent, userName, orgName, customerName)
      const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fname}.doc`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Download failed. Please try Copy instead.')
    }
    setGenerating('')
  }

  function copyText() {
    try { navigator.clipboard.writeText(content) } 
    catch(e) { 
      const ta = document.createElement('textarea')
      ta.value = content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    alert('Copied to clipboard!')
  }

  const [downloadContent, setDownloadContent] = useState(content)

  function handleDownload(type: 'pdf'|'word', scope: 'last'|'full') {
    const dc = scope === 'full' && fullSession ? fullSession : content
    setDownloadContent(dc)
    setShowOptions(false)
    setTimeout(() => { type === 'pdf' ? downloadPDF() : downloadWord() }, 100)
  }

  return (
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12,paddingTop:12,borderTop:'1px solid #eee',position:'relative'}}>
      <button onClick={copyText} style={{padding:'8px 16px',background:'#f3f4f6',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',color:'#1B2A4A'}}>📋 Copy</button>
      <button onClick={() => setShowOptions(!showOptions)} style={{padding:'8px 16px',background:'#dc2626',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>📥 Download ▾</button>
      {showOptions && (
        <div style={{position:'absolute',bottom:'100%',left:80,background:'#fff',borderRadius:8,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',padding:8,zIndex:10,minWidth:220}}>
          <p style={{fontSize:10,color:'#888',padding:'4px 8px',fontWeight:600}}>What to download?</p>
          <button onClick={() => handleDownload('pdf','last')} style={{display:'block',width:'100%',padding:'8px 12px',background:'none',border:'none',textAlign:'left',fontSize:12,cursor:'pointer',borderRadius:4,color:'#1B2A4A'}} onMouseOver={e=>(e.target as HTMLElement).style.background='#f3f4f6'} onMouseOut={e=>(e.target as HTMLElement).style.background='none'}>📥 Last Response → PDF</button>
          {fullSession && <button onClick={() => handleDownload('pdf','full')} style={{display:'block',width:'100%',padding:'8px 12px',background:'none',border:'none',textAlign:'left',fontSize:12,cursor:'pointer',borderRadius:4,color:'#1B2A4A'}} onMouseOver={e=>(e.target as HTMLElement).style.background='#f3f4f6'} onMouseOut={e=>(e.target as HTMLElement).style.background='none'}>📥 Full Session → PDF</button>}
          <button onClick={() => handleDownload('word','last')} style={{display:'block',width:'100%',padding:'8px 12px',background:'none',border:'none',textAlign:'left',fontSize:12,cursor:'pointer',borderRadius:4,color:'#1B2A4A'}} onMouseOver={e=>(e.target as HTMLElement).style.background='#f3f4f6'} onMouseOut={e=>(e.target as HTMLElement).style.background='none'}>📄 Last Response → Word</button>
          {fullSession && <button onClick={() => handleDownload('word','full')} style={{display:'block',width:'100%',padding:'8px 12px',background:'none',border:'none',textAlign:'left',fontSize:12,cursor:'pointer',borderRadius:4,color:'#1B2A4A'}} onMouseOver={e=>(e.target as HTMLElement).style.background='#f3f4f6'} onMouseOut={e=>(e.target as HTMLElement).style.background='none'}>📄 Full Session → Word</button>}
        </div>
      )}
    </div>
  )
}

function buildHTML(title: string, content: string, userName?: string, orgName?: string, customerName?: string): string {
  const date = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })
  const userLine = [userName, orgName].filter(Boolean).join(' | ')
  const custLine = customerName ? 'Customer: ' + customerName : ''
  return `<!DOCTYPE html><html><head><title>${title}</title>
<style>
  @media print { body { margin: 20mm; } .no-print { display: none; } }
  body { font-family: Arial, sans-serif; color: #1B2A4A; line-height: 1.8; font-size: 13px; max-width: 700px; margin: 0 auto; padding: 40px; }
  h1 { color: #0D1B2A; border-bottom: 3px solid #C8943E; padding-bottom: 8px; font-size: 22px; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #eee; }
  .brand { font-size: 18px; font-weight: bold; color: #C8943E; }
  .date { font-size: 12px; color: #888; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #0D1B2A; font-size: 11px; color: #888; text-align: center; }
  .confidential { font-size: 10px; color: #dc2626; margin-top: 8px; }
  pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
</style></head><body>
<div class="header"><span class="brand">B2BsalesBUDDY</span><span class="date">${date}</span></div>
${userLine ? '<p style="font-size:12px;color:#444;margin-bottom:4px">' + userLine + '</p>' : ''}
${custLine ? '<p style="font-size:12px;color:#666;margin-bottom:8px">' + custLine + '</p>' : ''}
${userLine ? '<p style="font-size:11pt;color:#444">' + userLine + '</p>' : ''}
${custLine ? '<p style="font-size:11pt;color:#666">' + custLine + '</p>' : ''}
<h1>${title}</h1>
<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<div class="footer">
  <p>Powered by Book B2B Sales Transformation 2.0, authored by Bhadresh Dani</p>
  <p class="confidential">CONFIDENTIAL: This report contains proprietary methodology. Do not distribute.</p>
</div>
</body></html>`
}

function buildWordHTML(title: string, content: string, userName?: string, orgName?: string, customerName?: string): string {
  const date = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })
  const userLine = [userName, orgName].filter(Boolean).join(' | ')
  const custLine = customerName ? 'Customer: ' + customerName : ''
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; color: #1B2A4A; line-height: 1.8; font-size: 12pt; margin: 2cm; }
  h1 { color: #0D1B2A; border-bottom: 3px solid #C8943E; padding-bottom: 8px; font-size: 18pt; }
  .brand { font-size: 16pt; font-weight: bold; color: #C8943E; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #0D1B2A; font-size: 9pt; color: #888; text-align: center; }
  pre { white-space: pre-wrap; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
</style></head><body>
<p class="brand">B2BsalesBUDDY</p><p style="font-size:10pt;color:#888">${date}</p>
${userLine ? '<p style="font-size:11pt;color:#444">' + userLine + '</p>' : ''}
${custLine ? '<p style="font-size:11pt;color:#666">' + custLine + '</p>' : ''}
<h1>${title}</h1>
<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<div class="footer">
  <p>Powered by Book B2B Sales Transformation 2.0, authored by Bhadresh Dani</p>
  <p style="color:#dc2626;font-size:8pt">CONFIDENTIAL: This report contains proprietary methodology. Do not distribute.</p>
</div></body></html>`
}
