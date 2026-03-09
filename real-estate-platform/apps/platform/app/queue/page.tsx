import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DesignerDashboard } from '@/components/views';
import { getRequests } from '@/app/actions/intake';

export default async function QueuePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as { role?: string }).role;
  if (role !== 'marketing_manager' && role !== 'executive') redirect('/requests');

  const user = {
    id: session.user.id ?? '',
    name: session.user.name ?? '',
    initials: (session.user.name ?? '').split(' ').map(n => n[0]).join(''),
    role: role ?? 'marketing_manager',
  };

  // For designer view, show requests assigned to the current user
  // or all requests if manager/executive
  const requests = await getRequests();

  return <DesignerDashboard user={user} requests={requests} />;
}
