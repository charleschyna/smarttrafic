/**
 * Simple polyline decoder for TomTom route geometry
 * TomTom uses a standard polyline encoding algorithm
 */

interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Decodes a polyline string into an array of latitude/longitude coordinates
 * @param encoded The encoded polyline string
 * @returns Array of coordinate objects
 */
export function decodePolyline(encoded: string): LatLng[] {
  if (!encoded || typeof encoded !== 'string') {
    console.warn('Invalid polyline string provided:', encoded);
    return [];
  }

  const coordinates: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  try {
    while (index < encoded.length) {
      let b: number;
      let shift = 0;
      let result = 0;

      // Decode latitude
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;

      // Decode longitude
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      coordinates.push({
        lat: lat / 1e5,
        lng: lng / 1e5
      });
    }

    console.log(`Successfully decoded polyline: ${coordinates.length} points`);
    return coordinates;
  } catch (error) {
    console.error('Error decoding polyline:', error);
    return [];
  }
}

/**
 * Simplifies a route by keeping only every nth point to reduce complexity
 * @param coordinates Array of coordinates
 * @param factor Simplification factor (keep every nth point)
 * @returns Simplified coordinate array
 */
export function simplifyRoute(coordinates: LatLng[], factor: number = 3): LatLng[] {
  if (!coordinates || coordinates.length === 0) return [];
  if (factor <= 1) return coordinates;

  const simplified: LatLng[] = [];
  
  // Always keep the first point
  simplified.push(coordinates[0]);
  
  // Keep every nth point
  for (let i = factor; i < coordinates.length; i += factor) {
    simplified.push(coordinates[i]);
  }
  
  // Always keep the last point if it wasn't included
  const lastIndex = coordinates.length - 1;
  if (lastIndex > 0 && simplified[simplified.length - 1] !== coordinates[lastIndex]) {
    simplified.push(coordinates[lastIndex]);
  }
  
  console.log(`Simplified route from ${coordinates.length} to ${simplified.length} points`);
  return simplified;
}
