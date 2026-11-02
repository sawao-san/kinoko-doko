import React, { useState } from 'react';
import { X, Copy, Check, FileText, Layers, ExternalLink, Sparkles, Cpu, Server, Smartphone, Database, ShieldCheck } from 'lucide-react';

interface SubmissionDocModalProps {
  onClose: () => void;
}

export const SubmissionDocModal: React.FC<SubmissionDocModalProps> = ({ onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const projectTitle = 'キノコどこどこ (Edible Mushroom Map)';
  const teamName = 'チーム・マッシュルームナビ (Kinoko Navigators)';
  const deployedUrl = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://ais-dev-bw3rkv5oytmspdxxgldgzp-818729720293.asia-east1.run.app';
  const techStackSelection = 'AIStudio, Gemini, Cloud Run, Node.js';
  const otherTools = 'React, TypeScript, Vite, Tailwind CSS, Leaflet.js, OpenStreetMap, Express, BigQuery, Google Cloud Storage, LocalStorage';
  const categoryRecommendation = 'ライフスタイル・アウトドア / Webアプリケーション / Gemini AI活用部門';

  const projectDescription = `【解決する課題】
秋の味覚やハイキング・自然散策のブームに伴い、野生キノコの採取に興味を持つ人が増える一方、毎年のように毒キノコによる誤食中毒事故や死亡事故が発生しています。
特に「タマゴタケ（可食）とベニテングタケ（有毒）」「ヒラタケ（可食）とツキヨタケ（有毒）」のように、外見が酷似したキノコを素人が見分けることは極めて困難です。また従来の紙の図鑑では「散歩中のその場での同定」が難しく、どこで発見したかの正確な記録を残す手段も限られていました。

【ソリューション】
「キノコどこどこ」は、スマートフォン片手の散歩・トレイル散策中に見つけたキノコを、直感的な操作で写真撮影・GPS位置記録し、Google Gemini 3.8 Flash のマルチモーダル画像解析によって瞬時に鑑定するフィールドナビゲーションWebアプリです。

主な提供価値：
1. 瞬時のマルチモーダルAI鑑定：撮影したキノコ画像を解析し、和名候補、食毒区分（可食/有毒/要注意）、約100文字の豆知識・生態、類似毒キノコとの誤食防止見分けポイントを構造化出力。
2. 直感的なマップビジュアライゼーション：OpenStreetMap/Leaflet を活用し、可食（緑）・有毒（赤）・注意（黄）の色分けピンで発見地点を可視化。
3. 住所・地名検索による遠隔リサーチ：行きたい山や公園の住所を入力すると即座に地図が移動し、過去の記録や現地調査をサポート。
4. 安全性の徹底：AI判定を過信させない免責表示、危険キノコ警告、初心者のための「キノコ散歩安全ガイド」を搭載。
5. スマホ片手操作UI：iPhoneの親指操作域に配慮したエルゴノミクスデザインと、LocalStorage によるオフライン耐性・高速なデータ保持。

【システム構成】
・フロントエンド（Client）：
  - React 19 + TypeScript + Vite による超高速SPA
  - Tailwind CSS 4 によるモバイル最適化UI（セーフエリア・Retina対応）
  - Leaflet.js + OpenStreetMap による地図描画・ピン管理・ポップアップ
  - HTML5 Geolocation API による現在地追従
・バックエンド（Server）：
  - Node.js + Express
  - OpenStreetMap Nominatim API 連携による日本語住所・地名ジオコーディング
・AIモデル（AI Engine）：
  - Google Gemini 3.8 Flash（@google/genai TypeScript SDK）
  - 画像データ（base64）を入力とし、ResponseSchema（JSON Schema）によって食毒区分・注意点・豆知識を厳密に型付けして出力
・ホスティング・インフラ：
  - Google Cloud Run（コンテナサーバーによる高速デプロイ・HTTPS提供）
・データ層：
  - クライアント側 LocalStorage（プライバシー保護＆完全なデータ永続化）`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 font-pixel">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-amber-50 border-4 border-gray-900 shadow-[6px_6px_0px_#111827] flex flex-col safe-pb">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-4 pb-3 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">ハッカソン提出用シート＆システム構成</h2>
              <p className="text-[11px] text-gray-500">ワンクリックでコピーして提出フォームに貼り付け可能です</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full transition"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6">
          {/* Visual Architecture Diagram (Ready for Screenshot!) */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs text-slate-200">
                  アーキテクチャ図（スクリーンショット推奨）
                </span>
              </div>
              <span className="text-[10px] bg-slate-800 text-emerald-300 px-2 py-0.5 rounded-full border border-slate-700">
                System Architecture
              </span>
            </div>

            {/* Architecture Blocks Grid */}
            <div className="space-y-3 text-xs">
              {/* Row 1: Client & Mobile */}
              <div className="p-3 rounded-xl bg-slate-800/90 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block text-sm">フロントエンド (Client)</span>
                    <span className="text-[11px] text-slate-300">
                      React 19 / TypeScript / Vite / Tailwind CSS
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="px-2 py-1 rounded bg-slate-700 text-emerald-300 font-mono">Leaflet.js</span>
                  <span className="px-2 py-1 rounded bg-slate-700 text-emerald-300 font-mono">OpenStreetMap</span>
                  <span className="px-2 py-1 rounded bg-slate-700 text-emerald-300 font-mono">HTML5 GPS</span>
                </div>
              </div>

              {/* Arrow Connector */}
              <div className="flex justify-center text-slate-500 text-xs font-mono">
                ↓ HTTPS JSON REST API / Base64 Multimodal Payload ↓
              </div>

              {/* Row 2: Backend (Cloud Run & Express) */}
              <div className="p-3 rounded-xl bg-slate-800/90 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Server className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block text-sm">バックエンド API (Google Cloud Run)</span>
                    <span className="text-[11px] text-slate-300">
                      Node.js Express Server / Nominatim Geocoding Proxy
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="px-2 py-1 rounded bg-slate-700 text-blue-300 font-mono">Express.js</span>
                  <span className="px-2 py-1 rounded bg-slate-700 text-blue-300 font-mono">Cloud Run</span>
                </div>
              </div>

              {/* Arrow Connector */}
              <div className="flex justify-center text-slate-500 text-xs font-mono">
                ↓ @google/genai TypeScript SDK ↓
              </div>

              {/* Row 3: AI Engine */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-teal-950/70 to-slate-800 border border-teal-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-300" />
                      Google Gemini 3.8 Flash (Multimodal)
                    </span>
                    <span className="text-[11px] text-teal-200/90">
                      画像解析 + 構造化食毒同定 (JSON Schema Response) + 誤食防止判定
                    </span>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-teal-900/60 text-teal-300 border border-teal-700 font-bold text-[10px]">
                  Zero Hallucination Schema
                </div>
              </div>

              {/* Row 4: BigQuery & Cloud Storage Data Layer */}
              <div className="p-3 rounded-xl bg-slate-800/90 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block text-sm">データ蓄積 ＆ アナリティクス (Google Cloud)</span>
                    <span className="text-[11px] text-slate-300">
                      BigQuery（数年間の当たり年・生態トレンド分析）+ Cloud Storage（写真保管）
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="px-2 py-1 rounded bg-slate-700 text-purple-300 font-mono">BigQuery DDL</span>
                  <span className="px-2 py-1 rounded bg-slate-700 text-purple-300 font-mono">GCS Bucket</span>
                  <span className="px-2 py-1 rounded bg-slate-700 text-purple-300 font-mono">LocalStorage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Field 1: プロジェクト名 */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <span className="text-rose-500 font-bold">*</span>
                プロジェクト名 （必須）
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(projectTitle, 'title')}
                className="flex items-center gap-1 text-xs text-emerald-700 font-bold hover:underline"
              >
                {copiedKey === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'title' ? 'コピー完了' : 'コピー'}
              </button>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-gray-200 font-bold text-sm text-gray-900">
              {projectTitle}
            </div>
          </div>

          {/* Form Field 2: チーム名 */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <span className="text-rose-500 font-bold">*</span>
                チーム名 （必須）
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(teamName, 'team')}
                className="flex items-center gap-1 text-xs text-emerald-700 font-bold hover:underline"
              >
                {copiedKey === 'team' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'team' ? 'コピー完了' : 'コピー'}
              </button>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 font-medium">
              {teamName}
            </div>
          </div>

          {/* Form Field 3: 使用技術スタック チェック推奨 */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <span className="text-rose-500 font-bold">*</span>
                使用技術スタック （必須・1つ以上選択）
              </label>
            </div>
            <p className="text-[11px] text-gray-500 mb-2.5">
              フォームの選択肢のうち、以下の項目にチェックを入れてください：
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>AIStudio</span>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Gemini</span>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Cloud Run</span>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Node.js</span>
              </div>
            </div>
          </div>

          {/* Form Field 4: その他のツール（任意・カンマ区切り） */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">その他のツール（任意・カンマ区切り）</label>
              <button
                type="button"
                onClick={() => copyToClipboard(otherTools, 'tools')}
                className="flex items-center gap-1 text-xs text-emerald-700 font-bold hover:underline"
              >
                {copiedKey === 'tools' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'tools' ? 'コピー完了' : 'コピー'}
              </button>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-gray-200 font-mono text-xs text-gray-800">
              {otherTools}
            </div>
          </div>

          {/* Form Field 5: 提出カテゴリ */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <label className="text-xs font-bold text-gray-700 block mb-1">
              <span className="text-rose-500 font-bold">*</span>
              提出カテゴリ （必須）推奨
            </label>
            <div className="p-2.5 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-800">
              {categoryRecommendation}
            </div>
          </div>

          {/* Form Field 6: デプロイ済みURL */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">デプロイ済みURL （推奨）</label>
              <button
                type="button"
                onClick={() => copyToClipboard(deployedUrl, 'url')}
                className="flex items-center gap-1 text-xs text-emerald-700 font-bold hover:underline"
              >
                {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'url' ? 'コピー完了' : 'コピー'}
              </button>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-gray-200 font-mono text-xs text-emerald-800 flex items-center justify-between">
              <span className="truncate mr-2">{deployedUrl}</span>
              <a href={deployedUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500">
              ※AI StudioのプレビューURL（現在表示中のURL）または画面右上の共有URL、あるいはご自身のCloud RunデプロイURLを使用できます。
            </p>
          </div>

          {/* Form Field 7: プロジェクト詳細（概要） （必須） */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <span className="text-rose-500 font-bold">*</span>
                  プロジェクト詳細（概要） （必須）
                </label>
                <p className="text-[10px] text-gray-500">
                  文字数: {projectDescription.length} / 5,000文字（課題、ソリューション、構成を網羅）
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(projectDescription, 'desc')}
                className="flex items-center gap-1 text-xs text-emerald-700 font-bold px-3 py-1.5 bg-emerald-100/80 rounded-lg hover:bg-emerald-200 transition"
              >
                {copiedKey === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'desc' ? '全文をコピー' : '全文をコピー'}
              </button>
            </div>
            <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto font-sans">
              {projectDescription}
            </div>
          </div>

          {/* Screenshot Advice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1">
              📸 添付ファイル（スクリーンショット・アーキテクチャ図）の準備手順
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-amber-800/90 text-[11px]">
              <li><strong>アーキテクチャ図：</strong>上の黒背景の構成図ブロックを画面キャプチャ（スクリーンショット）して添付してください。</li>
              <li><strong>UIスクリーンショット：</strong>本アプリの地図画面（ピンが立った状態）や「キノコを記録」「AI鑑定結果」画面をスマホやPCでキャプチャして添付してください。</li>
            </ol>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
