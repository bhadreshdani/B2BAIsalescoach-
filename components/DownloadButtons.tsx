'use client'
import { useState } from 'react'

interface DownloadButtonsProps {
  title: string
  content: string
  filename?: string
}

export default function DownloadButtons({ title, content, filename }: DownloadButtonsProps) {
  const [generating, setGenerating] = useState('')
  const fname = filename || title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()

  async function downloadPDF() {
    setGenerating('pdf')
    try {
      const html = buildHTML(title, content)
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
      const html = buildWordHTML(title, content)
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

  return (
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12,paddingTop:12,borderTop:'1px solid #eee'}}>
      <button onClick={copyText} style={{padding:'8px 16px',background:'#f3f4f6',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',color:'#1B2A4A'}}>📋 Copy</button>
      <button onClick={downloadPDF} disabled={generating==='pdf'} style={{padding:'8px 16px',background:'#dc2626',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>{generating==='pdf'?'Opening...':'📥 Save as PDF'}</button>
      <button onClick={downloadWord} disabled={generating==='word'} style={{padding:'8px 16px',background:'#2563eb',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>{generating==='word'?'Generating...':'📄 Download Word'}</button>
    </div>
  )
}

function buildHTML(title: string, content: string): string {
  const date = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })
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
<h1>${title}</h1>
<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<div class="footer">
  <p>Powered by B2B Sales Transformation 2.0 by Bhadresh Dani</p>
  <p class="confidential">CONFIDENTIAL: This report contains proprietary methodology. Do not distribute.</p>
</div>
</body></html>`
}

function buildWordHTML(title: string, content: string): string {
  const date = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })
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
<h1>${title}</h1>
<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<div class="footer">
  <p>Powered by B2B Sales Transformation 2.0 by Bhadresh Dani</p>
  <p style="color:#dc2626;font-size:8pt">CONFIDENTIAL: This report contains proprietary methodology. Do not distribute.</p>
</div></body></html>`
}
