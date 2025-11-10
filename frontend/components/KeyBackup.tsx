'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import {
  exportKeyForBackup,
  importKeyFromBackup,
  retrieveKey,
} from '@/lib/keyManager';

type MessageType = 'success' | 'error' | 'warning' | 'info';

interface Message {
  type: MessageType;
  text: string;
}

export default function KeyBackup() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    try {
      const key = await retrieveKey();
      setHasKey(!!key);
    } catch (error) {
      console.error('Failed to check key status:', error);
      setHasKey(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const jwk = await exportKeyForBackup();

      if (!jwk) {
        setMessage({
          type: 'error',
          text: 'No key found. Please create a diary entry first to generate an encryption key.',
        });
        setIsExporting(false);
        return;
      }

      // Create a blob with the JWK
      const blob = new Blob([JSON.stringify(jwk, null, 2)], {
        type: 'application/json',
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `pob-encryption-key-${timestamp}.json`;

      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: `Key exported successfully as ${filename}. Store it in a safe place!`,
      });
    } catch (error) {
      console.error('Failed to export key:', error);
      setMessage({
        type: 'error',
        text: 'Failed to export key. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setMessage({
        type: 'error',
        text: 'Only JSON files are allowed.',
      });
      return;
    }

    setIsImporting(true);
    setMessage(null);

    try {
      const fileContent = await file.text();
      const jwk = JSON.parse(fileContent);

      await importKeyFromBackup(jwk);

      setMessage({
        type: 'success',
        text: 'Key imported successfully! You can now decrypt your existing diary entries.',
      });

      setHasKey(true);

      // Clear file input
      e.target.value = '';
    } catch (error) {
      if (error instanceof SyntaxError) {
        setMessage({
          type: 'error',
          text: 'Invalid key file format. Please select a valid backup file.',
        });
      } else {
        console.error('Failed to import key:', error);
        setMessage({
          type: 'error',
          text: 'Failed to import key. Please check the file and try again.',
        });
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="key-backup">
      <header>
        <h2>Encryption Key Management</h2>
        <p>
          Your encryption key is used to protect your diary entries. Back it up to
          prevent data loss.
        </p>
      </header>

      {hasKey !== null && (
        <div className={`status ${hasKey ? 'has-key' : 'no-key'}`}>
          {hasKey ? (
            <>
              <span className="status-icon">✓</span>
              <span>Encryption key is backed up in your browser</span>
            </>
          ) : (
            <>
              <span className="status-icon">⚠</span>
              <span>No key found. Create a diary entry to generate one.</span>
            </>
          )}
        </div>
      )}

      <section className="export-section">
        <h3>Export Key</h3>
        <p>
          Download your encryption key as a JSON file. Store it in a secure location
          (password manager, encrypted USB drive, etc.).
        </p>
        <button onClick={handleExport} disabled={isExporting || !hasKey}>
          {isExporting ? 'Exporting...' : 'Export Key'}
        </button>
      </section>

      <section className="import-section">
        <h3>Import Key</h3>
        <p>
          Restore your encryption key from a backup file. This will allow you to decrypt
          existing diary entries.
        </p>
        <div className="file-input-container">
          <label htmlFor="key-file">Choose file:</label>
          <input
            id="key-file"
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            disabled={isImporting}
          />
        </div>
      </section>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <section className="warning-section">
        <h3>⚠️ Important Security Notes</h3>
        <ul>
          <li>
            <strong>Keep your key safe:</strong> Anyone with your key can decrypt your
            diary entries.
          </li>
          <li>
            <strong>Never share your key:</strong> Treat it like a password.
          </li>
          <li>
            <strong>Cannot recover lost keys:</strong> If you lose your key and haven't
            backed it up, your encrypted data is permanently lost.
          </li>
          <li>
            <strong>Multiple devices:</strong> Export the key and import it on other
            devices to access your diary.
          </li>
          <li>
            <strong>Recommended storage:</strong> Use a password manager like 1Password,
            Bitwarden, or an encrypted USB drive.
          </li>
        </ul>
      </section>

      <style jsx>{`
        .key-backup {
          max-width: 700px;
          margin: 0 auto;
        }

        header {
          margin-bottom: 2rem;
        }

        h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }

        header p {
          color: #666;
        }

        h3 {
          font-size: 1.25rem;
          margin-bottom: 0.75rem;
        }

        section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        section p {
          color: #4a5568;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .status {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .status.has-key {
          background-color: #c6f6d5;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }

        .status.no-key {
          background-color: #fef3c7;
          color: #78350f;
          border: 1px solid #fbbf24;
        }

        .status-icon {
          font-size: 1.5rem;
          margin-right: 0.75rem;
        }

        button {
          padding: 0.75rem 1.5rem;
          background-color: #3182ce;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        button:hover:not(:disabled) {
          background-color: #2c5aa0;
        }

        button:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
        }

        .file-input-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .file-input-container label {
          font-weight: 500;
        }

        input[type='file'] {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
        }

        input[type='file']:disabled {
          background-color: #f7fafc;
          cursor: not-allowed;
        }

        .message {
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .message.success {
          background-color: #c6f6d5;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }

        .message.error {
          background-color: #fed7d7;
          color: #742a2a;
          border: 1px solid #fc8181;
        }

        .message.warning {
          background-color: #fef3c7;
          color: #78350f;
          border: 1px solid #fbbf24;
        }

        .message.info {
          background-color: #bee3f8;
          color: #2c5282;
          border: 1px solid #90cdf4;
        }

        .warning-section {
          background-color: #fffbeb;
          border-color: #fbbf24;
        }

        .warning-section h3 {
          color: #78350f;
        }

        .warning-section ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #78350f;
        }

        .warning-section li {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        .warning-section strong {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
