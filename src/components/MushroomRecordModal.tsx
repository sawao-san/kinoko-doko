import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles, AlertTriangle, CheckCircle2, XCircle, Info, MapPin, X, RefreshCw } from 'lucide-react';
import { MushroomRecord, IdentificationResult, MushroomStatus } from '../types';
import { compressImage } from '../utils/imageHelper';
import { playClickSound, playPowerUpSound, playCoinSound } from '../utils/audio';

interface MushroomRecordModalProps {
  location: { lat: number; lng: number };
  onClose: () => void;
  onSave: (record: MushroomRecord) => void;
}

export const MushroomRecordModal: React.FC<MushroomRecordModalProps> = ({
  location,
  onClose,
  onSave,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [userNotes, setUserNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<IdentificationResult | null>(null);
  const [customName, setCustomName] = useState('');
  const [customStatus, setCustomStatus] = useState<MushroomStatus>('要注意/不明');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      playCoinSound();
      setErrorMsg(null);
      const { base64, mimeType } = await compressImage(file);
      setImagePreview(base64);
      setImageMime(mimeType);
      setAnalysisResult(null);
    } catch (err) {
      console.error('Error reading image file:', err);
      setErrorMsg('画像の読み込みに失敗しました。');
    }
  };

  const handleAnalyzeWithGemini = async () => {
    if (!imagePreview) return;
    playClickSound();
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/identify-mushroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: imageMime,
          userNotes: userNotes.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTPエラー: ${response.status}`);
      }

      const data: IdentificationResult = await response.json();
      setAnalysisResult(data);
      setCustomName(data.name || '不明なキノコ');
      setCustomStatus(data.status || '要注意/不明');
      playPowerUpSound();
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      setErrorMsg(err.message || 'AI判定に失敗しました。電波状況をご確認ください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveRecord = () => {
    if (!imagePreview) {
      setErrorMsg('キノコの写真を選択してください。');
      return;
    }

    playPowerUpSound();
    const newRecord: MushroomRecord = {
      id: `mushroom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: customName || analysisResult?.name || '見つけたキノコ',
      scientificName: analysisResult?.scientificName,
      status: customStatus,
      confidence: analysisResult?.confidence || '中',
      trivia: analysisResult?.trivia || '散歩中に見つけたキノコです。',
      cautionNotes: analysisResult?.cautionNotes || '誤食を防ぐため、むやみに食べないでください。',
      season: analysisResult?.season,
      habitat: analysisResult?.habitat,
      characteristics: analysisResult?.characteristics || [],
      disclaimer: '※AI判定は参考情報です。絶対に自己判断で口に入れないでください。',
      lat: location.lat,
      lng: location.lng,
      imageUrl: imagePreview,
      userNotes: userNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSave(newRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 font-pixel">
      <div className="w-full max-h-[92vh] overflow-y-auto bg-amber-50 border-t-4 border-gray-900 shadow-[0_-6px_0_#111827] flex flex-col safe-pb">
        {/* Retro Dialogue Box Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2.5 bg-emerald-700 border-b-3 border-gray-900 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍄</span>
            <div>
              <h2 className="text-sm font-black tracking-wide text-yellow-300">
                ITEM ACQUISITION: キノコを記録
              </h2>
              <p className="text-[10px] text-emerald-100 flex items-center gap-1 font-arcade">
                COORD: [{location.lat.toFixed(3)}, {location.lng.toFixed(3)}]
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-2 py-0.5 bg-gray-900 hover:bg-black text-white text-xs font-bold border border-yellow-400"
            aria-label="閉じる"
          >
            CLOSE
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          {/* Photo Section with Retro Item Slot */}
          <div>
            <label className="block text-xs font-black text-gray-900 mb-1.5 uppercase tracking-wide">
              1. キノコの写真（PHOTO SLOT）
            </label>

            {!imagePreview ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Take Photo button */}
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    cameraInputRef.current?.click();
                  }}
                  className="pixel-btn p-4 bg-emerald-100 hover:bg-emerald-200 flex flex-col items-center justify-center text-center group"
                >
                  <div className="w-12 h-12 bg-emerald-500 border-2 border-gray-900 shadow-[2px_2px_0px_#111827] flex items-center justify-center text-white mb-2">
                    <Camera className="w-6 h-6 text-gray-950" />
                  </div>
                  <span className="font-bold text-xs text-gray-950">カメラで撮影</span>
                  <span className="text-[10px] text-emerald-800 mt-0.5">その場でパシャリ</span>
                </button>

                {/* Pick from Album button */}
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    albumInputRef.current?.click();
                  }}
                  className="pixel-btn p-4 bg-yellow-100 hover:bg-yellow-200 flex flex-col items-center justify-center text-center group"
                >
                  <div className="w-12 h-12 bg-yellow-400 border-2 border-gray-900 shadow-[2px_2px_0px_#111827] flex items-center justify-center text-gray-950 mb-2">
                    <ImageIcon className="w-6 h-6 text-gray-950" />
                  </div>
                  <span className="font-bold text-xs text-gray-950">アルバム選択</span>
                  <span className="text-[10px] text-gray-700 mt-0.5">保存済み写真</span>
                </button>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <input
                  ref={albumInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="relative border-3 border-gray-900 shadow-[4px_4px_0px_#111827] bg-gray-950 overflow-hidden">
                <img
                  src={imagePreview}
                  alt="撮影したキノコ"
                  className="w-full max-h-56 object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setImagePreview(null);
                    setAnalysisResult(null);
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-yellow-400 text-gray-950 border-2 border-gray-900 text-xs font-bold shadow-[2px_2px_0px_#111827] active:scale-95"
                >
                  RE-TAKE 🔄
                </button>
              </div>
            )}
          </div>

          {/* User Observation Note */}
          <div>
            <label className="block text-xs font-black text-gray-900 mb-1 uppercase tracking-wide">
              2. 観察メモ（FIELD NOTE）
            </label>
            <input
              type="text"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="例: 広葉樹の倒木、根元に群生、湿った苔など"
              className="w-full px-3 py-2 bg-white border-2 border-gray-900 text-xs text-gray-900 focus:outline-none focus:bg-yellow-50 shadow-[2px_2px_0px_#111827]"
            />
          </div>

          {/* AI Identify Trigger Button */}
          {imagePreview && !analysisResult && (
            <div>
              <button
                type="button"
                onClick={handleAnalyzeWithGemini}
                disabled={isAnalyzing}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-sm border-3 border-gray-900 shadow-[0_5px_0_#111827] active:translate-y-1 active:shadow-none disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-950" />
                    <span className="font-arcade text-xs">AI ANALYZING...</span>
                  </>
                ) : (
                  <>
                    <span className="text-base animate-bounce">⚡</span>
                    <span className="tracking-wide">Gemini AIでキノコを鑑定する</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-100 border-2 border-gray-900 shadow-[3px_3px_0px_#111827] text-rose-950 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 64-bit Game Stat Card: AI Analysis Result */}
          {analysisResult && (
            <div className="p-3.5 bg-yellow-100 border-3 border-gray-900 shadow-[4px_4px_0px_#111827] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b-2 border-gray-900 pb-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-arcade font-bold text-gray-900 bg-yellow-300 px-2 py-0.5 border border-gray-900">
                  ★ GEMINI AI RESULT
                </span>
                {analysisResult.confidence && (
                  <span className="text-[11px] text-gray-700">
                    CONFIDENCE: <strong className="text-gray-950">{analysisResult.confidence}</strong>
                  </span>
                )}
              </div>

              {/* Status Badge & Name */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-arcade font-bold border-2 border-gray-900 shadow-[2px_2px_0px_#111827] ${
                      customStatus === '可食'
                        ? 'bg-emerald-500 text-gray-950'
                        : customStatus === '有毒'
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-400 text-gray-950'
                    }`}
                  >
                    {customStatus === '可食' && '【1UP 可食】'}
                    {customStatus === '有毒' && '【POISON 毒】'}
                    {customStatus === '要注意/不明' && '【ALERT 注意】'}
                  </span>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="font-black text-base text-gray-900 bg-white px-2 py-0.5 border-2 border-gray-900 focus:outline-none flex-1 min-w-[140px]"
                    title="キノコ名（編集可能）"
                  />
                </div>
                {analysisResult.scientificName && (
                  <p className="text-[10px] text-gray-600 italic">学名: {analysisResult.scientificName}</p>
                )}
              </div>

              {/* Status Selector Switcher */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-gray-700 font-bold">区分変更:</span>
                {(['可食', '有毒', '要注意/不明'] as MushroomStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setCustomStatus(st);
                    }}
                    className={`px-2 py-0.5 text-[10px] font-bold border-2 border-gray-900 transition ${
                      customStatus === st
                        ? st === '可食'
                          ? 'bg-emerald-500 text-gray-950 shadow-[2px_2px_0px_#111827]'
                          : st === '有毒'
                          ? 'bg-rose-500 text-white shadow-[2px_2px_0px_#111827]'
                          : 'bg-amber-400 text-gray-950 shadow-[2px_2px_0px_#111827]'
                        : 'bg-white text-gray-600'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Trivia Lore Box */}
              <div className="bg-white p-2.5 border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
                <h4 className="text-xs font-black text-gray-900 flex items-center gap-1 mb-1">
                  📖 豆知識・特徴 (LORE)
                </h4>
                <p className="text-xs text-gray-800 leading-snug">{analysisResult.trivia}</p>
              </div>

              {/* Caution & Danger Prevention Notes */}
              <div className="bg-rose-100 p-2.5 border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
                <h4 className="text-xs font-black text-rose-950 flex items-center gap-1 mb-1">
                  ⚠️ 誤食を防ぐ見分けの注意点 (WARNING)
                </h4>
                <p className="text-xs text-rose-950 leading-snug font-bold">
                  {analysisResult.cautionNotes}
                </p>
              </div>

              {/* Characteristics bullets */}
              {analysisResult.characteristics && analysisResult.characteristics.length > 0 && (
                <div className="text-xs">
                  <span className="font-bold text-gray-900 block mb-1">識別ポイント:</span>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.characteristics.map((c, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-white border border-gray-900 text-[11px] text-gray-900 font-bold"
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-2 bg-gray-900 text-yellow-300 text-[10px] leading-tight border border-gray-800">
                <p className="font-bold">※AI判定は参考情報です。絶対に自己判断で口に入れないでください。</p>
              </div>
            </div>
          )}

          {/* Action Buttons: Save or Cancel */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="flex-1 py-3 px-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-black text-xs border-3 border-gray-900 shadow-[0_4px_0_#111827] active:translate-y-1 active:shadow-none transition"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleSaveRecord}
              disabled={!imagePreview}
              className="flex-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs border-3 border-gray-900 shadow-[0_4px_0_#111827] active:translate-y-1 active:shadow-none disabled:opacity-40 transition flex items-center justify-center gap-1.5"
            >
              <span>🍄 マップにピンを立てる</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
