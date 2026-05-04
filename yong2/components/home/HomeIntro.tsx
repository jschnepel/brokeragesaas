import { homeContent } from '@/content/home';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

function emphasize(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((chunk, i) =>
    chunk.startsWith('*') && chunk.endsWith('*') ? <em key={i} className="font-light">{chunk.slice(1, -1)}</em> : <span key={i}>{chunk}</span>
  );
}

export function HomeIntro() {
  const { intro } = homeContent;
  return (
    <SectionFrame className="py-28">
      <CapsLabel as="div">{intro.kicker}</CapsLabel>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 md:items-end">
        <h2 className="display-xl text-balance">
          {emphasize(intro.headlineLeft)}
          <br />
          {emphasize(intro.headlineRight)}
        </h2>
        <div className="text-stone/80 leading-relaxed">
          {/* Thin gold rule above the italic lead — editorial flourish
           * that frames the lede without shouting; matches the hairline
           * pattern used in ContactCTA's contact details. */}
          <span className="block w-12 h-px bg-gold/60 mb-5" aria-hidden="true" />
          <p className="font-serif italic text-stone text-lg md:text-xl mb-4 leading-snug">
            {intro.lead}
          </p>
          <p>{intro.body}</p>
        </div>
      </div>
    </SectionFrame>
  );
}
