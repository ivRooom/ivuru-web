# Blue Media Universe Design Direction

## Purpose

ivuru公式サイトを、青・白・濃紺を基調としたアニメ・ゲーム・エンタメ系のメディア体験へ統一します。

参考サイトの大胆なタイポグラフィ、キャラクター中心の構図、スクロールごとのシーン転換を参考にします。ただし、レイアウト、イラスト、文言、アニメーションはivuru向けに独自設計し、そのまま複製しません。

## Visual system

- 基本色はWhite、Ice Blue、Signal Blue、Deep Navy
- ピンク、紫、クリームは主要色として使用しない
- オリジナルキャラクターとコンテンツを主役にする
- キャラクターはセル塗り、太さの揃った輪郭線、限定色、整理された陰影で構成する
- テカテカした質感、過剰な描き込み、不自然な光沢、写真風の肌処理を使用しない
- 放射ライン、斜めカット、ハーフトーン、円形シグナルを共通モチーフとする
- 装飾よりも見出し、キャラクター、CTA、本文の順で視線を誘導する
- 外部キャラクター素材へ依存せず、`public/assets/visuals/blue-anime/`のオリジナル素材を使用する

## Navigation

グローバルナビゲーションはHome、Profile、Works、News、Blog、Contactに限定します。GamesはHomeのBlue Channelsから、FavoritesはProfile内の`#favorites`からアクセスします。

### Mobile menu

- 右上のトリガー位置を起点に円形マスクで画面を展開する
- メニュー本体、Worldカード、ナビゲーション項目を段階表示する
- Escape、背景タップ、リンク選択、デスクトップ幅への変更で閉じる
- フォーカストラップと背景スクロール抑制を維持する
- 日本語、英語、韓国語で開閉ラベルとダイアログ名を切り替える
- `prefers-reduced-motion`では円形マスクを短いフェードへ置き換える

## Motion language

### Loader

- 初回は最大2.7秒、再訪は最大1.05秒で完了する
- 実際の`window.load`と最小表示時間を組み合わせる
- カーテン、円形シグナル、マスコット、タイトル、進捗バーを順に表示する
- ロード完了後は斜めカットで本編へつなぐ
- JavaScript無効時はローダーを非表示にし、本文を妨げない

### Hero

- コピー、見出し行、キャラクター、CTAを時間差で表示する
- キャラクターとコピーを異なる速度でスクロールさせる
- 円形軌道とSVGパスをスクロール進行に連動させる
- キャラクターの常時アニメーションは10px以内の上下移動に限定する

### Sections

- 見出しは36px以内の移動とマスク解除で表示する
- イラストは斜めクリップを解除しながら表示する
- 複数カードは100ms間隔で順に表示する
- セクションに応じてIce、Sky、Deepの青系背景へ切り替える
- `ScrollEffects`は`BaseLayout`で1回だけマウントする

## Performance and accessibility

- `prefers-reduced-motion: reduce`ではスクロールアニメーションと常時ループを停止する
- reduced motionでも全コンテンツを即時表示し、透明状態を残さない
- JavaScriptが読み込めない場合も本文とリンクを表示する
- 装飾SVGはローカル配信し、外部画像APIへの通信を発生させない
- 動画はData Saver、低速回線、画面外停止を維持する
- PC、Tablet、Mobile、Light、Dark、日英韓で同じ情報構造を提供する
- モバイルメニューはキーボード操作、Escape、フォーカストラップに対応する
- 青い背景には白またはIce Blue、白い背景にはDeep Navyを使用し、本文とCTAの判読性を確認する

## Illustration assets

- `ivuru-hero-blue.svg`: トップ用セル塗りキャラクター
- `ivuru-loader-blue.svg`: ローダー用フローティングマスコット
- `ivuru-news-blue.svg`: Newsチャンネル
- `ivuru-games-blue.svg`: Gamesチャンネル
- `ivuru-favorites-blue.svg`: Favoritesチャンネル

すべて`public/assets/visuals/blue-anime/`で管理します。

## QA baseline

Blue Media Universeを変更するPRでは、次の品質ゲートを通過させます。

- Production dependency audit
- Astro / TypeScript、ESLint、Prettier、Unit test、Production Build
- Performance Budget、Cloudflare Durable Mode、Wrangler dry-run
- Playwright Chromium E2E、Visual Regression、Netlify Deploy Preview
- 初回ローダー、再訪ローダー、`prefers-reduced-motion`の3条件
- `window.load`前はローダーを維持し、JavaScript無効時は本文とリンクを妨げないこと
- ローダーとモバイルメニューのラベルが日本語、英語、韓国語へ切り替わること
- モバイルメニューでEscape、フォーカストラップ、背景スクロール抑制が動作すること
- 日本語、英語、韓国語とPC、Tablet、Mobileの主要表示
- ライトモードとダークモードで本文、CTA、キャラクターが判読可能であること

実機SafariとAndroid Chromeは、本番反映前のリリース確認で補完します。
