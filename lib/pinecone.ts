import { Pinecone } from '@pinecone-database/pinecone';
import Anthropic from '@anthropic-ai/sdk';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const INDEX_NAME = process.env.PINECONE_INDEX || 'sales-coach-knowledge';

// Generate embeddings using Anthropic's Voyager or a simple approach
// For MVP, we use a lightweight embedding via the Pinecone inference API
async function generateEmbedding(text: string): Promise<number[]> {
  // Use Pinecone's built-in inference for embeddings
  const index = pinecone.index(INDEX_NAME);
  const embedding = await pinecone.inference.embed(
    'multilingual-e5-large',
    [text],
    { inputType: 'query' }
  );
  return embedding[0]?.values || [];
}

// Search the knowledge base for relevant chunks
export async function searchKnowledge(params: {
  query: string;
  challenge?: string;
  situation?: string;
  industry?: string;
  topK?: number;
}): Promise<{ content: string; source: string; score: number }[]> {
  try {
    const index = pinecone.index(INDEX_NAME);
    const queryEmbedding = await generateEmbedding(params.query);

    // Build metadata filter
    const filter: Record<string, any> = {};
    if (params.challenge) filter.challenge_tag = params.challenge;
    if (params.situation) filter.situation_tag = params.situation;

    const results = await index.query({
      vector: queryEmbedding,
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

    const embeddings = await pinecone.inference.embed(
      'multilingual-e5-large',
      batch.map((c) => c.content),
      { inputType: 'passage' }
    );

    const vectors = batch.map((chunk, idx) => ({
      id: chunk.id,
      values: embeddings[idx]?.values || [],
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
  const index = pinecone.index(INDEX_NAME);
  // Delete by metadata filter
  await index.deleteMany({ doc_id: docId });
}

// Initialize Pinecone index if it doesn't exist
export async function initPineconeIndex(): Promise<void> {
  const indexes = await pinecone.listIndexes();
  const exists = indexes.indexes?.some((idx) => idx.name === INDEX_NAME);

  if (!exists) {
    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: 1024, // multilingual-e5-large dimension
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });
  }
}
