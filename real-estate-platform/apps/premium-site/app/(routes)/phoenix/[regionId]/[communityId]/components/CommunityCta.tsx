import Link from 'next/link';

interface CommunityCtaProps {
  communityName: string;
  communityId: string;
}

export function CommunityCta({ communityName, communityId }: CommunityCtaProps) {
  return (
    <section className="py-20 bg-navy">
      <div className="max-w-[800px] mx-auto px-4 md:px-8 text-center">
        <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">
          Ready to Explore?
        </span>
        <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">
          Find Your Home in <span className="italic font-light">{communityName}</span>
        </h2>
        <p className="text-white/60 mb-8">
          Let me help you discover the perfect property in one of the most desirable communities.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="bg-gold text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-navy transition-all"
          >
            Schedule Consultation
          </Link>
          <Link
            href={`/listings?community=${communityId}`}
            className="border border-white/30 text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-navy transition-all"
          >
            View Listings
          </Link>
        </div>
      </div>
    </section>
  );
}
