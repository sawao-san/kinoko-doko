import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Locate, Search, X, Loader2, MapPin, AlertCircle, Flame, Layers } from 'lucide-react';
import { MushroomRecord, MushroomStatus, GeocodeResult } from '../types';
import { createMushroomMarkerIcon, createUserLocationIcon, createTempLocationIcon, createSearchResultIcon, createBearMarkerIcon } from '../utils/mapIcons';
import { playClickSound, playCoinSound, playJumpSound, playPowerUpSound } from '../utils/audio';
import { generateHotspotClusters } from '../utils/heatmapHelper';
import { JAPAN_BEAR_SIGHTINGS, BEAR_HOTSPOT_REGIONS } from '../data/bearSightings';

interface MapComponentProps {
  records: MushroomRecord[];
  selectedLocation: { lat: number; lng: number } | null;
  isSelectingLocation: boolean;
  onLocationSelected: (location: { lat: number; lng: number }) => void;
  onCancelSelection: () => void;
  onOpenDetail: (record: MushroomRecord) => void;
  onStartRecord: () => void;
  centerTarget: { lat: number; lng: number } | null;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  records,
  selectedLocation,
  isSelectingLocation,
  onLocationSelected,
  onCancelSelection,
  onOpenDetail,
  onStartRecord,
  centerTarget,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const bearLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [promptLocation, setPromptLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | MushroomStatus>('ALL');

  // Heatmap mode toggle (Default: ON)
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Address search states
  const [addressQuery, setAddressQuery] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressCandidates, setAddressCandidates] = useState<GeocodeResult[]>([]);
  const [searchNotification, setSearchNotification] = useState<string | null>(null);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = 36.3162;
    const initialLng = 138.5232;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Heatmap layer sits gracefully UNDER markers so both are visible
    const heatmapGroup = L.layerGroup().addTo(map);
    heatmapLayerRef.current = heatmapGroup;

    // Bear Alert Layer sits between heatmap and mushroom markers
    const bearGroup = L.layerGroup().addTo(map);
    bearLayerRef.current = bearGroup;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Initially place 1P YOU at bottom-left of Karuizawa Plant view
    const initialUserLat = initialLat - 0.005;
    const initialUserLng = initialLng - 0.005;
    const initialUserCoords = { lat: initialUserLat, lng: initialUserLng };
    setUserLocation(initialUserCoords);
    userMarkerRef.current = L.marker([initialUserLat, initialUserLng], {
      icon: createUserLocationIcon(false),
      zIndexOffset: 1500,
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Geolocation fetcher
  const getUserLocation = (panMap = false) => {
    if (!navigator.geolocation) {
      setGpsError('お使いの端末はGPS位置情報に対応していません。');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = { lat: latitude, lng: longitude };
        setUserLocation(coords);
        setPromptLocation(null);
        setIsLocating(false);

        if (mapInstanceRef.current) {
          if (!userMarkerRef.current) {
            userMarkerRef.current = L.marker([latitude, longitude], {
              icon: createUserLocationIcon(false),
              zIndexOffset: 1500,
            }).addTo(mapInstanceRef.current);
          } else {
            userMarkerRef.current.setLatLng([latitude, longitude]);
            userMarkerRef.current.setIcon(createUserLocationIcon(false));
          }

          if (panMap) {
            mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.2 });
          }
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('GPS位置情報の利用が許可されていません。');
        } else {
          setGpsError('現在地の取得に失敗しました。');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  };

  // 3. Handle map click: 1P YOU moves to clicked coordinate & prompts "ここに記録しますか？"
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const coords = { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };

      playJumpSound();
      setUserLocation(coords);
      setPromptLocation(coords);

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([coords.lat, coords.lng]);
        userMarkerRef.current.setIcon(createUserLocationIcon(true));
      } else {
        userMarkerRef.current = L.marker([coords.lat, coords.lng], {
          icon: createUserLocationIcon(true),
          zIndexOffset: 1500,
        }).addTo(map);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, []);

  const handleConfirmRecordHere = () => {
    if (!promptLocation) return;
    playPowerUpSound();
    const loc = promptLocation;
    setPromptLocation(null);
    if (userMarkerRef.current) {
      userMarkerRef.current.setIcon(createUserLocationIcon(false));
    }
    onLocationSelected(loc);
  };

  const handleDismissPrompt = () => {
    playClickSound();
    setPromptLocation(null);
    if (isSelectingLocation) {
      onCancelSelection();
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.setIcon(createUserLocationIcon(false));
    }
  };

  // 4. Update temporary marker when location is chosen
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedLocation) {
      if (!tempMarkerRef.current) {
        tempMarkerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], {
          icon: createTempLocationIcon(),
          zIndexOffset: 1200,
        }).addTo(map);
      } else {
        tempMarkerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
      }
    } else {
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
        tempMarkerRef.current = null;
      }
    }
  }, [selectedLocation]);

  // 5. Update Heatmap / Hotspot Layer (Color-coded by Edible vs Poisonous)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const heatmapGroup = heatmapLayerRef.current;
    if (!map || !heatmapGroup) return;

    heatmapGroup.clearLayers();

    if (!showHeatmap) return;

    // Filter by status if currently active
    const activeRecords = records.filter(
      (r) => statusFilter === 'ALL' || r.status === statusFilter
    );

    // 60m threshold represents localized spore drop and mycelial fairy-ring spread
    const clusters = generateHotspotClusters(activeRecords, 60);

    clusters.forEach((cluster) => {
      const isEdible = cluster.type === '可食';
      const isPoison = cluster.type === '有毒';

      const mainColor = isEdible ? '#10b981' : isPoison ? '#ef4444' : '#f59e0b';
      const coreColor = isEdible ? '#059669' : isPoison ? '#b91c1c' : '#d97706';
      const labelText = isEdible ? '🌿 可食胞子圏' : isPoison ? '☠️ 毒胞子警戒' : '⚠️ 要注意胞子';

      // 1. Layer 1: Outer spore reach glow
      const outerGlow = L.circle([cluster.centerLat, cluster.centerLng], {
        radius: cluster.radiusMeters,
        color: mainColor,
        fillColor: mainColor,
        fillOpacity: 0.28,
        weight: 2,
        dashArray: isPoison ? '4, 4' : '2, 3',
      });

      // 2. Layer 2: Core high-density mycelium center
      const innerCore = L.circle([cluster.centerLat, cluster.centerLng], {
        radius: Math.max(8, cluster.radiusMeters * 0.45),
        color: coreColor,
        fillColor: mainColor,
        fillOpacity: 0.55,
        weight: 2,
      });

      // 3. Layer 3: Spore Reach Title Badge
      const badgeIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-105 active:scale-95">
            <div class="px-1.5 py-0.5 ${
              isEdible ? 'bg-emerald-500 text-gray-950' : isPoison ? 'bg-rose-600 text-white' : 'bg-amber-400 text-gray-950'
            } font-arcade text-[8px] font-black border-2 border-gray-900 shadow-[2px_2px_0px_#111827] flex items-center gap-1 animate-pulse">
              <span>${labelText}</span>
              <span class="px-1 bg-yellow-300 text-gray-950 font-black border border-gray-900">${Math.round(cluster.radiusMeters)}m</span>
            </div>
          </div>
        `,
        className: 'hotspot-badge-marker',
        iconSize: [96, 24],
      });

      const centerBadge = L.marker([cluster.centerLat, cluster.centerLng], {
        icon: badgeIcon,
        zIndexOffset: 850,
      });

      // Popup for the spore dispersal cluster
      const clusterPopupHtml = `
        <div class="p-3 font-pixel ${isEdible ? 'bg-emerald-50' : isPoison ? 'bg-rose-50' : 'bg-amber-50'} min-w-[220px]">
          <div class="flex items-center justify-between border-b-2 border-gray-900 pb-1 mb-2">
            <span class="font-black text-xs ${isEdible ? 'text-emerald-950' : isPoison ? 'text-rose-950' : 'text-amber-950'}">
              ${isEdible ? '🌿 可食キノコ 胞子散布・群生圏' : isPoison ? '☠️ 毒キノコ 胞子飛散・警戒圏' : '⚠️ 要注意 胞子圏'}
            </span>
            <span class="px-1.5 py-0.5 bg-yellow-400 text-gray-950 border border-gray-900 text-[9px] font-arcade font-bold">
              半径 約${Math.round(cluster.radiusMeters)}m
            </span>
          </div>

          <p class="text-[11px] text-gray-800 mb-2 leading-relaxed">
            ${
              isEdible
                ? `林床では風速が弱まるため、キノコ胞子の約95%は半径10〜30m前後に着地します。この円（半径約${Math.round(cluster.radiusMeters)}m）は周囲の宿主樹木や菌糸網から発生している食用群生エリアです！`
                : isPoison
                ? `【警戒】有毒キノコの胞子が届く範囲（半径約${Math.round(cluster.radiusMeters)}m）です。風下や同一の土壌・倒木に猛毒種が連鎖発生している可能性が高いため、付近のキノコ採取は避けてください！`
                : '同定の難しいキノコの胞子散布エリアです。'
            }
          </p>

          <div class="bg-white p-2 border-2 border-gray-900 mb-2.5">
            <span class="block text-[10px] font-bold text-gray-600 mb-1">観測されたキノコ (${cluster.totalCount}本):</span>
            <ul class="text-xs text-gray-900 space-y-0.5 font-bold list-disc list-inside">
              ${cluster.mushrooms.map((m) => `<li>${m.name}</li>`).join('')}
            </ul>
          </div>

          <button
            id="zoom-cluster-${cluster.id}"
            class="w-full py-1.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-black text-xs border-2 border-gray-900 shadow-[0_2px_0_#111827] active:translate-y-0.5 active:shadow-none transition flex items-center justify-center gap-1"
          >
            🔍 この胞子圏を拡大して確認
          </button>
        </div>
      `;

      centerBadge.bindPopup(clusterPopupHtml, {
        className: 'custom-leaflet-popup',
        closeButton: true,
      });

      centerBadge.on('popupopen', () => {
        playCoinSound();
        const btn = document.getElementById(`zoom-cluster-${cluster.id}`);
        if (btn) {
          btn.onclick = () => {
            playClickSound();
            map.flyTo([cluster.centerLat, cluster.centerLng], 17, { duration: 0.8 });
            map.closePopup();
          };
        }
      });

      outerGlow.addTo(heatmapGroup);
      innerCore.addTo(heatmapGroup);
      centerBadge.addTo(heatmapGroup);
    });
  }, [records, showHeatmap, statusFilter]);

  // 6. Update Mushroom Markers & Leaflet Popups
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const filteredRecords = records.filter(
      (r) => statusFilter === 'ALL' || r.status === statusFilter
    );

    filteredRecords.forEach((record) => {
      const marker = L.marker([record.lat, record.lng], {
        icon: createMushroomMarkerIcon(record.status),
      });

      const formattedDate = new Date(record.createdAt).toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      });

      const badgeBg =
        record.status === '可食'
          ? 'bg-emerald-500 text-gray-950'
          : record.status === '有毒'
          ? 'bg-rose-500 text-white'
          : 'bg-amber-400 text-gray-950';

      const popupHtml = `
        <div class="w-68 max-w-[85vw] font-pixel bg-amber-50">
          <div class="relative w-full h-32 bg-gray-950 border-b-3 border-gray-900 overflow-hidden">
            <img src="${record.imageUrl}" alt="${record.name}" class="w-full h-full object-cover" />
            <div class="absolute top-2 left-2 px-2 py-0.5 border-2 border-gray-900 shadow-[2px_2px_0px_#111827] text-[10px] font-arcade font-bold ${badgeBg}">
              ${record.status === '可食' ? '★可食' : record.status === '有毒' ? '☠️有毒' : '⚠️注意'}
            </div>
            <div class="absolute bottom-1 right-1 text-[9px] font-arcade text-yellow-300 bg-gray-900 border border-gray-800 px-1 py-0.5">
              ${formattedDate}
            </div>
          </div>
          <div class="p-3 bg-amber-50">
            <h3 class="font-bold text-sm text-gray-900 truncate mb-0.5">
              🍄 ${record.name}
            </h3>
            ${record.scientificName ? `<p class="text-[10px] text-gray-500 italic mb-1.5 truncate">${record.scientificName}</p>` : ''}
            <div class="p-2 mb-3 bg-white border-2 border-gray-900 shadow-[2px_2px_0px_#111827] text-xs text-gray-800 leading-snug line-clamp-2">
              ${record.trivia}
            </div>
            <button
              id="detail-btn-${record.id}"
              class="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs border-2 border-gray-900 shadow-[0_3px_0_#111827] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-1"
            >
              ▶ 詳細・見分け方をチェック
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-leaflet-popup',
        closeButton: true,
        maxWidth: 300,
      });

      marker.on('popupopen', () => {
        playCoinSound();
        const btn = document.getElementById(`detail-btn-${record.id}`);
        if (btn) {
          btn.onclick = () => {
            playClickSound();
            onOpenDetail(record);
            map.closePopup();
          };
        }
      });

      markersGroup.addLayer(marker);
    });
  }, [records, statusFilter, onOpenDetail]);

  // 6b. Update Bear Sighting Hazard Layer (Layered when ALERT is selected)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const bearGroup = bearLayerRef.current;
    if (!map || !bearGroup) return;

    bearGroup.clearLayers();

    // Show bear sightings layer when ALERT filter is active
    if (statusFilter !== '要注意/不明') {
      return;
    }

    JAPAN_BEAR_SIGHTINGS.forEach((bear) => {
      const isHiguma = bear.bearSpecies === 'ヒグマ';
      const isCritical = bear.dangerLevel === 'CRITICAL';
      const radiusMeters = isHiguma ? 700 : isCritical ? 500 : 350;

      // Hazard action radius circle (spotted range buffer)
      const dangerCircle = L.circle([bear.lat, bear.lng], {
        radius: radiusMeters,
        color: isCritical ? '#dc2626' : isHiguma ? '#ea580c' : '#d97706',
        fillColor: isCritical ? '#ef4444' : isHiguma ? '#f97316' : '#f59e0b',
        fillOpacity: 0.16,
        weight: 1.5,
        dashArray: '3, 4',
      });

      const marker = L.marker([bear.lat, bear.lng], {
        icon: createBearMarkerIcon(bear),
        zIndexOffset: 1250,
      });

      const popupHtml = `
        <div class="p-3 font-pixel bg-amber-50 min-w-[240px] max-w-[310px]">
          <div class="flex items-center justify-between border-b-2 border-gray-900 pb-1 mb-2">
            <span class="font-black text-xs text-rose-950 flex items-center gap-1">
              <span>🐻</span>
              <span>${bear.bearSpecies} 出没・警戒情報</span>
            </span>
            <span class="px-1.5 py-0.5 ${
              isCritical
                ? 'bg-red-600 text-white animate-pulse'
                : isHiguma
                ? 'bg-amber-600 text-white'
                : 'bg-amber-400 text-gray-950'
            } border border-gray-900 text-[8px] font-arcade font-bold">
              ${isCritical ? '厳重警戒' : bear.dangerLevel === 'HIGH' ? '警戒' : '注意'}
            </span>
          </div>

          <div class="text-[10px] text-gray-800 space-y-1 mb-2 font-mono bg-white/70 p-1.5 border border-gray-300">
            <div>📍 <strong>地域:</strong> ${bear.prefecture} ${bear.municipality}</div>
            <div>🌲 <strong>場所:</strong> ${bear.locationName}</div>
            <div>📅 <strong>日時:</strong> ${bear.date} ${bear.time || ''} (${bear.count}頭)</div>
          </div>

          <div class="p-2 bg-white border-2 border-gray-900 mb-2 text-[11px] text-gray-900 leading-snug">
            <div class="font-bold text-[9px] text-rose-700 mb-0.5">【目撃・遭遇状況】</div>
            ${bear.situation}
          </div>

          <div class="p-2 bg-yellow-100 border-2 border-amber-600 mb-2 text-[10px] text-amber-950 leading-snug">
            <div class="font-bold text-[9px] text-amber-900 mb-0.5">⚠️ キノコ狩りの安全心得:</div>
            ${bear.safetyAdvice || '熊除け鈴やラジオで音を鳴らし、単独行動を避けてください。'}
          </div>

          <div class="text-[8px] text-gray-500 mb-2.5">
            情報元: ${bear.source}
          </div>

          <button
            id="zoom-bear-${bear.id}"
            class="w-full py-1.5 px-2 bg-amber-400 hover:bg-yellow-300 text-gray-950 font-black text-xs border-2 border-gray-900 shadow-[0_2px_0_#111827] active:translate-y-0.5 active:shadow-none transition flex items-center justify-center gap-1"
          >
            🔍 この出没地点をズーム
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-leaflet-popup',
        closeButton: true,
        maxWidth: 320,
      });

      marker.on('popupopen', () => {
        playCoinSound();
        const zoomBtn = document.getElementById(`zoom-bear-${bear.id}`);
        if (zoomBtn) {
          zoomBtn.onclick = () => {
            playClickSound();
            map.flyTo([bear.lat, bear.lng], 15, { duration: 0.8 });
          };
        }
      });

      dangerCircle.addTo(bearGroup);
      marker.addTo(bearGroup);
    });
  }, [statusFilter]);

  // 7. External center trigger
  useEffect(() => {
    if (centerTarget && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([centerTarget.lat, centerTarget.lng], 17, {
        duration: 1.0,
      });
    }
  }, [centerTarget]);

  // 8. Address Geocode & Move to location
  const handleAddressSearch = async (overrideQuery?: string) => {
    const query = (overrideQuery ?? addressQuery).trim();
    if (!query) return;

    playClickSound();
    setIsSearchingAddress(true);
    setSearchNotification(null);
    setShowAddressDropdown(false);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('住所の検索に失敗しました。');
      }

      const results: GeocodeResult[] = await response.json();

      if (!results || results.length === 0) {
        setSearchNotification(`「${query}」が見つかりませんでした。別の地名や都道府県名を含めてお試しください。`);
        setIsSearchingAddress(false);
        return;
      }

      if (results.length === 1 || overrideQuery) {
        moveToSearchResult(results[0]);
      } else {
        setAddressCandidates(results);
        setShowAddressDropdown(true);
      }
    } catch (err: any) {
      console.error('Search address error:', err);
      setSearchNotification(err.message || '住所検索中にエラーが発生しました。');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const moveToSearchResult = (item: GeocodeResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (isNaN(lat) || isNaN(lng)) return;

    playCoinSound();
    setShowAddressDropdown(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });

      if (!searchMarkerRef.current) {
        searchMarkerRef.current = L.marker([lat, lng], {
          icon: createSearchResultIcon(),
          zIndexOffset: 900,
        }).addTo(mapInstanceRef.current);
      } else {
        searchMarkerRef.current.setLatLng([lat, lng]);
      }

      // Also move 1P YOU to destination and show prompt
      const coords = { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };
      setUserLocation(coords);
      setPromptLocation(coords);
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([coords.lat, coords.lng]);
        userMarkerRef.current.setIcon(createUserLocationIcon(true));
      } else {
        userMarkerRef.current = L.marker([coords.lat, coords.lng], {
          icon: createUserLocationIcon(true),
          zIndexOffset: 1500,
        }).addTo(mapInstanceRef.current);
      }

      const shortName = item.name || item.display_name.split(',')[0];
      const popupHtml = `
        <div class="p-3 font-pixel bg-amber-50 min-w-[200px]">
          <p class="font-bold text-gray-950 text-sm mb-1">🏁 DESTINATION: ${shortName}</p>
          <p class="text-gray-600 text-[11px] line-clamp-2 mb-3 bg-white p-1.5 border border-gray-900">${item.display_name}</p>
          <button id="search-record-btn" class="w-full py-2 px-3 bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-black text-xs border-2 border-gray-900 shadow-[0_3px_0_#111827] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-1">
            🍄 ここにキノコを記録する
          </button>
        </div>
      `;

      searchMarkerRef.current.bindPopup(popupHtml, {
        className: 'custom-leaflet-popup',
        closeButton: true,
      }).openPopup();

      searchMarkerRef.current.on('popupopen', () => {
        const btn = document.getElementById('search-record-btn');
        if (btn) {
          btn.onclick = () => {
            playClickSound();
            onLocationSelected({ lat, lng });
            mapInstanceRef.current?.closePopup();
          };
        }
      });

      setSearchNotification(`📍「${shortName}」へワープしました！`);
      setTimeout(() => setSearchNotification(null), 4000);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none font-pixel">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Header: 64-bit Address Command Bar & Filter/Heatmap Tokens */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-30 flex flex-col gap-1.5">
        {/* Address Search Command Input */}
        <div className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddressSearch();
            }}
            className="flex items-center gap-1.5 p-1 bg-yellow-100 border-3 border-gray-900 shadow-[4px_4px_0px_#111827]"
          >
            <div className="flex items-center flex-1 pl-2">
              <span className="text-sm mr-1">🔍</span>
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                onFocus={() => {
                  if (addressCandidates.length > 0) setShowAddressDropdown(true);
                }}
                placeholder="住所・地名を入力（例: 高尾山、新宿御苑、軽井沢）"
                className="w-full text-xs text-gray-900 placeholder-gray-500 bg-transparent focus:outline-none font-pixel"
              />
              {addressQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setAddressQuery('');
                    setAddressCandidates([]);
                    setShowAddressDropdown(false);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-900 font-bold"
                >
                  ✖
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearchingAddress || !addressQuery.trim()}
              className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs border-2 border-gray-900 shadow-[0_3px_0_#111827] active:translate-y-1 active:shadow-none transition disabled:opacity-40 flex items-center gap-1 shrink-0"
            >
              {isSearchingAddress ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>WARP</span>
              )}
            </button>
          </form>

          {/* Search Result Candidates Dropdown */}
          {showAddressDropdown && addressCandidates.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-yellow-50 border-3 border-gray-900 shadow-[6px_6px_0px_#111827] z-40 max-h-60 overflow-y-auto">
              <div className="p-2 border-b-2 border-gray-900 bg-amber-200 flex items-center justify-between text-xs font-bold text-gray-900">
                <span>▼ SELECT DESTINATION:</span>
                <button
                  onClick={() => setShowAddressDropdown(false)}
                  className="text-gray-800 hover:text-black font-bold"
                >
                  ✖
                </button>
              </div>
              {addressCandidates.map((cand) => (
                <button
                  key={cand.place_id}
                  type="button"
                  onClick={() => moveToSearchResult(cand)}
                  className="w-full p-2.5 text-left border-b border-amber-200 hover:bg-yellow-200 active:bg-yellow-300 transition flex items-start gap-2"
                >
                  <span className="text-sm">📍</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-gray-950 truncate">
                      {cand.name || cand.display_name.split(',')[0]}
                    </p>
                    <p className="text-[10px] text-gray-600 truncate">{cand.display_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls Row: Heatmap Toggle & Mushroom Filter Buttons */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {/* Heatmap Layer Toggle Button */}
          <button
            type="button"
            onClick={() => {
              playCoinSound();
              setShowHeatmap(!showHeatmap);
            }}
            className={`px-2.5 py-1 text-[11px] font-bold border-2 border-gray-900 shadow-[2px_2px_0px_#111827] active:translate-y-0.5 active:shadow-none transition flex items-center gap-1 shrink-0 ${
              showHeatmap
                ? 'bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400 text-gray-950'
                : 'bg-gray-800 text-gray-300'
            }`}
            title="ホットエリア表示の切り替え"
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-rose-600 fill-rose-500 animate-pulse' : 'text-gray-400'}`} />
            <span>ホットエリア: {showHeatmap ? 'ON' : 'OFF'}</span>
          </button>

          {/* Quick Spots shortcut tokens */}
          <div className="flex items-center gap-1 shrink-0">
            {['新宿御苑', '高尾山'].map((spot) => (
              <button
                key={spot}
                type="button"
                onClick={() => {
                  setAddressQuery(spot);
                  handleAddressSearch(spot);
                }}
                className="px-2 py-0.5 bg-yellow-200 text-gray-900 text-[10px] font-bold border-2 border-gray-900 shadow-[1px_1px_0px_#111827] active:translate-y-0.5 transition"
              >
                🌲 {spot}
              </button>
            ))}
          </div>

          {/* Mushroom Status Filters */}
          <div className="flex items-center gap-0.5 p-0.5 bg-gray-900 border-2 border-gray-900 shadow-[2px_2px_0px_#111827] shrink-0">
            <button
              onClick={() => {
                playClickSound();
                setStatusFilter('ALL');
              }}
              className={`px-2 py-0.5 text-[9px] font-arcade transition ${
                statusFilter === 'ALL'
                  ? 'bg-yellow-400 text-gray-950 font-bold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => {
                playClickSound();
                setStatusFilter('可食');
              }}
              className={`px-2 py-0.5 text-[9px] font-arcade transition ${
                statusFilter === '可食'
                  ? 'bg-emerald-500 text-gray-950 font-bold'
                  : 'bg-gray-800 text-emerald-400 hover:bg-gray-700'
              }`}
            >
              1UP
            </button>
            <button
              onClick={() => {
                playClickSound();
                setStatusFilter('有毒');
              }}
              className={`px-2 py-0.5 text-[9px] font-arcade transition ${
                statusFilter === '有毒'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-gray-800 text-rose-400 hover:bg-gray-700'
              }`}
            >
              POISON
            </button>
            <button
              onClick={() => {
                playPowerUpSound();
                setStatusFilter('要注意/不明');
              }}
              className={`px-2 py-0.5 text-[9px] font-arcade transition flex items-center gap-1 ${
                statusFilter === '要注意/不明'
                  ? 'bg-amber-400 text-gray-950 font-bold ring-2 ring-red-500'
                  : 'bg-gray-800 text-amber-300 hover:bg-gray-700'
              }`}
              title="日本の熊出没警戒レイヤーを展開"
            >
              <span>🐻</span>
              <span>ALERT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Heatmap Mini Legend (Bottom-Left above Zoom buttons) */}
      {showHeatmap && (
        <div className="absolute left-2.5 bottom-24 z-30 p-2 bg-yellow-50/95 border-2 border-gray-900 shadow-[3px_3px_0px_#111827] text-[10px] space-y-1">
          <div className="font-arcade text-[9px] text-gray-900 border-b border-gray-400 pb-0.5 font-bold flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-600 fill-rose-500" />
            <span>HEATMAP LEGEND</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-gray-900 ring-2 ring-emerald-300"></span>
            <span>可食群生ホットエリア</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-rose-900">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-gray-900 ring-2 ring-rose-300"></span>
            <span>毒キノコ警戒ホットエリア</span>
          </div>
          {statusFilter === '要注意/不明' && (
            <div className="flex items-center gap-1.5 font-bold text-amber-950 pt-1 border-t border-gray-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-gray-900 ring-2 ring-red-500"></span>
              <span>🐻 熊出没警戒圏 (350〜700m)</span>
            </div>
          )}
        </div>
      )}



      {/* Notifications / Toast */}
      {searchNotification && (
        <div className="absolute top-28 left-4 right-4 z-30 p-2.5 bg-gray-950 border-3 border-yellow-400 text-yellow-300 text-xs shadow-[4px_4px_0px_#000] flex items-center justify-between animate-in fade-in">
          <span>{searchNotification}</span>
          <button
            onClick={() => setSearchNotification(null)}
            className="p-1 text-gray-400 hover:text-white font-bold"
          >
            ✖
          </button>
        </div>
      )}

      {/* GPS Error Notification if denied */}
      {gpsError && (
        <div className="absolute top-28 left-4 right-4 z-30 flex items-center justify-between p-2.5 bg-rose-100 border-3 border-gray-900 text-rose-950 shadow-[4px_4px_0px_#111827] text-xs">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{gpsError}</span>
          </div>
          <button onClick={() => setGpsError(null)} className="p-1 font-bold">
            ✖
          </button>
        </div>
      )}

      {/* Location Picking Banner Guide (Quest Prompt) */}
      {isSelectingLocation && !promptLocation && (
        <div className="absolute top-28 left-4 right-4 z-30 p-3 bg-emerald-600 border-3 border-gray-900 shadow-[5px_5px_0px_#111827] text-white flex flex-col gap-2 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b-2 border-emerald-700 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xl animate-bounce">📍</span>
              <span className="font-bold text-xs sm:text-sm text-yellow-300">
                QUEST: 地図をタップして1P YOUを移動！
              </span>
            </div>
            <button
              onClick={onCancelSelection}
              className="px-2 py-0.5 bg-gray-900 text-white border border-white text-xs font-bold"
            >
              CANCEL
            </button>
          </div>
          {userLocation && (
            <button
              onClick={() => {
                playClickSound();
                setPromptLocation(userLocation);
                if (userMarkerRef.current) {
                  userMarkerRef.current.setIcon(createUserLocationIcon(true));
                }
              }}
              className="py-1.5 px-3 bg-yellow-400 text-gray-950 font-black text-xs border-2 border-gray-900 shadow-[0_2px_0_#111827] active:translate-y-0.5 active:shadow-none transition flex items-center justify-center gap-1.5"
            >
              <Locate className="w-3.5 h-3.5 text-gray-950" />
              <span>いま居る現在地を指定する (1P LOC)</span>
            </button>
          )}
        </div>
      )}

      {/* Floating GPS Jump Button (Thumb Zone - Bottom Right) */}
      <div className={`absolute right-4 ${promptLocation ? 'bottom-44' : 'bottom-24'} z-30 flex flex-col items-center gap-3 transition-all`}>
        <button
          type="button"
          onClick={() => {
            playCoinSound();
            getUserLocation(true);
          }}
          disabled={isLocating}
          className={`flex items-center justify-center w-12 h-12 bg-yellow-400 hover:bg-yellow-300 text-gray-950 border-3 border-gray-900 shadow-[0_4px_0_#111827] active:translate-y-1 active:shadow-none transition ${
            isLocating ? 'animate-spin' : ''
          }`}
          title="現在地にジャンプ"
          aria-label="現在地にジャンプ"
        >
          <Locate className="w-6 h-6 text-gray-950 stroke-[2.5]" />
        </button>
      </div>

      {/* 64-bit RPG Interactive Confirmation Dialogue Box (Prompt on map click) */}
      {promptLocation ? (
        <div className="absolute left-3 right-3 sm:left-6 sm:right-6 bottom-4 z-40 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-emerald-950 border-4 border-gray-900 shadow-[0_6px_0_#111827] p-3.5 text-white max-w-md mx-auto">
            {/* Header with 1P YOU status */}
            <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-lg animate-bounce">🏃</span>
                <span className="font-arcade text-xs text-yellow-300 font-bold">
                  1P YOU 移動完了！
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900 px-1.5 py-0.5 border border-emerald-700">
                {promptLocation.lat.toFixed(4)}, {promptLocation.lng.toFixed(4)}
              </span>
            </div>

            {/* Main RPG Question */}
            <div className="flex items-center gap-2.5 mb-3 bg-emerald-900/80 p-2.5 border-2 border-emerald-700">
              <div className="text-2xl animate-pulse shrink-0">🍄</div>
              <div>
                <p className="text-xs sm:text-sm font-black text-yellow-200 leading-tight">
                  ここに記録しますか？
                </p>
                <p className="text-[10px] text-emerald-200 mt-0.5">
                  1P YOU のいるこの場所でキノコを発見・記録します
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleConfirmRecordHere}
                className="py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-black text-xs sm:text-sm border-3 border-gray-900 shadow-[0_3px_0_#111827] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="text-sm">🍄</span>
                <span>はい、記録する！</span>
              </button>
              <button
                type="button"
                onClick={handleDismissPrompt}
                className="py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs sm:text-sm border-3 border-gray-900 shadow-[0_3px_0_#111827] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>✖ 移動のみ</span>
              </button>
            </div>
          </div>
        </div>
      ) : !isSelectingLocation ? (
        <div className="absolute left-4 right-4 bottom-5 z-30 flex justify-center safe-pb">
          <button
            type="button"
            onClick={onStartRecord}
            className="w-full max-w-sm flex items-center justify-center gap-2.5 py-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-base border-4 border-gray-900 shadow-[0_6px_0_#111827] active:translate-y-1.5 active:shadow-none transition tracking-wider"
          >
            <span className="text-2xl animate-pulse">🍄</span>
            <span className="text-sm sm:text-base text-gray-950 drop-shadow-[1px_1px_0px_#fff]">
              キノコを記録する (RECORD)
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
};
