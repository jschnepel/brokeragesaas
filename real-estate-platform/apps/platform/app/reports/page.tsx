import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ExecutiveDashboard } from '@/components/views';
import { getRequests, getDesigners } from '@/app/actions/intake';

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as { role?: string }).role;
  if (role !== 'executive' && role !== 'marketing_manager') redirect('/requests');

  const user = {
    id: session.user.id ?? '',
    name: session.user.name ?? '',
    initials: (session.user.name ?? '').split(' ').map(n => n[0]).join(''),
    role: role ?? 'executive',
  };

  const [requests, designerRows] = await Promise.all([
    getRequests(),
    getDesigners(),
  ]);

  const designers = designerRows.map(d => ({ id: d.id, name: d.name }));

  return <ExecutiveDashboard user={user} requests={requests} designers={designers} />;
}
