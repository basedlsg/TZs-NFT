import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/contexts/WalletContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import ErrorBoundary from '@/components/ErrorBoundary';

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
      <body>
        <ErrorBoundary>
          <NotificationProvider>
            <WalletProvider>{children}</WalletProvider>
          </NotificationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
