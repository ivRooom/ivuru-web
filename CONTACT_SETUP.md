# Contact Terminal setup

PR #11では、既存のStatic Assets Workerへ`src/worker.ts`を追加し、`/api/contact`だけをWorkerコードへ通します。初回デプロイ後はCloudflare DashboardのVariables and Secretsを利用できます。

## 1. 初回デプロイ

```bash
npm ci
npm run build
npm run deploy
```

Cloudflare Dashboardで`ivrm-ivurugg`を開き、設定画面にVariables and Secretsが表示されることを確認します。

## 2. Turnstile

Cloudflare DashboardでTurnstile Widgetを作成し、許可ホストへ本番ドメインを追加します。

```text
ivurugg.ivrm.jp
```

Workerへ次を設定します。

| Name                   | Type     | Value                        |
| ---------------------- | -------- | ---------------------------- |
| `TURNSTILE_SITE_KEY`   | Variable | Turnstile WidgetのSite Key   |
| `TURNSTILE_SECRET_KEY` | Secret   | Turnstile WidgetのSecret Key |

CLIでSecretを設定する場合:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Site Keyは公開値なので、Dashboardの通常Variableとして追加します。

## 3. Resend

1. Resendで`ivrm.jp`を送信ドメインとして認証します。
2. API Keyを作成します。
3. Worker Secretへ登録します。

```bash
npx wrangler secret put RESEND_API_KEY
```

`wrangler.jsonc`の既定値:

```text
CONTACT_TO_EMAIL=contact@ivrm.jp
CONTACT_FROM_EMAIL=ivuru Contact <contact@ivrm.jp>
```

Resend側の認証状況に応じて、送信元は`noreply@ivrm.jp`へ変更しても構いません。受信先は`contact@ivrm.jp`のままです。

## 4. Discord通知（任意）

通知先チャンネルでWebhook URLを発行し、Secretへ登録します。

```bash
npx wrangler secret put DISCORD_WEBHOOK_URL
```

未設定でもメール送信は動作します。

## 5. 動作確認

```text
GET /api/contact
```

準備完了後の例:

```json
{
  "ready": true,
  "turnstileSiteKey": "...",
  "recipient": "contact@ivrm.jp",
  "discordEnabled": true,
  "queueEnabled": true,
  "statusEnabled": true
}
```

フォームUIの入力条件:

- お名前は空白以外を1文字以上
- メールアドレスは有効な形式
- 件名は空白以外を2文字以上
- 本文は空白以外を20文字以上
- 設定取得中のみ入力欄と確認操作を無効化
- 条件未達時は不足項目を表示し、最初の不正項目へフォーカスを移動

確認項目:

- `/contact`で入力条件が表示される
- 設定取得完了後に「送信内容を確認」を操作できる
- 不足項目がある場合は項目別エラーが表示される
- `/contact`でTurnstileが表示される
- 正常送信でHTTP 202
- `contact@ivrm.jp`へ管理者通知が届く
- 送信者へ受付メールが届く
- Discord通知が届く（設定時）
- 受付番号と照会キーが画面へ表示される
- 状態照会が有効な場合は`/contact/status/`から確認できる
- 4回目以降の連続送信がHTTP 429になる
- 存在しないページが従来どおり独自404になる

## 6. ローカル開発

`.dev.vars`を作成します。このファイルはGitへ追加しません。

```text
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
RESEND_API_KEY=re_xxx
DISCORD_WEBHOOK_URL=
```

Cloudflareのテストキーはローカル・CI専用です。本番環境へ設定しないでください。

## Security notes

- Turnstile tokenは必ずサーバー側で検証します。
- API KeyとWebhook URLはSecretとして保存します。
- `keep_vars: true`によりDashboardで追加したVariableを次回デプロイでも維持します。
- `/api/contact`以外の静的配信はAssets bindingへ委譲します。
- Contact本文は最大24,000 UTF-8バイト、状態照会本文は最大2,000 UTF-8バイトです。
- 管理者メール送信に失敗した場合は成功扱いにしません。
- 自動受付メールまたはDiscordだけが失敗した場合は、管理者通知成功後に受付を完了します。
