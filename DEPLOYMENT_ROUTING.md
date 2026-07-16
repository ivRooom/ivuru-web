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
2. Contact UIは同一Originの`/api/contact`へアクセスします。
3. Netlifyは`netlify.toml`の200 rewriteでCloudflare Workerへリクエストを転送します。
4. `src/worker-entry.ts`は、ブラウザの`Origin`が`ALLOWED_ORIGINS`に含まれる場合だけ、APIリクエストURLを公開Originへ正規化します。
5. 既存の`src/worker.ts`がOrigin、`Sec-Fetch-Site`、Content-Type、本文サイズ、Rate Limit、Turnstile、入力値を検証します。
6. D1へ受付情報を保存し、Cloudflare QueueからResendとDiscordへ通知します。

## セキュリティ方針

- `Origin`が未設定または未許可の場合、POSTは既存Workerで403にします。
- URL正規化は`/api/*`かつ`ALLOWED_ORIGINS`に含まれるOriginだけを対象にします。
- Turnstileの`hostname`と`action=contact_submit`の検証は維持します。
- Netlify側へSecret、Resend API Key、Discord Webhook、D1認証情報は配置しません。
- NetlifyはAPIレスポンスを生成せず、Cloudflare Workerへ転送するだけです。
- SupabaseはこのContact経路では使用しません。

## 設定

### Netlify

`netlify.toml`に次を設定します。

```toml
[[redirects]]
from = "/api/*"
to = "https://ivurugg.ivrm.jp/api/:splat"
status = 200
force = true
```

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
```

`deployment:routing:check`は次を検証します。

- Netlifyの本番`SITE_URL`
- `/api/*` rewrite先、HTTP 200、`force=true`
- Cloudflare Worker entrypoint
- 許可Origin
- `siteConfig`のフォールバックURL

## デプロイ後の確認

1. `https://ivuru.ivrm.jp/api/contact`がJSONを返すことを確認します。
2. `ready=true`、`queueEnabled=true`、`statusEnabled=true`を確認します。
3. `https://ivuru.ivrm.jp/contact/`で確認画面まで進めます。
4. 運営者自身の情報で問い合わせを1件送信します。
5. 受付番号と照会キーが表示されることを確認します。
6. D1保存、管理者メール、自動返信、Discord通知を確認します。
7. 状態照会画面で同じ受付番号を確認します。
8. Queue backlogとDLQが0件であることを確認します。
9. Worker Logsに氏名、メールアドレス、本文、Secretが出力されていないことを確認します。

## ロールバック

Contact経路に問題がある場合は、次の順で戻します。

1. Netlifyの`/api/*` rewriteを削除します。
2. `wrangler.jsonc`の`main`を`./src/worker.ts`へ戻します。
3. `ALLOWED_ORIGINS`からNetlify本番Originを削除します。
4. Cloudflare Workerを直前の正常バージョンへロールバックします。
5. Contact画面は設定取得に失敗し、メール導線へ安全にフォールバックします。
