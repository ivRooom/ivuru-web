# Anime Scroll Story

ホームページ冒頭を、スクロール量を時間軸として進行する4章のアニメ作品型体験へ再構成した実装仕様です。

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
- 背景、本文、主役ビジュアル、小物を別レイヤーとして扱う
- 前景は奥から出現し、章の終端で画面手前へ抜ける
- 現在章は`data-story-chapter`、テーマは`data-story-scene`で管理する
- 旧`data-anime-hero`、`data-anime-scene`によるグローバル演出とは分離する

## アクセシビリティ

- 非表示章へ`aria-hidden`と`inert`を同期する
- 表示章と支援技術上の有効章を同じタイムライン境界で切り替える
- `prefers-reduced-motion: reduce`ではピン留め、Z移動、ブラーを使用せず、4章を縦に積む
- JavaScriptが無効でも第1章と主要リンクを表示する
- 日英韓で同じDOM構造を使用する

## レスポンシブ

- PCは本文と主役ビジュアルの2カラム
- Tabletは主役サイズと余白を圧縮する
- Mobileは本文を上、主役を下へ配置する
- `100svh`とSafe Areaを使用し、iOSブラウザの可変UIを考慮する
- Fine pointer環境だけ視差とカードチルトを有効にする

## 性能方針

- 常時稼働するCanvasやWebGLは使用しない
- 背景はCSS、SVG、DOMレイヤーで構築する
- ポインター処理は`requestAnimationFrame`でまとめる
- 動画をファーストビューへ追加しない
- 既存のPerformance BudgetとVisual Regressionを継続する

## インフラ影響

- Netlify Deploy PreviewでPR単位に確認する
- Cloudflare Worker、D1、Queue、Rate Limit、Assets設定は変更しない
- Supabaseスキーマ、認証、Edge Functionは変更しない
- 本番反映はPRのCI・Visual Regression・実機確認後に行う
