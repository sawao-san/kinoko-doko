import React from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, MapPin, Calendar, Trash2, Navigation, Info, ShieldAlert } from 'lucide-react';
import { MushroomRecord } from '../types';
import { playClickSound, playCoinSound } from '../utils/audio';

interface MushroomDetailModalProps {
  mushroom: MushroomRecord;
  onClose: () => void;
  onDelete: (id: string) => void;
  onCenterOnMap: (lat: number, lng: number) => void;
}

export const MushroomDetailModal: React.FC<MushroomDetailModalProps> = ({
  mushroom,
  onClose,
  onDelete,
  onCenterOnMap,
}) => {
  const formattedDate = new Date(mushroom.createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDelete = () => {
    playClickSound();
    if (window.confirm(`「${mushroom.name}」の記録を削除してもよろしいですか？`)) {
      onDelete(mushroom.id);
      onClose();
    }
  };

  const badgeBg =
    mushroom.status === '可食'
      ? 'bg-emerald-500 text-gray-950'
      : mushroom.status === '有毒'
      ? 'bg-rose-500 text-white'
      : 'bg-amber-400 text-gray-950';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150 font-pixel">
      <div className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto bg-amber-50 border-t-4 sm:border-4 border-gray-900 shadow-[6px_6px_0px_#111827] flex flex-col safe-pb">
        {/* Header with image */}
        <div className="relative w-full bg-gray-950 h-60 sm:h-64 border-b-3 border-gray-900 overflow-hidden">
          <img
            src={mushroom.imageUrl}
            alt={mushroom.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

          {/* Close button */}
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="absolute top-3 right-3 px-2 py-1 bg-gray-900 text-yellow-300 border-2 border-yellow-400 font-bold text-xs"
            aria-label="閉じる"
          >
            CLOSE ✕
          </button>

          {/* Top Status Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-arcade font-bold border-2 border-gray-900 shadow-[2px_2px_0px_#111827] ${badgeBg}`}
            >
              {mushroom.status === '可食' && '★ 1UP 可食'}
              {mushroom.status === '有毒' && '☠️ POISON 有毒'}
              {mushroom.status === '要注意/不明' && '⚠️ ALERT 要注意'}
            </span>
          </div>

          {/* Title & subtitle over image */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="text-xl sm:text-2xl font-black tracking-wider text-yellow-300 drop-shadow-[2px_2px_0px_#111827]">
              🍄 {mushroom.name}
            </h2>
            {mushroom.scientificName && (
              <p className="text-[11px] text-emerald-200 italic">
                {mushroom.scientificName}
              </p>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="p-4 space-y-3.5">
          {/* Metadata badges: Date & Location */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-800 pb-2 border-b-2 border-gray-900">
            <div className="flex items-center gap-1 bg-yellow-200 px-2 py-0.5 border border-gray-900">
              <Calendar className="w-3.5 h-3.5 text-gray-900" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1 bg-yellow-200 px-2 py-0.5 border border-gray-900 font-arcade text-[10px]">
              <MapPin className="w-3 h-3 text-gray-900" />
              <span>{mushroom.lat.toFixed(4)}, {mushroom.lng.toFixed(4)}</span>
            </div>
          </div>

          {/* User Observation Note */}
          {mushroom.userNotes && (
            <div className="p-2.5 bg-white border-2 border-gray-900 shadow-[2px_2px_0px_#111827] text-xs">
              <span className="font-bold text-gray-900 block mb-0.5">📝 FIELD NOTE:</span>
              <p className="text-gray-800">{mushroom.userNotes}</p>
            </div>
          )}

          {/* Trivia / Characteristics (豆知識) */}
          <div className="p-3 bg-white border-2 border-gray-900 shadow-[3px_3px_0px_#111827] space-y-1">
            <h3 className="text-xs font-black text-gray-900 flex items-center gap-1">
              <Info className="w-4 h-4 text-emerald-700" />
              豆知識・生態・特徴 (LORE)
            </h3>
            <p className="text-xs text-gray-800 leading-snug">
              {mushroom.trivia}
            </p>
          </div>

          {/* Caution & Misidentification Notes */}
          <div className="p-3 bg-rose-100 border-2 border-gray-900 shadow-[3px_3px_0px_#111827] space-y-1">
            <h3 className="text-xs font-black text-rose-950 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-rose-700" />
              誤食を防ぐための見分けの注意点 (WARNING)
            </h3>
            <p className="text-xs text-rose-950 leading-snug font-bold">
              {mushroom.cautionNotes}
            </p>
          </div>

          {/* Habitat & Season if present */}
          {(mushroom.season || mushroom.habitat) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {mushroom.season && (
                <div className="p-2 bg-yellow-100 border-2 border-gray-900">
                  <span className="text-gray-600 block text-[10px] font-bold">発生時期</span>
                  <span className="text-gray-900 font-bold">{mushroom.season}</span>
                </div>
              )}
              {mushroom.habitat && (
                <div className="p-2 bg-yellow-100 border-2 border-gray-900">
                  <span className="text-gray-600 block text-[10px] font-bold">発生環境</span>
                  <span className="text-gray-900 font-bold">{mushroom.habitat}</span>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-2 bg-gray-950 text-yellow-300 text-[10px] leading-tight border border-gray-800">
            <p className="font-bold">※AI判定は参考情報です。絶対に自己判断で口に入れないでください。</p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => {
                playCoinSound();
                onCenterOnMap(mushroom.lat, mushroom.lng);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs border-3 border-gray-900 shadow-[0_4px_0_#111827] active:translate-y-1 active:shadow-none transition"
            >
              <Navigation className="w-4 h-4 text-gray-950" />
              <span>地図でこの位置を見る (WARP)</span>
            </button>

            <button
              onClick={handleDelete}
              className="p-3 bg-rose-200 hover:bg-rose-300 border-3 border-gray-900 text-rose-900 shadow-[0_4px_0_#111827] active:translate-y-1 active:shadow-none transition"
              title="記録を削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
