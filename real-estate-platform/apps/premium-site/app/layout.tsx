import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { AgentProvider } from './AgentProvider';
import { Navigation } from './Navigation';
import { resolveAgentConfig } from './agent-config';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Resolve agent config at build/request time
// TODO: In production, read agentId from middleware header (domain → agent lookup)
const agentConfig = resolveAgentConfig();

export const metadata: Metadata = {
  title: {
    default: agentConfig.seo.defaultTitle,
    template: agentConfig.seo.titleTemplate,
  },
  description: agentConfig.seo.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} font-sans antialiased`}>
        <AgentProvider config={agentConfig}>
          <Navigation />
          {children}
        </AgentProvider>
      </body>
    </html>
  );
}
