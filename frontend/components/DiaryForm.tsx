'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { saveDiaryEntry } from '@/lib/diaryStorage';
import { pinDiaryEntry } from '@/lib/ipfs';

interface DiaryFormProps {
  onSuccess?: (entryId: string) => void;
}

const GOAL_OPTIONS = [
  { id: '', label: '-- Select a goal --' },
  { id: 'run_5km', label: 'Run 5km' },
  { id: 'read_20_pages', label: 'Read 20 pages' },
  { id: 'meditate_10min', label: 'Meditate 10 minutes' },
  { id: 'make_sketch', label: 'Make a sketch' },
  { id: 'custom', label: 'Custom goal' },
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function DiaryForm({ onSuccess }: DiaryFormProps) {
  const [goalId, setGoalId] = useState('');
  const [reflection, setReflection] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [backupToIPFS, setBackupToIPFS] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!goalId) {
      newErrors.goal = 'Goal is required';
    }

    if (!reflection.trim()) {
      newErrors.reflection = 'Reflection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImageDataUrl(undefined);
      return;
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors({ ...errors, image: 'Only images allowed (JPEG, PNG, GIF, WebP)' });
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      setErrors({ ...errors, image: 'Image too large (max 5MB)' });
      return;
    }

    // Clear image error
    const newErrors = { ...errors };
    delete newErrors.image;
    setErrors(newErrors);

    // Convert to data URL
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const entry = {
        goalId,
        reflection: reflection.trim(),
        imageDataUrl,
        timestamp: Date.now(),
      };

      // Save to local IndexedDB (always)
      const entryId = await saveDiaryEntry(entry);

      // Optionally backup to IPFS
      if (backupToIPFS) {
        try {
          const ipfsUri = await pinDiaryEntry(entry);
          // Store IPFS URI for later retrieval
          localStorage.setItem(`ipfs:${entryId}`, ipfsUri);
        } catch (ipfsError) {
          console.warn('IPFS pinning failed, entry saved locally only:', ipfsError);
          // Don't fail the whole operation if IPFS fails
        }
      }

      setMessage({ type: 'success', text: 'Entry saved successfully!' });

      // Clear form
      setGoalId('');
      setReflection('');
      setImageFile(null);
      setImageDataUrl(undefined);
      setBackupToIPFS(false);

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      onSuccess?.(entryId);
    } catch (error) {
      console.error('Failed to save entry:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save entry. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="diary-form">
      <div className="form-group">
        <label htmlFor="goal">Goal *</label>
        <select
          id="goal"
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
          disabled={isSaving}
        >
          {GOAL_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.goal && <span className="error">{errors.goal}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="reflection">Reflection *</label>
        <textarea
          id="reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Write about your experience..."
          rows={6}
          disabled={isSaving}
        />
        {errors.reflection && <span className="error">{errors.reflection}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="photo">Photo (optional)</label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={isSaving}
        />
        {errors.image && <span className="error">{errors.image}</span>}
        {imageDataUrl && (
          <div className="image-preview">
            <img src={imageDataUrl} alt="Preview" />
          </div>
        )}
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={backupToIPFS}
            onChange={(e) => setBackupToIPFS(e.target.checked)}
            disabled={isSaving}
          />
          <span>Backup to IPFS (encrypted)</span>
        </label>
        <small>
          Optional: Store encrypted entry on IPFS for backup and sync.
        </small>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Entry'}
      </button>

      <style jsx>{`
        .diary-form {
          max-width: 600px;
          margin: 0 auto;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        select,
        textarea,
        input[type='file'] {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
          font-family: inherit;
        }

        select:disabled,
        textarea:disabled,
        input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        textarea {
          resize: vertical;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          font-weight: normal;
        }

        .checkbox-group input[type='checkbox'] {
          width: auto;
          margin-right: 0.5rem;
        }

        .checkbox-group small {
          display: block;
          margin-top: 0.25rem;
          color: #666;
        }

        .error {
          display: block;
          color: #e53e3e;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .image-preview {
          margin-top: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          overflow: hidden;
        }

        .image-preview img {
          max-width: 100%;
          height: auto;
          display: block;
        }

        .message {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
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

        button {
          width: 100%;
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
      `}</style>
    </form>
  );
}
