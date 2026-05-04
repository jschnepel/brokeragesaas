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
    <SectionFrame className="py-28 md:py-32 border-t border-white/5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
        <div>
          <CapsLabel as="div">{contactCta.kicker}</CapsLabel>
          <h2 className="display-lg mt-4 text-balance">{emphasize(contactCta.headline)}</h2>
          <p className="mt-6 text-stone/80 leading-relaxed max-w-lg">{contactCta.body}</p>
        </div>
        <div className="md:border-l md:border-white/10 md:pl-12">
          <dl className="space-y-3">
            <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
              <dt className="caps text-stone/70">Mobile</dt>
              <dd>
                <a href={siteContent.contact.mobileHref} className="hover:text-gold transition-colors">
                  {siteContent.contact.mobile}
                </a>
              </dd>
            </div>
            <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
              <dt className="caps text-stone/70">Email</dt>
              <dd>
                <a href={`mailto:${siteContent.contact.email}`} className="hover:text-gold transition-colors">
                  {siteContent.contact.email}
                </a>
              </dd>
            </div>
            <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
              <dt className="caps text-stone/70">Office</dt>
              <dd className="text-mute text-right">{siteContent.contact.office}</dd>
            </div>
          </dl>
          {/* Closing CTA — the one filled action on the page. Luxury
           * convention: the page may have many ghost CTAs but the final
           * ask gets a single weighted action so the next step is
           * unambiguous. Outside the dl for valid HTML semantics. */}
          <Link
            href="/contact"
            className="caps inline-flex items-center gap-3 mt-8 bg-gold text-ink px-7 py-4 hover:bg-gold-muted transition-colors group"
          >
            <span>Begin a Conversation</span>
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </SectionFrame>
  );
}
