import { 
  collection, 
  query, 
  where, 
  orderBy, 
  startAt, 
  endAt, 
  getDocs, 
  QueryConstraint 
} from 'firebase/firestore';
import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';
import { db } from '@/lib/firebase';
import { Pet } from '@/types';

/**
 * Generates geohash for lat/lng coordinate
 */
export function getGeohash(lat: number, lng: number): string {
  return geohashForLocation([lat, lng]);
}

/**
 * Searches pets within a given radius in Kilometers using geohashes
 */
export async function queryPetsByLocation(
  centerLat: number,
  centerLng: number,
  radiusInKm: number,
  typeFilter?: string
): Promise<Pet[]> {
  const center: [number, number] = [centerLat, centerLng];
  const radiusInM = radiusInKm * 1000;
  const bounds = geohashQueryBounds(center, radiusInM);
  const petsRef = collection(db, 'pets');

  const promises = bounds.map((bound) => {
    const constraints: QueryConstraint[] = [
      orderBy('geohash'),
      startAt(bound[0]),
      endAt(bound[1]),
    ];
    if (typeFilter && typeFilter !== 'all') {
      constraints.unshift(where('type', '==', typeFilter));
    }
    const q = query(petsRef, ...constraints);
    return getDocs(q);
  });

  const snapshots = await Promise.all(promises);
  const matchingPets: Pet[] = [];
  const seenIds = new Set<string>();

  for (const snap of snapshots) {
    for (const docSnap of snap.docs) {
      if (seenIds.has(docSnap.id)) continue;
      const pet = { id: docSnap.id, ...docSnap.data() } as Pet;
      
      if (pet.lat && pet.lng) {
        const distKm = distanceBetween([pet.lat, pet.lng], center);
        if (distKm <= radiusInKm) {
          seenIds.add(docSnap.id);
          matchingPets.push(pet);
        }
      }
    }
  }

  return matchingPets;
}
