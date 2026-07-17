# Site-wide Motion Design System

PR #42で導入したホームのアニメスクロールストーリーを基準に、全ページの遷移、ナビゲーション、操作状態、表示アニメーションを統一するための仕様です。

## 目的

- ホームと下層ページを同一作品世界として接続する
- 現在地と次の行動を、章番号・Active状態・CTA階層で明確にする
- 操作へ即座に反応し、情報表示と主役演出の速度を分離する
- PC、モバイル、キーボード、Reduced Motion、JavaScript無効時に基本導線を維持する
- スクロール処理をIntersection Observer、描画更新をtransform / opacity中心に保つ

## Motion Token

CSSは`src/styles/motion-system.css`、React / Framer Motionは`src/lib/motion.ts`を参照します。

| Token | CSS | React | 用途 |
|---|---:|---:|---|
| Instant | 90ms | 0.09s | Pressed、状態確定 |
| Fast | 180ms | 0.18s | Hover、Focus、アイコン |
| Standard | 320ms | 0.32s | カード、メニュー、パネル |
| Cinematic | 520ms | 0.52s | ページ遷移、主要セクション |
| Exit | 220ms | 0.22s | 退出、キャンセル |
| Apple Ease | `cubic-bezier(0.16, 1, 0.3, 1)` | `[0.16, 1, 0.3, 1]` | 標準表示 |
| Spring Ease | `cubic-bezier(0.22, 1.24, 0.36, 1)` | `[0.22, 1.24, 0.36, 1]` | 小さなアイコン・選択反応 |
| Exit Ease | `cubic-bezier(0.4, 0, 1, 1)` | `[0.4, 0, 1, 1]` | 退出 |
| Distance | 8 / 16 / 28px | 8 / 16 / 28 | 操作 / 情報 / 主役 |
| Pressed scale | 0.985 | 0.985 | 押下 |
| Stagger | 48ms | 0.048s | メニュー・短いリスト |

一画面で強く動く主役は原則1つです。HoverやPressedはFast / Instant、情報表示はStandard、ページ遷移と主役演出だけCinematicを使用します。

## ページ遷移

Astro 7の`ClientRouter`を`BaseLayout.astro`で全ページへ適用します。

- `site-header`を共有トランジション名として安定表示する
- `page-content`を共有トランジション名として、forward / backで方向を切り替える
- 退出は短く、進入はApple Easeで滑らかにする
- `astro:before-preparation`から上部のRoute Progressを表示する
- `astro:after-preparation`で進捗を90%付近へ進める
- `astro:page-load`で完了し、通常状態へ戻す
- 遷移中は`body[aria-busy=true]`を設定する
- 新規遷移後は最初の`h1`へフォーカスする
- ハッシュがある場合はアンカー先へフォーカスする
- history traverseではスクロール復元を優先し、強制フォーカスしない
- JavaScript無効時は通常のMPA遷移へフォールバックする

## Header / Navigation

- Activeリンクへ`aria-current=page`を設定する
- 章番号とページタイトルをHeader内の現在地表示へ出す
- Headerのscrolled状態は直接scroll listenerではなくIntersection Observerで判定する
- Mobile MenuはEscapeで閉じる
- Tab / Shift+TabをDialog内で循環させる
- 開いている間は背景要素を`inert`にする
- 閉じた後はトリガーへフォーカスを戻す
- `astro:before-preparation`と`ivuru:route-start`で確実に閉じる
- Safe Areaと短い画面高の既存レイアウトを維持する

## Button / Card / Link States

共通スタイルは以下を扱います。

- Default
- Hover（Hover + Fine Pointerのみ）
- Focus Visible
- Pressed
- Loading（`aria-busy=true`または`data-state=loading`）
- Disabled（`disabled`、`aria-disabled=true`、`data-state=disabled`）
- External Link（`target=_blank`へ`data-ui-external=true`を同期）
- Selected / Active（`aria-current=page`）
- Error（`data-state=error`）
- Success（`data-state=success`）

タッチ端末ではHover依存と3Dチルトを無効化し、主要操作の最小高さを44pxにします。

## Reduced Motion

`prefers-reduced-motion: reduce`では次を停止または1msへ短縮します。

- ページ遷移の移動とフェード
- ズーム、3D回転、Pressed scale
- 長いスタッガー
- 連続アニメーション
- Smooth Scroll

コンテンツ、リンク、現在地、操作結果は維持します。

## Performance

- Headerの通常スクロール判定はIntersection Observer
- 表示監視は既存`ScrollEffects`のIntersection Observer
- ページ遷移はtransform / opacity中心
- Page Transitionのための動画、Canvas、WebGLは追加しない
- Fine Pointer以外では3D Card Transformを無効化する
- `visibilitychange`で非アクティブタブのCSS animationをpauseする
- 60fpsは保証値ではなく、60fpsを狙える構造として扱う

## テスト

- `tests/unit/sitewide-motion-contract.test.ts`
  - Motion Token
  - ClientRouter / Lifecycle
  - HeaderのIntersection Observer契約
  - Mobile MenuのEscape / Focus Trap / inert
  - Reduced Motion / 非アクティブ停止
  - transform / opacity中心の遷移
- `tests/e2e/sitewide-navigation.spec.ts`
  - 主要ページ遷移
  - 戻る
  - 遷移後フォーカス
  - Active状態
  - アンカーリンク
  - 外部リンク
  - Reduced Motion
  - JavaScript無効時の通常遷移

## 既知の制約

- `ClientRouter`ではページ固有のbundled scriptが再実行されない場合があるため、ページ再初期化は`astro:page-load`へ接続する
- ブラウザのView Transitions API非対応時はAstroのanimate fallbackを使用する
- 端末性能、GPU、ブラウザ、解像度、電源状態によって実フレームレートは変動する

## インフラ影響

- Cloudflare Worker / D1 / Queue / bindings変更なし
- Netlify Functions / Edge Functions変更なし
- Supabase schema / Auth / Edge Functions変更なし
- PR段階では本番デプロイしない
