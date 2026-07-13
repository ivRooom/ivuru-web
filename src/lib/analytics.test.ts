import { describe, expect, it } from 'vitest';
import {
  analyticsEventMap,
  analyticsEventNames,
  analyticsParameterAllowlist,
} from '@/data/analytics-events';

describe('analytics event map', () => {
  it('defines every event exactly once', () => {
    expect(new Set(analyticsEventNames).size).toBe(analyticsEventNames.length);
    expect(Object.keys(analyticsEventMap).sort()).toEqual([...analyticsEventNames].sort());
  });

  it('uses only privacy-safe allowlisted parameters', () => {
    const allowed = new Set(analyticsParameterAllowlist);
    const forbidden = new Set(['name', 'email', 'message', 'subject', 'requestId', 'ip']);

    for (const definition of Object.values(analyticsEventMap)) {
      for (const parameter of definition.parameters) {
        expect(allowed.has(parameter as (typeof analyticsParameterAllowlist)[number])).toBe(true);
        expect(forbidden.has(parameter)).toBe(false);
      }
    }
  });
});
