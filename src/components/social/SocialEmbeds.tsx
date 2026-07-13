import { useEffect, useMemo, useState } from 'react';

type Props = {
  locale: 'ja' | 'en' | 'ko';
  xUrl: string;
  xHandle: string;
  instagramUrl: string;
  instagramPosts: string[];
};

type ExternalWindow = Window & {
  twttr?: { widgets?: { load?: (element?: HTMLElement) => void } };
  instgrm?: { Embeds?: { process?: () => void } };
};

const copy = {
  ja: {
    loadX: 'Xタイムラインを読み込む',
    loadInstagram: 'Instagramハイライトを読み込む',
    external: '外部サービスのコンテンツを表示すると、XまたはInstagramへ接続します。',
    fallback: '埋め込みを表示できない場合は、プロフィールを直接開いてください。',
    instagramPending: 'Instagram投稿URLを設定すると、選んだ投稿をここへ表示できます。',
    openProfile: 'プロフィールを開く',
  },
  en: {
    loadX: 'Load X timeline',
    loadInstagram: 'Load Instagram highlights',
    external: 'Loading external media connects your browser to X or Instagram.',
    fallback: 'Open the profile directly if the embed cannot be displayed.',
    instagramPending: 'Add Instagram post URLs to display selected posts here.',
    openProfile: 'Open profile',
  },
  ko: {
    loadX: 'X 타임라인 불러오기',
    loadInstagram: 'Instagram 하이라이트 불러오기',
    external: '외부 콘텐츠를 표시하면 X 또는 Instagram에 연결됩니다.',
    fallback: '임베드가 표시되지 않으면 프로필을 직접 열어 주세요.',
    instagramPending: 'Instagram 게시물 URL을 설정하면 선택한 게시물을 표시할 수 있습니다.',
    openProfile: '프로필 열기',
  },
} as const;

const injectScript = (id: string, src: string) => {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) return existing;
  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  script.crossOrigin = 'anonymous';
  document.body.appendChild(script);
  return script;
};

export default function SocialEmbeds({ locale, xUrl, xHandle, instagramUrl, instagramPosts }: Props) {
  const [xLoaded, setXLoaded] = useState(false);
  const [instagramLoaded, setInstagramLoaded] = useState(false);
  const labels = copy[locale];
  const normalizedPosts = useMemo(
    () => instagramPosts.map((url) => url.trim()).filter(Boolean).slice(0, 3),
    [instagramPosts],
  );

  useEffect(() => {
    if (!xLoaded) return;
    localStorage.setItem('ivuru-external-x', 'allowed');
    const script = injectScript('x-widgets-script', 'https://platform.x.com/widgets.js');
    const process = () => (window as ExternalWindow).twttr?.widgets?.load?.();
    script.addEventListener('load', process, { once: true });
    window.setTimeout(process, 80);
    return () => script.removeEventListener('load', process);
  }, [xLoaded]);

  useEffect(() => {
    if (!instagramLoaded || normalizedPosts.length === 0) return;
    localStorage.setItem('ivuru-external-instagram', 'allowed');
    const script = injectScript('instagram-embed-script', 'https://www.instagram.com/embed.js');
    const process = () => (window as ExternalWindow).instgrm?.Embeds?.process?.();
    script.addEventListener('load', process, { once: true });
    window.setTimeout(process, 80);
    return () => script.removeEventListener('load', process);
  }, [instagramLoaded, normalizedPosts]);

  return (
    <div className="social-terminal-grid">
      <section className="social-terminal-card social-x-card" aria-labelledby="social-x-title">
        <div className="social-terminal-head">
          <span>CHANNEL / X</span>
          <strong id="social-x-title">{xHandle}</strong>
          <i data-status={xLoaded ? 'online' : 'standby'}>{xLoaded ? 'ONLINE' : 'STANDBY'}</i>
        </div>
        {!xLoaded ? (
          <div className="social-consent-panel">
            <p>{labels.external}</p>
            <button type="button" className="primary-button" onClick={() => setXLoaded(true)}>
              {labels.loadX}
            </button>
            <a href={xUrl} target="_blank" rel="noopener noreferrer">
              {labels.openProfile} ↗
            </a>
          </div>
        ) : (
          <div className="social-embed-frame" data-provider="x">
            <a
              className="twitter-timeline"
              data-theme="dark"
              data-chrome="noheader nofooter noborders transparent"
              data-height="620"
              href={`${xUrl}?ref_src=twsrc%5Etfw`}
            >
              Posts by {xHandle.replace('@', '')}
            </a>
            <p className="social-fallback">
              {labels.fallback} <a href={xUrl}>{xHandle} ↗</a>
            </p>
          </div>
        )}
      </section>

      <section className="social-terminal-card social-instagram-card" aria-labelledby="social-instagram-title">
        <div className="social-terminal-head">
          <span>CHANNEL / INSTAGRAM</span>
          <strong id="social-instagram-title">HIGHLIGHTS</strong>
          <i data-status={instagramLoaded ? 'online' : 'standby'}>
            {instagramLoaded ? 'ONLINE' : 'STANDBY'}
          </i>
        </div>
        {normalizedPosts.length === 0 ? (
          <div className="social-consent-panel">
            <p>{labels.instagramPending}</p>
            {instagramUrl && (
              <a className="secondary-button" href={instagramUrl} target="_blank" rel="noopener noreferrer">
                {labels.openProfile} ↗
              </a>
            )}
          </div>
        ) : !instagramLoaded ? (
          <div className="social-consent-panel">
            <p>{labels.external}</p>
            <button type="button" className="primary-button" onClick={() => setInstagramLoaded(true)}>
              {labels.loadInstagram}
            </button>
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                {labels.openProfile} ↗
              </a>
            )}
          </div>
        ) : (
          <div className="instagram-highlight-grid">
            {normalizedPosts.map((url) => (
              <blockquote
                key={url}
                className="instagram-media"
                data-instgrm-permalink={url}
                data-instgrm-version="14"
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Instagram post ↗
                </a>
              </blockquote>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
