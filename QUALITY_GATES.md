# Quality Gates

## CI

通常CIでは以下を実行します。

1. `npm ci`
2. `npm run check`
3. `npm run lint`
4. `npm test`
5. `npm run build`
6. 静的成果物確認
7. `npm run performance:check`
8. Wrangler dry-run
9. Playwright Chromium E2E

GitHub Actionsの権限は`contents: read`に限定し、同一PRの古い実行はConcurrencyでキャンセルします。

## Performance Budget

`scripts/check-performance-budget.mjs`が`dist/`を検査します。

| Budget           |   Limit |
| ---------------- | ------: |
| dist total       |  20 MiB |
| JavaScript total |   3 MiB |
| CSS total        | 700 KiB |
| Largest asset    |   4 MiB |

制限変更は実測値・利用者への効果・Cloudflare配信コストを確認したうえで行います。単にCIを通すためだけに上限を引き上げないでください。

## Visual Regression

`.github/workflows/visual-regression.yml`はPRブランチと最新`main`を別々にビルドし、同じChromium環境で次を撮影します。

- Home: Desktop / Mobile
- Profile: Tablet / Mobile
- Portfolio: Desktop Light
- Contact: Desktop / Mobile

外部通信、アニメーション、カーソル点滅、World Atmosphereを固定し、変更ピクセルが3%を超える場合に失敗します。Baseline、Current、Diffは14日間Artifactとして保存します。

意図した大幅なデザイン変更で失敗した場合も、差分Artifactを確認してから閾値または撮影対象を変更してください。

## Analytics

イベント設計は`ANALYTICS_EVENT_MAP.md`と`src/data/analytics-events.ts`を正とします。

- PIIを送信しない
- Query stringを送信しない
- 許可リスト外のイベント・パラメータを追加しない
- Contactではカテゴリーと固定エラーコードだけを送る

## Security checks

Contact APIでは以下を必須とします。

- Same-origin POST
- JSON Content-Type
- Payload size limit
- Server-side validation
- Honeypot
- Rate Limit binding
- Turnstile hostname / action検証
- 外部API timeout
- HTML escape / Discord mentions無効化
- Secretをログへ出さない
