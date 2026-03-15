import type { Metadata } from 'next';
import { resolveAgentConfig } from '../../../agent-config/index';
import { RelocateClient } from './RelocateClient';

const agent = resolveAgentConfig();

export const metadata: Metadata = {
  title: 'Relocation Guide | Compare Arizona Lifestyles',
  description: 'Compare four distinct Arizona lifestyles — mountain, desert luxury, urban, and suburban — across climate, dining, outdoor recreation, and more. Find your perfect fit.',
};

export const revalidate = 86400;

export default function RelocatePage() {
  return <RelocateClient agentId={agent.agentId} />;
}
