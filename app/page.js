'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function RAGPlayground() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [chunkSize, setChunkSize] = useState(700);
  const [chunkOverlap, setChunkOverlap] = useState(100);
  const [topK, setTopK] = useState(3);
  const [apiKey, setApiKey] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('question', question);
    formData.append('chunkSize', chunkSize);
    formData.append('chunkOverlap', chunkOverlap);
    formData.append('topK', topK);
    formData.append('apiKey', apiKey);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process request');
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>AI RAG Playground</h1>
        <p>Test and optimize your Retrieval-Augmented Generation engine.</p>
      </header>

      <div className={styles.grid}>
        {/* Left Panel: Inputs */}
        <aside className={`${styles.panel} ${styles.settingsPanel}`}>
          <h2>Configuration</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Gemini API Key</label>
              <input 
                type="password" 
                placeholder="Paste your API Key here" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
              />
            </div>

            <div className={`${styles.formGroup} ${styles.row}`}>
              <div className={styles.halfWidth}>
                <label>Chunk Size</label>
                <input 
                  type="number" 
                  value={chunkSize} 
                  onChange={(e) => setChunkSize(e.target.value)} 
                />
              </div>
              <div className={styles.halfWidth}>
                <label>Chunk Overlap</label>
                <input 
                  type="number" 
                  value={chunkOverlap} 
                  onChange={(e) => setChunkOverlap(e.target.value)} 
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Top K Results</label>
              <input 
                type="number" 
                value={topK} 
                onChange={(e) => setTopK(e.target.value)} 
                min="1"
                max="20"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.uploadGroup}`}>
              <label>Document (PDF)</label>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files[0])} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Query</label>
              <textarea 
                rows="3" 
                value={question} 
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about the document..."
              />
            </div>

            <button type="submit" disabled={loading} className={styles.btnSubmit}>
              {loading ? <span className={styles.spinner} /> : 'Generate Response'}
            </button>
            {error && <div className={styles.errorMsg}>{error}</div>}
          </form>
        </aside>

        {/* Right Panel: Output */}
        <main className={`${styles.panel} ${styles.resultsPanel}`}>
          <h2>Results</h2>
          
          {!result && !loading && (
            <div className={styles.emptyState}>
              <p>Upload a document and ask a query to see the RAG output.</p>
            </div>
          )}

          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.bouncingLoader}>
                <div />
                <div />
                <div />
              </div>
              <p>Extracting, embedding, and generating...</p>
            </div>
          )}

          {result && (
            <div className={`${styles.resultsContent} ${styles.fadeIn}`}>
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Confidence</span>
                  <span className={`${styles.statValue} ${styles.highlight}`}>{result.confidenceScore}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Retrieval Latency</span>
                  <span className={styles.statValue}>{result.latency.retrievalMs}ms</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Generation Latency</span>
                  <span className={styles.statValue}>{result.latency.generationMs}ms</span>
                </div>
                {result.usageMetadata && (
                  <>
                    <div className={styles.statCard}>
                      <span className={styles.statLabel}>Embedding Tokens</span>
                      <span className={styles.statValue}>{result.usageMetadata.embeddingTokens}</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statLabel}>Generation Tokens</span>
                      <span className={styles.statValue}>{result.usageMetadata.generationTokens}</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statLabel}>Total Tokens</span>
                      <span className={`${styles.statValue} ${styles.highlight}`}>{result.usageMetadata.totalTokens}</span>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.answerBox}>
                <h3>Final Answer</h3>
                <p>{result.answer}</p>
              </div>

              <div className={styles.chunksSection}>
                <h3>Top {result.topChunks.length} Retrieved Chunks</h3>
                <div className={styles.chunksList}>
                  {result.topChunks.map((chunk, idx) => (
                    <div key={idx} className={styles.chunkCard}>
                      <div className={styles.chunkHeader}>
                        <span>Chunk #{idx + 1}</span>
                        <span className={styles.chunkScore}>Score: {chunk.score.toFixed(4)}</span>
                      </div>
                      <p className={styles.chunkText}>{chunk.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
