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
- ストーリー全体をScrollTriggerで固定し、章ごとにZ方向の移動、スケール、ブラー、透明度を同期する
- タイムラインの章ラベルへ`labelsDirectional`スナップを適用し、操作方向に沿って最寄りの章へ吸着する
- 背景、本文、主役ビジュアル、小物を別レイヤーとして扱う
- シーン背景は円形マスク、本文は矩形マスク、主役ビジュアルは円形マスクから展開する
- 前景は奥から出現し、章の終端で画面手前へ抜ける
- 現在章は`data-story-chapter`、テーマは`data-story-scene`で管理する
- スナップ契約は`data-story-snap`、マスク契約は`data-story-mask`でE2Eから確認できる
- 飛行パスは`data-story-flight-path`を使用し、共通`data-blue-path`のScrollTriggerから分離する
- 旧`data-anime-hero`、`data-anime-scene`によるグローバル演出とは分離する

## デザインシステム

- 背景はディープネイビー、本文は白、補助情報はアイスブルーを基本とする
- ネオンは常用せず、シアンとバイオレットを章の光源として限定使用する
- 見出しはモダンなサンセリフと詰めた字間を使用し、一画面一主役を守る
- 表面は半透明のダークガラスと細いヘアラインで統一する
- 進行UIとボタンは装飾を抑え、余白とコントラストで階層を示す
- Canvas、WebGL、ファーストビュー動画へ依存せずCSS、SVG、DOMレイヤーで構築する

## アクセシビリティ

- 非表示章へ`aria-hidden`と`inert`を同期する
- 表示章と支援技術上の有効章を同じタイムライン境界で切り替える
- `prefers-reduced-motion: reduce`ではピン留め、スナップ、Z移動、ブラー、マスクを使用せず、4章を縦に積む
- JavaScriptが無効でも第1章と主要リンクを表示する
- 日英韓で同じDOM構造を使用する

## レスポンシブ

- PCは本文と主役ビジュアルの2カラム
- Tabletは主役サイズと余白を圧縮する
- Mobileは本文を上、主役を下へ配置する
- `100svh`とSafe Areaを使用し、iOSブラウザの可変UIを考慮する
- Motionモードでは固定ステージの`min-height`を解除し、画面高679px以下ではコピー・余白・ポータル位置を追加圧縮する
- MobileではZ移動、ブラー、視差、スタッガーを縮小し、装飾レイヤーの一部を非表示にする
- Fine pointer環境だけ視差とカードチルトを有効にする

## 導線と計測

- 第3章のNEWS、GAMES、FAVORITESは装飾ではなく実際のローカライズ済みリンクとして提供する
- `AnimeStoryAnalytics.tsx`が`world_portal_open`、target、surface、positionを既存のAnalyticsBridge契約へ同期する
- デスクトップとモバイルで同一の遷移先・計測項目を維持する

## 性能方針

- 常時稼働するCanvasやWebGLは使用しない
- 背景はCSS、SVG、DOMレイヤーで構築する
- ポインター処理は`requestAnimationFrame`でまとめる
- 動画をファーストビューへ追加しない
- モーション対象へ`will-change`を限定し、固定ステージへpaint containmentを適用する
- 既存のPerformance BudgetとVisual Regressionを継続する

## インフラ影響

- Netlify Deploy PreviewでPR単位に確認する
- Cloudflare Worker、D1、Queue、Rate Limit、Assets設定は変更しない
- Supabaseスキーマ、認証、Edge Functionは変更しない
- 本番反映はPRのCI・Visual Regression・実機確認後に行う
