import { ExternalLink, Music2, Play } from 'lucide-react';
import { useState } from 'react';

const copy = {
  ja: {
    title: 'Spotifyプレイリストを読み込む',
    description: 'クリックするまでSpotifyへの通信と埋め込みを開始しません。',
    load: 'プレイヤーを読み込む',
    open: 'Spotifyで開く',
  },
  en: {
    title: 'Load the Spotify playlist',
    description: 'No Spotify connection or embed is created until you choose to load it.',
    load: 'Load player',
    open: 'Open in Spotify',
  },
  ko: {
    title: 'Spotify 플레이리스트 불러오기',
    description: '선택하기 전에는 Spotify 연결과 임베드를 시작하지 않습니다.',
    load: '플레이어 불러오기',
    open: 'Spotify에서 열기',
  },
} as const;

export default function DeferredSpotify({
  locale,
  embedUrl,
}: {
  locale: keyof typeof copy;
  embedUrl: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const t = copy[locale];
  const externalUrl = embedUrl.replace('/embed/', '/').split('?')[0];

  if (loaded) {
    return (
      <div className="spotify-frame" data-spotify-loaded="true">
        <iframe
          title="Spotify playlist"
          src={embedUrl}
          width="100%"
          height="352"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
        <a href={externalUrl} target="_blank" rel="noopener noreferrer">
          {t.open} <ExternalLink aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <div className="spotify-consent" data-spotify-loaded="false">
      <span className="spotify-disc" aria-hidden="true">
        <Music2 />
      </span>
      <div>
        <h3>{t.title}</h3>
        <p>{t.description}</p>
      </div>
      <button
        type="button"
        data-analytics-event="spotify_load"
        data-analytics-surface="profile_favorites_music"
        onClick={() => setLoaded(true)}
      >
        <Play aria-hidden="true" /> {t.load}
      </button>
    </div>
  );
}
