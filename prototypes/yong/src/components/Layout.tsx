import type { ReactNode } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  navVariant?: 'transparent' | 'solid';
}

const Layout: React.FC<LayoutProps> = ({ children, navVariant = 'solid' }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation variant={navVariant} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
