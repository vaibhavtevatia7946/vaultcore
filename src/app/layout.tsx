import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VaultCore — High-Throughput Distributed Payment Ledger',
  description: 'ACID-compliant double-entry financial ledger with distributed row-level locking, deadlock prevention, and idempotency guarantees.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#07080b] text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
