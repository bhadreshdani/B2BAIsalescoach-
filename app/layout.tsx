import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bhadresh Dani — AI Sales Coach',
  description: 'AI-powered B2B sales coaching platform. Diagnose real sales problems, get contextual coaching, and close more deals.',
  keywords: ['B2B sales', 'sales coaching', 'AI coach', 'Bhadresh Dani', 'sales transformation'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
