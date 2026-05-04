import type { ReactNode } from 'react';

type SectionFrameProps = {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
  id?: string;
};

export function SectionFrame({ children, className = '', as: Tag = 'section', id }: SectionFrameProps) {
  return (
    <Tag id={id} className={`w-full px-6 md:px-12 lg:px-16 ${className}`}>
      <div className="max-w-[1400px] mx-auto">{children}</div>
    </Tag>
  );
}
