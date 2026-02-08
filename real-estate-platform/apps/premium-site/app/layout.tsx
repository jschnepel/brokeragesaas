import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AgentProvider } from '@/lib/agent-context';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Real Estate Agent',
  description: 'Find your perfect home',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AgentProvider>
          {children}
        </AgentProvider>
      </body>
    </html>
  );
}
