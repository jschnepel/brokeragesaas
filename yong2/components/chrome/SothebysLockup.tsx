import Image from 'next/image';

type SothebysLockupProps = {
  className?: string;
  variant?: 'light' | 'dark';
};

export function SothebysLockup({ className = '', variant = 'light' }: SothebysLockupProps) {
  // Logo is dark-on-light; invert for dark backgrounds.
  const invert = variant === 'light' ? 'invert brightness-0 contrast-200' : '';
  return (
    <div className={className}>
      <Image
        src="/images/rlsir-logo.png"
        alt="Russ Lyon Sotheby's International Realty"
        width={180}
        height={48}
        className={`opacity-80 ${invert}`}
        style={{ height: 'auto' }}
      />
    </div>
  );
}
