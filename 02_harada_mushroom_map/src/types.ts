export type MushroomStatus = '可食' | '有毒' | '要注意/不明';

export interface MushroomRecord {
  id: string;
  name: string;
  scientificName?: string;
  status: MushroomStatus;
  confidence?: '高' | '中' | '低';
  trivia: string;
  cautionNotes: string;
  season?: string;
  habitat?: string;
  characteristics?: string[];
  disclaimer: string;
  lat: number;
  lng: number;
  imageUrl: string; // Base64 data URL or sample image
  userNotes?: string;
  createdAt: string; // ISO date string
}

export interface IdentificationResult {
  isMushroom: boolean;
  name: string;
  scientificName?: string;
  status: MushroomStatus;
  confidence?: '高' | '中' | '低';
  trivia: string;
  cautionNotes: string;
  season?: string;
  habitat?: string;
  characteristics?: string[];
  disclaimer?: string;
  error?: string;
}

export interface BearSighting {
  id: string;
  prefecture: string;
  municipality: string;
  locationName: string;
  lat: number;
  lng: number;
  date: string;
  time?: string;
  bearSpecies: 'ヒグマ' | 'ツキノワグマ';
  count: number;
  situation: string;
  dangerLevel: 'CRITICAL' | 'HIGH' | 'CAUTION';
  source: string;
  safetyAdvice?: string;
}

export interface GeocodeResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: Record<string, string>;
}
