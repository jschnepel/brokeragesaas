import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ManagerDashboard } from '@/components/views';
import { getRequests, getDesigners } from '@/app/actions/intake';

export default async function TriagePage() {
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

  const [requests, designerRows] = await Promise.all([
    getRequests(),
    getDesigners(),
  ]);

  const designers = designerRows.map(d => ({ id: d.id, name: d.name }));

  return <ManagerDashboard user={user} requests={requests} designers={designers} />;
}
