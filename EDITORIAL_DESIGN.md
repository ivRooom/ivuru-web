# Anime Editorial Motion Direction

## Purpose

トップ、Games、Profile / Favoritesを、読みやすさを保ちながら「かわいいアニメ作品の公式サイト」のような一つの世界へ統合します。

参考サイトの大胆なタイポグラフィ、キャラクターを中心にした画面構成、スクロールごとのシーン転換を参考にします。ただし、レイアウト・イラスト・文言・アニメーションはivuru向けに独自設計し、そのまま複製しません。

## Visual principles

- オリジナルキャラクターとコンテンツを主役にする
- パステルピンク、ラベンダー、スカイブルー、クリーム、ミントを基本色にする
- キャラクターの目、髪、衣装、小物まで具体的に描き、抽象的なAI生成背景だけで済ませない
- イラストは同じ輪郭線、顔、髪色、配色を共有し、ページごとに別人へ見えないようにする
- 大きな発光、粒子、軌道、3D回転を同時に重ねない
- 余白、見出し、キャラクター、CTAの順で視線を誘導する
- 外部キャラクター素材へ依存せず、`public/assets/visuals/anime/`のオリジナルSVGを使用する

## Navigation

グローバルナビゲーションはHome、Profile、Works、News、Blog、Contactに限定します。GamesはHomeのシーンカードから、FavoritesはProfile内の`#favorites`からアクセスします。

## Motion language

### Loader

- 初回は最大2.7秒、再訪は最大1.05秒で完了する
- 実際の`window.load`と最小表示時間を組み合わせ、固定時間だけに依存しない
- カーテン、マスコット、タイトル、進捗バーを順に表示する
- ロード完了後は上方向のマスクで本編へつなぐ

### Hero

- コピーとキャラクターを時間差で表示する
- スクロール中はコピーとキャラクターを異なる速度で動かす
- CTAとトピックは短いスタッガーで表示する
- キャラクターの常時アニメーションは9px以内の上下移動に限定する

### Sections

- 見出しは34px以内の移動とマスク解除で表示する
- イラストは小さなスケール変化とクリップ解除を使用する
- 複数カードは100ms間隔で順に表示する
- セクションに応じて背景をPink / Purple / Blueへ緩やかに切り替える
- 大きな横移動、強いぼかし、連続3D回転を使用しない

## Performance and accessibility

- `prefers-reduced-motion: reduce`ではスクロールアニメーションと常時ループを停止する
- reduced motionでも全コンテンツを即時表示し、透明状態を残さない
- JavaScriptが読み込めない場合も本文とリンクは表示する
- 装飾SVGはローカル配信し、外部画像APIへの通信を発生させない
- 動画を追加する場合はData Saver、低速回線、画面外停止を維持する
- PC、Tablet、Mobile、Light、Dark、日英韓で同じ情報構造を提供する

## Illustration assets

- `ivuru-hero-girl.svg`: トップ用オリジナルキャラクター
- `ivuru-loader-mascot.svg`: ローダー用マスコット
- `ivuru-news-scene.svg`: Newsシーン
- `ivuru-games-scene.svg`: Gamesシーン
- `ivuru-favorites-scene.svg`: Favoritesシーン

すべてのSVGは`public/assets/visuals/anime/`で管理します。

## QA baseline

アニメ体験を変更するPRでは、次の品質ゲートをすべて通過させます。

- Production dependency audit
- Astro / TypeScript、ESLint、Prettier、Unit test、Production Build
- Performance Budget、Cloudflare Durable Mode、Wrangler dry-run
- Playwright Chromium E2E、Visual Regression、Netlify Deploy Preview
- 初回ローダー、再訪ローダー、`prefers-reduced-motion`の3条件
- 日本語、英語、韓国語とPC、Tablet、Mobileの主要表示
- ライトモードとダークモードで本文、CTA、キャラクターが判読可能であること

実機SafariとAndroid Chromeは自動テストだけで完結させず、本番反映前のリリース確認で補完します。
