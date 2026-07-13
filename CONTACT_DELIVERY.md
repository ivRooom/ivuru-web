# Contact Delivery Reliability

お問い合わせAPIは、Turnstile検証と入力検証に成功した後、管理者向けメールを同期送信します。管理者向けメールが成功した場合のみHTTP 202を返し、受付メールとDiscord通知は`ctx.waitUntil()`で継続します。

## 再試行対象

次の一時障害だけを最大3回再試行します。

- ネットワークエラー、接続タイムアウト
- HTTP 408 Request Timeout
- HTTP 425 Too Early
- HTTP 429 Too Many Requests
- HTTP 5xx

400、401、403、404などの恒久エラーは再試行しません。

## バックオフ

- 初回待機: 250ms
- 2回目待機: 500ms
- 最大待機: 2,000ms
- `Retry-After`がある場合はその値を優先し、最大2,000msへ制限

Cloudflare Workerの実行時間を過度に消費しないよう、短い上限を設けています。

## 冪等性

Resendへ送信するメールには、受付番号と用途から生成した`Idempotency-Key`を付与します。

- 管理者メール: `{requestId}:admin`
- 受付メール: `{requestId}:receipt`

同じ問い合わせの再試行でメールが重複しにくい構成です。Discord Webhookには同等の冪等性機能がないため、Discord通知は一時障害時に重複する可能性があります。問い合わせの正本は管理者メールとし、Discordは補助通知として扱います。

## ログ

本文、氏名、メールアドレス、Turnstile token、API key、Webhook URLはログへ出しません。記録するのは受付番号、カテゴリー、ロケール、通知チャンネル、Cloudflare Ray ID、成功・失敗イベントです。

## 今後の拡張

永続キューと配信履歴が必要になった場合は、Cloudflare QueuesとD1、または既存のSupabase基盤を比較し、次を実装します。

- 問い合わせ受付と通知処理の分離
- Retry / Dead Letter Queue
- 配信状態と再送履歴
- 管理者向け状態確認
- 保存期間と削除ポリシー

外部ストレージへ個人情報を保存する前に、保存期間、閲覧権限、削除手順、プライバシーポリシーを確定してください。
