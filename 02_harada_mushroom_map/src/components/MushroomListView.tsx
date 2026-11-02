import React, { useState } from 'react';
import { Search, MapPin, Calendar, CheckCircle2, XCircle, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';
import { MushroomRecord, MushroomStatus } from '../types';
import { playClickSound, playCoinSound } from '../utils/audio';

interface MushroomListViewProps {
  records: MushroomRecord[];
  onSelectRecord: (record: MushroomRecord) => void;
  onCenterOnMap: (lat: number, lng: number) => void;
  onResetSamples: () => void;
}

export const MushroomListView: React.FC<MushroomListViewProps> = ({
  records,
  onSelectRecord,
  onCenterOnMap,
  onResetSamples,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MushroomStatus>('ALL');

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.scientificName && r.scientificName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.userNotes && r.userNotes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.trivia.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const edibleCount = records.filter((r) => r.status === '可食').length;
  const poisonCount = records.filter((r) => r.status === '有毒').length;
  const cautionCount = records.filter((r) => r.status === '要注意/不明').length;

  return (
    <div className="flex flex-col h-full bg-emerald-950 font-pixel safe-pb">
      {/* 64-bit Game Inventory Stats Bar */}
      <div className="bg-emerald-800 border-b-3 border-gray-900 p-3 shadow-[0_4px_0_#111827]">
        <div className="grid grid-cols-4 gap-2 text-center font-arcade text-xs">
          <div className="p-1.5 bg-yellow-400 text-gray-950 border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
            <span className="block text-[8px]">TOTAL</span>
            <span className="text-sm font-black">{records.length}</span>
          </div>
          <div className="p-1.5 bg-emerald-500 text-gray-950 border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
            <span className="block text-[8px]">1UP</span>
            <span className="text-sm font-black">{edibleCount}</span>
          </div>
          <div className="p-1.5 bg-rose-500 text-white border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
            <span className="block text-[8px]">POISON</span>
            <span className="text-sm font-black">{poisonCount}</span>
          </div>
          <div className="p-1.5 bg-amber-400 text-gray-950 border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
            <span className="block text-[8px]">ALERT</span>
            <span className="text-sm font-black">{cautionCount}</span>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="mt-2.5 relative">
          <div className="flex items-center gap-1.5 p-1.5 bg-yellow-50 border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
            <Search className="w-3.5 h-3.5 text-gray-600 ml-1 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH: キノコ名や観察メモで検索..."
              className="w-full text-xs text-gray-900 placeholder-gray-500 bg-transparent focus:outline-none font-pixel"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-gray-500 font-bold px-1"
              >
                ✖
              </button>
            )}
          </div>
        </div>

        {/* Filter Tokens */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5 scrollbar-none font-arcade text-[10px]">
          <button
            onClick={() => {
              playClickSound();
              setStatusFilter('ALL');
            }}
            className={`px-2.5 py-1 border-2 border-gray-900 transition ${
              statusFilter === 'ALL'
                ? 'bg-yellow-400 text-gray-950 font-bold shadow-[2px_2px_0px_#111827]'
                : 'bg-emerald-900 text-emerald-200 hover:bg-emerald-700'
            }`}
          >
            ALL ({records.length})
          </button>
          <button
            onClick={() => {
              playClickSound();
              setStatusFilter('可食');
            }}
            className={`px-2.5 py-1 border-2 border-gray-900 transition ${
              statusFilter === '可食'
                ? 'bg-emerald-500 text-gray-950 font-bold shadow-[2px_2px_0px_#111827]'
                : 'bg-emerald-900 text-emerald-300 hover:bg-emerald-700'
            }`}
          >
            1UP ({edibleCount})
          </button>
          <button
            onClick={() => {
              playClickSound();
              setStatusFilter('有毒');
            }}
            className={`px-2.5 py-1 border-2 border-gray-900 transition ${
              statusFilter === '有毒'
                ? 'bg-rose-500 text-white font-bold shadow-[2px_2px_0px_#111827]'
                : 'bg-emerald-900 text-rose-300 hover:bg-emerald-700'
            }`}
          >
            POISON ({poisonCount})
          </button>
          <button
            onClick={() => {
              playClickSound();
              setStatusFilter('要注意/不明');
            }}
            className={`px-2.5 py-1 border-2 border-gray-900 transition ${
              statusFilter === '要注意/不明'
                ? 'bg-amber-400 text-gray-950 font-bold shadow-[2px_2px_0px_#111827]'
                : 'bg-emerald-900 text-amber-300 hover:bg-emerald-700'
            }`}
          >
            ALERT ({cautionCount})
          </button>
        </div>
      </div>

      {/* 64-bit Game Inventory Grid / List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4 bg-emerald-900/50 border-3 border-dashed border-emerald-700 p-6 m-2">
            <span className="text-4xl block mb-2 animate-bounce">🍄</span>
            <p className="font-bold text-yellow-300 text-sm">NO DATA FOUND</p>
            <p className="text-xs text-emerald-200 mt-1">
              {searchTerm ? '検索ワードを変えてみてください' : '散歩で見つけたキノコを記録してみましょう'}
            </p>
            {records.length === 0 && (
              <button
                onClick={() => {
                  playCoinSound();
                  onResetSamples();
                }}
                className="mt-4 px-4 py-2 bg-yellow-400 text-gray-950 font-black text-xs border-3 border-gray-900 shadow-[0_4px_0_#111827] active:translate-y-1 active:shadow-none transition inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RESTORE SAMPLE DATA (初期サンプル復元)
              </button>
            )}
          </div>
        ) : (
          filtered.map((record) => {
            const dateStr = new Date(record.createdAt).toLocaleDateString('ja-JP', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={record.id}
                onClick={() => {
                  playClickSound();
                  onSelectRecord(record);
                }}
                className="flex items-center gap-3 p-2.5 bg-amber-50 border-3 border-gray-900 shadow-[4px_4px_0px_#111827] active:translate-y-0.5 active:shadow-[2px_2px_0px_#111827] transition cursor-pointer"
              >
                {/* Photo Thumbnail with Retro Frame */}
                <div className="w-16 h-16 bg-gray-900 border-2 border-gray-900 shrink-0 overflow-hidden">
                  <img
                    src={record.imageUrl}
                    alt={record.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-arcade font-bold border border-gray-900 shadow-[1px_1px_0px_#111827] shrink-0 ${
                        record.status === '可食'
                          ? 'bg-emerald-500 text-gray-950'
                          : record.status === '有毒'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-400 text-gray-950'
                      }`}
                    >
                      {record.status === '可食' ? '1UP' : record.status === '有毒' ? 'POISON' : 'ALERT'}
                    </span>
                    <h3 className="font-black text-xs sm:text-sm text-gray-950 truncate">
                      {record.name}
                    </h3>
                  </div>

                  <p className="text-[11px] text-gray-700 line-clamp-1 mb-1">{record.trivia}</p>

                  <div className="flex items-center gap-3 text-[10px] text-gray-600 font-arcade">
                    <span className="flex items-center gap-1 text-gray-500">
                      📅 {dateStr}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playCoinSound();
                        onCenterOnMap(record.lat, record.lng);
                      }}
                      className="flex items-center gap-0.5 text-emerald-800 font-bold hover:underline"
                    >
                      <MapPin className="w-3 h-3 text-emerald-700" />
                      MAP WARP ▶
                    </button>
                  </div>
                </div>

                <div className="text-gray-900 text-lg font-bold pr-1">
                  ▶
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
