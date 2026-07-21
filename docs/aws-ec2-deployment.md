# AWS共有Runtimeへのゼロタッチデプロイ

## 目的

`main` ブランチへの反映を起点に、GitHub ActionsがOIDCで短期AWS認証情報を取得し、AWS Systems Manager経由で既存EC2へ静的サイトをデプロイします。

AWSアクセスキーやSSH秘密鍵はGitHubへ保存しません。

このデプロイ先は `ivuru.ivrm.jp` の本番置き換えではなく、AWS学習・検証用の共有Runtimeです。既存のCloudflare Workers / Pages環境は維持します。

## デプロイ経路

```text
GitHub main
  → GitHub Actions
  → GitHub OIDC
  → AWS IAM Role
  → SSM Run Command
  → 既存EC2上のDockerでAstroをビルド
  → ivuru-web専用公開ディレクトリを更新
  → localhost:8080を確認
  → Cloudflare Tunnel経由の公開URLを確認
```

## リポジトリと実行基盤の方針

リポジトリごとにEC2を1台用意する必要はありません。アプリケーションの実行特性に応じて配置先を分けます。

- `ivuru-web`
  - 本番は既存のCloudflare Workers / Pagesを維持
  - AWS共有Runtimeには検証用として配置
  - 追加インスタンスは作成しない
- `ivrm-web`
  - `ivrm.jp`、`member.ivrm.jp`、`admin.ivrm.jp`、`api.ivrm.jp` はCloudflare Pages / Workers / D1を継続
  - AWS EC2へ移行しない
- `Herta`
  - Discord Bot、API、Worker、Studio、PostgreSQL、Redisを常時稼働させるため、将来的に専用Lightsailへ分離
  - 初期検証は2 GB、安定運用は4 GBを推奨
- `ivrm-minecraft-activity`
  - Activity APIはCloud Runを継続
  - Minecraft側Mod / PluginはMinecraftサーバー側で稼働
  - AWS EC2へ移行しない

したがって、当面のAWS構成は次の2台以内に抑えます。

```text
既存EC2
  └─ AWS Runtime Foundation
      └─ ivuru-web検証配信

Lightsail（Herta本番化時のみ追加）
  └─ Herta
      ├─ Studio
      ├─ API
      ├─ Bot
      ├─ Worker
      ├─ PostgreSQL
      └─ Redis
```

LightsailのLinux/Unix一般用途プランは、パブリックIPv4込みで2 GBが月額12 USD、4 GBが月額24 USDです。Hertaを本番化するまでは追加契約せず、現在のEC2だけで進めます。

## 現在の対象範囲

このワークフローはAstroの静的出力 `dist/` をEC2上のCaddyから配信します。

`src/worker-entry.ts`、D1、Queues、Rate LimitsなどCloudflare Workers固有機能は、このEC2デプロイでは移行しません。既存のCloudflare Workersデプロイと並行運用し、API移行は別工程で実施します。

## 1. GitHub OIDC IAMスタックを作成

AWS CloudShellで実行します。

```bash
aws cloudformation deploy \
  --region ap-northeast-1 \
  --stack-name ivrm-ivuru-web-github-oidc \
  --template-file infra/aws/github-oidc-deploy.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    GitHubOrganization=ivRooom \
    GitHubRepository=ivuru-web \
    GitHubEnvironment=aws-runtime \
    InstanceId=i-05e3efb4c02b39824 \
    CreateGitHubOidcProvider=true
```

同じAWSアカウントに `token.actions.githubusercontent.com` のOIDC Providerがすでに存在する場合は、重複作成できません。その場合は次を指定します。

```bash
PROVIDER_ARN="arn:aws:iam::911291529944:oidc-provider/token.actions.githubusercontent.com"

aws cloudformation deploy \
  --region ap-northeast-1 \
  --stack-name ivrm-ivuru-web-github-oidc \
  --template-file infra/aws/github-oidc-deploy.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    GitHubOrganization=ivRooom \
    GitHubRepository=ivuru-web \
    GitHubEnvironment=aws-runtime \
    InstanceId=i-05e3efb4c02b39824 \
    CreateGitHubOidcProvider=false \
    ExistingGitHubOidcProviderArn="$PROVIDER_ARN"
```

出力確認:

```bash
aws cloudformation describe-stacks \
  --region ap-northeast-1 \
  --stack-name ivrm-ivuru-web-github-oidc \
  --query 'Stacks[0].Outputs' \
  --output table
```

## 2. GitHub Environmentを作成

Repository Settingsから次を作成します。

```text
Settings
→ Environments
→ New environment
→ aws-runtime
```

IAMの信頼条件は次のSubjectに限定されています。

```text
repo:ivRooom/ivuru-web:environment:aws-runtime
```

## 3. GitHub Actions Repository Variables

次のRepository Variablesを登録します。

- `AWS_RUNTIME_DEPLOY_ROLE_ARN`: CloudFormation出力 `GitHubDeployRoleArn`
- `AWS_RUNTIME_INSTANCE_ID`: `i-05e3efb4c02b39824`
- `AWS_REGION`: `ap-northeast-1`
- `AWS_RUNTIME_SITE_URL`: `https://runtime.ivrm.jp`

SecretsにAWSアクセスキーを登録する必要はありません。

## 4. EC2前提条件

EC2では次が必要です。

- SSM Agentがオンライン
- Dockerが起動中
- Git、curl、flockが利用可能
- Caddyコンテナが起動中
- Caddyの公開ディレクトリが `/srv` または `/usr/share/caddy` にバインドマウント済み
- `http://localhost:8080` がHTTP 200を返す
- `https://runtime.ivrm.jp` がCloudflare Tunnel経由でHTTP 200を返す

公開ディレクトリのマウント確認:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'

docker inspect "$(docker ps --filter ancestor=caddy --format '{{.ID}}' | head -n1)" \
  --format '{{range .Mounts}}{{println .Destination "->" .Source}}{{end}}'
```

## 5. 初回実行

Actions画面から手動実行します。

```text
Actions
→ AWS共有Runtimeへデプロイ
→ Run workflow
```

成功後は `main` へのpushまたはPRマージで自動実行されます。

## 安全対策

- OIDCのSubjectをRepositoryと `aws-runtime` Environmentへ限定
- IAM Roleは対象EC2へのSSM SendCommandだけを許可
- 同時デプロイをConcurrencyで直列化
- デプロイ前にcheck、lint、test、buildを実行
- EC2上ではflockで二重実行を防止
- 公開前ファイルをバックアップ
- ローカル・外部ヘルスチェック失敗時に自動復元
- リリースとバックアップは最新5世代を保持

## ロールバック

デプロイ中のヘルスチェックが失敗した場合は自動的に直前バックアップを復元します。

手動で過去の状態へ戻す場合は、対象バックアップをCaddyの公開ディレクトリへ戻し、Caddyをreloadします。

## Cloudflare Tunnel

公開経路は次のまま維持します。

```text
runtime.ivrm.jp
  → Cloudflare
  → ivrm-aws-runtime Tunnel
  → cloudflared
  → http://localhost:8080
  → Caddy
```

EC2の80/443番ポートをインターネットへ開放する必要はありません。
