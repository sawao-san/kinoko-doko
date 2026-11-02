# 🍄 キノコどこどこ (Edible Mushroom Map) - 原田さん成果物単体

> **Google Cloud Builders Day 提出成果物**  
> **開発者: 原田さん（チーム・マッシュルームナビ）**

本リポジトリは、原田さんが開発された野生キノコ探索・同定・マッピングWebアプリケーション **「キノコどこどこ」** の単体成果物です。

---

## 📌 概要

身近な里山や登山ルートで見つけた野生キノコをGPS地図上に記録し、Google Gemini 3.8 Flash のマルチモーダル画像解析によって瞬時に「食毒」「豆知識」「誤食防止ポイント」を特定・可視化するフィールドナビゲーションアプリです。

- **技術スタック**:
  - フロントエンド: React 19 + TypeScript + Vite + Tailwind CSS v4 + Leaflet.js
  - バックエンド: Node.js + Express
  - AIエンジン: Google Gemini 3.8 Flash (`@google/genai` SDK)
  - ジオコーディング: OpenStreetMap Nominatim API
  - ビッグデータ: Google BigQuery スキーマ定義・当たり年分析対応

---

## 🚀 ローカル起動方法

```powershell
cd 02_harada_mushroom_map

# 依存関係インストール
npm install

# 開発サーバー起動（デフォルトポート3000、またはPORT指定で起動）
$env:PORT="3001"
npm run dev
```

ブラウザで [http://localhost:3001](http://localhost:3001) を開きます。

---

## 🐳 Google Cloud Run デプロイ

単体で Google Cloud Run へコンテナデプロイ可能です（マルチステージ Dockerfile 作成済み）：

```powershell
gcloud run deploy harada-mushroom-map `
  --source . `
  --region asia-northeast1 `
  --allow-unauthenticated
```
