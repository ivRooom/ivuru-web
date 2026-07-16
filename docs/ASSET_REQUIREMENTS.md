# Anime Cyber PNG Asset Requirements

Blue Media Universeの世界観を維持しつつ、既存の人物・シーンSVGを最終イラストへ置き換えるための制作仕様です。

## 共通ルール

- 形式: PNG
- カラーモード: sRGB
- 主要カラー: 青、白、紫、黒
- 既存作品や既存キャラクターを模倣せず、ivuru専用のオリジナルデザインにする
- 細線だけに依存せず、スマートフォン幅でもシルエットが分かる構図にする
- 人物素材は背景透過を推奨
- 画像内に重要な文章を入れない
- Web公開・SNS表示・二次的なトリミングを許可できる権利状態で納品する
- 公開済み画像は同じURLで上書きせず、バージョン付きファイル名で追加する

## 制作用の基準ファイル名

### `/public/assets/images/ivuru-hero-character.png`

- 推奨サイズ: 1600 × 1200px
- 形式: 透過PNG
- 用途: トップページのメインキャラクター
- 構図: 全身または膝上、視線は中央から左寄り
- セーフエリア: 顔と上半身を中央60%以内へ配置
- 右上・右下はサイバー装飾と重なるため重要要素を避ける

### `/public/assets/images/ivuru-profile-fallback.png`

- 推奨サイズ: 1024 × 1024px
- 形式: 正方形PNG
- 用途: X API未設定・障害時、構造化データ
- 構図: アイコン向けバストアップ
- 円形トリミングでも顔が欠けないよう中央70%へ配置

### `/public/assets/images/ivuru-profile-scene.png`

- 推奨サイズ: 1600 × 1067px
- 形式: 横長PNG
- 用途: Profile / Favoritesの情景イラスト
- 構図: 青白のデスク、ゲーム、開発、音楽の要素を一枚に統合
- 左右10%はレスポンシブ時のトリミング余白にする

### `/public/assets/images/channel-news.png`

- 推奨サイズ: 1440 × 960px
- 内容: 通信、記事、ログ、ホログラムを連想するキャラクターシーン

### `/public/assets/images/channel-games.png`

- 推奨サイズ: 1440 × 960px
- 内容: ゲーム、コントローラー、プレイ画面を連想する動きのあるシーン

### `/public/assets/images/channel-favorites.png`

- 推奨サイズ: 1440 × 960px
- 内容: 音楽、創作、コミュニティ、個人的な棚を連想する落ち着いたシーン

## 本番素材への切り替え

`public/_headers`では`/assets/*`を1年間の`immutable`キャッシュとして配信しています。すでに配信したプレースホルダーを同名で上書きすると、利用者のブラウザに古い画像が残る可能性があります。

最終イラストを導入するときは、次のようにバージョン付きファイル名で追加してください。

```text
ivuru-hero-character-v2.png
ivuru-profile-fallback-v2.png
ivuru-profile-scene-v2.png
channel-news-v2.png
channel-games-v2.png
channel-favorites-v2.png
```

同じPRでAstroコンポーネントと`site-config.ts`の参照先も新しいファイル名へ更新し、E2EとVisual Regressionを実行します。画像を再調整する場合も`v3`のようにURLを更新します。

## 圧縮目標

- Hero: 900KB以下
- Profile: 500KB以下
- Channel / Scene: 650KB以下
- 透明領域を必要以上に広くしない
- PNG-24が不要な場合はPNG-8も検討する

## アクセシビリティ

- 装飾だけの画像はHTML側で`alt=""`とする
- Xプロフィール画像は表示名とハンドルを動的な代替テキストへ設定する
- 画像内の文字は補助的な装飾に限定し、情報は必ずHTMLでも提供する

## プレースホルダーについて

現在のリポジトリにはレイアウト確認用の抽象PNGが入っています。最終イラストはバージョン付きの新規ファイルとして追加し、参照先を更新してください。プレースホルダーの削除は、新しい画像が本番へ反映され、既存ページから参照されていないことを確認した後に別PRで行います。
