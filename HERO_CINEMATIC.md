# トップヒーロー・アニメOP背景

トップページのヒーローは、Developer / Gamerの2つの世界を表現するオリジナル生成キービジュアルと、そこから制作した短尺ループ動画を使用します。

## 現行アセット

- `public/assets/visuals/hero-anime-keyvisual.svg`: オリジナル生成キービジュアル
- `public/assets/video/hero-anime-op-loop.webm`: 優先ソース
- `public/assets/video/hero-anime-op-loop.mp4`: H.264フォールバック
- `public/assets/video/hero-anime-op-poster.webp`: 初期表示・省データ・reduced motion用

旧`hero-cinematic-*`は比較・ロールバック用として保持しています。現行の`HeroWorld.tsx`は`hero-anime-op-*`を参照します。

現在のループは音声を含まないオリジナル生成映像です。第三者のゲーム映像、キャラクター、ロゴ、音楽、個人情報は含みません。

## 再生条件

次の条件をすべて満たした場合のみ動画要素を生成します。

- `prefers-reduced-motion: reduce`ではない
- Data Saverが無効
- 接続種別が`slow-2g`または`2g`ではない
- `hardwareConcurrency`が2以下の極端な低性能端末ではない

画面外へ移動した場合とブラウザタブが非表示になった場合は自動停止します。利用者はヒーロー左下のMOTIONボタンから一時停止・再開でき、状態は同じタブの`sessionStorage`へ保存されます。

## Games向け生成映像

`public/assets/video/games/`へ、左右から登場するGamesページ用のローカル映像を配置しています。

- `neon-rift.*`
- `sky-raid.*`
- `prism-arena.*`

各映像はWebM、MP4、posterを1セットとして管理します。`AdaptiveLoopVideo.tsx`がreduced motion、Data Saver、低速回線、低性能端末、画面外停止へ対応します。

## フォールバック

1. 動画を使用しない環境ではposterを表示
2. HERO動画の読み込みまたは再生に失敗した場合は、既存の`PortalScene`を遅延読み込み
3. JavaScriptが利用できない場合でもローカルposterと既存の`hero-world.webp`が残る

## 差し替え時の注意

- WebM、MP4、posterを同時に更新する
- 6〜12秒程度のシームレスループを推奨
- 1ファイル4MiB以下、動画合計8MiB以下を維持する
- 音声は含めない
- 権利、同意、クレジット条件を確認する
- ファイル名を変更する場合はデータファイル、Reactコンポーネント、E2Eを同時に更新する

## 検証

- 通常環境で動画ソースと停止ボタンが利用できる
- Data Saverとreduced motionで動画要素を生成しない
- 日本語、英語、韓国語で主要コピーが切り替わる
- PC、タブレット、スマートフォンで文字とCTAの可読性を維持する
- Visual Regressionはreduced motion固定のposterで安定比較する
