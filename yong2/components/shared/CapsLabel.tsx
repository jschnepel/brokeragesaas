import type { ReactNode } from 'react';

type CapsLabelProps = {
  children: ReactNode;
  className?: string;
  as?: 'span' | 'div' | 'p' | 'h2' | 'h3' | 'h4';
};

export function CapsLabel({ children, className = '', as: Tag = 'span' }: CapsLabelProps) {
  return <Tag className={`caps ${className}`}>{children}</Tag>;
}
