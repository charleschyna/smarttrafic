import React, { useState, useEffect } from 'react';
import MapDisplay from './MapDisplay';
import LocationInput from './LocationInput';
import { getDirections, reverseGeocode } from '../../services/routingService';
import type { VehicleType } from '../../AI/types';
import { supabase } from '../../lib/supabaseClient';
import { selectBestRoute } from '../../AI/scoring';
import { generateRouteSummary } from '../../AI/services';
import { Map, Search, ArrowRight } from 'lucide-react';

// Helper to convert TomTom routes to GeoJSON for Mapbox
const toGeoJSON = (tomtomRoutes: any[], bestRouteIndex: number): GeoJSON.FeatureCollection => {
  if (!tomtomRoutes || tomtomRoutes.length === 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  const features: GeoJSON.Feature[] = tomtomRoutes.map((route, index) => {
    const coordinates = route.legs[0].points.map((p: { latitude: number, longitude: number }) => [p.longitude, p.latitude]);
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates,
      },
      properties: {
        isBest: index === bestRouteIndex,
      },
    };
  });

  // Ensure the best route is the first feature for rendering order
  features.sort((a, b) => (a.properties!.isBest ? -1 : b.properties!.isBest ? 1 : 0));

  return { type: 'FeatureCollection', features };
};

const ModernRouteOptimizer: React.FC = () => {
  const [startLocation, setStartLocation] = useState('Current Location');
  const [destination, setDestination] = useState('');
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);
  const [selectedRouteSummary, setSelectedRouteSummary] = useState<{ distance: number; duration: number; confidence: number; trafficDelay: number; } | null>(null);
  const [travelMode, setTravelMode] = useState<VehicleType>('car');
  const [userPreference, setUserPreference] = useState('Fastest');
  const [routes, setRoutes] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    // Autofill start location with user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setStartCoords([longitude, latitude]);
          const locationDetails = await reverseGeocode({ latitude, longitude });
          if (locationDetails.addresses && locationDetails.addresses.length > 0) {
            setStartLocation(locationDetails.addresses[0].address.freeformAddress || `${latitude}, ${longitude}`);
          }
        },
        () => {
          console.error('Could not get user location. Defaulting to Nairobi.');
          // Default to Nairobi CBD if location access is denied
          setStartCoords([36.8219, -1.2921]);
          setStartLocation('Nairobi, KE');
        }
      );
    } else {
      // Default for browsers that don't support geolocation
      setStartCoords([36.8219, -1.2921]);
      setStartLocation('Nairobi, KE');
    }

    const setupUserPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('routing_preference')
          .eq('user_id', user.id)
          .single();

        if (data && data.routing_preference) {
          setUserPreference(data.routing_preference);
        } else if (error && error.code === 'PGRST116') {
          // No preference set, insert the default
          await supabase.from('user_preferences').insert({ user_id: user.id, routing_preference: 'Fastest' });
        }
      }
    };
    setupUserPreferences();
  }, []);

  useEffect(() => {
    const updateUserPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ routing_preference: userPreference, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating user preference:', error);
        }
      }
    };
    // Avoid running on initial render if userPreference is the default
    if (userPreference !== 'Fastest') {
      updateUserPreference();
    }
  }, [userPreference]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startCoords || !endCoords) {
      setError('Please select a valid start and destination.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRoutes(null);
    setSelectedRouteSummary(null);
    setAiSummary(null);

    try {
      const data = await getDirections(
        { longitude: startCoords[0], latitude: startCoords[1] },
        { longitude: endCoords[0], latitude: endCoords[1] },
        travelMode
      );

      if (data && data.routes && data.routes.length > 0) {
        const bestRouteResult = selectBestRoute(data.routes, userPreference);
        if (bestRouteResult) {
          const { route: bestRoute, confidence, index: bestRouteIndex } = bestRouteResult;
          const geoJsonRoutes = toGeoJSON(data.routes, bestRouteIndex);
          setRoutes(geoJsonRoutes);

          setSelectedRouteSummary({
            distance: bestRoute.summary.lengthInMeters,
            duration: bestRoute.summary.travelTimeInSeconds,
            confidence: confidence,
            trafficDelay: bestRoute.summary.trafficDelayInSeconds,
          });

          const incidents = bestRouteResult.route.summary?.trafficIncidents || [];
        const summaryText = await generateRouteSummary(bestRouteResult, userPreference, incidents);
          setAiSummary(summaryText);
        } else {
          setError('Could not determine the best route.');
        }
      } else {
        setError('No routes could be found.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <div className="w-1/3 p-8 overflow-y-auto shadow-lg">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">Route Optimization</h2>
        <form onSubmit={handleSearch}>
          <div className="space-y-4 mb-6">
            <LocationInput
              value={startLocation}
              onValueChange={setStartLocation}
              onLocationSelect={(coords) => setStartCoords(coords as [number, number])}
              placeholder="Start Location"
              Icon={Search}
            />
            <LocationInput
              value={destination}
              onValueChange={setDestination}
              onLocationSelect={(coords) => setEndCoords(coords as [number, number])}
              placeholder="Destination"
              Icon={Map}
            />
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Routing Priority</h3>
            <select 
              value={userPreference} 
              onChange={(e) => setUserPreference(e.target.value)}
              className="w-full p-3 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            >
              <option value="Fastest">Fastest</option>
              <option value="Shortest">Shortest</option>
              <option value="Eco-Friendly">Eco-Friendly</option>
              <option value="Thrilling">Thrilling</option>
            </select>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Travel Mode</h3>
            <select 
              value={travelMode} 
              onChange={(e) => setTravelMode(e.target.value as VehicleType)}
              className="w-full p-3 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            >
              <option value="car">Car</option>
              <option value="truck">Truck</option>
              <option value="bicycle">Bicycle</option>
              <option value="pedestrian">Pedestrian</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center" disabled={isLoading}>
            <ArrowRight className="mr-2" size={20} />
            {isLoading ? 'Searching...' : 'Find Best Route'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        <hr className="my-8 border-gray-200" />

        <div>
          <h3 className="text-xl font-bold mb-4 text-gray-800">Route Summary</h3>
          {aiSummary && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
              <p>{aiSummary}</p>
            </div>
          )}
          {selectedRouteSummary ? (
            <div className="space-y-3 text-gray-700 bg-gray-100 p-4 rounded-lg">
              <p><strong>Distance:</strong> {(selectedRouteSummary.distance / 1000).toFixed(1)} km</p>
              <p><strong>Est. Time:</strong> {Math.round(selectedRouteSummary.duration / 60)} min</p>
              <p><strong>AI Confidence:</strong> <span className="font-bold text-green-600">{selectedRouteSummary.confidence}%</span></p>
              <p><strong>Traffic Delay:</strong> <span className={`font-bold ${selectedRouteSummary.trafficDelay > 300 ? 'text-red-600' : selectedRouteSummary.trafficDelay > 120 ? 'text-orange-500' : 'text-green-600'}`}>{Math.round(selectedRouteSummary.trafficDelay / 60)} min</span></p>
            </div>
          ) : (
            !isLoading && <div className="text-gray-500">
              <p>Find a route to see the summary.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-gray-200">
        {import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? (
          <MapDisplay routes={routes} startCoords={startCoords} endCoords={endCoords} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-700">
            <p className="text-center">
              <strong>Mapbox Access Token is missing.</strong>
              <br />
              Please add VITE_MAPBOX_ACCESS_TOKEN to your .env file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernRouteOptimizer;
