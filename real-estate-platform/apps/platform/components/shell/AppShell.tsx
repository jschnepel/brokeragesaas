import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  sidebarItems: Parameters<typeof Sidebar>[0]['items'];
  user?: Parameters<typeof Sidebar>[0]['user'];
  topBarTitle: string;
  topBarSubtitle?: string;
  topBarActions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  sidebarItems,
  user,
  topBarTitle,
  topBarSubtitle,
  topBarActions,
  children,
}: AppShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--brand-surface)' }}>
      <Sidebar items={sidebarItems} user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar title={topBarTitle} subtitle={topBarSubtitle} actions={topBarActions} />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
