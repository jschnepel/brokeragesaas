import Image from 'next/image';
import { CapsLabel } from '@/components/shared/CapsLabel';

type Props = {
  name: string;
  locality: string;
  imageUrl: string | null;
  aerialVideoId?: string;
};

export function CommunityHero({ name, locality, imageUrl, aerialVideoId }: Props) {
  return (
    <section className="relative w-full h-[60vh] min-h-[440px] overflow-hidden">
      {aerialVideoId ? (
        <iframe
          src={`https://aerialview.google.com/embed/${aerialVideoId}?autoplay=1&mute=1&loop=1`}
          className="absolute inset-0 w-full h-full"
          title={`${name} aerial`}
          allow="autoplay; fullscreen"
        />
      ) : imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          priority
          fetchPriority="high"
          quality={70}
          sizes="100vw"
          className="object-cover"
        />
      ) : <div className="absolute inset-0 bg-ink-elevated" />}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 pb-12">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
          <CapsLabel as="div">{locality}</CapsLabel>
          <h1 className="display-xl italic mt-4">{name}</h1>
        </div>
      </div>
    </section>
  );
}
