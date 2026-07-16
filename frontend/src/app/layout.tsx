import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LavoroHub - Marketplace dei Servizi',
  description: 'Piattaforma sicura per la compravendita di servizi locali.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
