# X Profile Integration Setup

Profileページは`/api/x-profile`を通して、Xの`@ivuruGG`公開プロフィールを取得します。

## 構成

```text
Browser
  └─ GET /api/x-profile
       ├─ Netlify: /api/* proxy
       └─ Cloudflare Worker
            ├─ Cache API
            ├─ X API v2
            └─ Local PNG fallback
```

Astro本体は静的出力のまま維持し、APIだけを既存Cloudflare Workerへ追加しています。

## 必要なX設定

1. X Developer Portalでアプリを作成する
2. 公開プロフィールの読み取りに使用できるBearer Tokenを発行する
3. Bearer Tokenをソースコード、Netlify、ブラウザへ埋め込まない
4. Cloudflare WorkerのSecretとして登録する

```bash
npx wrangler secret put X_BEARER_TOKEN
```

入力を求められたらBearer Tokenを貼り付けます。値は`wrangler.jsonc`へ書きません。

## 公開設定

`wrangler.jsonc`には秘密でない設定だけを定義しています。

```jsonc
{
  "vars": {
    "X_PROFILE_USERNAME": "ivuruGG",
    "X_PROFILE_CACHE_TTL_SECONDS": "21600",
  },
}
```

- `X_PROFILE_USERNAME`: 先頭の`@`なし
- `X_PROFILE_CACHE_TTL_SECONDS`: Cloudflare Cache APIの保持時間。300〜86400秒へ制限されます

## ローカル確認

ローカルの`.dev.vars`へ次を追加します。`.dev.vars`はGitへコミットしません。

```dotenv
X_BEARER_TOKEN=your-secret-bearer-token
```

起動後に確認します。

```bash
npm run dev
curl http://localhost:4321/api/x-profile
```

Astro単体の開発サーバーではWorker APIが動かない場合があります。その場合はWrangler経由で確認してください。

```bash
npm run build
npx wrangler dev
```

## APIレスポンス

```json
{
  "ok": true,
  "source": "x",
  "username": "ivuruGG",
  "name": "いゔる。",
  "description": "...",
  "profileImageUrl": "https://pbs.twimg.com/..._400x400.jpg",
  "profileBannerUrl": "https://pbs.twimg.com/...",
  "profileUrl": "https://x.com/ivuruGG",
  "verified": false,
  "fetchedAt": "2026-07-16T00:00:00.000Z"
}
```

## フォールバック

次の状態では、ページをエラーにせず`/assets/images/ivuru-profile-fallback.png`を返します。

- `X_BEARER_TOKEN`が未設定
- X APIがレート制限または障害を返した
- タイムアウトした
- 必須のユーザー情報がなかった

レスポンスの`source`が`fallback`、`warning`が原因コードになります。

## セキュリティ

- Bearer TokenはCloudflare Secretだけで管理する
- クライアントは同一オリジンの`/api/x-profile`だけを呼び出す
- ユーザー名は英数字とアンダースコア、最大15文字へ制限する
- APIレスポンスは公開プロフィール項目だけに限定する
- X APIレスポンス本文やTokenをログへ出力しない
- CSPではX画像の配信元だけを`img-src`へ許可する

## デプロイ

設定後にCloudflare Workerをデプロイします。

```bash
npm run deploy:check
npm run deploy
```

Netlify側にはBearer Tokenは不要です。`/api/*`がCloudflare Workerへproxyされる既存構成を使用します。

本番反映後はレスポンスヘッダーの`x-profile-cache`が`MISS`から`HIT`へ変わることも確認します。

```bash
curl -I https://ivuru.ivrm.jp/api/x-profile
```
