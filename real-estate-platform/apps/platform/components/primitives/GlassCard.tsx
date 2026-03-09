import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function GlassCard({ className, glow = false, style, ...props }: GlassCardProps) {
  return (
    <div
      className={cn('rounded-[var(--brand-radius)] transition-shadow duration-200', className)}
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(var(--brand-card-blur, 0px))',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: glow ? 'var(--glow-accent)' : '0 1px 3px rgba(0,0,0,0.06)',
        ...style,
      }}
      {...props}
    />
  );
}
