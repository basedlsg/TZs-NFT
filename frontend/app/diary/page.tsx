'use client';

import { useState } from 'react';
import DiaryForm from '@/components/DiaryForm';
import Link from 'next/link';

export default function DiaryPage() {
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  return (
    <div className="diary-page">
      <header>
        <Link href="/" className="back-link">
          ← Back to Home
        </Link>
        <h1>New Diary Entry</h1>
        <p>
          Record your progress towards your goals. All entries are encrypted client-side
          and stored securely in your browser.
        </p>
      </header>

      <main>
        <DiaryForm onSuccess={(id) => setLastSavedId(id)} />

        {lastSavedId && (
          <div className="actions">
            <Link href="/diary/history" className="view-link">
              View All Entries
            </Link>
          </div>
        )}
      </main>

      <style jsx>{`
        .diary-page {
          min-height: 100vh;
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        header {
          margin-bottom: 3rem;
        }

        .back-link {
          display: inline-block;
          color: #3182ce;
          text-decoration: none;
          margin-bottom: 1rem;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        header p {
          color: #666;
          max-width: 600px;
        }

        .actions {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }

        .view-link {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background-color: #f7fafc;
          color: #3182ce;
          text-decoration: none;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .view-link:hover {
          background-color: #edf2f7;
          border-color: #cbd5e0;
        }
      `}</style>
    </div>
  );
}
