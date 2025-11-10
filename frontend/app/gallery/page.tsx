'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { getSoulNFTContract } from '@/lib/soulNFT';
import { generateArt } from '@/lib/artGenerator';

interface NFTData {
  tokenId: number;
  owner: string;
  metadataUri: string;
  stage?: number;
  seed?: string;
  artwork?: string;
}

export default function GalleryPage() {
  const { account } = useWallet();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTokenId, setUserTokenId] = useState<number | null>(null);

  useEffect(() => {
    loadGallery();
  }, [account]);

  const loadGallery = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For MVP, we'll show a demo gallery
      // In production, this would query all tokens from the contract
      const demoNFTs: NFTData[] = [];

      // If user has a Soul NFT, load it
      if (account) {
        try {
          const soulNFT = getSoulNFTContract();
          const tokenId = await soulNFT.getTokenIdByOwner(account);

          if (tokenId !== null) {
            setUserTokenId(tokenId);

            const metadata = await soulNFT.getTokenMetadata(tokenId);

            if (metadata && metadata.seed) {
              // Generate artwork preview from seed
              const artwork = generateArt(metadata.seed, 256, 256, metadata.stage || 1);

              demoNFTs.push({
                tokenId,
                owner: account,
                metadataUri: metadata.metadataUri,
                stage: metadata.stage,
                seed: metadata.seed,
                artwork: artwork.dataUrl,
              });
            }
          }
        } catch (err) {
          console.error('Error loading user NFT:', err);
        }
      }

      // Add some demo NFTs for visualization
      const demoSeeds = [
        'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678',
        'b4e30c9d5e6f7890abcdef1234567890abcdef1234567890abcdef12345679',
        'c5f41dae6f7g8h90abcdef1234567890abcdef1234567890abcdef1234567a',
      ];

      demoSeeds.forEach((seed, index) => {
        if (demoNFTs.length < 10) {
          // Don't show if it's the user's NFT
          if (nfts.find(nft => nft.seed === seed)) return;

          const artwork = generateArt(seed, 256, 256, index + 1);
          demoNFTs.push({
            tokenId: 1000 + index,
            owner: `tz1demo${index}`,
            metadataUri: '',
            stage: index + 1,
            seed,
            artwork: artwork.dataUrl,
          });
        }
      });

      setNfts(demoNFTs);
    } catch (err) {
      console.error('Failed to load gallery:', err);
      setError('Failed to load gallery');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gallery-page">
      <header>
        <Link href="/" className="back-link">
          ← Back to Home
        </Link>
        <h1>Soul NFT Gallery</h1>
        <p>Explore evolved Soul NFTs from the Proof of Becoming community</p>
      </header>

      <main>
        {isLoading && (
          <div className="loading">
            <p>Loading gallery...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadGallery}>Retry</button>
          </div>
        )}

        {!isLoading && !error && nfts.length === 0 && (
          <div className="empty-state">
            <p>No Soul NFTs have been minted yet.</p>
            <Link href="/diary" className="cta-link">
              Create your first diary entry
            </Link>
          </div>
        )}

        {!isLoading && !error && nfts.length > 0 && (
          <div className="gallery-grid">
            {nfts.map((nft) => (
              <article key={nft.tokenId} className="nft-card">
                <div className="artwork">
                  {nft.artwork ? (
                    <img src={nft.artwork} alt={`Soul NFT #${nft.tokenId}`} />
                  ) : (
                    <div className="placeholder">No artwork</div>
                  )}
                </div>

                <div className="nft-info">
                  <h3>Soul NFT #{nft.tokenId}</h3>
                  {nft.stage && (
                    <p className="stage">Evolution Stage {nft.stage}</p>
                  )}
                  <p className="owner">
                    {nft.owner === account ? (
                      <span className="your-nft">Your NFT</span>
                    ) : (
                      <span className="owner-address">
                        {nft.owner.substring(0, 10)}...
                      </span>
                    )}
                  </p>
                  {nft.seed && (
                    <details className="seed-details">
                      <summary>Seed</summary>
                      <code>{nft.seed}</code>
                    </details>
                  )}
                </div>

                {nft.owner === account && (
                  <div className="actions">
                    <Link href="/diary" className="action-link">
                      View Diary
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {!isLoading && nfts.length > 0 && (
          <div className="gallery-note">
            <p>
              <strong>Note:</strong> This is an MVP gallery. In production, it will display
              all Soul NFTs from the contract.
            </p>
          </div>
        )}
      </main>

      <style jsx>{`
        .gallery-page {
          min-height: 100vh;
          padding: 2rem;
          max-width: 1200px;
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
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        header p {
          color: #666;
          font-size: 1.1rem;
        }

        .loading,
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #666;
        }

        .cta-link {
          display: inline-block;
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background-color: #3182ce;
          color: white;
          text-decoration: none;
          border-radius: 4px;
        }

        .cta-link:hover {
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

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .nft-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .nft-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .artwork {
          width: 100%;
          aspect-ratio: 1;
          background: #000;
        }

        .artwork img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
        }

        .nft-info {
          padding: 1.5rem;
        }

        .nft-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          color: #2d3748;
        }

        .stage {
          margin: 0.5rem 0;
          color: #805ad5;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .owner {
          margin: 0.5rem 0;
          font-size: 0.875rem;
          color: #718096;
        }

        .your-nft {
          color: #38a169;
          font-weight: 600;
        }

        .owner-address {
          font-family: monospace;
          font-size: 0.75rem;
        }

        .seed-details {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: #f7fafc;
          border-radius: 4px;
        }

        .seed-details summary {
          cursor: pointer;
          font-weight: 500;
          color: #4a5568;
          font-size: 0.875rem;
        }

        .seed-details code {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #2d3748;
          word-break: break-all;
          font-family: monospace;
        }

        .actions {
          padding: 0 1.5rem 1.5rem;
        }

        .action-link {
          display: inline-block;
          padding: 0.5rem 1rem;
          background-color: #edf2f7;
          color: #3182ce;
          text-decoration: none;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .action-link:hover {
          background-color: #e2e8f0;
        }

        .gallery-note {
          text-align: center;
          padding: 2rem;
          background-color: #fffbeb;
          border-radius: 8px;
          border: 1px solid #fbbf24;
        }

        .gallery-note p {
          margin: 0;
          color: #78350f;
        }
      `}</style>
    </div>
  );
}
