import React, { useState, useEffect } from 'react';
import { Map, BookOpen, ShieldAlert, Sparkles, Plus, AlertTriangle, FileText, Volume2, VolumeX, Gamepad2 } from 'lucide-react';
import { MushroomRecord } from './types';
import { getMushroomRecords, addMushroomRecord, deleteMushroomRecord, resetToSampleRecords } from './utils/storage';
import { MapComponent } from './components/MapComponent';
import { MushroomRecordModal } from './components/MushroomRecordModal';
import { MushroomDetailModal } from './components/MushroomDetailModal';
import { MushroomListView } from './components/MushroomListView';
import { SafetyGuideModal } from './components/SafetyGuideModal';
import { SubmissionDocModal } from './components/SubmissionDocModal';
import { BigQueryAnalyticsModal } from './components/BigQueryAnalyticsModal';
import { isSoundEnabled, toggleSound, playClickSound, playPowerUpSound } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<'MAP' | 'LIST'>('MAP');
  const [records, setRecords] = useState<MushroomRecord[]>([]);
  const [soundOn, setSoundOn] = useState(true);

  // Recording workflow state
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Detail, Safety, Submission & BigQuery modals
  const [selectedMushroomForDetail, setSelectedMushroomForDetail] = useState<MushroomRecord | null>(null);
  const [showSafetyGuide, setShowSafetyGuide] = useState(false);
  const [showSubmissionDoc, setShowSubmissionDoc] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Map panning target
  const [centerTarget, setCenterTarget] = useState<{ lat: number; lng: number } | null>(null);

  // Load records from LocalStorage on mount
  useEffect(() => {
    const loaded = getMushroomRecords();
    setRecords(loaded);
    setSoundOn(isSoundEnabled());
  }, []);

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  const handleStartRecord = () => {
    playClickSound();
    setActiveTab('MAP');
    setIsSelectingLocation(true);
    setPickedLocation(null);
  };

  const handleLocationPicked = (loc: { lat: number; lng: number }) => {
    playClickSound();
    setPickedLocation(loc);
    setIsSelectingLocation(false);
    setShowRecordModal(true);
  };

  const handleSaveMushroom = (newRecord: MushroomRecord) => {
    playPowerUpSound();
    const updated = addMushroomRecord(newRecord);
    setRecords(updated);
    setShowRecordModal(false);
    setPickedLocation(null);
    setCenterTarget({ lat: newRecord.lat, lng: newRecord.lng });
  };

  const handleDeleteMushroom = (id: string) => {
    playClickSound();
    const updated = deleteMushroomRecord(id);
    setRecords(updated);
  };

  const handleResetSamples = () => {
    playClickSound();
    if (window.confirm('サンプルのキノコデータを初期状態に戻しますか？')) {
      const resetData = resetToSampleRecords();
      setRecords(resetData);
    }
  };

  const handleCenterOnMap = (lat: number, lng: number) => {
    playClickSound();
    setActiveTab('MAP');
    setCenterTarget({ lat, lng });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-emerald-950 font-pixel">
      {/* 64-bit Pop Game HUD Header */}
      <header className="shrink-0 z-40 bg-emerald-700 border-b-4 border-gray-900 shadow-[0_4px_0_#111827] text-white safe-pt">
        {/* Top Status Bar (Score / Stage / Audio) */}
        <div className="bg-emerald-800 border-b-2 border-emerald-900 px-4 py-1 flex items-center justify-between text-[11px] font-arcade tracking-tight">
          <div className="flex items-center gap-2 text-yellow-300">
            <span className="animate-pulse">★</span>
            <span>STAGE: YEAR {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-200 flex items-center gap-1 font-bold">
              <span className="text-xs">🍄</span> <span className="text-yellow-300">{records.length}</span>
            </span>
            {/* Audio Toggle */}
            <button
              onClick={handleSoundToggle}
              className="p-1 text-yellow-300 hover:text-white transition active:scale-90"
              title="8-bit効果音 ON/OFF"
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-gray-400" />}
            </button>
          </div>
        </div>

        {/* Main Header Row */}
        <div className="flex items-center justify-between px-3.5 py-2">
          {/* Logo with 64-bit Game Cartridge Icon */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-14 h-14 bg-yellow-400 border-3 border-gray-900 shadow-[3px_3px_0px_#111827] text-4xl pixelated">
              🍄
            </div>
            <div>
              <h1 className="text-base font-black tracking-wider leading-none text-white drop-shadow-[2px_2px_0px_#111827] flex items-center gap-1.5">
                キノコどこどこ
                <span className="text-[9px] font-arcade bg-yellow-400 text-gray-900 px-1 py-0.5 border border-gray-900 shadow-[1px_1px_0px_#111827]">
                  64-BIT AI
                </span>
              </h1>
              <p className="text-[11px] text-yellow-200 mt-0.5 tracking-wide">散歩ルートの菌類コレクション帳</p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-1.5">
            {/* BigQuery / Bumper Year Analytics Button */}
            <button
              onClick={() => {
                playClickSound();
                setShowAnalyticsModal(true);
              }}
              className="pixel-btn-sm px-2 py-1 bg-blue-500 hover:bg-blue-400 text-white font-bold text-[11px] flex items-center gap-1 shadow-[2px_2px_0px_#111827]"
              title="BigQuery ＆ 当たり年アナリティクス"
            >
              <span>📊 分析</span>
            </button>

            {/* Submission Form Guide Button */}
            <button
              onClick={() => {
                playClickSound();
                setShowSubmissionDoc(true);
              }}
              className="pixel-btn-sm px-2 py-1 bg-amber-400 text-gray-900 font-bold text-[11px] flex items-center gap-1"
              title="提出用シート＆アーキテクチャ図"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">提出回答</span>
            </button>

            {/* Safety Guide Button */}
            <button
              onClick={() => {
                playClickSound();
                setShowSafetyGuide(true);
              }}
              className="pixel-btn-sm px-2 py-1 bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1"
              title="キノコ安全ガイド"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>安全</span>
            </button>
          </div>
        </div>

        {/* 64-bit Game Tabs (WORLD MAP vs ZUKAN) */}
        <div className="flex px-3 pb-2 gap-2">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('MAP');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold transition pixel-btn ${
              activeTab === 'MAP'
                ? 'bg-yellow-400 text-gray-950 font-black'
                : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>🗺️ ワールドマップ</span>
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('LIST');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold transition pixel-btn ${
              activeTab === 'LIST'
                ? 'bg-yellow-400 text-gray-950 font-black'
                : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📖 見つけた図鑑 ({records.length})</span>
          </button>
        </div>
      </header>

      {/* Main Game Screen Canvas */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        {/* Map View */}
        <div className={`w-full h-full ${activeTab === 'MAP' ? 'block' : 'hidden'}`}>
          <MapComponent
            records={records}
            selectedLocation={pickedLocation}
            isSelectingLocation={isSelectingLocation}
            onLocationSelected={handleLocationPicked}
            onCancelSelection={() => {
              playClickSound();
              setIsSelectingLocation(false);
              setPickedLocation(null);
            }}
            onOpenDetail={(record) => {
              playClickSound();
              setSelectedMushroomForDetail(record);
            }}
            onStartRecord={handleStartRecord}
            centerTarget={centerTarget}
          />
        </div>

        {/* List View */}
        {activeTab === 'LIST' && (
          <div className="w-full h-full">
            <MushroomListView
              records={records}
              onSelectRecord={(record) => {
                playClickSound();
                setSelectedMushroomForDetail(record);
              }}
              onCenterOnMap={handleCenterOnMap}
              onResetSamples={handleResetSamples}
            />
          </div>
        )}
      </main>

      {/* Modal: Record Mushroom */}
      {showRecordModal && pickedLocation && (
        <MushroomRecordModal
          location={pickedLocation}
          onClose={() => {
            playClickSound();
            setShowRecordModal(false);
            setPickedLocation(null);
          }}
          onSave={handleSaveMushroom}
        />
      )}

      {/* Modal: Mushroom Details */}
      {selectedMushroomForDetail && (
        <MushroomDetailModal
          mushroom={selectedMushroomForDetail}
          onClose={() => {
            playClickSound();
            setSelectedMushroomForDetail(null);
          }}
          onDelete={handleDeleteMushroom}
          onCenterOnMap={handleCenterOnMap}
        />
      )}

      {/* Modal: Safety Guide */}
      {showSafetyGuide && (
        <SafetyGuideModal onClose={() => {
          playClickSound();
          setShowSafetyGuide(false);
        }} />
      )}

      {/* Modal: Hackathon Submission Document & Architecture */}
      {showSubmissionDoc && (
        <SubmissionDocModal onClose={() => {
          playClickSound();
          setShowSubmissionDoc(false);
        }} />
      )}

      {/* Modal: BigQuery Analytics & Bumper Year Detection */}
      {showAnalyticsModal && (
        <BigQueryAnalyticsModal
          records={records}
          onClose={() => {
            playClickSound();
            setShowAnalyticsModal(false);
          }}
        />
      )}
    </div>
  );
}
