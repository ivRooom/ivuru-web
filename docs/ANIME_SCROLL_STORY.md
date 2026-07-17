# Anime Scroll Story

ホームページ冒頭を、スクロール量を時間軸として進行する4章のアニメ作品型体験へ再構成した実装仕様です。

世界観は「青い近未来SF × 現代ポップ × 星海ファンタジー」とし、Apple製品ページのような余白、タイポグラフィ、奥行き、吸着感を組み合わせます。

- Linear: [IVR-227](https://linear.app/mizzzjp/issue/IVR-227/apple級スナップマスク演出でアニメスクロールストーリーを最終研磨)
- GitHub: [PR #42](https://github.com/ivRooom/ivuru-web/pull/42)
- Netlify: [Deploy Preview](https://deploy-preview-42--ivuru-web.netlify.app)

## 60fpsを狙う実装方針

- 通常セクションの表示開始とシーン判定はIntersection Observerで行う
- `scroll`イベントリスナーを直接登録しない
- GSAPとScrollTriggerは静的importせず、ストーリーが画面へ近づいた時だけ動的importする
- スクロール中に連続更新するプロパティを`transform`と`opacity`へ限定する
- ブラーと`clip-path`をスクロール連動で更新しない
- 進行バーは`scaleX()`をGSAP `quickSetter`で更新する
- ポインター移動は`requestAnimationFrame`で1フレーム1回へ集約する
- `getBoundingClientRect()`はpointerenter時にキャッシュし、ResizeObserverで無効化する
- `will-change`は表示中だけ有効化し、演出完了後は`auto`へ戻す
- 画面外の大型セクションは`content-visibility: auto`で描画を抑制する
- 対応ブラウザではCSSの`animation-timeline: view()`で軽量な視差を適用する

## モーションとイージング

- 共通表示: `cubic-bezier(0.16, 1, 0.3, 1)`
- 主役ビジュアル: `back.out(1.12)`
- コピー: `expo.out`
- 退出: `power3.in`
- PCでは方向付きスナップを維持する
- Mobileではスナップを停止し、短いscrubで指追従を優先する
- `prefers-reduced-motion`ではピン留め、スナップ、Z移動を停止して4章を縦積み表示する

## 音楽・公開プロフィール

- SpotifyプレイリストID: `37i9dQZEVXdgE4Qkd43TnK`
- Spotify iframeは初期表示で生成せず、利用者が表示ボタンを押した時だけ読み込む
- Xは`@ivuruGG`、GitHubは`mizzz-dev`、SNS総合導線は`lit.link/ivuruGG`を使用する
- 確認できない個別SNS URLは推測して設定しない
- Spotify表示は`spotify_load`、外部プロフィールは既存の`social_open`で計測する
- NEWS / GAMES / FAVORITESの分析属性はSSR HTMLへ直接出力する

## アクセシビリティ

- 非表示章へ`aria-hidden`と`inert`を同期する
- GSAP動的importの待機中も第1章以外を即時`inert`にする
- JavaScript無効時も4章すべてと主要リンクを表示する
- 日英韓で同じDOM構造を維持する

## 最終QA

- Type / Astro Check、ESLint、Stylelint、Prettier: 成功
- Unit Test、Production Build、Static Artifact Check: 成功
- Performance Budget、Wrangler Dry Run: 成功
- Playwright全E2E: 成功
- Visual Regression: 成功
- Netlify Deploy Preview: Ready
- GitHubレビュー: 未解決0件

これは60fpsを狙う構造的最適化です。実際のフレームレートは端末、ブラウザ、GPU、画面解像度、電源状態によって変わるため固定値として保証しません。

## インフラ影響

- Cloudflare Worker、D1、Queue、Rate Limit、Assets設定は変更しない
- Supabaseスキーマ、認証、Edge Functionは変更しない
- Cloudflare本番デプロイはPRのためスキップする
- マージと本番反映は未実施
