# Contact Durable Mode 本番構築結果

GitHub ActionsからCloudflare本番環境へ、Contact Durable Modeで使用するリソースを作成しました。

## 作成・確認済み

- D1: `ivuru-contact-production`
- D1 database ID: `985dee82-e9bd-4e7d-b18c-1fb8f4777968`
- Queue: `ivuru-contact-delivery`
- Dead-letter queue: `ivuru-contact-delivery-dlq`
- D1 Migration: 適用済み
- `contact_requests`テーブル: 確認済み
- `wrangler.jsonc`の本番Binding: 反映済み
- 本番Workerデプロイ: PRマージ後に実施

API Token、Account ID、Resend API Key、Discord WebhookなどのSecret値は、リポジトリへ保存していません。

## マージ前に必要なCloudflare Dashboard設定

Workers Buildsの設定を次へ変更します。

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Non-production branch deploy command: `npx wrangler versions upload`
- Root directory: `/`
- Build variable: `SITE_URL=https://ivurugg.ivrm.jp`

現在のBuild commandが空欄のままでは、Astroが`dist/`を生成しないため、Static Assetsを含む本番デプロイを完了できません。

## デプロイ後の完了条件

1. `GET /api/contact`が`queueEnabled: true`と`statusEnabled: true`を返す。
2. テスト問い合わせがD1へ保存される。
3. Queue Consumerが管理者メール、自動返信、Discord通知を処理する。
4. `/contact/status/`で受付状態を照会できる。
5. Workers Logsへ問い合わせ本文やメールアドレスが出力されない。
6. Queue backlogとDLQが通常時に0件である。
