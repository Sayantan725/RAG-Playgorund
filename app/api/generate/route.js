import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function chunkText(text, chunkSize = 700, overlap = 100) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

function cosineSimilarity(A, B) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < A.length; i++) {
    dot += A[i] * B[i];
    normA += A[i] * A[i];
    normB += B[i] * B[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const question = formData.get('question');
    const chunkSize = parseInt(formData.get('chunkSize') || '700');
    const chunkOverlap = parseInt(formData.get('chunkOverlap') || '100');
    const topK = parseInt(formData.get('topK') || '3');
    const apiKey = formData.get('apiKey') || process.env.GEMINI_API_KEY;

    if (!file || !question || !apiKey) {
      return NextResponse.json({ error: 'Missing required fields (file, question, or API key).' }, { status: 400 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    // Track Retrieval Time
    const retrieveStart = performance.now();

    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    const text = data.text.replace(/\s+/g, ' ').trim();
    
    // Chunking
    const chunks = chunkText(text, chunkSize, chunkOverlap);
    
    // Limit chunks to prevent large payload crash (optional, but good practice)
    // Assuming documents aren't massive.
    const batchResponse = await embedModel.batchEmbedContents({
      requests: chunks.map((chunk) => ({
        content: { role: 'user', parts: [{ text: chunk }] },
      })),
    });

    const chunkData = batchResponse.embeddings.map((emb, i) => ({
      text: chunks[i],
      embedding: emb.values,
    }));

    // Generate query embedding
    const questionResult = await embedModel.embedContent(question);
    const questionEmbedding = questionResult.embedding.values;

    // Score and get top K
    const scoredChunks = chunkData.map(item => ({
      text: item.text,
      score: cosineSimilarity(questionEmbedding, item.embedding)
    }));

    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, topK);

    const retrieveEnd = performance.now();
    const retrievalMs = Math.round(retrieveEnd - retrieveStart);

    // Calculate max Confidence Score (highest cosine similarity)
    const confidenceScore = topChunks.length > 0 ? `${Math.round(topChunks[0].score * 100)}%` : '0%';

    // Context for prompt
    const contextText = topChunks.map((c, idx) => `--- Chunk ${idx + 1} ---\n${c.text}`).join('\n\n');

    // Track Generation Time
    const genStart = performance.now();

    const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      INSTRUCTIONS:
      Answer the user's question using ONLY the provided context. 
      If the answer is not in the context, say: "I'm sorry, the provided document does not contain information about that."

      CONTEXT:
      ${contextText}

      QUESTION:
      ${question}
    `;

    const result = await chatModel.generateContent(prompt);
    const answer = result.response.text();

    const genEnd = performance.now();
    const generationMs = Math.round(genEnd - genStart);

    return NextResponse.json({
      answer,
      topChunks,
      latency: {
        retrievalMs,
        generationMs,
        totalMs: retrievalMs + generationMs
      },
      confidenceScore
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
