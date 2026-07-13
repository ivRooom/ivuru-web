export type GameClip = {
  slug: string;
  title: string;
  game: string;
  platform: 'youtube' | 'twitch' | 'tiktok' | 'x' | 'local';
  url: string;
  thumbnail?: string;
  publishedAt?: string;
  duration?: string;
  tags?: string[];
  featured?: boolean;
};

// 公開できる実クリップを追加した時点でカードが表示されます。
// 架空のURLや動画は登録しません。
export const gameClips: GameClip[] = [];
