import L from 'leaflet';
import { MushroomStatus, BearSighting } from '../types';

export function createBearMarkerIcon(bear: BearSighting): L.DivIcon {
  const isHiguma = bear.bearSpecies === 'ヒグマ';
  const isCritical = bear.dangerLevel === 'CRITICAL';

  const badgeBg = isCritical ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-400 text-gray-950';
  const badgeLabel = isHiguma ? '⚠️ヒグマ警報' : isCritical ? '⚠️クマ厳重警戒' : '⚠️クマ目撃';

  // Pixel art bear face sprite (16x16)
  const furColor = isHiguma ? '#603813' : '#18181b';
  const snoutColor = isHiguma ? '#b45309' : '#3f3f46';
  const innerEarColor = isHiguma ? '#d97706' : '#71717a';

  const bearSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 16 16" shape-rendering="crispEdges" class="pixelated">
      <!-- Ears Outer -->
      <rect x="2" y="1" width="3" height="3" fill="#111827"/>
      <rect x="11" y="1" width="3" height="3" fill="#111827"/>
      <!-- Ears Inner -->
      <rect x="3" y="2" width="1" height="1" fill="${innerEarColor}"/>
      <rect x="12" y="2" width="1" height="1" fill="${innerEarColor}"/>
      <!-- Head Base Outline -->
      <rect x="3" y="3" width="10" height="9" fill="#111827"/>
      <!-- Head Fill -->
      <rect x="4" y="4" width="8" height="7" fill="${furColor}"/>
      <!-- Eyes -->
      <rect x="5" y="5" width="1" height="1" fill="${isCritical ? '#ef4444' : '#ffffff'}"/>
      <rect x="10" y="5" width="1" height="1" fill="${isCritical ? '#ef4444' : '#ffffff'}"/>
      <!-- Snout Base -->
      <rect x="6" y="7" width="4" height="3" fill="${snoutColor}"/>
      <!-- Nose & Mouth -->
      <rect x="7" y="7" width="2" height="1" fill="#111827"/>
      <rect x="7" y="9" width="2" height="1" fill="#dc2626"/>
      ${
        !isHiguma
          ? `<!-- Crescent moon chest / neck mark of Asian Black Bear -->
             <path d="M6 13h4v1H6z" fill="#fef08a"/>`
          : ''
      }
    </svg>
  `;

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform">
      <!-- Pulsing alert ring for critical sightings -->
      ${
        isCritical
          ? `<div class="absolute -top-1 w-10 h-10 rounded-full bg-red-500/40 animate-ping pointer-events-none"></div>`
          : ''
      }
      <!-- Pixel Bear Face Box with 3D retro drop-shadow -->
      <div class="p-1 ${isHiguma ? 'bg-orange-100' : 'bg-red-50'} border-3 border-gray-900 shadow-[3px_3px_0px_#111827] flex items-center justify-center">
        ${bearSvg}
      </div>
      <!-- Alert Badge -->
      <div class="mt-0.5 px-1.5 py-0.5 text-[8px] font-arcade tracking-tighter ${badgeBg} border-2 border-gray-900 shadow-[2px_2px_0px_#111827] font-black uppercase whitespace-nowrap">
        ${badgeLabel}
      </div>
      <!-- Pointer Pixel Triangle -->
      <div class="w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-bear-pixel-marker',
    iconSize: [68, 64],
    iconAnchor: [34, 64],
    popupAnchor: [0, -64],
  });
}

export function createMushroomMarkerIcon(status: MushroomStatus): L.DivIcon {
  let badgeText = '可食';
  let badgeBg = 'bg-emerald-500';
  let badgeColor = 'text-emerald-950';
  let capColor = '#10b981';
  let capSpot = '#ecfdf5';

  if (status === '有毒') {
    badgeText = 'POISON';
    badgeBg = 'bg-rose-500';
    badgeColor = 'text-white';
    capColor = '#ef4444';
    capSpot = '#fee2e2';
  } else if (status === '要注意/不明') {
    badgeText = 'CAUTION';
    badgeBg = 'bg-amber-400';
    badgeColor = 'text-amber-950';
    capColor = '#f59e0b';
    capSpot = '#fffbeb';
  }

  // Pure 64-bit retro pixel art mushroom SVG sprite with crisp edges
  const pixelMushroomSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 16 16" shape-rendering="crispEdges" class="pixelated">
      <!-- Cap Outer Black Pixel Border -->
      <path d="M5 2h6v1h2v2h2v4h-1v2h-2v1H4v-1H2v-2H1V5h2V3h2V2z" fill="#111827"/>
      <!-- Cap Fill Main Color -->
      <path d="M5 3h6v1h2v2h1v3h-1v1H3V9H2V6h1V4h2V3z" fill="${capColor}"/>
      <!-- Cap Pixel Spots / Highlight -->
      <rect x="7" y="4" width="2" height="3" fill="${capSpot}"/>
      <rect x="4" y="5" width="2" height="2" fill="${capSpot}"/>
      <rect x="11" y="5" width="2" height="2" fill="${capSpot}"/>
      <!-- Stem Base Black Border -->
      <rect x="5" y="10" width="6" height="5" fill="#111827"/>
      <!-- Stem Fill -->
      <rect x="6" y="10" width="4" height="4" fill="#fef3c7"/>
      <!-- Stem Pixel Eyes / Shade -->
      <rect x="6" y="11" width="1" height="2" fill="#111827"/>
      <rect x="9" y="11" width="1" height="2" fill="#111827"/>
    </svg>
  `;

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer -translate-x-1/2 -translate-y-full">
      <!-- Pixel Mushroom Container with 3D retro drop-shadow -->
      <div class="p-1 bg-amber-50 border-3 border-gray-900 shadow-[3px_3px_0px_#111827] flex items-center justify-center transition-transform hover:-translate-y-1">
        ${pixelMushroomSvg}
      </div>
      <!-- Pixel Badge -->
      <div class="mt-1 px-1.5 py-0.5 text-[9px] font-arcade tracking-tighter ${badgeBg} ${badgeColor} border-2 border-gray-900 shadow-[2px_2px_0px_#111827] uppercase font-bold">
        ${badgeText}
      </div>
      <!-- Pointer Pixel Triangle -->
      <div class="w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-mushroom-pixel-marker',
    iconSize: [44, 60],
    iconAnchor: [22, 60],
    popupAnchor: [0, -60],
  });
}

export function createUserLocationIcon(hasPrompt: boolean = false, promptText: string = 'ここに記録する？🍄'): L.DivIcon {
  // 64-bit Pixel Adventurer Sprite!
  const adventurerSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 16 16" shape-rendering="crispEdges" class="pixelated">
      <!-- Hat / Cap -->
      <rect x="5" y="1" width="6" height="2" fill="#047857"/>
      <rect x="4" y="3" width="9" height="1" fill="#059669"/>
      <!-- Face -->
      <rect x="5" y="4" width="6" height="4" fill="#fed7aa"/>
      <rect x="8" y="5" width="1" height="2" fill="#111827"/>
      <!-- Body & Jacket -->
      <rect x="5" y="8" width="6" height="4" fill="#2563eb"/>
      <rect x="4" y="9" width="1" height="3" fill="#1d4ed8"/>
      <rect x="11" y="9" width="1" height="3" fill="#1d4ed8"/>
      <!-- Belt -->
      <rect x="5" y="11" width="6" height="1" fill="#78350f"/>
      <!-- Legs & Boots -->
      <rect x="5" y="12" width="2" height="3" fill="#1e293b"/>
      <rect x="9" y="12" width="2" height="3" fill="#1e293b"/>
      <rect x="4" y="14" width="3" height="1" fill="#451a03"/>
      <rect x="9" y="14" width="3" height="1" fill="#451a03"/>
    </svg>
  `;

  const html = `
    <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full user-pixel-marker ${hasPrompt ? 'scale-105' : ''}">
      ${
        hasPrompt
          ? `
        <!-- Speech Bubble Prompt -->
        <div class="mb-1 px-2 py-0.5 bg-yellow-300 text-gray-950 border-2 border-gray-900 text-[10px] font-bold shadow-[2px_2px_0px_#111827] whitespace-nowrap animate-bounce flex items-center gap-1 cursor-pointer">
          <span>${promptText}</span>
        </div>
      `
          : ''
      }
      <!-- Player Tag -->
      <div class="px-1 py-0.5 bg-yellow-400 text-gray-900 border-2 border-gray-900 text-[8px] font-arcade shadow-[2px_2px_0px_#111827] mb-0.5 font-bold">
        1P YOU
      </div>
      <!-- Adventurer Sprite Box -->
      <div class="p-0.5 bg-sky-200 border-2 border-gray-900 shadow-[3px_3px_0px_#111827]">
        ${adventurerSvg}
      </div>
      <!-- Shadow on Ground -->
      <div class="w-4 h-1.5 bg-black/40 rounded-full mt-0.5"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'user-pixel-marker-wrapper',
    iconSize: [hasPrompt ? 140 : 40, hasPrompt ? 80 : 52],
    iconAnchor: [hasPrompt ? 70 : 20, hasPrompt ? 80 : 52],
  });
}

export function createTempLocationIcon(): L.DivIcon {
  const html = `
    <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full pixel-bounce">
      <div class="px-2 py-0.5 bg-emerald-400 text-gray-900 border-2 border-gray-900 text-[9px] font-arcade font-bold shadow-[2px_2px_0px_#111827] mb-1">
        SET!
      </div>
      <div class="w-10 h-10 bg-yellow-300 border-3 border-gray-900 shadow-[4px_4px_0px_#111827] flex items-center justify-center text-xl">
        🍄
      </div>
      <div class="w-2.5 h-2.5 bg-gray-900 rotate-45 -mt-1.5"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'temp-location-pin',
    iconSize: [44, 60],
    iconAnchor: [22, 60],
  });
}

export function createSearchResultIcon(): L.DivIcon {
  const flagSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 16 16" shape-rendering="crispEdges" class="pixelated">
      <!-- Pole -->
      <rect x="3" y="1" width="2" height="14" fill="#475569"/>
      <!-- Gold Ball on top -->
      <rect x="2" y="0" width="4" height="2" fill="#facc15"/>
      <!-- Flag Body -->
      <polygon points="5,2 14,5 5,9" fill="#3b82f6"/>
      <polygon points="5,3 12,5 5,8" fill="#60a5fa"/>
    </svg>
  `;

  const html = `
    <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full pixel-bounce">
      <div class="px-1.5 py-0.5 bg-blue-500 text-white border-2 border-gray-900 text-[8px] font-arcade font-bold shadow-[2px_2px_0px_#111827] mb-0.5">
        DEST
      </div>
      <div class="p-1 bg-white border-3 border-gray-900 shadow-[3px_3px_0px_#111827] flex items-center justify-center">
        ${flagSvg}
      </div>
      <div class="w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'search-destination-pin',
    iconSize: [36, 54],
    iconAnchor: [18, 54],
    popupAnchor: [0, -54],
  });
}
