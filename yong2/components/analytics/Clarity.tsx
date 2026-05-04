'use client';

import Script from 'next/script';
import { useConsent } from '@/lib/analytics/use-consent';

/**
 * Microsoft Clarity — session replay + heatmaps. Free, unlimited.
 *
 * Loads only when:
 *   - consent.analytics === true (DNT auto-rejects via the consent module), AND
 *   - NEXT_PUBLIC_CLARITY_PROJECT_ID is set.
 *
 * The inline init script is the canonical install snippet from clarity.microsoft.com,
 * wrapped in `next/script` with `afterInteractive` so it doesn't compete with
 * critical assets. No event firing here — Clarity captures replays + heatmaps
 * without any code from us.
 */
export function ClarityScript() {
  const consent = useConsent();
  if (!consent.analytics) return null;

  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  if (!projectId) return null;

  return (
    <Script id="clarity-init" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${projectId}");`}
    </Script>
  );
}
