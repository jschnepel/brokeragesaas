import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AgentDashboard } from '@/components/views';
import { getRequests } from '@/app/actions/intake';

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = {
    id: session.user.id ?? '',
    name: session.user.name ?? '',
    initials: (session.user.name ?? '').split(' ').map(n => n[0]).join(''),
    role: (session.user as { role?: string }).role ?? 'agent',
  };

  const requests = await getRequests({ requester_id: user.id });

  return <AgentDashboard user={user} requests={requests} />;
}
