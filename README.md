# 🍄 キノコどこどこ (Nagano Mind)

> **Google Cloud Builders Day ハッカソン開発プロダクト**  
> **開発チーム: Nagano Mind**

**「キノコどこどこ（Nagano Mind）」** は、**Google Cloud Builders Day** にてチーム **Nagano Mind** が開発した、信州（長野県）のキノコ生態学習・実物ビジュアル生成・生息地マップ探索を1画面（NotebookLM風 3ペインUI）で体験できるAIプラットフォームです。

ユーザーがキャンバスにキノコの絵や生態図解を描いて説明すると、**マルチエージェントAI（Gemini）** が絵と説明を赤ペン添削し、**Nano Banana** が手書きスケッチからリアルなキノコ図鑑ビジュアルを生成、さらに **Google Maps** 上で長野県内の具体的な生息スポット（北信・東信・中信・南信）を特定・マッピングします。

---

## ⚠️ 重要：APIキーの設定について（最初にお読みください）

セキュリティ保護のため、本リポジトリには **Gemini API キー（`.env.local`）は含まれていません**。  
クローンして動かす際や、ご自身の環境へデプロイする際は、**必ずご自身で Gemini API キーを取得・設定**してください。

### APIキーの取得と設定手順

1. [Google AI Studio](https://aistudio.google.com/apikey) または Google Cloud コンソールから、ご自身の **Gemini API キー** を発行します。
2. リポジトリ直下の `.env.example` をコピーして `.env.local` を作成します：
   ```bash
   cp .env.example .env.local
   ```
   *(Windows PowerShell の場合: `Copy-Item .env.example .env.local`)*
3. `.env.local` を開き、ご自身の API キーと GCP プロジェクト ID を設定してください：
   ```env
   GEMINI_API_KEY=あなたのGEMINI_API_KEYをここに入力
   GOOGLE_CLOUD_PROJECT=あなたのGCPプロジェクトID
   ```

> 💡 **補足**: `GEMINI_API_KEY` を設定しない状態で起動した場合でも、エラーにはならず内蔵のモック評価データ＆SVG図鑑イラストによるフォールバックモードで画面動作を確認できます。

---

## ✨ 主な機能（3ペイン・スプリットワークスペース）

各ペインはヘッダー右上の **「最大化」ボタン** でフルスクリーン表示に切り替え可能です。

1. **📝 左ペイン：ノート＆解説キャンバス ＋ AI赤ペン添削**
   - 手書きペン、図形（四角・丸・ひし形）、矢印コネクタ、テキスト配置、マイク音声入力（Web Speech API）に対応。
   - **3人の専門AIエージェント**（👦 小学生エージェント / 🍄 キノコ生態学エージェント / ✍️ 赤ペン統括先生）が「絵のわかりやすさ」と「説明の正確さ」を個別に採点・フィードバック。
2. **🍌 中央ペイン：Nano Banana 実物キノコ生成スタジオ**
   - 左ペインに描いた「手書きスケッチ画像」と「解説テキスト」をベースに、**Nano Banana (`gemini-nano-banana-2.1`)** がリアルな自然科学イラスト・実物キノコ画像を生成。
   - 手書きスケッチとの並列比較や再生成、キノコ図鑑フォルダへの保存が可能。
3. **🗺️ 右ペイン：Google Maps キノコ生息地マップ（チーム統合領域）**
   - 特定されたキノコが長野県内のどこに生息しているか（標高・共生樹木・発生時期・発生確率）を解析し、Google Maps（航空写真/地形）上にピン表示＆ワンクリック移動（FlyTo）。
   - **長野県4地域（北信・東信・中信・南信）の生息環境まとめ**表示。
   - **チームメンバー統合機能**:
     - 「チームURL統合」タブから、チームメンバーが開発した Google Maps アプリのURLを iframe で直接埋め込み可能。
     - 下部の「チームメンバーのGoogle Map連携用JSONをコピー」ボタンから、生息地座標リスト（`habitatLocations`）と生成画像データをJSON形式で出力・連携可能。

---

## 🚀 ローカル環境での起動方法

### 必要環境
- Node.js 20 以上（推奨: Node.js 22）

### 手順

```bash
# 1. リポジトリのクローン
git clone https://github.com/sawao-san/kinoko-doko.git
cd kinoko-doko

# 2. パッケージのインストール
npm install

# 3. 環境変数ファイルの作成（※ご自身の GEMINI_API_KEY を設定してください）
cp .env.example .env.local

# 4. 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くとアプリが表示されます。

---

## ☁️ Google Cloud Run へのデプロイ方法

本リポジトリには Cloud Run 用の `Dockerfile`、`next.config.js` (`output: "standalone"`)、`.gcloudignore` が設定済みです。  
ご自身の GCP プロジェクトと API キーを指定して、以下のコマンドで直接デプロイできます。

```bash
# 1. ご自身のGoogleアカウントでログイン＆プロジェクト設定
gcloud auth login
gcloud config set project <あなたのGCPプロジェクトID>

# 2. 必要なAPIの有効化（初回のみ）
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# 3. Cloud Run へビルド＆デプロイ（※ご自身の GEMINI_API_KEY を指定してください）
gcloud run deploy kinodoko-app \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=<あなたのGEMINI_API_KEY>"
```

---

## 🛠️ 技術スタック

| カテゴリ | 使用技術 |
| :--- | :--- |
| **フロントエンド** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **描画・音声入力** | HTML5 Canvas API, Web Speech API |
| **AI推論・評価** | Google Gemini API (`gemini-3.8-flash`) - マルチモーダル構造化出力 |
| **実物画像生成** | Nano Banana (`gemini-nano-banana-2.1`) |
| **マップ連携** | Google Maps Embed / チーム開発 Google Maps モジュール統合インターフェース |
| **インフラ / デプロイ** | Docker, Google Cloud Run (`asia-northeast1`) |

---

## 📄 ドキュメント
詳細な設計仕様・マルチエージェント構成・UIワイヤーフレームについては [SPEC.md](./SPEC.md) をご覧ください。
