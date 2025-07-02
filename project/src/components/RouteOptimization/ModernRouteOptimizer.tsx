
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Truck, Bike, Footprints, Clock, Gauge, Leaf, Zap, MapPin, ArrowRight, X, Search, Loader, Info, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Wind, TrendingUp, Sun, Cloud, Droplets
} from 'lucide-react';

// --- Leaflet Icon Fix ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- Types ---
interface Location {
  name: string;
  position: { lat: number; lng: number };
}

interface Route {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
  instructions: string[];
  type: 'fastest' | 'shortest' | 'eco';
}

interface OptimizedRoutes {
  mainRoute: Route;
  alternativeRoutes: Route[];
  summary: string;
  aiSummary: string;
}

// --- OpenRouteService API Logic ---
const ORS_API_KEY = '5b3ce3597851110001cf624815c98f06fc244b1ab34b5fc0c6b07326';

const searchLocation = async (query: string): Promise<any[]> => {
  if (!query || query.length < 3) return [];
  try {
    const response = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&boundary.country=KE&size=10`
    );
    if (!response.ok) throw new Error('Network response was not ok.');
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Location search failed:', error);
    return [];
  }
};

const calculateRoute = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  profile: string = 'driving-car'
): Promise<Route | null> => {
  try {
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${ORS_API_KEY}&start=${origin.lng},${origin.lat}&end=${destination.lng},${destination.lat}`
    );
    if (!response.ok) throw new Error(`ORS API error: ${response.statusText}`);
    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const feature = data.features[0];
    const routeCoordinates: [number, number][] = feature.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
    
    return {
      coordinates: routeCoordinates,
      distance: feature.properties.summary.distance,
      duration: feature.properties.summary.duration,
      instructions: feature.properties.segments[0].steps.map((s: any) => s.instruction),
      type: 'fastest', // Default type, can be expanded later
    };
  } catch (error) {
    console.error('Route calculation failed:', error);
    return null;
  }
};


// --- UI Components ---

const LocationInput = ({ value, onChange, onClear, placeholder, results, onSelect, onUseCurrentLocation, isLoading }) => (
    <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-10 py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400 shadow-sm hover:border-gray-300"
        />
        {isLoading && <Loader className="absolute right-10 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={20} />} 
        {value && !isLoading && (
            <button onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={20} />
            </button>
        )}
        <AnimatePresence>
            {results.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-30 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto"
                >
                    {onUseCurrentLocation && (
                        <button onClick={onUseCurrentLocation} className="w-full px-4 py-3 text-left text-blue-600 font-semibold hover:bg-blue-50 transition-colors flex items-center">
                            <MapPin size={16} className="mr-2" /> Use Current Location
                        </button>
                    )}
                    {results.map((result, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                const [lng, lat] = result.geometry.coordinates;
                                onSelect({ name: result.properties.label, position: { lat, lng } });
                            }}
                            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                            {result.properties.label}
                        </button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const RouteMap = ({ routes, selectedRoute, origin, destination }) => {
  const map = useMap();
  useEffect(() => {
    if (routes && routes.length > 0) {
      const allCoords = routes.flatMap(r => r.coordinates);
      if (allCoords.length > 0) {
        map.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50] });
      }
    } else if (origin && destination) {
        map.fitBounds(L.latLngBounds([origin.position, destination.position]), { padding: [50, 50] });
    }
  }, [routes, origin, destination, map]);

  return (
    <>
      {routes && routes.map(route => (
        <Polyline
          key={route.type}
          positions={route.coordinates}
          color={route.type === selectedRoute ? '#22d3ee' : '#94a3b8'}
          weight={route.type === selectedRoute ? 7 : 5}
          opacity={route.type === selectedRoute ? 1 : 0.6}
        />
      ))}
      {origin && <Marker position={origin.position}><Popup>{origin.name}</Popup></Marker>}
      {destination && <Marker position={destination.position}><Popup>{destination.name}</Popup></Marker>}
    </>
  );
};

// --- Main Modern Component ---
const ModernRouteOptimizer: React.FC = () => {
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originResults, setOriginResults] = useState([]);
  const [destinationResults, setDestinationResults] = useState([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [destinationLoading, setDestinationLoading] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoutes | null>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<'fastest' | 'shortest' | 'eco'>('fastest');

  const [vehicleType, setVehicleType] = useState('car');

  const handleSearch = useCallback(async (query: string, isOrigin: boolean) => {
    if (isOrigin) setOriginLoading(true); else setDestinationLoading(true);
    try {
      const results = await searchLocation(query);
      if (isOrigin) setOriginResults(results); else setDestinationResults(results);
    } finally {
      if (isOrigin) setOriginLoading(false); else setDestinationLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => { if (originQuery) handleSearch(originQuery, true); else setOriginResults([]); }, 500);
    return () => clearTimeout(handler);
  }, [originQuery, handleSearch]);

  useEffect(() => {
    const handler = setTimeout(() => { if (destinationQuery) handleSearch(destinationQuery, false); else setDestinationResults([]); }, 500);
    return () => clearTimeout(handler);
  }, [destinationQuery, handleSearch]);

  const handleSelectLocation = (location: Location, isOrigin: boolean) => {
    if (isOrigin) {
      setOrigin(location);
      setOriginQuery(location.name);
      setOriginResults([]);
    } else {
      setDestination(location);
      setDestinationQuery(location.name);
      setDestinationResults([]);
    }
  };

  const handleFindRoute = async () => {
    if (!origin || !destination) {
      setError('Set origin and destination to find a route.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setOptimizedRoutes(null);

    try {
      const profileMap = { car: 'driving-car', truck: 'driving-hgv', bicycle: 'cycling-road', pedestrian: 'foot-walking' };
      const mainRoute = await calculateRoute(origin.position, destination.position, profileMap[vehicleType]);

      if (!mainRoute) {
        setError('Could not calculate a route. The locations might be unreachable.');
        return;
      }
      
      setOptimizedRoutes({
        mainRoute,
        alternativeRoutes: [], // Can add more route types here later
        summary: `Route: ${(mainRoute.distance / 1000).toFixed(1)} km, ${Math.round(mainRoute.duration / 60)} min.`,
        aiSummary: 'Route calculated with OpenRouteService.'
      });

    } catch (err) {
      setError('Failed to find a route. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const allRoutes = optimizedRoutes ? [optimizedRoutes.mainRoute, ...optimizedRoutes.alternativeRoutes] : [];

  return (
    <div className="relative h-screen w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-200 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute top-20 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-36 h-36 bg-green-200 rounded-full opacity-35 animate-bounce delay-1000"></div>
      </div>
      
      <MapContainer center={[-1.286389, 36.817223]} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RouteMap routes={allRoutes} selectedRoute={selectedRouteType} origin={origin} destination={destination} />
      </MapContainer>

      <motion.div 
        className="absolute top-0 left-0 right-0 p-4 md:p-8 flex flex-col md:flex-row gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex-grow bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-cyan-500/30 shadow-2xl flex flex-col gap-4 hover:shadow-cyan-500/30 hover:border-cyan-400/50 transition-all duration-500 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <LocationInput value={originQuery} onChange={setOriginQuery} onClear={() => { setOrigin(null); setOriginQuery(''); }} placeholder="Choose starting point" results={originResults} onSelect={(loc) => handleSelectLocation(loc, true)} isLoading={originLoading} />
              <LocationInput value={destinationQuery} onChange={setDestinationQuery} onClear={() => { setDestination(null); setDestinationQuery(''); }} placeholder="Choose destination" results={destinationResults} onSelect={(loc) => handleSelectLocation(loc, false)} isLoading={destinationLoading} />
            </div>
             <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {(['car', 'truck', 'bicycle', 'pedestrian'] as const).map(v => (
                      <button key={v} onClick={() => setVehicleType(v)} className={`p-2.5 rounded-lg transition-colors ${vehicleType === v ? 'bg-cyan-500/20 text-cyan-300' : 'bg-neutral-700/50 text-neutral-400 hover:bg-neutral-600/50'}`}>
                        {v === 'car' && <Car />}
                        {v === 'truck' && <Truck />}
                        {v === 'bicycle' && <Bike />}
                        {v === 'pedestrian' && <Footprints />}
                      </button>
                    ))}
                </div>
                <button onClick={handleFindRoute} disabled={isLoading || !origin || !destination} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed flex items-center gap-2 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25">
                    {isLoading ? <><Loader className="animate-spin" />Calculating</> : 'Find Route'}
                </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
             <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-500/80 backdrop-blur-sm p-4 rounded-xl text-white font-semibold"
             >
                {error}
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {optimizedRoutes && (
            <motion.div
                className="absolute bottom-8 right-8 w-[350px] bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-neutral-600/50 shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
            >
               <h2 className="text-2xl font-bold mb-4">Route Details</h2>
               <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                    <div className="flex items-center gap-2 text-cyan-400"><TrendingUp /> <span>Distance</span></div>
                    <span className="font-bold">{(optimizedRoutes.mainRoute.distance / 1000).toFixed(1)} km</span>
                </div>
                 <div className="flex justify-between items-center text-lg">
                    <div className="flex items-center gap-2 text-cyan-400"><Clock /> <span>Duration</span></div>
                    <span className="font-bold">{Math.round(optimizedRoutes.mainRoute.duration / 60)} min</span>
                </div>
               </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernRouteOptimizer;

