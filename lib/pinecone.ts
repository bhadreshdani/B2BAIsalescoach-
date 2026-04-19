import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const INDEX_NAME = process.env.PINECONE_INDEX || 'sales-coach-knowledge';

// Simple but effective text-to-vector using hash-based approach
// This works on ALL Pinecone plans without needing inference API
function textToVector(text: string, dimensions: number = 1024): number[] {
  const vector = new Array(dimensions).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  
  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const hash1 = (word.charCodeAt(i) * 31 + (word.charCodeAt(i + 1) || 0) * 17) % dimensions;
      const hash2 = (word.charCodeAt(i) * 37 + i * 13 + word.length * 7) % dimensions;
      vector[hash1] += 1.0 / words.length;
      vector[hash2] += 0.5 / words.length;
    }
  }
  
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }
  
  return vector;
}

// Search the knowledge base for relevant chunks
export async function searchKnowledge(params: {
  query: string;
  challenge?: string;
  situation?: string;
  topK?: number;
}): Promise<{ content: string; source: string; score: number }[]> {
  try {
    const index = pinecone.index(INDEX_NAME);
    const queryVector = textToVector(params.query);

    const filter: Record<string, any> = {};
    if (params.challenge) filter.challenge_tag = params.challenge;
    if (params.situation) filter.situation_tag = params.situation;

    const results = await index.query({
      vector: queryVector,
      topK: params.topK || 5,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    return (results.matches || []).map((match) => ({
      content: (match.metadata?.content as string) || '',
      source: (match.metadata?.source as string) || 'Unknown',
      score: match.score || 0,
    }));
  } catch (error) {
    console.error('Pinecone search error:', error);
    return [];
  }
}

// Upload chunks to Pinecone
export async function upsertChunks(chunks: {
  id: string;
  content: string;
  metadata: {
    source: string;
    page?: number;
    challenge_tag?: string;
    situation_tag?: string;
    chunk_type?: string;
    doc_id: string;
  };
}[]): Promise<void> {
  const index = pinecone.index(INDEX_NAME);

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const vectors = batch.map((chunk) => ({
      id: chunk.id,
      values: textToVector(chunk.content),
      metadata: {
        ...chunk.metadata,
        content: chunk.content,
      },
    }));

    await index.upsert(vectors);
  }
}

// Delete all chunks for a document
export async function deleteDocChunks(docId: string): Promise<void> {
  try {
    const index = pinecone.index(INDEX_NAME);
    // List and delete vectors with matching doc_id
    // Note: deleteMany with metadata filter requires paid plan
    // Fallback: we track IDs and delete by ID
    const results = await index.query({
      vector: new Array(1024).fill(0),
      topK: 10000,
      filter: { doc_id: docId },
      includeMetadata: false,
    });
    
    const ids = (results.matches || []).map(m => m.id);
    if (ids.length > 0) {
      // Delete in batches of 1000
      for (let i = 0; i < ids.length; i += 1000) {
        await index.deleteMany(ids.slice(i, i + 1000));
      }
    }
  } catch (error) {
    console.error('Delete chunks error:', error);
  }
}