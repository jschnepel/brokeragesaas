type HairlineDividerProps = { className?: string };
export function HairlineDivider({ className = '' }: HairlineDividerProps) {
  return <div className={`hairline w-full ${className}`} aria-hidden="true" />;
}
