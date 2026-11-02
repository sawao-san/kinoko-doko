import { MushroomRecord } from '../types';

export interface HotspotCluster {
  id: string;
  type: '可食' | '有毒' | '要注意/不明' | 'MIXED';
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  totalCount: number;
  edibleCount: number;
  poisonCount: number;
  cautionCount: number;
  mushrooms: MushroomRecord[];
}

/**
 * Calculates distance in meters between two lat/lng coordinates (Haversine formula)
 */
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Groups nearby mushrooms based on typical mycological spore dispersal & mycelial colonization range:
 * - In forest understory, >95% of basidiospores settle within 10 to 30 meters of the fruiting body.
 * - Mycelium colonial networks / fairy rings typically span 20 to 50 meters.
 *
 * @param records Mushroom records
 * @param clusterThresholdMeters Proximity threshold to consider part of the same mycelial grove (default: 60m)
 */
export function generateHotspotClusters(
  records: MushroomRecord[],
  clusterThresholdMeters = 60
): HotspotCluster[] {
  if (!records || records.length === 0) return [];

  const clusters: HotspotCluster[] = [];
  const types: Array<'可食' | '有毒' | '要注意/不明'> = ['可食', '有毒', '要注意/不明'];

  types.forEach((statusType) => {
    const statusRecords = records.filter((r) => r.status === statusType);
    const visited = new Set<string>();

    for (let i = 0; i < statusRecords.length; i++) {
      const current = statusRecords[i];
      if (visited.has(current.id)) continue;

      const group: MushroomRecord[] = [current];
      visited.add(current.id);

      for (let j = i + 1; j < statusRecords.length; j++) {
        const candidate = statusRecords[j];
        if (visited.has(candidate.id)) continue;

        // Check if candidate is within spore/mycelium cluster threshold of ANY current member
        const isNear = group.some(
          (member) =>
            getDistanceMeters(member.lat, member.lng, candidate.lat, candidate.lng) <=
            clusterThresholdMeters
        );

        if (isNear) {
          group.push(candidate);
          visited.add(candidate.id);
        }
      }

      // Calculate centroid of the cluster
      const centerLat = group.reduce((sum, r) => sum + r.lat, 0) / group.length;
      const centerLng = group.reduce((sum, r) => sum + r.lng, 0) / group.length;

      // Realistic spore dispersal & mycelial radius (in meters):
      // Single mushroom: ~25m (tight spore zone)
      // Multiple mushrooms: expands with colony up to max ~70m
      const radiusMeters = Math.min(70, Math.round(25 + (group.length - 1) * 12));

      clusters.push({
        id: `cluster-${statusType}-${i}-${Date.now()}`,
        type: statusType,
        centerLat,
        centerLng,
        radiusMeters,
        totalCount: group.length,
        edibleCount: statusType === '可食' ? group.length : 0,
        poisonCount: statusType === '有毒' ? group.length : 0,
        cautionCount: statusType === '要注意/不明' ? group.length : 0,
        mushrooms: group,
      });
    }
  });

  return clusters;
}
