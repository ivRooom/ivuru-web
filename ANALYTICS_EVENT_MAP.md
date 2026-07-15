# Analytics Event Map

将来のCloudflare Web Analytics / GA4導入に備えた、プロバイダー非依存のイベント設計です。

## 原則

- 氏名、メールアドレス、問い合わせ本文、受付番号などの個人情報は送信しない
- URLクエリ文字列は送信しない
- イベント名とパラメータは`src/data/analytics-events.ts`の許可リストだけを使用する
- Cloudflare Web Analyticsだけを使う場合も、UI導線の独自イベントはこの設計を維持する
- GA4を有効化する場合は`window.gtag`へ同じイベントを転送する
- Astro ClientRouterの`astro:page-load`ごとに`page_view`を1回だけ送る

## イベント

| Event                   | Timing                     | Parameters                                  | Purpose        |
| ----------------------- | -------------------------- | ------------------------------------------- | -------------- |
| `page_view`             | 初回表示・内部ページ遷移   | `path`, `locale`                            | ページ閲覧     |
| `nav_open`              | モバイルメニュー展開       | `path`, `locale`, `surface`                 | ナビ利用       |
| `nav_select`            | ナビリンク選択             | `target`, `surface`, `position`             | 主要導線       |
| `works_open`            | Works詳細を開く            | `target`, `category`, `surface`, `position` | 作品関心       |
| `portfolio_open`        | Portfolio導線              | `surface`                                   | 開発情報関心   |
| `clip_open`             | Clip外部再生               | `target`, `category`, `surface`, `position` | ゲーム活動関心 |
| `social_open`           | SNS・Discord・Email        | `target`, `surface`, `position`             | 外部導線       |
| `contact_start`         | Contact入力開始            | `surface`                                   | フォーム開始率 |
| `contact_confirm`       | 確認画面表示               | `category`                                  | 確認到達率     |
| `contact_submit`        | API送信試行                | `category`                                  | 送信試行率     |
| `contact_success`       | 受付成功                   | `category`, `status`                        | 完了率         |
| `contact_error`         | 受付失敗                   | `category`, `status`                        | エラー傾向     |
| `command_center_open`   | Command Centerリンク       | `target`, `surface`, `position`             | 活動導線       |
| `world_portal_open`     | News・Games・Favorites導線 | `target`, `surface`, `position`             | ワールド導線   |
| `media_playback_toggle` | ローカル動画の再生・停止   | `target`, `surface`, `status`               | 動画操作       |
| `spotify_load`          | Spotify埋め込みの明示読込  | `surface`                                   | 音楽導線       |
| `language_change`       | 言語変更                   | `target`                                    | 言語利用       |
| `theme_change`          | テーマ変更                 | `target`                                    | テーマ利用     |

## 許可パラメータ

`path`, `locale`, `target`, `surface`, `category`, `position`, `status`

`status`へ外部APIの生レスポンス、例外本文、メールアドレス等を入れてはいけません。固定された内部エラーコードだけを使用します。

## 導入手順

1. Cloudflare Web Analyticsを有効化
2. CSPへ`https://static.cloudflareinsights.com`を追加
3. ページビューとCore Web Vitalsを確認
4. 詳細な導線分析が必要になった場合だけGA4を追加
5. GA4では自動ページビューと手動ページビューを重複させない
6. Privacy Policyへ利用サービスと取得内容を反映
