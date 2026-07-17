import { useState } from 'react';

type Props = {
  locale: 'ja' | 'en' | 'ko';
  playlistId: string;
  playlistUrl: string;
};

const copy = {
  ja: {
    title: 'いま聴いている音楽から、世界観の続きを。',
    body: '音楽は創作とゲームの時間をつなぐ、もうひとつの青いチャンネルです。',
    consent: 'プレイリストを表示するとSpotifyへ接続します。',
    load: 'プレイリストを表示',
    open: 'Spotifyで開く',
    iframe: 'いゔる。のSpotifyプレイリスト',
  },
  en: {
    title: 'Continue the story through the music in rotation.',
    body: 'Music is another blue channel connecting creative work and time spent playing.',
    consent: 'Displaying the playlist connects your browser to Spotify.',
    load: 'Show playlist',
    open: 'Open in Spotify',
    iframe: 'ivuru Spotify playlist',
  },
  ko: {
    title: '지금 듣는 음악으로 세계관의 다음 장면을.',
    body: '음악은 창작과 게임의 시간을 잇는 또 하나의 푸른 채널입니다.',
    consent: '플레이리스트를 표시하면 Spotify에 연결됩니다.',
    load: '플레이리스트 표시',
    open: 'Spotify에서 열기',
    iframe: 'ivuru Spotify 플레이리스트',
  },
} as const;

export default function SpotifyPlaylist({ locale, playlistId, playlistUrl }: Props) {
  const [loaded, setLoaded] = useState(false);
  const labels = copy[locale];
  const embedUrl = `https://open.spotify.com/embed/playlist/${encodeURIComponent(
    playlistId,
  )}?utm_source=generator&theme=0`;

  return (
    <section className="signal-music-player" aria-labelledby="signal-music-title">
      <div className="signal-music-copy">
        <span aria-hidden="true">MUSIC / SPOTIFY</span>
        <h3 id="signal-music-title">{labels.title}</h3>
        <p>{labels.body}</p>
      </div>

      <div className="signal-music-frame" data-loaded={loaded ? 'true' : 'false'}>
        {!loaded ? (
          <div className="signal-music-consent">
            <div className="signal-music-wave" aria-hidden="true">
              {Array.from({ length: 18 }, (_, index) => (
                <i key={index} />
              ))}
            </div>
            <p>{labels.consent}</p>
            <div className="signal-music-actions">
              <button type="button" onClick={() => setLoaded(true)}>
                {labels.load}
              </button>
              <a href={playlistUrl} target="_blank" rel="noopener noreferrer">
                {labels.open} ↗
              </a>
            </div>
          </div>
        ) : (
          <iframe
            src={embedUrl}
            title={labels.iframe}
            width="100%"
            height="352"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>
    </section>
  );
}
