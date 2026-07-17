# Anime Scroll Story

ホームページ冒頭を、スクロール量を時間軸として進行する4章のアニメ作品型体験へ再構成した実装仕様です。

世界観は「青い近未来SF × 現代ポップ × 星海ファンタジー」とし、Apple製品ページのような余白、タイポグラフィ、奥行き、吸着感を組み合わせます。

- Linear: [IVR-227](https://linear.app/mizzzjp/issue/IVR-227/apple級スナップマスク演出でアニメスクロールストーリーを最終研磨)
- GitHub: [PR #42](https://github.com/ivRooom/ivuru-web/pull/42)

## 章構成

| 章  | テーマ       | 主なビジュアル                   | 役割                             |
| --- | ------------ | -------------------------------- | -------------------------------- |
| 01  | 青の境界     | 空、海、IVモノグラム             | ブランドと世界観の導入           |
| 02  | つくる世界   | 都市、光のレール、開発デバイス   | Web / Cloud / APIの表現          |
| 03  | 遊ぶ世界     | 月、遠近グリッド、ゲームポータル | News / Games / Favoritesへの導線 |
| 04  | つながる世界 | 星空、オーロラ、光点、ivRm       | コミュニティの表現               |

## モーションモデル

- `AnimeScrollDirector.tsx`がストーリー専用のGSAPタイムラインを管理する
- GSAPとScrollTriggerは静的importせず、ストーリーがビューポートへ近づいた時だけ動的importする
- ストーリー全体をScrollTriggerで固定し、章ごとにZ方向の移動、スケール、透明度を同期する
- PCでは`labelsDirectional`スナップを適用し、操作方向に沿って最寄りの章へ吸着する
- Mobileではスナップを停止し、短いscrubで指追従を優先する
- 背景、本文、主役ビジュアル、小物を別レイヤーとして扱う
- 連続更新するプロパティを`transform`と`opacity`に限定し、ブラーと`clip-path`のスクロール更新を行わない
- 前景は奥から出現し、章の終端で画面手前へ抜ける
- 進行バーはCSS変数ではなく、専用要素の`scaleX()`をGSAP `quickSetter`で更新する
- 現在章は`data-story-chapter`、性能契約は`data-story-performance="transform-only"`で管理する
- 飛行パスは`data-story-flight-path`を使用し、共通演出から分離する

## 共通スクロール処理

- `ScrollEffects.tsx`は複数のGSAP ScrollTriggerを廃止し、単一のIntersection Observer群で表示開始とシーン切り替えを行う
- 通常セクションの表示演出は一度だけ発火し、完了後は`will-change: auto`へ戻す
- 対応ブラウザではCSS Scroll-driven Animationsの`animation-timeline: view()`を使って軽量な視差を付ける
- 非対応ブラウザでは視差を無理にJavaScript再実装せず、静的表示へ安全にフォールバックする
- カードチルトは可視領域へ入ったカードだけにイベントを登録する
- ポインター座標は`requestAnimationFrame`で1フレーム1回へ集約する
- `getBoundingClientRect()`はpointerenter時にキャッシュし、ResizeObserverで無効化する

## Apple系イージング

- 共通表示: `cubic-bezier(0.16, 1, 0.3, 1)`
- 主役ビジュアル: `back.out(1.12)`を限定的に使用
- コピー: `expo.out`
- 退出: `power3.in`
- スクロール追従部分は過剰なスプリングを避け、入力と表示の遅延を抑える

## デザインシステム

- 背景はディープネイビー、本文は白、補助情報はアイスブルーを基本とする
- ネオンは常用せず、シアンとバイオレットを章の光源として限定使用する
- 見出しはモダンなサンセリフと詰めた字間を使用し、一画面一主役を守る
- セクション間へPCで最大220px、Mobileで最大120pxの余白を確保する
- 動くカードの`backdrop-filter`を避け、濃度の高いグラデーション面でガラス感を表現する
- Canvas、WebGL、ファーストビュー動画へ依存せずCSS、SVG、DOMレイヤーで構築する

## 音楽・公開プロフィール

- SpotifyプレイリストID: `37i9dQZEVXdgE4Qkd43TnK`
- Spotify iframeは初期表示で生成せず、利用者が「プレイリストを表示」を押した時だけ読み込む
- 外部リンクは常に表示し、Spotify iframeが利用できなくても導線を失わない
- Xは`@ivuruGG`、GitHubは`mizzz-dev`、SNS総合導線は`lit.link/ivuruGG`を使用する
- lit.linkから取得できない個別SNS URLは推測して設定しない

## アクセシビリティ

- 非表示章へ`aria-hidden`と`inert`を同期する
- 表示章と支援技術上の有効章を同じタイムライン境界で切り替える
- 次章の有効化は前章の退出完了後へ遅延し、見えている章と操作できる章を一致させる
- `prefers-reduced-motion: reduce`ではピン留め、スナップ、Z移動を使用せず、4章を縦に積む
- JavaScriptが無効でも4章すべてと主要リンクを表示する
- 日英韓で同じDOM構造を使用する

## レスポンシブ

- PCは本文と主役ビジュアルの2カラム
- Tabletは主役サイズと余白を圧縮する
- Mobileは本文を上、主役を下へ配置する
- `100svh`とSafe Areaを使用し、iOSブラウザの可変UIを考慮する
- MobileではZ移動、視差、スタッガーを縮小し、装飾レイヤーの一部を非表示にする
- Fine pointer環境だけカードチルトを有効にする

## 検証契約

- Unit Testで直接scroll listenerが存在しないことを検査する
- Unit TestでGSAPが動的importであることを検査する
- Unit Testでストーリー処理に`clipPath`と`filter`更新がないことを検査する
- E2Eで`data-story-performance="transform-only"`、進行バー、章切り替え、Reduced Motionを確認する
- E2EでSpotifyが操作前に読み込まれないことと、公開プロフィールURLを確認する
- Performance BudgetとVisual Regressionを継続する

## インフラ影響

- Netlify Deploy PreviewでPR単位に確認する
- Cloudflare Worker、D1、Queue、Rate Limit、Assets設定は変更しない
- Supabaseスキーマ、認証、Edge Functionは変更しない
- 本番反映はPRのCI・Visual Regression・実機確認後に行う
