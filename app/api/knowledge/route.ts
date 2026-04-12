import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { processDocument } from '@/lib/document-processor';

// POST - Upload and process a document
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const docType = formData.get('docType') as string || 'Document';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 50MB.' }, { status: 400 });
    }

    // Convert to buffer and process
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processDocument(buffer, file.name, docType);

    return NextResponse.json({
      success: true,
      docId: result.docId,
      chunkCount: result.chunkCount,
      filename: file.name,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}

// GET - List all documents
export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('knowledge_docs')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE - Remove a document and its chunks
export async function DELETE(req: NextRequest) {
  const { docId } = await req.json();
  const supabase = createServerClient();

  // Delete from Pinecone
  const { deleteDocChunks } = await import('@/lib/pinecone');
  await deleteDocChunks(docId);

  // Delete from database
  const { error } = await supabase
    .from('knowledge_docs')
    .delete()
    .eq('id', docId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
