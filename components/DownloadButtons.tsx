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
  const dateStr = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' }).replace(/ /g,'-')
  const cleanTitle = title.replace('B2BsalesBUDDY ', '').replace('Coaching Session', 'Session').trim()
  const coachingType = cleanTitle.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ +/g, '-').substring(0, 30)
  const uName = (userName || 'User').replace(/[^a-zA-Z0-9]/g, '-')
  const fname = `B2BsalesBUDDY_${coachingType}_${uName}_${dateStr}`

  function buildHTML(docContent: string): string {
    const dateDisplay = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })
    const preparedFor = userName ? 'Prepared for: ' + userName + (orgName ? ' | ' + orgName : '') : ''
    const customerLine = 'Customer: ' + (customerName || '_______________')
    return '<!DOCTYPE html><html><head><title>' + fname + '</title>' +
    '<style>' +
    '@media print { body { margin: 20mm; } }' +
    'body { font-family: Arial, sans-serif; color: #1B2A4A; line-height: 1.8; font-size: 13px; max-width: 700px; margin: 0 auto; padding: 40px; }' +
    'h1 { color: #0D1B2A; border-bottom: 3px solid #C8943E; padding-bottom: 8px; font-size: 22px; }' +
    '.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #eee; }' +
    '.brand { font-size: 18px; font-weight: bold; color: #C8943E; }' +
    '.date { font-size: 12px; color: #888; }' +
    '.footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #0D1B2A; font-size: 11px; color: #888; text-align: center; }' +
    'pre { white-space: pre-wrap; font-family: Arial, sans-serif; }' +
    '</style></head><body>' +
    '<div class="header"><span class="brand">B2BsalesBUDDY</span><span class="date">' + dateDisplay + '</span></div>' +
    (preparedFor ? '<p style="font-size:12px;color:#444;margin-bottom:4px">' + preparedFor + '</p>' : '') +
    '<p style="font-size:12px;color:#666;margin-bottom:12px">' + customerLine + '</p>' +
    '<h1>' + title + '</h1>' +
    '<pre>' + docContent.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>' +
    '<div class="footer">' +
    '<p>Powered by Book B2B Sales Transformation 2.0, authored by Bhadresh Dani</p>' +
    '<p style="font-size:10px;color:#dc2626;margin-top:8px">CONFIDENTIAL: This report contains proprietary methodology. Do not distribute.</p>' +
    '<p style="font-size:9px;color:#aaa;margin-top:4px">AI can make mistakes. Please verify coaching content before execution.</p>' +
    '</div></body></html>'
  }

  function buildWordHTML(docContent: string): string {
    const dateDisplay = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })
    const preparedFor = userName ? 'Prepared for: ' + userName + (orgName ? ' | ' + orgName : '') : ''
    const customerLine = 'Customer: ' + (customerName || '_______________')
    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">' +
    '<head><meta charset="utf-8"><title>' + fname + '</title>' +
    '<style>' +
    'body { font-family: Calibri, Arial, sans-serif; color: #1B2A4A; line-height: 1.8; font-size: 12pt; margin: 2cm; }' +
    'h1 { color: #0D1B2A; border-bottom: 3px solid #C8943E; padding-bottom: 8px; font-size: 18pt; }' +
    'pre { white-space: pre-wrap; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }' +
    '</style></head><body>' +
    '<p style="font-size:16pt;font-weight:bold;color:#C8943E">B2BsalesBUDDY</p>' +
    '<p style="font-size:10pt;color:#888">' + dateDisplay + '</p>' +
    (preparedFor ? '<p style="font-size:11pt;color:#444">' + preparedFor + '</p>' : '') +
    '<p style="font-size:11pt;color:#666">' + customerLine + '</p>' +
    '<h1>' + title + '</h1>' +
    '<pre>' + docContent.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>' +
    '<div style="margin-top:40px;padding-top:16px;border-top:2px solid #0D1B2A;font-size:9pt;color:#888;text-align:center">' +
    '<p>Powered by Book B2B Sales Transformation 2.0, authored by Bhadresh Dani</p>' +
    '<p style="color:#dc2626;font-size:8pt">CONFIDENTIAL: This report contains proprietary methodology. Do not distribute.</p>' +
    '<p style="font-size:8pt;color:#aaa">AI can make mistakes. Please verify coaching content before execution.</p>' +
    '</div></body></html>'
  }

  function downloadPDF(docContent: string) {
    setGenerating('pdf')
    try {
      const html = buildHTML(docContent)
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      document.body.appendChild(iframe)
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(html)
        iframeDoc.close()
        setTimeout(() => {
          iframe.contentWindow?.print()
          setTimeout(() => document.body.removeChild(iframe), 1000)
        }, 500)
      }
    } catch (e) {
      alert('To save as PDF: Use Print dialog (Cmd+P) and select Save as PDF')
    }
    setGenerating('')
  }

  function downloadWord(docContent: string) {
    setGenerating('word')
    try {
      const html = buildWordHTML(docContent)
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

  function handleDownload(type: 'pdf'|'word', scope: 'last'|'full') {
    const dc = scope === 'full' && fullSession ? fullSession : content
    setShowOptions(false)
    type === 'pdf' ? downloadPDF(dc) : downloadWord(dc)
  }

  return (
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12,paddingTop:12,borderTop:'1px solid #eee',position:'relative'}}>
      <button onClick={copyText} style={{padding:'8px 16px',background:'#f3f4f6',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',color:'#1B2A4A'}}>📋 Copy</button>
      <button onClick={() => setShowOptions(!showOptions)} style={{padding:'8px 16px',background:'#dc2626',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>📥 Download ▾</button>
      {showOptions && (
        <div style={{position:'absolute',bottom:'100%',left:80,background:'#fff',borderRadius:8,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',padding:8,zIndex:10,minWidth:220}}>
          <p style={{fontSize:10,color:'#888',padding:'4px 8px',fontWeight:600}}>What to download?</p>
          <button onClick={() => handleDownload('pdf','last')} style={{display:'block',width:'100%',padding:'8px 12px',background:'none',border:'none',textAlign:'left',fontSize:12,cursor:'pointer',borderRadius:4,color:'#1B2A4A'}}>📥 Last Response → PDF</button>
          {fullSession && <button onClick={() => handleDownload('pdf','full')} style={{display:'block',width:'100%',padding:'8px 12px',background:'none',border:'none',textAlign:'left',fontSize:12,cursor:'pointer',borderRadius:4,color:'#1B2A4A'}}>📥 Full Session → PDF</button>}
          <button onClick={() => handleDownload('word','last')} style={{display:'block',width:'100%',padding:'8px 12px',background:'none',border:'none',textAlign:'left',fontSize:12,cursor:'pointer',borderRadius:4,color:'#1B2A4A'}}>📄 Last Response → Word</button>
          {fullSession && <button onClick={() => handleDownload('word','full')} style={{display:'block',width:'100%',padding:'8px 12px',background:'none',border:'none',textAlign:'left',fontSize:12,cursor:'pointer',borderRadius:4,color:'#1B2A4A'}}>📄 Full Session → Word</button>}
        </div>
      )}
    </div>
  )
}
