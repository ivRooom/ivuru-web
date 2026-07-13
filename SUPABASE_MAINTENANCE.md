# Supabase Maintenance

## 対象

- Project: `ivrm-core`
- Project ID: `drazbrcqnjxjuygfxmlz`
- Region: `ap-northeast-1`
- 用途: Minecraft Activity / Reward基盤

このWebサイトのContact APIはCloudflare Workersで動作しており、Contact本文やメールアドレスをSupabaseへ保存していません。

## 2026-07-13 Security hardening

RLSが有効でPolicyが存在しなかったMinecraft関連テーブルへ、`anon`と`authenticated`の直接アクセスを明示的に拒否する`deny_public_access` Policyを追加しました。

対象テーブル:

- `minecraft_servers`
- `minecraft_accounts`
- `minecraft_event_logs`
- `minecraft_sessions`
- `minecraft_session_heartbeats`
- `minecraft_daily_stats`
- `minecraft_monthly_stats`
- `minecraft_reward_pools`
- `minecraft_reward_items`
- `minecraft_reward_grants`
- `minecraft_random_reward_draws`

Service RoleはRLSを迂回するため、サーバー処理からの既存アクセス方式は変更しません。将来ブラウザや認証ユーザーから直接参照させる場合は、用途、所有者判定、公開列、更新可否を決めたうえで専用Policyへ置き換えてください。

適用Migration:

```text
add_explicit_deny_public_policies
```

適用後のSupabase Security Advisorは指摘0件です。

## 2026-07-13 Foreign-key indexes

`minecraft_random_reward_draws`で不足していた外部キー用Indexを追加しました。

- `idx_minecraft_random_reward_draws_pool_id`
- `idx_minecraft_random_reward_draws_reward_item_id`
- `idx_minecraft_random_reward_draws_reward_grant_id`

`reward_grant_id`はnullableのため、`IS NOT NULL`の部分Indexです。

適用Migration:

```text
add_random_reward_draw_fk_indexes
```

テーブルがまだ空のため、Performance Advisorでは新旧Indexが`unused_index`として表示されます。利用実績がない段階でIndexを削除せず、本番クエリと`pg_stat_user_indexes`を一定期間確認してから判断してください。

## 運用ルール

- DDLは`apply_migration`相当の履歴が残る方法で実施する
- Productionデータの削除や既存Policy削除は別途レビューする
- RLS変更後はSecurity Advisorを再確認する
- Index追加後はPerformance Advisorを再確認する
- Publishable KeyやService Role Keyをリポジトリへ保存しない
- Contact用データを追加する場合は、Minecraftデータと責務を分離し、保存期間と削除手順を先に決める
