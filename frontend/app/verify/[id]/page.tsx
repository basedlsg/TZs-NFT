'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProofSubmission from '@/components/ProofSubmission';

export default function VerifyProofPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = params.id as string;

  const handleSuccess = () => {
    // Navigate to success page or back to diary after successful verification
    setTimeout(() => {
      router.push('/diary/history');
    }, 3000);
  };

  return (
    <div className="verify-page">
      <header>
        <Link href="/diary/history" className="back-link">
          ← Back to Diary History
        </Link>
        <h1>Proof Verification</h1>
        <p>Submit your proof for AI verification to evolve your Soul NFT.</p>
      </header>

      <main>
        <ProofSubmission diaryEntryId={entryId} onSuccess={handleSuccess} />
      </main>

      <style jsx>{`
        .verify-page {
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
      `}</style>
    </div>
  );
}
