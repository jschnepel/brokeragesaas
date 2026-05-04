'use client';

import { useState } from 'react';
import { ConsentSettings } from './ConsentSettings';
import { clearAnonId } from '@/lib/analytics/identity';

/**
 * Wrapper around <ConsentSettings /> for the standalone /privacy/preferences
 * page. Adds a "Reset analytics id" control which clears the persisted
 * `yong2_anon_id` cookie so subsequent pageviews aren't stitched to prior
 * sessions.
 */
export function PreferencesPanel() {
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  function handleReset() {
    clearAnonId();
    setResetMessage('Anonymous analytics id cleared. A fresh id will be issued on your next pageview.');
    window.setTimeout(() => setResetMessage(null), 6000);
  }

  return (
    <div className="space-y-10">
      <ConsentSettings variant="page" showShortcuts />

      <div className="border-t border-white/10 pt-8 space-y-3">
        <div className="caps">Reset Analytics Id</div>
        <p className="text-sm text-stone/70 leading-relaxed max-w-2xl">
          Clearing your anonymous id severs the link between this browser and any prior pageviews we&rsquo;ve
          seen. It does not delete events already collected — for that, email{' '}
          <a href="mailto:privacy@yongchoi.com" className="text-gold underline underline-offset-4">
            privacy@yongchoi.com
          </a>
          .
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="caps text-stone/80 border border-white/15 px-5 py-2 hover:border-gold hover:text-gold transition-colors"
        >
          Reset Anonymous Id
        </button>
        {resetMessage ? <p className="text-sm text-gold-muted">{resetMessage}</p> : null}
      </div>
    </div>
  );
}
