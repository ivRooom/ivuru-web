import { useEffect, useState } from 'react';

interface XProfilePayload {
  ok: boolean;
  source: 'x' | 'fallback';
  username: string;
  name: string;
  description: string;
  profileImageUrl: string;
  profileBannerUrl: string | null;
  profileUrl: string;
  verified: boolean;
  fetchedAt: string;
}

interface XProfileIdentityProps {
  variant?: 'hero' | 'passport';
  priority?: boolean;
  showDescription?: boolean;
}

const fallbackProfile: XProfilePayload = {
  ok: false,
  source: 'fallback',
  username: 'ivuruGG',
  name: 'いゔる。 / ivuru',
  description: 'Developer / Gamer / Community operator',
  profileImageUrl: '',
  profileBannerUrl: null,
  profileUrl: 'https://x.com/ivuruGG',
  verified: false,
  fetchedAt: '',
};

const PROFILE_REQUEST_CACHE_MS = 300_000;
let profileRequest: Promise<XProfilePayload> | undefined;
let profileRequestStartedAt = 0;

const requestProfile = () => {
  const now = Date.now();
  if (!profileRequest || now - profileRequestStartedAt >= PROFILE_REQUEST_CACHE_MS) {
    profileRequestStartedAt = now;
    profileRequest = fetch('/api/x-profile', {
      headers: { accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`X profile request failed: ${response.status}`);
        return (await response.json()) as XProfilePayload;
      })
      .catch(() => fallbackProfile);
  }
  return profileRequest;
};

export default function XProfileIdentity({
  variant = 'hero',
  priority = false,
  showDescription = false,
}: XProfileIdentityProps) {
  const [profile, setProfile] = useState<XProfilePayload>(fallbackProfile);
  const [ready, setReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let active = true;
    requestProfile().then((result) => {
      if (!active) return;
      setProfile(result);
      setImageFailed(false);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const useBrandFallback = profile.source !== 'x' || !profile.profileImageUrl || imageFailed;

  return (
    <div
      className={`x-profile-identity is-${variant} ${ready ? 'is-ready' : 'is-loading'}`}
      data-x-profile-source={profile.source}
      data-x-profile-visual={useBrandFallback ? 'brand' : 'x'}
      aria-busy={!ready}
    >
      <div className="x-profile-image-shell">
        {!useBrandFallback && profile.profileBannerUrl ? (
          <img
            className="x-profile-banner"
            src={profile.profileBannerUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <span className="x-profile-glitch-layer" aria-hidden="true"></span>
        {useBrandFallback ? (
          <div
            className="x-profile-avatar-fallback"
            role="img"
            aria-label={`${profile.name}（X: @${profile.username}）`}
          >
            <span className="x-profile-fallback-orbit orbit-a"></span>
            <span className="x-profile-fallback-orbit orbit-b"></span>
            <strong>IV</strong>
            <small>PROFILE / SIGNAL</small>
          </div>
        ) : (
          <img
            className="x-profile-avatar"
            src={profile.profileImageUrl}
            alt={`${profile.name}（X: @${profile.username}）`}
            width={720}
            height={720}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        )}
        <span className="x-profile-scanline" aria-hidden="true"></span>
        <span className="x-profile-source-badge">
          {useBrandFallback ? 'BRAND FALLBACK' : 'LIVE FROM X'}
        </span>
      </div>

      {variant === 'passport' ? (
        <div className="x-profile-live-data" aria-live="polite">
          <div>
            <span>PROFILE SIGNAL</span>
            <strong>{profile.name}</strong>
          </div>
          <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer">
            @{profile.username} ↗
          </a>
          {showDescription ? <p>{profile.description}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
