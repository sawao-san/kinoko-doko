import React from 'react';
import { X, ShieldAlert, AlertTriangle, CheckCircle2, HeartHandshake } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface SafetyGuideModalProps {
  onClose: () => void;
}

export const SafetyGuideModal: React.FC<SafetyGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 font-pixel">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-amber-50 border-4 border-gray-900 shadow-[6px_6px_0px_#111827] flex flex-col safe-pb">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 bg-rose-600 border-b-3 border-gray-900 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <h2 className="text-sm font-black text-yellow-300 tracking-wide">
              SAFETY RULES: キノコ散歩・安全の書
            </h2>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-2 py-0.5 bg-gray-900 hover:bg-black text-yellow-300 font-bold text-xs border border-yellow-400"
            aria-label="閉じる"
          >
            CLOSE ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 text-xs text-gray-800 leading-snug">
          {/* Main banner */}
          <div className="p-3 bg-rose-100 border-2 border-gray-900 shadow-[3px_3px_0px_#111827] text-rose-950">
            <h3 className="font-black text-xs flex items-center gap-1.5 mb-1 text-rose-900">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              【冒険者の掟】絶対に守るべき3大原則
            </h3>
            <ul className="list-disc list-inside space-y-1 font-bold mt-1 text-[11px]">
              <li>確実に鑑定できないキノコは【採らない・食べない・売らない・人にあげない】</li>
              <li>「柄が縦に裂けるキノコは安全」「虫食いがあるから平気」等の俗説は命に関わる危険な迷信です</li>
              <li>万一体調不良を感じたら、直ちに医療機関（救急・保健所）へご相談ください</li>
            </ul>
          </div>

          {/* AI Disclaimer Explanation */}
          <div className="p-3 bg-yellow-100 border-2 border-gray-900 shadow-[3px_3px_0px_#111827] space-y-1">
            <h4 className="font-black text-gray-900 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Gemini AI鑑定の役割について
            </h4>
            <p className="text-[11px] text-gray-800">
              本アプリは、散策中に自然のキノコに興味を持ち、菌類の多様性を楽しむための「観察支援フィールドノート」です。
            </p>
            <p className="text-[11px] text-gray-800 font-bold">
              AIは写真の画像情報から統計的に類似種を推定しているため、<span className="text-rose-700">絶対にAIの「可食」判定のみを根拠に喫食しないでください。</span>
            </p>
          </div>

          {/* Similar species warning */}
          <div className="space-y-1.5">
            <h4 className="font-black text-gray-900 text-xs">⚠️ 見間違いやすい危険な毒キノコ例</h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 bg-white border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
                <span className="font-black text-rose-700 block">ツキヨタケ（有毒） ⇄ ヒラタケ・シイタケ（食用）</span>
                <span className="text-gray-700">秋のブナ倒木に生え誤食事故多発。柄の断面に黒いシミがあり夜間に薄く光ります。</span>
              </div>
              <div className="p-2 bg-white border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
                <span className="font-black text-rose-700 block">クサウラベニタケ（有毒） ⇄ ウラベニホテイシメジ（食用）</span>
                <span className="text-gray-700">外見が酷似しベテランでも間違えやすい危険種です。</span>
              </div>
              <div className="p-2 bg-white border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
                <span className="font-black text-rose-700 block">カエンタケ（猛毒・致死性）</span>
                <span className="text-gray-700">赤い指のような形。触るだけでも皮膚が爛れるため絶対に触れてはいけません。</span>
              </div>
            </div>
          </div>

          {/* Bear Safety Section */}
          <div className="p-3 bg-amber-100 border-2 border-gray-900 shadow-[3px_3px_0px_#111827] space-y-1 text-amber-950">
            <h4 className="font-black text-xs flex items-center gap-1.5 text-amber-900">
              <span>🐻</span>
              キノコ採り入山時の熊遭遇対策 (ALERTレイヤー)
            </h4>
            <p className="text-[11px] leading-snug">
              秋の山林はキノコの最盛期であると同時に、冬眠前のクマ（ヒグマ・ツキノワグマ）の活発な採食期です。
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] font-bold">
              <li>マップの<strong className="text-rose-800">「🐻 ALERT」</strong>ボタンで全国の熊目撃・出没警戒レイヤーを確認できます</li>
              <li>熊除け鈴や携帯ラジオを鳴らし、音で人間の存在を常に知らせる</li>
              <li>クマスプレーを即座に安全ピンを抜ける位置に携行する</li>
              <li>早朝・夕暮れ時の単独行動や、視界の悪いヤブ漕ぎは厳禁</li>
            </ul>
          </div>

          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs border-3 border-gray-900 shadow-[0_4px_0_#111827] active:translate-y-1 active:shadow-none transition"
          >
            ルールを理解しました (OK)
          </button>
        </div>
      </div>
    </div>
  );
};
