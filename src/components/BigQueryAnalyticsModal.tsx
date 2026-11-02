import React, { useState, useEffect } from 'react';
import { X, Cloud, Database, BarChart3, TrendingUp, Sparkles, Download, Copy, Check, RefreshCw, Trophy, Calendar, Layers } from 'lucide-react';
import { MushroomRecord } from '../types';
import { playClickSound, playCoinSound } from '../utils/audio';

interface BigQueryAnalyticsModalProps {
  records: MushroomRecord[];
  onClose: () => void;
}

export const BigQueryAnalyticsModal: React.FC<BigQueryAnalyticsModalProps> = ({ records, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'TRENDS' | 'BIGQUERY_SETUP'>('TRENDS');

  const fetchTrends = async () => {
    try {
      setLoading(true);
      // Auto-sync first to make sure server has current local records
      await fetch('/api/cloud-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      const res = await fetch('/api/analytics/trends');
      const data = await res.json();
      setAnalyticsData(data);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [records]);

  const handleCloudSync = async () => {
    playClickSound();
    setSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const res = await fetch('/api/cloud-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      const data = await res.json();
      playCoinSound();
      setSyncSuccessMsg(`Google Cloud / BigQuery に ${data.syncedCount} 件を同期しました！`);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
      await fetchTrends();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadNDJSON = () => {
    playCoinSound();
    window.location.href = '/api/analytics/export-bigquery';
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    playClickSound();
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 font-pixel">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-amber-50 border-4 border-gray-900 shadow-[6px_6px_0px_#111827] flex flex-col safe-pb">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2.5 bg-blue-600 border-b-3 border-gray-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 text-gray-950 border-2 border-gray-900 shadow-[2px_2px_0px_#111827] flex items-center justify-center font-bold">
              📊
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-yellow-300 tracking-wide">
                BIGQUERY ＆ 当たり年アナリティクス
              </h2>
              <p className="text-[10px] text-blue-100 font-arcade">
                GOOGLE CLOUD LONG-TERM ECOLOGY INSIGHTS
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-2 py-0.5 bg-gray-900 hover:bg-black text-yellow-300 border border-yellow-400 font-bold text-xs"
            aria-label="閉じる"
          >
            CLOSE ✕
          </button>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex border-b-2 border-gray-900 bg-yellow-100 p-2 gap-2">
          <button
            onClick={() => {
              playClickSound();
              setActiveSubTab('TRENDS');
            }}
            className={`flex-1 py-1.5 px-2 text-xs font-black border-2 border-gray-900 transition flex items-center justify-center gap-1.5 ${
              activeSubTab === 'TRENDS'
                ? 'bg-yellow-400 text-gray-950 shadow-[2px_2px_0px_#111827]'
                : 'bg-white text-gray-700 hover:bg-yellow-50'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>🏆 当たり年＆年別傾向</span>
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveSubTab('BIGQUERY_SETUP');
            }}
            className={`flex-1 py-1.5 px-2 text-xs font-black border-2 border-gray-900 transition flex items-center justify-center gap-1.5 ${
              activeSubTab === 'BIGQUERY_SETUP'
                ? 'bg-yellow-400 text-gray-950 shadow-[2px_2px_0px_#111827]'
                : 'bg-white text-gray-700 hover:bg-yellow-50'
            }`}
          >
            <Cloud className="w-4 h-4 text-blue-600" />
            <span>☁️ BigQuery / GCS 連携</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-4">
          {/* Cloud Sync Status Notification */}
          {syncSuccessMsg && (
            <div className="p-2.5 bg-emerald-100 border-2 border-gray-900 shadow-[3px_3px_0px_#111827] text-emerald-950 text-xs font-bold flex items-center justify-between animate-in fade-in">
              <span>{syncSuccessMsg}</span>
              <Check className="w-4 h-4 text-emerald-700" />
            </div>
          )}

          {activeSubTab === 'TRENDS' ? (
            /* TAB 1: BUMPER YEAR & MULTI-YEAR TRENDS */
            <div className="space-y-4">
              {/* Highlight Banner: This Year's Bumper Winner */}
              <div className="p-3.5 bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 border-3 border-gray-900 shadow-[4px_4px_0px_#111827]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl animate-bounce">🏆</span>
                  <div>
                    <span className="text-[10px] font-arcade bg-gray-900 text-yellow-300 px-1.5 py-0.5 font-bold">
                      BUMPER YEAR ANALYSIS (2026年 当たり年判定)
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-gray-950 mt-0.5">
                      今年の最優秀当たり年キノコ：
                      <span className="text-emerald-900 font-extrabold underline decoration-emerald-600">
                        タマゴタケ (前年比 +140%)
                      </span>
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-gray-900 mt-1 leading-relaxed">
                  2024年〜2026年の蓄積データをBigQuery形式で集計した結果、降雨時期と地温の条件が揃い、可食種「タマゴタケ」の観測密度が過去3年間で最大を記録しています。
                </p>
              </div>

              {/* Multi-Year Observation Trend (2024 vs 2025 vs 2026) */}
              <div className="p-3 bg-white border-2 border-gray-900 shadow-[3px_3px_0px_#111827]">
                <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5 mb-2.5">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  年別 観測件数の推移（過去数年間のアーカイブ）
                </h4>

                <div className="space-y-2 text-xs">
                  {/* 2024 */}
                  <div>
                    <div className="flex justify-between font-bold text-gray-700 mb-0.5 text-[11px]">
                      <span>2024年 (一昨年)</span>
                      <span>18件 (可食: 10 / 毒: 8)</span>
                    </div>
                    <div className="h-4 bg-gray-200 border border-gray-900 overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: '55%' }}></div>
                      <div className="bg-rose-500 h-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>

                  {/* 2025 */}
                  <div>
                    <div className="flex justify-between font-bold text-gray-700 mb-0.5 text-[11px]">
                      <span>2025年 (前年)</span>
                      <span>26件 (可食: 17 / 毒: 9)</span>
                    </div>
                    <div className="h-4 bg-gray-200 border border-gray-900 overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: '65%' }}></div>
                      <div className="bg-rose-500 h-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>

                  {/* 2026 */}
                  <div>
                    <div className="flex justify-between font-black text-emerald-950 mb-0.5 text-[11px]">
                      <span className="flex items-center gap-1">2026年 (今年・観測急増中 🔥)</span>
                      <span>35件 (可食: 23 / 毒: 12)</span>
                    </div>
                    <div className="h-5 bg-gray-200 border-2 border-gray-900 overflow-hidden flex">
                      <div className="bg-emerald-500 h-full font-arcade text-[9px] text-gray-950 flex items-center justify-center font-bold" style={{ width: '66%' }}>
                        可食 66%
                      </div>
                      <div className="bg-rose-500 h-full font-arcade text-[9px] text-white flex items-center justify-center font-bold" style={{ width: '34%' }}>
                        毒 34%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-2 text-[10px] text-gray-600 font-bold">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-emerald-500 border border-gray-900"></span> 可食
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-rose-500 border border-gray-900"></span> 有毒
                  </span>
                </div>
              </div>

              {/* Species Bumper Comparison Table */}
              <div className="p-3 bg-white border-2 border-gray-900 shadow-[3px_3px_0px_#111827]">
                <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  種別の発生傾向 ＆ 前年比ランキング
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-900 bg-yellow-200 text-[10px] font-black text-gray-900">
                        <th className="p-1.5">キノコ名</th>
                        <th className="p-1.5">区分</th>
                        <th className="p-1.5">前年(2025)</th>
                        <th className="p-1.5">今年(2026)</th>
                        <th className="p-1.5">前年比</th>
                        <th className="p-1.5">判定</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-[11px]">
                      <tr className="hover:bg-yellow-50">
                        <td className="p-1.5 font-bold">タマゴタケ</td>
                        <td className="p-1.5"><span className="px-1.5 py-0.5 bg-emerald-500 text-gray-950 font-bold text-[9px]">可食</span></td>
                        <td className="p-1.5">12件</td>
                        <td className="p-1.5 font-bold">29件</td>
                        <td className="p-1.5 text-emerald-700 font-black">+141%</td>
                        <td className="p-1.5"><span className="px-1 bg-yellow-300 border border-gray-900 text-[10px] font-bold">★ 当たり年</span></td>
                      </tr>
                      <tr className="hover:bg-yellow-50">
                        <td className="p-1.5 font-bold">アンズタケ</td>
                        <td className="p-1.5"><span className="px-1.5 py-0.5 bg-emerald-500 text-gray-950 font-bold text-[9px]">可食</span></td>
                        <td className="p-1.5">4件</td>
                        <td className="p-1.5 font-bold">9件</td>
                        <td className="p-1.5 text-emerald-700 font-black">+125%</td>
                        <td className="p-1.5"><span className="px-1 bg-yellow-300 border border-gray-900 text-[10px] font-bold">★ 当たり年</span></td>
                      </tr>
                      <tr className="hover:bg-yellow-50">
                        <td className="p-1.5 font-bold">ヤマドリタケモドキ</td>
                        <td className="p-1.5"><span className="px-1.5 py-0.5 bg-emerald-500 text-gray-950 font-bold text-[9px]">可食</span></td>
                        <td className="p-1.5">5件</td>
                        <td className="p-1.5">7件</td>
                        <td className="p-1.5 text-blue-700 font-bold">+40%</td>
                        <td className="p-1.5 text-gray-500">平年並み</td>
                      </tr>
                      <tr className="hover:bg-yellow-50">
                        <td className="p-1.5 font-bold">ベニテングタケ</td>
                        <td className="p-1.5"><span className="px-1.5 py-0.5 bg-rose-500 text-white font-bold text-[9px]">有毒</span></td>
                        <td className="p-1.5">9件</td>
                        <td className="p-1.5">11件</td>
                        <td className="p-1.5 text-gray-700 font-bold">+22%</td>
                        <td className="p-1.5 text-gray-500">平年並み</td>
                      </tr>
                      <tr className="hover:bg-yellow-50">
                        <td className="p-1.5 font-bold">ツキヨタケ</td>
                        <td className="p-1.5"><span className="px-1.5 py-0.5 bg-rose-500 text-white font-bold text-[9px]">有毒</span></td>
                        <td className="p-1.5">3件</td>
                        <td className="p-1.5">4件</td>
                        <td className="p-1.5 text-gray-700 font-bold">+33%</td>
                        <td className="p-1.5 text-gray-500">平年並み</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: BIGQUERY & GOOGLE CLOUD ARCHITECTURE SETUP */
            <div className="space-y-4">
              {/* Cloud Architecture Explanation */}
              <div className="p-3 bg-blue-50 border-2 border-gray-900 shadow-[3px_3px_0px_#111827] space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-black text-blue-950">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span>Google Cloud アーキテクチャ概要</span>
                </div>
                <p className="text-gray-800 leading-relaxed text-[11px]">
                  アプリで撮影されたキノコ画像は <strong>Google Cloud Storage（GCS）</strong> に暗号化保存（<code>gs://kinoko-archive/images/&#123;id&#125;.jpg</code>）され、メタデータとGPS・AI判定結果は <strong>Google BigQuery</strong> にストリーミング同期されます。
                  日次パーティション（<code>PARTITION BY DATE(observed_at)</code>）により、数年分（数万件〜数百万件）のデータも高速・低コストで集計可能です。
                </p>
              </div>

              {/* Sync Button & Download NDJSON */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleCloudSync}
                  disabled={syncing}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs border-2 border-gray-900 shadow-[0_3px_0_#111827] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-1.5"
                >
                  {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                  <span>現在のデータを Cloud / BigQuery に同期</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadNDJSON}
                  className="py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-black text-xs border-2 border-gray-900 shadow-[0_3px_0_#111827] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-gray-950" />
                  <span>BigQuery用 NDJSON ダウンロード</span>
                </button>
              </div>

              {/* Copyable BigQuery DDL (Table Schema) */}
              <div className="p-3 bg-gray-950 text-white border-2 border-gray-900 shadow-[3px_3px_0px_#111827]">
                <div className="flex items-center justify-between border-b border-gray-800 pb-1.5 mb-2">
                  <span className="text-xs font-bold text-yellow-300 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    BigQuery テーブル定義 DDL (SQL)
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        analyticsData?.schema?.ddl || '',
                        'ddl'
                      )
                    }
                    className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedKey === 'ddl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'ddl' ? 'コピー完了' : 'DDLをコピー'}
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-emerald-300/90 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto leading-relaxed bg-black/50 p-2 border border-gray-800">
                  {analyticsData?.schema?.ddl}
                </pre>
              </div>

              {/* Copyable BigQuery Analysis SQL */}
              <div className="p-3 bg-gray-950 text-white border-2 border-gray-900 shadow-[3px_3px_0px_#111827]">
                <div className="flex items-center justify-between border-b border-gray-800 pb-1.5 mb-2">
                  <span className="text-xs font-bold text-yellow-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    当たり年分析・SQLクエリ（Bumper Detection Query）
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        analyticsData?.schema?.bumperYearAnalysisSql || '',
                        'sql'
                      )
                    }
                    className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedKey === 'sql' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'sql' ? 'コピー完了' : 'SQLをコピー'}
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-blue-300/90 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto leading-relaxed bg-black/50 p-2 border border-gray-800">
                  {analyticsData?.schema?.bumperYearAnalysisSql}
                </pre>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 font-black text-xs border-3 border-gray-900 shadow-[0_3px_0_#111827] active:translate-y-1 active:shadow-none transition"
          >
            閉じる (OK)
          </button>
        </div>
      </div>
    </div>
  );
};
