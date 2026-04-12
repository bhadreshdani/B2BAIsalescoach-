import { createServerClient } from './supabase';
import { upsertChunks } from './pinecone';
import { randomUUID } from 'crypto';

// Split text into smart chunks that respect section boundaries
function smartChunk(text: string, maxChunkSize: number = 1500): string[] {
  const chunks: string[] = [];
  // Split by double newlines (paragraph boundaries) first
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());

  let currentChunk = '';

  for (const para of paragraphs) {
    // If adding this paragraph exceeds the limit, save current and start new
    if (currentChunk.length + para.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }

    // If a single paragraph is too long, split by sentences
    if (para.length > maxChunkSize) {
      const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        currentChunk += sentence + ' ';
      }
    } else {
      currentChunk += para + '\n\n';
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Auto-tag chunks by challenge and situation
function autoTag(content: string): {
  challenge_tag: string;
  situation_tag: string;
  chunk_type: string;
} {
  const lower = content.toLowerCase();

  // Challenge detection
  let challenge_tag = 'general';
  if (lower.includes('price') || lower.includes('discount') || lower.includes('premium') || lower.includes('cost')) {
    challenge_tag = 'pricing';
  } else if (lower.includes('clos') || lower.includes('objection') || lower.includes('stall') || lower.includes('decision')) {
    challenge_tag = 'closing';
  }

  // Situation detection
  let situation_tag = 'general';
  const situationMap: Record<string, string[]> = {
    discount: ['discount', 'price reduction', 'price cut', 'lower price'],
    competitor: ['competitor', 'competing', 'alternative', 'rival'],
    justify: ['justify', 'premium', 'worth', 'value proposition'],
    budget: ['budget', 'afford', 'investment', 'allocation'],
    ghosting: ['follow up', 'not responding', 'silent', 'no response'],
    objections: ['objection', 'concern', 'pushback', 'resistance'],
    stuck: ['stuck', 'stalled', 'no progress', 'momentum'],
    silent: ['decision maker', 'dm silent', 'went quiet', 'not reachable'],
  };

  for (const [tag, keywords] of Object.entries(situationMap)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      situation_tag = tag;
      break;
    }
  }

  // Content type detection
  let chunk_type = 'framework';
  if (lower.includes('case study') || lower.includes('example') || lower.includes('real-world')) {
    chunk_type = 'case_study';
  } else if (lower.includes('script') || lower.includes('say this') || lower.includes('conversation')) {
    chunk_type = 'script';
  } else if (lower.includes('checklist') || lower.includes('step 1') || lower.includes('step-by-step')) {
    chunk_type = 'checklist';
  }

  return { challenge_tag, situation_tag, chunk_type };
}

// Extract text from uploaded file
async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'pdf') {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === 'docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === 'txt') {
    return buffer.toString('utf-8');
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

// Main processing function
export async function processDocument(
  fileBuffer: Buffer,
  filename: string,
  docType: string
): Promise<{ docId: string; chunkCount: number }> {
  const supabase = createServerClient();
  const docId = randomUUID();

  // 1. Create document record
  await supabase.from('knowledge_docs').insert({
    id: docId,
    filename,
    doc_type: docType,
    status: 'processing',
    chunk_count: 0,
    uploaded_at: new Date().toISOString(),
  });

  try {
    // 2. Extract text
    const text = await extractText(fileBuffer, filename);

    // 3. Smart chunk
    const textChunks = smartChunk(text);

    // 4. Tag and prepare for Pinecone
    const pineconeChunks = textChunks.map((content, i) => {
      const tags = autoTag(content);
      return {
        id: `${docId}-chunk-${i}`,
        content,
        metadata: {
          source: filename,
          page: Math.floor(i / 3) + 1, // Approximate page number
          ...tags,
          doc_id: docId,
        },
      };
    });

    // 5. Upload to Pinecone
    await upsertChunks(pineconeChunks);

    // 6. Update document record
    await supabase
      .from('knowledge_docs')
      .update({ status: 'active', chunk_count: textChunks.length })
      .eq('id', docId);

    return { docId, chunkCount: textChunks.length };
  } catch (error) {
    // Mark as error
    await supabase
      .from('knowledge_docs')
      .update({ status: 'error' })
      .eq('id', docId);
    throw error;
  }
}
