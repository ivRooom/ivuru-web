# Netlify / Cloudflare デプロイ経路

## 目的

`ivuru-web`は、公開フロントエンドとContact APIで異なる配信基盤を利用します。

| 役割                        | URL                                          | 基盤                               |
| --------------------------- | -------------------------------------------- | ---------------------------------- |
| 公開フロントエンド          | `https://ivuru.ivrm.jp`                      | Netlify                            |
| Contact API / Static mirror | `https://ivurugg.ivrm.jp`                    | Cloudflare Workers + Static Assets |
| Contact API                 | `https://ivurugg.ivrm.jp/api/contact`        | Cloudflare Worker                  |
| Contact状態照会API          | `https://ivurugg.ivrm.jp/api/contact/status` | Cloudflare Worker                  |

## リクエスト経路

1. ブラウザはNetlifyの`https://ivuru.ivrm.jp`を表示します。
2. Netlify buildは`PUBLIC_CONTACT_API_ORIGIN=https://ivurugg.ivrm.jp`をクライアントへ埋め込みます。
3. Contact UIと状態照会UIはブラウザからCloudflare Workerへ直接アクセスします。
4. `src/worker-entry.ts`は`ALLOWED_ORIGINS`に含まれるOriginだけへCORSレスポンスを返し、JSON POSTのpreflightを処理します。
5. `src/worker.ts`はOrigin、`Sec-Fetch-Site`、Content-Type、本文サイズ、Rate Limit、Turnstile、入力値を検証します。
6. Cloudflareが実利用者の`CF-Connecting-IP`を保持するため、Rate LimitとTurnstile `remoteip`検証を利用者単位で適用できます。
7. D1へ受付情報を保存し、Cloudflare QueueからResendとDiscordへ通知します。

## Netlify proxyを使用しない理由

Netlifyの外部proxyを経由すると、Cloudflare Workerから見た接続元がNetlifyの出口IPになり、複数利用者が同じRate Limit bucketを共有します。Contact APIはブラウザからWorkerへ直接接続し、Netlifyの`/api/*` rewriteは設定しません。

## セキュリティ方針

- `Access-Control-Allow-Origin: *`は使用しません。
- `ALLOWED_ORIGINS`に登録済みのOriginだけへCORSを返します。
- Credential付きCORS、Cookie、セッション認証は使用しません。
- `Origin`が未設定または未許可の場合、POSTは既存Workerで403にします。
- Turnstileの`hostname`は許可済みブラウザOrigin、`action`は`contact_submit`として検証します。
- `CF-Connecting-IP`はブラウザからCloudflareへの直接接続で取得します。
- Netlify側へSecret、Resend API Key、Discord Webhook、D1認証情報は配置しません。
- SupabaseはこのContact経路では使用しません。

## 設定

### Netlify

`netlify.toml`に公開情報だけを設定します。

```toml
[build.environment]
SITE_URL = "https://ivuru.ivrm.jp"
PUBLIC_CONTACT_API_ORIGIN = "https://ivurugg.ivrm.jp"
```

`PUBLIC_CONTACT_API_ORIGIN`はブラウザへ公開されるURLであり、Secretではありません。`/api/*`の外部proxy rewriteは追加しません。

### Cloudflare

`wrangler.jsonc`では次を維持します。

```jsonc
{
  "main": "./src/worker-entry.ts",
  "vars": {
    "ALLOWED_ORIGINS": "https://ivurugg.ivrm.jp,https://ivuru.ivrm.jp",
  },
}
```

Cloudflare TurnstileのWidget Hostnameには、公開ページで使用する次のホストを登録します。

- `ivuru.ivrm.jp`
- `ivurugg.ivrm.jp`

## 品質ゲート

```bash
npm run deployment:routing:check
npm test
npm run check
npm run lint
npm run build
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
npm run test:e2e -- --project=chromium
```

`deployment:routing:check`は次を検証します。

- Netlifyの本番`SITE_URL`と公開Contact API Origin
- Netlifyの`/api/*` proxyが存在しないこと
- Contact送信UIと状態照会UIが共通URLヘルパーを利用すること
- Cloudflare Worker entrypointと許可Origin
- `siteConfig`のフォールバックURL

## デプロイ後の確認

1. ブラウザ開発者ツールで`https://ivurugg.ivrm.jp/api/contact`へ直接通信していることを確認します。
2. GETレスポンスに`Access-Control-Allow-Origin: https://ivuru.ivrm.jp`があることを確認します。
3. POST前のOPTIONSが204を返し、未許可OriginにはCORSヘッダーを返さないことを確認します。
4. `ready=true`、`queueEnabled=true`、`statusEnabled=true`を確認します。
5. `https://ivuru.ivrm.jp/contact/`で確認画面まで進めます。
6. 氏名を`IVURU E2E TEST`、件名を`[TEST] Contact delivery verification`などとした、実在人物を示さない合成データで1件送信します。返信先は運営管理下のテスト用メールアドレスを使用します。
7. 受付番号と照会キーが表示されることを確認します。
8. D1保存、管理者メール、自動返信、Discord通知を確認します。
9. 状態照会画面で同じ受付番号を確認します。
10. Queue backlogとDLQが0件であることを確認します。
11. Worker Logsに氏名、メールアドレス、本文、Secretが出力されていないことを確認します。
12. テスト完了後、D1の対象レコードと通知を識別し、保持方針どおり削除または期限切れ対象になっていることを確認します。

## ロールバック

Contact経路に問題がある場合は、次の順で戻します。

1. Netlifyの`PUBLIC_CONTACT_API_ORIGIN`を直前の正常値へ戻します。
2. Cloudflare Workerを直前の正常バージョンへロールバックします。
3. `ALLOWED_ORIGINS`とTurnstile Hostnameの設定差分を確認します。
4. Contact画面は設定取得に失敗した場合、メール導線へ安全にフォールバックします。
5. Netlifyの外部proxyは共有IP Rate Limitを再発させるため、緊急回避としても使用しません。
