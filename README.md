# いゔる。 / ivuru Official Website

DeveloperとGamerを主軸に、個人開発、ゲーム活動、ivRmコミュニティ、クリエイター活動、ブログを一つの世界観へ統合した「いゔる。」の公式サイトです。ID・英語表記は`ivuru`です。

> BUILD. PLAY. CREATE.  
> つくる。遊ぶ。つなげる。

## Status

- 初期リリースは完全な静的サイトです。
- Cloudflare Workers Builds + Static Assetsで公開します。
- 架空の顧客、案件、数値、問い合わせ先は掲載していません。
- `sample: true`の作品・記事は、実データに差し替えるための編集用サンプルです。
- Privacy / Terms / Customer Harassment Policyは運用草案です。正式公開前に実際の受付方法と法務観点を確認してください。

## Technology

- Astro 7 / React / TypeScript
- Tailwind CSS 4
- Astro Content Collections / MDX
- GSAP / ScrollTrigger
- Motion（Framer Motion）
- Three.js / React Three Fiber / Drei
- Cloudflare Workers Static Assets / Wrangler
- Lucide Icons
- ESLint / Prettier / Vitest / Playwright

## Requirements

- Node.js 22.22.3（推奨）または`package.json`の`engines`を満たすバージョン
- npm 10以上

```bash
npm install
npm run dev
```

開発サーバーは通常`http://localhost:4321`で起動します。

## Commands

```bash
npm run dev             # Astro開発サーバー
npm run check           # Astro / TypeScript型チェック
npm run lint            # ESLint
npm run format          # Prettierで整形
npm run format:check    # 整形差分の確認
npm test                # Vitest
npm run test:e2e        # Playwright
npm run build           # 静的ビルド（dist/）
npm run preview         # Astroでビルド結果を確認
npm run deploy:check    # ビルド + Wrangler dry-run
npm run deploy          # Cloudflareへ本番デプロイ
npm run deploy:preview  # デプロイせず新しいWorker Versionをアップロード
```

## Main routes

日本語は言語プレフィックスなし、英語は`/en`、韓国語は`/ko`です。

- `/`, `/profile`, `/works`, `/works/[slug]`, `/portfolio`, `/blog`, `/blog/[slug]`
- `/privacy`, `/terms`, `/customer-harassment`, `/404`
- `/en/...`
- `/ko/...`

## World experience

全ページは次の共通体験へ統合しています。

- 初回アクセス・リロード: World Gateロード演出
- 内部ページ遷移: Chapter Cut
- Profile: Character Profile
- Works: World Select / Mission Select
- Works詳細: Mission Briefing
- Portfolio: Developer World System Console
- Blog: Digital Archive Terminal
- ivRm: Digital Room
- スクロール進行: Dawn / Day / Sunset / NightのWorld State
- Works一覧と詳細: View Transition共有要素
- `prefers-reduced-motion`では主要アニメーションを短縮・停止

`ChapterCut`は内部リンクの遷移先を表示します。IntroLoaderはページ遷移では再生せず、Chapter Cutと重複しない設計です。

## Updating site data

設定・プロフィール・リンク・作品・活動は`src/data/`で管理します。

- `site-config.ts`: サイトURL、X、Instagram、GitHub、Discord、ivRm、問い合わせ、言語、受付状態、Analytics、OGP
- `profile.ts`: 役割、興味、技術、タイムライン
- `projects.ts`: Worksの項目と詳細
- `activities.ts`: Activity / Now
- `categories.ts`: Works / Blogのカテゴリー
- `navigation.ts`: 共通ナビゲーション

URLが空文字のリンクは表示しない設計です。未確定の問い合わせ先やSNSアカウントを作らないでください。

## Social embeds

XとInstagramは、ページ表示時に外部スクリプトを自動読み込みしません。利用者が表示ボタンを押した後にのみ各サービスへ接続します。

### X

- Account: `@ivuruGG`
- Script: `https://platform.x.com/widgets.js`
- タイムラインが読み込めない場合は、Xプロフィールへの通常リンクを表示

### Instagram

Instagramには任意のプロフィールURLと、表示対象として選んだ個別投稿URLを設定します。URL未設定時は架空のアカウントや投稿を表示しません。

```text
PUBLIC_INSTAGRAM_URL=https://www.instagram.com/your-account/
PUBLIC_INSTAGRAM_POST_URLS=https://www.instagram.com/p/POST_1/,https://www.instagram.com/p/POST_2/
```

- 投稿URLはカンマ区切り
- 最大3件を表示
- タイムライン全体ではなく、権利と掲載内容を確認した投稿だけを選ぶ
- 外部スクリプト拒否・障害時でもサイト本文とリンクは利用可能
- 外部サービス追加時は`public/_headers`のCSPとPrivacy Policyを更新

## Legal pages

- `/privacy`: プライバシーポリシー
- `/terms`: 利用規約
- `/customer-harassment`: カスタマーハラスメント等への対応方針

カスタマーハラスメント対応方針では、暴力・脅迫・侮辱・差別・過剰要求・執拗な連絡・運営妨害・個人情報晒し等を例示し、対応終了、利用制限、警察・弁護士等への相談を記載しています。正当な意見・要望・苦情を制限しないことも明記しています。

運用開始前に、実際の問い合わせ窓口、対応主体、保存期間、準拠法・管轄等を確認してください。

## Adding a project

`src/data/projects.ts`へ項目を追加します。`slug`は小文字kebab-caseにし、確認前の内容は`sample: true`にしてください。画像は`public/assets/works/`へ配置し、権利を確認した実素材だけを使用します。

## Adding a blog post

`src/content/blog/{ja|en|ko}/`に`.md`または`.mdx`を追加します。

```yaml
---
title: 'Title'
description: 'Description'
publishedAt: 2026-07-13
updatedAt: 2026-07-13
category: 'Development'
tags: ['Astro', 'Cloudflare']
locale: 'ja'
thumbnail: '/assets/blog/example.webp'
draft: false
featured: false
sample: false
---
```

`draft: true`は一覧・RSSから除外されます。記事本文の見出しから目次を生成します。

## Translation

共通UI文言は`src/i18n/dictionaries.ts`で管理します。コンポーネント内へ新しい翻訳を直接増やす場合は、同じ変更内で辞書へ移してください。新言語追加時は以下を更新します。

1. `src/data/site-config.ts`の`locales`
2. `src/i18n/dictionaries.ts`
3. `src/pages/{locale}/`
4. `astro.config.mjs`のsitemap i18n設定
5. `BaseLayout.astro`のOG locale / hreflang

## Theme

Light / Dark / Systemに対応し、選択は`ivuru-theme`として`localStorage`へ保存します。初期テーマは`<head>`内で同期適用するため、表示時の点滅を抑えています。

## Images, OGP and video

詳細は[ASSET_REQUIREMENTS.md](./ASSET_REQUIREMENTS.md)を参照してください。

- 画像: AVIF / WebPを優先し、幅・高さ・`sizes`を指定
- 動画: WebM + MP4 + poster
- 背景動画: `muted playsinline loop`
- 画面外の動画はIntersectionObserverで停止
- Data Saverでは自動再生しない
- 著作権上使用できないゲーム・アニメ・キャラクター素材は追加しない
- ブランドOGP: `public/assets/og/ivuru-brand-og.svg`
- SVG非対応クローラー向けPNGフォールバック: `public/assets/og/og-background.png`
- OGPは1200×630、正式表示名は「いゔる。」、ID表記は`ivuru`

## Cloudflare Workers Builds

このプロジェクトはCloudflare Pagesではなく、Cloudflare Workers BuildsとStatic Assetsを使用します。Astroは`output: 'static'`のまま運用し、`@astrojs/cloudflare`サーバーアダプターは使用しません。

### Git連携設定

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch command | `npx wrangler versions upload` |
| Root directory | `/` |
| Node.js | `22.22.3` |
| Static Assets directory | `./dist` |

`wrangler.jsonc`では次を管理します。

- Worker名: `ivrm-ivurugg`
- `assets.directory`: `./dist`
- `assets.not_found_handling`: `404-page`
- `assets.html_handling`: `auto-trailing-slash`

Workerスクリプトの`main`は設定せず、静的成果物だけを配信します。

### Build variables

CloudflareのBuild variablesへ次を設定します。

```text
SITE_URL=https://ivurugg.ivrm.jp
PUBLIC_ANALYTICS_ID=
PUBLIC_CONTACT_URL=
PUBLIC_INSTAGRAM_URL=
PUBLIC_INSTAGRAM_POST_URLS=
```

`SITE_URL`はcanonical、OGP、JSON-LD、sitemap、robots.txt、RSSのURL生成に使用します。コード側にも`https://ivurugg.ivrm.jp`のフォールバックがありますが、本番ではBuild variableを明示してください。

### Headers and redirects

`public/_headers`と`public/_redirects`はビルド時に`dist/`へコピーされ、Workers Static Assetsが読み込みます。

- CSP
- HSTS
- Referrer-Policy
- Permissions-Policy
- 静的アセットの長期キャッシュ
- HTMLの再検証
- 言語・旧URLリダイレクト

SNS埋め込み用CSPはX・Instagramの必要ドメインに限定しています。新しい外部ドメインを追加する際は、読み込み目的、Privacy Policy、フォールバック表示を同時に更新してください。

SPA用の`/* /index.html 200`は使用しません。存在しないURLは最寄りの`404.html`をHTTP 404で返します。

### Deploy and rollback

```bash
npm run deploy:check     # 認証不要のdry-run
npm run deploy           # 本番デプロイ
npm run deploy:preview   # Versionをアップロード
npx wrangler versions list
npx wrangler rollback
```

Workers Buildsでは`main`を本番デプロイし、その他のブランチはVersionアップロードとして扱います。公開後はCloudflare Dashboardで対象コミットSHA、Preview URL、Custom Domain、SSLを確認してください。

## Future contact form

現在は受付先未設定のため送信フォームを有効化していません。次フェーズではCloudflare Worker API、Turnstile、サーバー側バリデーション、レート制限、メール送信APIを追加します。送信後の自動受付メールと、管理側Discord通知を拡張できる構成にします。

## Performance and accessibility

- R3Fはヒーローだけで遅延読み込み
- モバイル、Data Saver、低性能端末、reduced motionでは3Dを静止画へ切り替え
- 通常スクロールを維持し、ScrollTriggerは必要区間だけ使用
- semantic HTML、Skip Link、フォーカス表示、Escape、フォーカストラップ
- View Transitions対応環境ではAstro ClientRouter、非対応時は通常遷移
- JavaScriptなしでも主要本文・リンクはHTMLとして表示
- モバイルナビは`document.body`へPortal描画し、viewport全体を覆います
- 外部SNSは同意後に遅延読み込みし、失敗時は通常リンクへフォールバック

## Deployment checklist

```bash
npm ci
npm run check
npm run lint
npm run format:check
npm test
npm run build
npm run deploy:check
npm run test:e2e -- --project=chromium
```

公開前に、実素材、サイトURL、各種リンク、法務草案、CSP、OGP、モバイル表示、Lighthouse、リンク切れを確認してください。
