import type { AnalyticsEventDetail, AnalyticsEventName } from '@/data/analytics-events';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const localeFromPath = (pathname: string): 'ja' | 'en' | 'ko' => {
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  if (pathname === '/ko' || pathname.startsWith('/ko/')) return 'ko';
  return 'ja';
};

export const emitAnalyticsEvent = (
  name: AnalyticsEventName,
  detail: Omit<Partial<AnalyticsEventDetail>, 'name' | 'path' | 'locale'> = {},
) => {
  if (typeof window === 'undefined') return;

  const payload: AnalyticsEventDetail = {
    name,
    path: window.location.pathname,
    locale: localeFromPath(window.location.pathname),
    ...detail,
  };

  window.dispatchEvent(
    new CustomEvent<AnalyticsEventDetail>('ivuru:analytics', { detail: payload }),
  );

  if (typeof window.gtag === 'function') {
    const { name: eventName, ...parameters } = payload;
    window.gtag('event', eventName, parameters);
  }
};
