import type { ReactNode } from 'react';

type CapsLabelProps = {
  children: ReactNode;
  className?: string;
  as?: 'span' | 'div' | 'p';
};

export function CapsLabel({ children, className = '', as: Tag = 'span' }: CapsLabelProps) {
  return <Tag className={`caps ${className}`}>{children}</Tag>;
}
