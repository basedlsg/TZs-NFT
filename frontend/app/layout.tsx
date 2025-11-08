import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Proof of Becoming',
  description: 'Private ritual journaling with evolving Soul NFTs on Tezos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
