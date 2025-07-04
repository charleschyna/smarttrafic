import type { VehicleType } from '../AI/types';

const MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const DIRECTIONS_BASE_URL = 'https://api.mapbox.com/directions/v5/mapbox';
const GEOCODING_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

interface Coordinates {
  latitude: number;
  longitude: number;
}

// Map application travel modes to Mapbox profiles
const getMapboxProfile = (travelMode: VehicleType): string => {
  switch (travelMode) {
    case 'truck':
      // Note: For more advanced truck routing, you might need a specific Mapbox profile or parameters
      return 'driving-traffic';
    case 'bicycle':
      return 'cycling';
    case 'pedestrian':
      return 'walking';
    case 'car':
    default:
      return 'driving-traffic';
  }
};

/**
 * Fetches route directions from Mapbox.
 * @param startCoords - The starting coordinates.
 * @param endCoords - The ending coordinates.
 * @param travelMode - The mode of travel.
 * @returns The route data from the API.
 */
export const getDirections = async (
  waypoints: Coordinates[],
  travelMode: VehicleType = 'car'
) => {
  if (!MAPBOX_API_KEY) {
    throw new Error(
      'Mapbox API key is missing. Please add VITE_MAPBOX_ACCESS_TOKEN to your .env file.'
    );
  }
  if (waypoints.length < 2) {
    throw new Error('At least two waypoints (start and end) are required.');
  }

  const profile = getMapboxProfile(travelMode);
  const coordinates = waypoints
    .map(p => `${p.longitude},${p.latitude}`)
    .join(';');

  const params = new URLSearchParams({
    access_token: MAPBOX_API_KEY,
    alternatives: 'true',
    geometries: 'geojson',
    overview: 'full',
    steps: 'true',
    annotations: 'duration,distance,speed,congestion',
  });

  const url = `${DIRECTIONS_BASE_URL}/${profile}/${coordinates}?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Mapbox Routing API Error:', errorData);
    const message = errorData?.message || 'An unknown API error occurred.';

    if (errorData.code === 'NoRoute') {
      throw new Error(
        'Could not find a route between the selected points. Please ensure they are on or near a road.'
      );
    }

    throw new Error(`Mapbox Routing API Error: ${message}`);
  }

  return response.json();
};

/**
 * Fetches geocode suggestions from Mapbox.
 * @param text - The search text.
 * @returns A list of location suggestions.
 */
export const getGeocode = async (text: string) => {
  if (!MAPBOX_API_KEY) {
    throw new Error('Mapbox API key is missing.');
  }

  const params = new URLSearchParams({
    access_token: MAPBOX_API_KEY,
    country: 'KE',
    limit: '7',
    autocomplete: 'true',
    types: 'country,region,place,locality,neighborhood,address,poi',
  });

  const url = `${GEOCODING_BASE_URL}/${encodeURIComponent(text)}.json?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Mapbox Search API Error:', errorData);
    const message = errorData?.message || 'An unknown API error occurred.';
    throw new Error(`Mapbox Search API Error: ${message}`);
  }

  return response.json();
};

/**
 * Fetches location details from coordinates using Mapbox's reverse geocoding.
 * @param coords - The coordinates to look up.
 * @returns The location details.
 */
export const reverseGeocode = async (coords: Coordinates) => {
  if (!MAPBOX_API_KEY) {
    throw new Error('Mapbox API key is missing.');
  }

  const coordinates = `${coords.longitude},${coords.latitude}`;
  const params = new URLSearchParams({
    access_token: MAPBOX_API_KEY,
    types: 'address,place,locality',
    limit: '1',
  });

  const url = `${GEOCODING_BASE_URL}/${coordinates}.json?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Mapbox Reverse Geocode API Error:', errorData);
    const message = errorData?.message || 'An unknown API error occurred.';
    throw new Error(`Mapbox Reverse Geocode API Error: ${message}`);
  }

  const data = await response.json();
  
  // The Mapbox response for reverse geocoding is an array of features.
  // We need to transform it to a structure similar to what the app expects,
  // which seems to be { addresses: [{ address: { freeformAddress: '...' } }] }
  // based on ModernRouteOptimizer.tsx
  if (data.features && data.features.length > 0) {
    return {
      addresses: [
        {
          address: {
            freeformAddress: data.features[0].place_name,
          },
        },
      ],
    };
  }

  return { addresses: [] };
};


