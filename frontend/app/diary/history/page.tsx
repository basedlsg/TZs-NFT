'use client';

import { useState, useEffect } from 'react';
import { getAllDiaryEntries, DiaryEntry } from '@/lib/diaryStorage';
import Link from 'next/link';

export default function DiaryHistoryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allEntries = await getAllDiaryEntries();
      // Sort by timestamp, newest first
      allEntries.sort((a, b) => b.timestamp - a.timestamp);
      setEntries(allEntries);
    } catch (err) {
      console.error('Failed to load entries:', err);
      setError('Failed to load diary entries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatGoalId = (goalId: string): string => {
    return goalId
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="history-page">
      <header>
        <div className="header-nav">
          <Link href="/diary" className="back-link">
            ← Back to New Entry
          </Link>
          <Link href="/settings" className="settings-link">
            Settings
          </Link>
        </div>
        <h1>Diary History</h1>
        <p>All your entries are encrypted and stored securely in your browser.</p>
      </header>

      <main>
        {isLoading && (
          <div className="loading">
            <p>Loading entries...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadEntries}>Retry</button>
          </div>
        )}

        {!isLoading && !error && entries.length === 0 && (
          <div className="empty-state">
            <p>No diary entries yet.</p>
            <Link href="/diary" className="new-entry-link">
              Create your first entry
            </Link>
          </div>
        )}

        {!isLoading && !error && entries.length > 0 && (
          <div className="entries-list">
            {entries.map((entry) => (
              <article key={entry.id} className="entry-card">
                <header>
                  <h2>{formatGoalId(entry.goalId)}</h2>
                  <time>{formatDate(entry.timestamp)}</time>
                </header>

                <p className="reflection">{entry.reflection}</p>

                {entry.imageDataUrl && (
                  <div className="image-container">
                    <img src={entry.imageDataUrl} alt="Entry photo" />
                  </div>
                )}

                <footer>
                  <small>Entry ID: {entry.id}</small>
                  <small>Hash: {entry.hash.substring(0, 16)}...</small>
                </footer>
              </article>
            ))}
          </div>
        )}
      </main>

      <style jsx>{`
        .history-page {
          min-height: 100vh;
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }

        header {
          margin-bottom: 3rem;
        }

        .header-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .back-link,
        .settings-link {
          color: #3182ce;
          text-decoration: none;
        }

        .back-link:hover,
        .settings-link:hover {
          text-decoration: underline;
        }

        h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        header p {
          color: #666;
        }

        .loading,
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .new-entry-link {
          display: inline-block;
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background-color: #3182ce;
          color: white;
          text-decoration: none;
          border-radius: 4px;
        }

        .new-entry-link:hover {
          background-color: #2c5aa0;
        }

        .error-message {
          text-align: center;
          padding: 2rem;
          background-color: #fed7d7;
          border-radius: 8px;
          color: #742a2a;
        }

        .error-message button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background-color: #742a2a;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .entries-list {
          display: grid;
          gap: 1.5rem;
        }

        .entry-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .entry-card header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .entry-card h2 {
          font-size: 1.25rem;
          margin: 0;
          color: #2d3748;
        }

        .entry-card time {
          font-size: 0.875rem;
          color: #718096;
        }

        .reflection {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 1rem;
          white-space: pre-wrap;
        }

        .image-container {
          margin: 1rem 0;
          border-radius: 8px;
          overflow: hidden;
        }

        .image-container img {
          width: 100%;
          height: auto;
          display: block;
        }

        .entry-card footer {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e2e8f0;
        }

        .entry-card footer small {
          font-size: 0.75rem;
          color: #a0aec0;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}
