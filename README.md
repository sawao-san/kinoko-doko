# 🍄 信州キノコ × ファインマン プロジェクト (Builders Day 成果物群)

本リポジトリは、**Google Cloud Builders Day** における以下の **3つの独立したシステム** を保管・管理するモノレポ構成のリポジトリです。各システムは完全に独立したディレクトリとして保管されており、それぞれ個別にローカル起動および Google Cloud Run へのデプロイが可能です。

---

## 📂 プロジェクト構成一覧

| フォルダ名 | システム名 | 開発者 | 概要 | 単独デプロイコマンド |
| :--- | :--- | :--- | :--- | :--- |
| [`01_my_nagano_mind`](./01_my_nagano_mind) | **Nagano Mind（単体）** | ユーザー様 | 信州キノコ専門家黒板。手描きスケッチと音声説明によるマルチエージェントAI採点・長野県生息地特定システム。 | `gcloud run deploy nagano-mind --source ./01_my_nagano_mind` |
| [`02_harada_mushroom_map`](./02_harada_mushroom_map) | **キノコどこどこ（単体）** | 原田さん | GPS地図上のキノコマッピング、Gemini画像同定、食毒判定、BigQuery分析機能を持つフィールドナビゲーション。 | `gcloud run deploy harada-mushroom-map --source ./02_harada_mushroom_map` |
| [`03_kinoko_mind_integrated`](./03_kinoko_mind_integrated) | **統合システム（合体版）** | 共同成果物 | Nagano Mindのファインマン黒板機能でキノコを説明するとAI採点され、説明したキノコの実物検索写真（Wikipedia/Wikimedia）を表示し、原田さんのキノコマップとも合体したフル機能システム。 | `gcloud run deploy kinoko-mind-integrated --source ./03_kinoko_mind_integrated` |

---

## 🚀 各システムのローカル起動方法

### 1. ユーザー様単体システム (Nagano Mind)
```powershell
cd 01_my_nagano_mind
npm install
npm run dev
# -> http://localhost:3000
```

### 2. 原田さん単体システム (キノコどこどこ)
```powershell
cd 02_harada_mushroom_map
npm install
$env:PORT="3001"
npm run dev
# -> http://localhost:3001
```

### 3. 合体システム (Nagano Mind × キノコどこどこ)
```powershell
cd 03_kinoko_mind_integrated
npm install
npm run dev
# -> http://localhost:3000 (右ペインで原田さんのキノコマップを直接プレビュー可能)
```

---

## 🐳 Google Cloud Run 個別デプロイ手順

3つのシステムは、それぞれ独立したコンテナ（Dockerfile）を備えています。用途に応じて個別にデプロイ可能です：

```powershell
# 1. ユーザー様単体システムをデプロイ
gcloud run deploy my-nagano-mind `
  --source ./01_my_nagano_mind `
  --region asia-northeast1 `
  --allow-unauthenticated

# 2. 原田さん単体システムをデプロイ
gcloud run deploy harada-mushroom-map `
  --source ./02_harada_mushroom_map `
  --region asia-northeast1 `
  --allow-unauthenticated

# 3. 合体システムをデプロイ
gcloud run deploy kinoko-mind-integrated `
  --source ./03_kinoko_mind_integrated `
  --region asia-northeast1 `
  --allow-unauthenticated
```
