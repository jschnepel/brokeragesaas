import Link from 'next/link';
import { homeContent } from '@/content/home';
import { siteContent } from '@/content/site';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

function emphasize(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((c, i) =>
    c.startsWith('*') && c.endsWith('*') ? <em key={i} className="font-light">{c.slice(1, -1)}</em> : <span key={i}>{c}</span>
  );
}

export function ContactCTA() {
  const { contactCta } = homeContent;
  return (
    <SectionFrame className="py-28">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <CapsLabel as="div">{contactCta.kicker}</CapsLabel>
          <h2 className="display-lg mt-4">{emphasize(contactCta.headline)}</h2>
          <p className="mt-4 text-stone/80 leading-relaxed max-w-lg">{contactCta.body}</p>
        </div>
        <dl className="md:border-l md:border-white/10 md:pl-10 space-y-3">
          <div className="flex justify-between border-b border-white/10 pb-3">
            <dt className="caps">Mobile</dt><dd><a href={siteContent.contact.mobileHref} className="hover:text-gold">{siteContent.contact.mobile}</a></dd>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-3">
            <dt className="caps">Email</dt><dd><a href={`mailto:${siteContent.contact.email}`} className="hover:text-gold">{siteContent.contact.email}</a></dd>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-3">
            <dt className="caps">Office</dt><dd className="text-mute">{siteContent.contact.office}</dd>
          </div>
          <Link href="/contact" className="caps inline-block mt-6 bg-gold text-ink px-6 py-4 hover:bg-stone transition-colors">
            Begin a Conversation →
          </Link>
        </dl>
      </div>
    </SectionFrame>
  );
}
