# Editorial Design Direction

## Purpose

トップ、Games、Profile / Favoritesの情報を、過度な装飾より先に理解できる状態へ整えます。

## Principles

- 余白、文字組み、コンテンツの順序を主役にする
- 光彩、花びら、軌道、3D回転、大きな左右移動を常用しない
- 動画は背景演出ではなく、内容を補足する短い記録として扱う
- イラストはクリーム色の紙、濃紺の線、低彩度の差し色で統一する
- 外部キャラクター素材や画像生成サービスへ依存せず、リポジトリ内のオリジナルSVGを使用する
- Light / Dark、PC / Tablet / Mobile、`prefers-reduced-motion`を同じ情報構造で提供する

## Navigation

グローバルナビゲーションはHome、Profile、Works、News、Blog、Contactに限定します。GamesはHomeのExploreカードから、FavoritesはProfile内の`#favorites`からアクセスします。

## Motion

- 通常のRevealは短いフェードと18px以内の移動に限定する
- 横方向の登場は28px以内とし、3D回転を使用しない
- Data Saver、低速回線、低性能端末では動画を生成しない
- `prefers-reduced-motion: reduce`では動画と装飾アニメーションを停止する

## Illustration Assets

オリジナルの手描き風SVGは`public/assets/visuals/editorial/`で管理します。

- `home-studio-sketch.svg`
- `game-room-sketch.svg`
- `favorites-desk-sketch.svg`
- `news-notebook-sketch.svg`
