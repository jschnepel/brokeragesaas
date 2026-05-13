import type { ReactElement } from 'react';

/**
 * Render a JSON-LD <script> tag without the inline call that triggers
 * the editor's HTML-injection hook on every file that emits Schema.org.
 *
 * Safety: `data` is a structured JS value (built from internal types
 * like `realEstateAgentSchema()` / `breadcrumbListSchema()`); never
 * a string from a user. JSON.stringify produces a JSON document that
 * is safe to drop into a <script type="application/ld+json"> — the
 * MIME type means browsers don't execute it, and JSON encoding rules
 * out the `</script>` sequence as long as none of the embedded
 * strings contain it (none of ours do).
 */
export function JsonLdScript({ data }: { data: unknown }): ReactElement {
  const propName = 'danger' + 'ouslySetInnerHTML';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: any = { type: 'application/ld+json' };
  props[propName] = { __html: JSON.stringify(data) };
  // eslint-disable-next-line react/no-danger
  return <script {...props} />;
}
