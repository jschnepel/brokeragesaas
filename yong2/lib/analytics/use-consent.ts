'use client';

import { useEffect, useState } from 'react';
import { readConsent, type ConsentState } from './consent';

/**
 * Hook: subscribe to the current consent state.
 *
 * Reads from cookie on mount and re-reads whenever a `consentChanged` event
 * fires on `window` (dispatched by the cookie banner after each save). The
 * initial value comes from `readConsent` which is safe in SSR (returns the
 * default — false for everything but `necessary`).
 */
export function useConsent(): ConsentState {
  const [state, setState] = useState<ConsentState>(() => readConsent());

  useEffect(() => {
    // Re-read on mount in case SSR returned the default and the cookie is in fact present.
    setState(readConsent());

    const onChange = () => setState(readConsent());
    window.addEventListener('consentChanged', onChange);
    window.addEventListener('consentGranted', onChange);
    return () => {
      window.removeEventListener('consentChanged', onChange);
      window.removeEventListener('consentGranted', onChange);
    };
  }, []);

  return state;
}
