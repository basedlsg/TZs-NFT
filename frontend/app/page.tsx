'use client';

import WalletButton from '@/components/WalletButton';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">
              Proof of Becoming
            </h1>
            <p className="text-lg text-gray-600">
              Private ritual journaling with evolving Soul NFTs on Tezos
            </p>
          </div>
          <WalletButton />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">🎯 Set Goals</h2>
            <p className="text-gray-600">
              Define personal rituals and intentions
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">📸 Submit Proof</h2>
            <p className="text-gray-600">
              Capture moments with photo + reflection
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">✅ Get Verified</h2>
            <p className="text-gray-600">
              AI verification with privacy preserved
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">🎨 Evolve NFT</h2>
            <p className="text-gray-600">
              Quantum-seeded generative art on-chain
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/diary"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Diary Entry →
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Status:</strong> MVP in development - Week 3 (Private Journal + Encryption)
          </p>
        </div>
      </div>
    </main>
  );
}
