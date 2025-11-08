'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { getDiaryEntry, DiaryEntry } from '@/lib/diaryStorage';
import { useWallet } from '@/contexts/WalletContext';
import { getSoulNFTContract } from '@/lib/soulNFT';

interface VerificationChecks {
  validGoal: boolean;
  sufficientReflection: boolean;
  validImage: boolean;
  aiVerified?: boolean;
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  reason: string;
  feedback: string;
  needsSecondPhoto?: boolean;
  checks?: VerificationChecks;
}

interface ProofSubmissionProps {
  diaryEntryId: string;
  onSuccess?: (result: VerificationResult) => void;
}

export default function ProofSubmission({ diaryEntryId, onSuccess }: ProofSubmissionProps) {
  const { account } = useWallet();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionComplete, setEvolutionComplete] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondPhotoFile, setSecondPhotoFile] = useState<File | null>(null);
  const [secondPhotoDataUrl, setSecondPhotoDataUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadEntry();
  }, [diaryEntryId]);

  const loadEntry = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const diaryEntry = await getDiaryEntry(diaryEntryId);

      if (!diaryEntry) {
        setError('Diary entry not found');
        return;
      }

      setEntry(diaryEntry);
    } catch (err) {
      console.error('Failed to load diary entry:', err);
      setError('Failed to load diary entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecondPhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSecondPhotoFile(null);
      setSecondPhotoDataUrl(undefined);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Convert to data URL
    const reader = new FileReader();
    reader.onload = () => {
      setSecondPhotoDataUrl(reader.result as string);
      setSecondPhotoFile(file);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const submitProof = async (withSecondPhoto: boolean = false) => {
    if (!entry) {
      setError('No entry to verify');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const requestBody = {
        goalId: entry.goalId,
        reflection: entry.reflection,
        imageDataUrl: entry.imageDataUrl || '',
        ...(withSecondPhoto && secondPhotoDataUrl ? { secondImageDataUrl: secondPhotoDataUrl } : {}),
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }

      const result: VerificationResult = await response.json();
      setVerificationResult(result);

      if (result.verified && onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify proof. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const evolveNFT = async () => {
    if (!account) {
      setError('Please connect your wallet to evolve your Soul NFT');
      return;
    }

    if (!entry) {
      setError('No entry data available');
      return;
    }

    setIsEvolving(true);
    setError(null);

    try {
      const soulNFT = getSoulNFTContract();

      // Get user's token ID
      const tokenId = await soulNFT.getTokenIdByOwner(account);

      if (tokenId === null) {
        setError('You don\'t have a Soul NFT yet. Please mint one first.');
        setIsEvolving(false);
        return;
      }

      // Get current metadata to determine next stage
      const currentMetadata = await soulNFT.getTokenMetadata(tokenId);
      const nextStage = (currentMetadata?.stage || 0) + 1;

      // Generate a random seed (for now, using crypto.getRandomValues)
      // In Week 5, this will be replaced with QRNG
      const seedArray = new Uint8Array(32);
      crypto.getRandomValues(seedArray);
      const seed = Array.from(seedArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Create metadata URI (for now, a simple JSON with proof hash)
      // In Week 5, this will include IPFS-hosted generative art
      const metadata = {
        name: `Soul NFT #${tokenId}`,
        description: `Evolution Stage ${nextStage}`,
        stage: nextStage,
        seed,
        proofHash: entry.hash,
        goalId: entry.goalId,
        timestamp: Date.now(),
      };

      // For now, store metadata as data URI
      // In Week 5, this will be pinned to IPFS
      const metadataUri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;

      // Call evolve on the contract
      const result = await soulNFT.evolve({
        tokenId,
        stage: nextStage,
        seed,
        metadataUri,
      });

      console.log('Evolution transaction:', result.hash);

      // Wait for confirmation
      await result.confirmation();

      setEvolutionComplete(true);
      setError(null);
    } catch (err) {
      console.error('Evolution error:', err);
      if (err instanceof Error) {
        setError(`Failed to evolve NFT: ${err.message}`);
      } else {
        setError('Failed to evolve NFT. Please try again.');
      }
    } finally {
      setIsEvolving(false);
    }
  };

  const handleSubmit = () => {
    submitProof(false);
  };

  const handleSubmitWithSecondPhoto = () => {
    submitProof(true);
  };

  const handleRetry = () => {
    setVerificationResult(null);
    setSecondPhotoFile(null);
    setSecondPhotoDataUrl(undefined);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="proof-submission loading">
        <p>Loading entry...</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="proof-submission error">
        <p>Entry not found</p>
      </div>
    );
  }

  return (
    <div className="proof-submission">
      <header>
        <h2>Verify Your Proof</h2>
        <p>Submit your diary entry for AI verification to evolve your Soul NFT.</p>
      </header>

      <section className="entry-preview">
        <h3>Entry Details</h3>
        <div className="entry-info">
          <p><strong>Goal:</strong> {entry.goalId.replace(/_/g, ' ')}</p>
          <p><strong>Reflection:</strong> {entry.reflection.substring(0, 100)}...</p>
          {entry.imageDataUrl && (
            <div className="image-preview">
              <img src={entry.imageDataUrl} alt="Proof" />
            </div>
          )}
        </div>
      </section>

      {!verificationResult && !error && (
        <section className="submit-section">
          <button
            onClick={handleSubmit}
            disabled={isVerifying}
            className="submit-button"
          >
            {isVerifying ? 'Verifying...' : 'Submit Proof for Verification'}
          </button>
        </section>
      )}

      {isVerifying && (
        <div className="verifying-status">
          <div className="spinner"></div>
          <p>Verifying your proof...</p>
        </div>
      )}

      {isEvolving && (
        <div className="evolving-status">
          <div className="spinner"></div>
          <p>Evolving your Soul NFT on-chain...</p>
          <small>Please confirm the transaction in your wallet</small>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleRetry}>Try Again</button>
        </div>
      )}

      {verificationResult && (
        <section className="verification-result">
          <div className={`result-header ${verificationResult.verified ? 'success' : 'failure'}`}>
            <span className="icon">{verificationResult.verified ? '✓' : '✗'}</span>
            <h3>{verificationResult.verified ? 'Proof Verified!' : 'Not Verified'}</h3>
          </div>

          <div className="confidence-score">
            <div className="score-label">Confidence Score:</div>
            <div className="score-value">{verificationResult.confidence}%</div>
            <div className="score-bar">
              <div
                className="score-fill"
                style={{ width: `${verificationResult.confidence}%` }}
              ></div>
            </div>
          </div>

          <div className="feedback">
            <p>{verificationResult.feedback}</p>
          </div>

          {verificationResult.checks && (
            <div className="checks">
              <h4>Verification Checks:</h4>
              <ul>
                <li className={verificationResult.checks.validGoal ? 'pass' : 'fail'}>
                  Valid Goal: {verificationResult.checks.validGoal ? '✓' : '✗'}
                </li>
                <li className={verificationResult.checks.sufficientReflection ? 'pass' : 'fail'}>
                  Sufficient Reflection: {verificationResult.checks.sufficientReflection ? '✓' : '✗'}
                </li>
                <li className={verificationResult.checks.validImage ? 'pass' : 'fail'}>
                  Valid Image: {verificationResult.checks.validImage ? '✓' : '✗'}
                </li>
                {verificationResult.checks.aiVerified !== undefined && (
                  <li className={verificationResult.checks.aiVerified ? 'pass' : 'fail'}>
                    AI Verified: {verificationResult.checks.aiVerified ? '✓' : '✗'}
                  </li>
                )}
              </ul>
            </div>
          )}

          {verificationResult.needsSecondPhoto && !secondPhotoDataUrl && (
            <div className="second-photo-request">
              <h4>Additional Verification Needed</h4>
              <p>Please upload an additional photo to improve verification confidence.</p>
              <div className="file-input-container">
                <label htmlFor="second-photo">Additional Photo:</label>
                <input
                  id="second-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleSecondPhotoChange}
                  disabled={isVerifying}
                />
              </div>
            </div>
          )}

          {verificationResult.needsSecondPhoto && secondPhotoDataUrl && (
            <div className="second-photo-preview">
              <h4>Second Photo Ready</h4>
              <img src={secondPhotoDataUrl} alt="Second proof" />
              <button
                onClick={handleSubmitWithSecondPhoto}
                disabled={isVerifying}
                className="submit-button"
              >
                {isVerifying ? 'Verifying...' : 'Submit with Second Photo'}
              </button>
            </div>
          )}

          {!verificationResult.verified && !verificationResult.needsSecondPhoto && (
            <div className="retry-section">
              <button onClick={handleRetry}>Try Again</button>
            </div>
          )}

          {verificationResult.verified && !evolutionComplete && (
            <div className="success-actions">
              <p className="success-note">
                Your proof has been verified! You can now evolve your Soul NFT.
              </p>
              {account ? (
                <button
                  onClick={evolveNFT}
                  disabled={isEvolving}
                  className="evolve-button"
                >
                  {isEvolving ? 'Evolving NFT...' : 'Evolve Soul NFT'}
                </button>
              ) : (
                <p className="wallet-warning">
                  Please connect your wallet to evolve your Soul NFT.
                </p>
              )}
            </div>
          )}

          {evolutionComplete && (
            <div className="evolution-complete">
              <div className="evolution-header">
                <span className="icon">🎨</span>
                <h4>Soul NFT Evolved!</h4>
              </div>
              <p>
                Your Soul NFT has successfully evolved to the next stage. Your progress has
                been recorded on-chain.
              </p>
            </div>
          )}
        </section>
      )}

      <style jsx>{`
        .proof-submission {
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

        section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }

        h4 {
          font-size: 1.1rem;
          margin-bottom: 0.75rem;
        }

        .entry-info p {
          margin-bottom: 0.5rem;
          color: #4a5568;
        }

        .image-preview {
          margin-top: 1rem;
          border-radius: 8px;
          overflow: hidden;
        }

        .image-preview img {
          max-width: 100%;
          height: auto;
          display: block;
        }

        .submit-button {
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

        .submit-button:hover:not(:disabled) {
          background-color: #2c5aa0;
        }

        .submit-button:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
        }

        .verifying-status {
          text-align: center;
          padding: 2rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #3182ce;
          border-radius: 50%;
          margin: 0 auto 1rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          background-color: #fed7d7;
          color: #742a2a;
          border: 1px solid #fc8181;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .error-message button {
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          background-color: #742a2a;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .result-header.success {
          background-color: #c6f6d5;
          color: #22543d;
        }

        .result-header.failure {
          background-color: #fed7d7;
          color: #742a2a;
        }

        .result-header .icon {
          font-size: 2rem;
          font-weight: bold;
        }

        .result-header h3 {
          margin: 0;
        }

        .confidence-score {
          margin-bottom: 1.5rem;
        }

        .score-label {
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .score-value {
          font-size: 2rem;
          font-weight: bold;
          color: #3182ce;
          margin-bottom: 0.5rem;
        }

        .score-bar {
          height: 20px;
          background-color: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          background: linear-gradient(90deg, #f56565, #ecc94b, #48bb78);
          transition: width 0.3s ease;
        }

        .feedback {
          padding: 1rem;
          background-color: #edf2f7;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .feedback p {
          margin: 0;
          color: #2d3748;
        }

        .checks {
          margin-bottom: 1.5rem;
        }

        .checks ul {
          list-style: none;
          padding: 0;
        }

        .checks li {
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border-radius: 4px;
        }

        .checks li.pass {
          background-color: #c6f6d5;
          color: #22543d;
        }

        .checks li.fail {
          background-color: #fed7d7;
          color: #742a2a;
        }

        .second-photo-request {
          background-color: #fef3c7;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #fbbf24;
        }

        .file-input-container {
          margin-top: 1rem;
        }

        .file-input-container label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .file-input-container input[type='file'] {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
        }

        .second-photo-preview {
          background-color: #e6fffa;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #81e6d9;
        }

        .second-photo-preview img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1rem 0;
        }

        .retry-section {
          text-align: center;
        }

        .retry-section button {
          padding: 0.75rem 1.5rem;
          background-color: #4a5568;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .success-actions {
          text-align: center;
          padding: 1rem;
          background-color: #c6f6d5;
          border-radius: 8px;
        }

        .success-note {
          margin: 0 0 1rem 0;
          color: #22543d;
          font-weight: 500;
        }

        .evolve-button {
          width: 100%;
          padding: 0.75rem 1.5rem;
          background-color: #805ad5;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .evolve-button:hover:not(:disabled) {
          background-color: #6b46c1;
        }

        .evolve-button:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
        }

        .wallet-warning {
          margin-top: 0.5rem;
          color: #c05621;
          font-size: 0.875rem;
        }

        .evolving-status {
          text-align: center;
          padding: 2rem;
          background-color: #faf5ff;
          border-radius: 8px;
          border: 1px solid #d6bcfa;
          margin-bottom: 1.5rem;
        }

        .evolving-status small {
          display: block;
          margin-top: 0.5rem;
          color: #6b46c1;
          font-size: 0.875rem;
        }

        .evolution-complete {
          padding: 1.5rem;
          background-color: #faf5ff;
          border-radius: 8px;
          border: 1px solid #d6bcfa;
        }

        .evolution-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .evolution-header .icon {
          font-size: 2rem;
        }

        .evolution-header h4 {
          margin: 0;
          color: #553c9a;
        }

        .evolution-complete p {
          margin: 0;
          color: #44337a;
        }

        .loading,
        .error {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
      `}</style>
    </div>
  );
}
