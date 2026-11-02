import { MushroomRecord } from '../types';
import { INITIAL_MUSHROOM_SAMPLES } from '../data/sampleMushrooms';

const STORAGE_KEY = 'kinoko_doko_doko_records_v3';
const OLD_STORAGE_KEY = 'tabereru_kinoko_map_records_v1';

export function getMushroomRecords(): MushroomRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check if user had created custom mushrooms in v1
      const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldRaw) {
        try {
          const oldParsed = JSON.parse(oldRaw);
          if (Array.isArray(oldParsed) && oldParsed.length > 3) {
            saveMushroomRecords(oldParsed);
            return oldParsed;
          }
        } catch (e) {
          // ignore
        }
      }
      saveMushroomRecords(INITIAL_MUSHROOM_SAMPLES);
      return INITIAL_MUSHROOM_SAMPLES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_MUSHROOM_SAMPLES;
  } catch (error) {
    console.error('Failed to load mushroom records from localStorage:', error);
    return INITIAL_MUSHROOM_SAMPLES;
  }
}

export function saveMushroomRecords(records: MushroomRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save mushroom records to localStorage:', error);
  }
}

export function addMushroomRecord(record: MushroomRecord): MushroomRecord[] {
  const current = getMushroomRecords();
  const updated = [record, ...current];
  saveMushroomRecords(updated);
  return updated;
}

export function deleteMushroomRecord(id: string): MushroomRecord[] {
  const current = getMushroomRecords();
  const updated = current.filter(r => r.id !== id);
  saveMushroomRecords(updated);
  return updated;
}

export function resetToSampleRecords(): MushroomRecord[] {
  saveMushroomRecords(INITIAL_MUSHROOM_SAMPLES);
  return INITIAL_MUSHROOM_SAMPLES;
}
