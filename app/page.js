'use client';

import { useState } from 'react';

export default function RAGPlayground() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('Different service types of Shinkansen?');
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
    <div className="container">
      <header className="header">
        <h1>AI RAG Playground</h1>
        <p>Test and optimize your Retrieval-Augmented Generation engine.</p>
      </header>

      <div className="grid">
        {/* Left Panel: Inputs */}
        <aside className="panel settings-panel">
          <h2>Configuration</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Gemini API Key (leave empty to use .env)</label>
              <input 
                type="password" 
                placeholder="AIzaSy..." 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
              />
            </div>

            <div className="form-group row">
              <div className="half-width">
                <label>Chunk Size</label>
                <input 
                  type="number" 
                  value={chunkSize} 
                  onChange={(e) => setChunkSize(e.target.value)} 
                />
              </div>
              <div className="half-width">
                <label>Chunk Overlap</label>
                <input 
                  type="number" 
                  value={chunkOverlap} 
                  onChange={(e) => setChunkOverlap(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Top K Results</label>
              <input 
                type="number" 
                value={topK} 
                onChange={(e) => setTopK(e.target.value)} 
                min="1"
                max="20"
              />
            </div>

            <div className="form-group upload-group">
              <label>Document (PDF)</label>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files[0])} 
              />
            </div>

            <div className="form-group">
              <label>Query</label>
              <textarea 
                rows="3" 
                value={question} 
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about the document..."
              />
            </div>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? <span className="spinner"></span> : 'Generate Response'}
            </button>
            {error && <div className="error-msg">{error}</div>}
          </form>
        </aside>

        {/* Right Panel: Output */}
        <main className="panel results-panel">
          <h2>Results</h2>
          
          {!result && !loading && (
            <div className="empty-state">
              <p>Upload a document and ask a query to see the RAG output.</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="bouncing-loader">
                <div></div>
                <div></div>
                <div></div>
              </div>
              <p>Extracting, embedding, and generating...</p>
            </div>
          )}

          {result && (
            <div className="results-content fade-in">
              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-label">Confidence</span>
                  <span className="stat-value highlight">{result.confidenceScore}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Retrieval Latency</span>
                  <span className="stat-value">{result.latency.retrievalMs}ms</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Generation Latency</span>
                  <span className="stat-value">{result.latency.generationMs}ms</span>
                </div>
              </div>

              <div className="answer-box">
                <h3>Final Answer</h3>
                <p>{result.answer}</p>
              </div>

              <div className="chunks-section">
                <h3>Top {result.topChunks.length} Retrieved Chunks</h3>
                <div className="chunks-list">
                  {result.topChunks.map((chunk, idx) => (
                    <div key={idx} className="chunk-card">
                      <div className="chunk-header">
                        <span>Chunk #{idx + 1}</span>
                        <span className="chunk-score">Score: {chunk.score.toFixed(4)}</span>
                      </div>
                      <p className="chunk-text">{chunk.text}</p>
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
