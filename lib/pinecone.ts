import { createServerClient } from './supabase';

// Search the knowledge base using Supabase text search
export async function searchKnowledge(params: {
  query: string;
  challenge?: string;
  situation?: string;
  topK?: number;
}): Promise<{ content: string; source: string; score: number }[]> {
  try {
    const supabase = createServerClient();
    
    // Build search query - split into keywords
    const keywords = params.query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 8);
    
    // Search using ilike for each keyword
    let query = supabase
      .from('knowledge_chunks')
      .select('content, source, challenge_tag, situation_tag')
      .limit(params.topK || 5);
    
    // Filter by challenge if specified
    if (params.challenge) {
      query = query.eq('challenge_tag', params.challenge);
    }
    
    // Text search - find chunks containing any of the keywords
    if (keywords.length > 0) {
      const orConditions = keywords.map(k => `content.ilike.%${k}%`).join(',');
      query = query.or(orConditions);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Knowledge search error:', error);
      return [];
    }
    
    // Score results by keyword match count
    const scored = (data || []).map(chunk => {
      const lower = chunk.content.toLowerCase();
      const matchCount = keywords.filter(k => lower.includes(k)).length;
      return {
        content: chunk.content,
        source: chunk.source || 'Unknown',
        score: matchCount / keywords.length,
      };
    });
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    return scored.slice(0, params.topK || 5);
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Upload chunks to Supabase (replaces Pinecone upsert)
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
  const supabase = createServerClient();
  
  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    const rows = batch.map(chunk => ({
      id: chunk.id,
      doc_id: chunk.metadata.doc_id,
      content: chunk.content,
      source: chunk.metadata.source,
      page_number: chunk.metadata.page || null,
      challenge_tag: chunk.metadata.challenge_tag || 'general',
      situation_tag: chunk.metadata.situation_tag || 'general',
      chunk_type: chunk.metadata.chunk_type || 'framework',
    }));
    
    const { error } = await supabase.from('knowledge_chunks').insert(rows);
    
    if (error) {
      console.error('Chunk insert error:', error);
      throw error;
    }
  }
}

// Delete all chunks for a document
export async function deleteDocChunks(docId: string): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('knowledge_chunks')
    .delete()
    .eq('doc_id', docId);
    
  if (error) {
    console.error('Delete chunks error:', error);
  }
}