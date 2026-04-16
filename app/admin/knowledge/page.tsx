'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';

export default function AdminKnowledge() {
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    try {
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      if (Array.isArray(data)) setDocs(data);
    } catch (err) {
      console.error('Failed to load docs:', err);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext || '')) {
      setError('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum 50MB.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', 'Document');

      setUploadProgress('Processing document — extracting text and creating chunks...');

      const res = await fetch('/api/knowledge', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setSuccess(`"${result.filename}" processed successfully — ${result.chunkCount} chunks created.`);
      setUploadProgress('');
      loadDocs();
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
      setUploadProgress('');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(docId: string) {
    try {
      const res = await fetch('/api/knowledge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId }),
      });

      if (res.ok) {
        setDocs(docs.filter(d => d.id !== docId));
        setDeleteConfirm(null);
        setSuccess('Document deleted successfully.');
      }
    } catch (err) {
      setError('Failed to delete document.');
    }
  }

  const totalChunks = docs.reduce((s, d) => s + (d.chunk_count || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-start mb-7">
        <div>
          <h1 className="font-serif text-[26px] mb-1">Knowledge base</h1>
          <p className="text-sm text-gray-500">Upload your book, playbook, scripts, and case studies. The AI coaches from this content.</p>
        </div>
        <label className={`btn-gold cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleUpload} className="hidden" disabled={uploading} />
          {uploading ? 'Processing...' : '↑ Upload file'}
        </label>
      </div>

      {/* Status messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 mb-5 flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5 mb-5 flex justify-between items-center">
          <p className="text-sm text-emerald-700">{success}</p>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && uploadProgress && (
        <div className="bg-white rounded-xl border-[1.5px] border-gold/30 px-5 py-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{uploadProgress}</p>
              <p className="text-xs text-gray-500 mt-0.5">This may take a minute for large files.</p>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-navy/5 rounded-xl px-5 py-4 mb-5 border-l-[3px] border-navy" style={{ borderRadius: 0 }}>
        <p className="text-sm font-medium mb-1">How document processing works</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          When you upload a file, the system: (1) Extracts all text content, (2) Splits it into smart chunks that preserve context, 
          (3) Tags each chunk by challenge and situation, (4) Creates searchable embeddings in Pinecone. 
          The AI then searches these chunks to build coaching responses from your methodology.
        </p>
      </div>

      {/* Document list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <span className="text-sm font-medium">{docs.length} documents</span>
          <span className="text-xs text-gray-500">— {totalChunks.toLocaleString()} total chunks</span>
        </div>

        {docs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-sm text-gray-500 mb-1">No documents uploaded yet</p>
            <p className="text-xs text-gray-400">Upload your book, playbook, or coaching scripts to get started.</p>
          </div>
        ) : (
          docs.map(doc => (
            <div key={doc.id} className="px-5 py-4 border-b border-gray-50 last:border-0 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center">
                  <svg className="w-[18px] h-[18px] text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">{doc.filename}</p>
                  <p className="text-xs text-gray-500">
                    {doc.doc_type} — {doc.chunk_count} chunks — uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                  doc.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                  doc.status === 'processing' ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {doc.status === 'active' ? 'Active' : doc.status === 'processing' ? 'Processing...' : 'Error'}
                </span>

                {deleteConfirm === doc.id ? (
                  <div className="flex gap-1.5">
                    <button onClick={() => handleDelete(doc.id)} className="text-[11px] px-2.5 py-1 bg-red-50 text-red-700 rounded font-medium hover:bg-red-100 transition">Delete</button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-[11px] px-2.5 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(doc.id)} className="text-gray-300 hover:text-red-400 transition">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">Supported formats: PDF, DOCX, TXT — Maximum file size: 50MB</p>
    </div>
  );
}
