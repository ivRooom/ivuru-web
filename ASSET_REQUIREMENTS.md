# ivuru Asset Requirements

サイトは壊れた画像や無関係なストック素材を表示しません。公開アセットは、オリジナル生成素材、権利確認済み素材、ブランド用抽象素材に限定します。

## 推奨サイズ

| 用途                    |     推奨サイズ |   比率 | 形式                     |
| ----------------------- | -------------: | -----: | ------------------------ |
| Home hero               | 1920 × 1080 px |   16:9 | WebP / PNG + WebM / MP4  |
| Profile key visual      | 1600 × 2000 px |    4:5 | AVIF / WebP              |
| Work cover              | 1920 × 1200 px |  16:10 | AVIF / WebP              |
| Game clip               | 1920 × 1080 px |   16:9 | WebM / MP4 + WebP poster |
| News / Favorites visual |  1600 × 900 px |   16:9 | AVIF / WebP / PNG        |
| Blog thumbnail          |  1600 × 900 px |   16:9 | AVIF / WebP              |
| OGP                     |  1200 × 630 px | 1.91:1 | PNG / JPG                |

## Video

- Master: 1920 × 1080、24〜30fps、音声なしを基本とする
- Web配信: WebM（VP9 / AV1）+ MP4（H.264）
- 背景ループは6〜12秒、1ファイル4MiB以下を推奨
- すべての動画へ対応posterを用意する
- `muted`、`playsinline`、`loop`を使用する
- 画面外、非表示タブ、Data Saver、低速回線では停止またはposterへ切り替える
- `prefers-reduced-motion`では動画要素を生成しない

## 現行の生成アセット

- `public/assets/visuals/hero-anime-keyvisual.svg`
- `public/assets/video/hero-anime-op-loop.webm`
- `public/assets/video/hero-anime-op-loop.mp4`
- `public/assets/video/hero-anime-op-poster.webp`
- `public/assets/video/games/neon-rift.*`
- `public/assets/video/games/sky-raid.*`
- `public/assets/video/games/prism-arena.*`

## 命名

小文字kebab-caseを使用します。

- `hero-anime-op-loop.webm`
- `game-neon-rift-poster.webp`
- `news-release-2026-07.webp`

## ディレクトリ

`public/assets/`配下の`brand`、`profile`、`works`、`blog`、`community`、`gaming`、`development`、`creative`、`visuals`、`video`、`og`へ用途別に配置します。

## 公開チェック

- 権利、同意、クレジット条件を確認する
- 個人アカウント名、チャットログ、サーバーアドレス、APIキー、個人情報を除去する
- 動画へposterを用意する
- 装飾画像は空の`alt`、情報画像は意味のある代替テキストを設定する
- Performance Budgetとモバイル表示を確認する
- `sample: true`は検証済み情報へ差し替えるまで公開データとして扱わない
