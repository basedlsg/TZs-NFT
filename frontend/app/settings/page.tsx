'use client';

import KeyBackup from '@/components/KeyBackup';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <header>
        <Link href="/" className="back-link">
          ← Back to Home
        </Link>
        <h1>Settings</h1>
        <p>Manage your encryption keys and privacy settings.</p>
      </header>

      <main>
        <KeyBackup />
      </main>

      <footer>
        <div className="footer-links">
          <Link href="/diary">View Diary</Link>
          <Link href="/diary/history">Diary History</Link>
        </div>
      </footer>

      <style jsx>{`
        .settings-page {
          min-height: 100vh;
          padding: 2rem;
          max-width: 900px;
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
        }

        footer {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
        }

        .footer-links {
          display: flex;
          gap: 2rem;
          justify-content: center;
        }

        .footer-links a {
          color: #3182ce;
          text-decoration: none;
        }

        .footer-links a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
