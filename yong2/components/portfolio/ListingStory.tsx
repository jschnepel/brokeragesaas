import type { NarrativeStory } from '@/lib/listing-narrative';

type ListingStoryProps = {
  story: NarrativeStory;
};

/**
 * 4-paragraph story block — fixed slot order: lede → setting → interior →
 * closing. Drop-cap on the lede only. Each paragraph is produced by the
 * narrative workflow with a defined intent (see lib/listing-narrative.ts).
 *
 * Structure is consistent across every listing on the site so the rhythm
 * holds. When the workflow can't fill a slot for a given listing (sparse
 * data), we render an empty paragraph rather than collapsing — keeps the
 * page rhythm even, signals to the listing-prep team where to invest
 * effort.
 */
export function ListingStory({ story }: ListingStoryProps) {
  return (
    <article className="text-stone/90 leading-relaxed space-y-5 max-w-2xl">
      <p>
        <span className="font-serif text-5xl leading-none float-left mr-2 -mt-1 text-gold">
          {story.lede.charAt(0)}
        </span>
        {story.lede.slice(1)}
      </p>
      <p>{story.setting}</p>
      <p>{story.interior}</p>
      <p className="text-stone/75 italic">{story.closing}</p>
    </article>
  );
}
