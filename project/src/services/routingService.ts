import type { VehicleType } from '../AI/types';

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;
const BASE_URL = '/api/tomtom';

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Fetches route directions from TomTom.
 * @param startCoords - The starting coordinates.
 * @param endCoords - The ending coordinates.
 * @returns The route data from the API.
 */
export const getDirections = async (
  startCoords: Coordinates,
  endCoords: Coordinates,
  travelMode: VehicleType = 'car'
) => {
  if (!TOMTOM_API_KEY) {
    throw new Error(
      'TomTom API key is missing. Please add VITE_TOMTOM_API_KEY to your .env file.'
    );
  }

  const params = new URLSearchParams({
    key: TOMTOM_API_KEY,
    routeType: 'fastest',
    traffic: 'true',
    routeRepresentation: 'polyline',
    maxAlternatives: '2',
    instructionsType: 'text',
    sectionType: 'traffic',
    travelMode: travelMode,
  });

  if (travelMode === 'truck') {
    params.append('vehicleCommercial', 'true');
  }

  const url = `${BASE_URL}/routing/1/calculateRoute/${startCoords.longitude},${startCoords.latitude}:${endCoords.longitude},${endCoords.latitude}/json?${params.toString()}`;


  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('TomTom Routing API Error:', errorData);
    const description = errorData?.error?.description || errorData?.detailedError?.message || 'An unknown API error occurred.';

    // Check for the failure string in the description, as the code is not reliable
    if (description.includes('MAP_MATCHING_FAILURE')) {
      const pointType = description.includes('Origin') ? 'starting point' : 'destination';
      throw new Error(`Could not find a road for the selected ${pointType}. Please choose a point closer to a main road.`);
    }

    throw new Error(`TomTom Routing API Error: ${description}`);
  }

  return response.json();
};

/**
 * Fetches geocode suggestions from TomTom.
 * @param text - The search text.
 * @returns A list of location suggestions.
 */
export const getGeocode = async (text: string) => {
  if (!TOMTOM_API_KEY) {
    throw new Error('TomTom API key is missing.');
  }

  // Parameters to refine search for better suggestions within Kenya
  const params = new URLSearchParams({
    key: TOMTOM_API_KEY,
    countrySet: 'KE',
    limit: '7',
    typeahead: 'true', // Enable predictive search for autocomplete
    idxSet: 'Str,PAD,Addr,Geo,POI', // Use correct index set for comprehensive search
  });

  const url = `${BASE_URL}/search/2/search/${encodeURIComponent(text)}.json?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('TomTom Search API Error:', errorData);
    const description = errorData?.error?.description || errorData?.detailedError?.message || 'An unknown API error occurred.';
    throw new Error(`TomTom Search API Error: ${description}`);
  }

  return response.json();
};

/**
 * Fetches location details from coordinates using TomTom's reverse geocoding.
 * @param coords - The coordinates to look up.
 * @returns The location details.
 */
export const reverseGeocode = async (coords: Coordinates) => {
  if (!TOMTOM_API_KEY) {
    throw new Error('TomTom API key is missing.');
  }

  const url = `${BASE_URL}/search/2/reverseGeocode/${coords.latitude},${coords.longitude}.json?key=${TOMTOM_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('TomTom Reverse Geocode API Error:', errorData);
    const description = errorData?.error?.description || errorData?.detailedError?.message || 'An unknown API error occurred.';
    throw new Error(`TomTom Reverse Geocode API Error: ${description}`);
  }

  return response.json();
};


