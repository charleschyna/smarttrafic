import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Car,
  Truck,
  Bike,
  Footprints,
  Clock,
  Gauge,
  Leaf,
  Zap,
  MapPin,
  ArrowRight,
  X,
  Search,
  Loader,
  Info,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Types
interface Location {
  name: string;
  position: {
    lat: number;
    lng: number;
  };
}

interface Route {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  instructions: string[];
  type: 'fastest' | 'shortest' | 'eco';
}

interface OptimizedRoutes {
  mainRoute: Route;
  alternativeRoutes: Route[];
  summary: string;
  aiSummary: string;
}

// OpenRouteService API functions
const ORS_API_KEY = '5b3ce3597851110001cf624815c98f06fc244b1ab34b5fc0c6b07326'; // Free API key

const searchLocation = async (query: string): Promise<any[]> => {
  if (!query || query.length < 3) return [];
  
  try {
    const response = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&boundary.country=KE&size=10`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
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
      `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${ORS_API_KEY}&start=${origin.lng},${origin.lat}&end=${destination.lng},${destination.lat}&format=geojson&instructions=true`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      return null;
    }
    
    const feature = data.features[0];
    const geometry = feature.geometry;
    const properties = feature.properties;
    
    // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
    const routeCoordinates: [number, number][] = geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
    
    return {
      coordinates: routeCoordinates,
      distance: properties.summary?.distance || 0,
      duration: properties.summary?.duration || 0,
      instructions: properties.segments?.[0]?.steps?.map((step: any) => step.instruction) || [],
      type: profile.includes('fastest') ? 'fastest' : profile.includes('shortest') ? 'shortest' : 'eco'
    };
  } catch (error) {
    console.error('Route calculation failed:', error);
    return null;
  }
};

// Location Input Component
const LocationInput = ({ value, onChange, onClear, placeholder, results, onSelect, onUseCurrentLocation }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm hover:shadow-md"
    />
    {value && (
      <button onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        <X size={18} />
      </button>
    )}
    {results.length > 0 && (
      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
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
              const location: Location = {
                name: result.properties.label || result.properties.name,
                position: { lat, lng }
              };
              onSelect(location);
            }}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors"
          >
            {result.properties.label || result.properties.name}
          </button>
        ))}
      </div>
    )}
  </div>
);

// Route Option Card Component
const RouteOptionCard = ({ route, isSelected, onSelect }) => {
  const icons = {
    fastest: <Zap size={20} className="text-yellow-500" />,
    shortest: <Gauge size={20} className="text-blue-500" />,
    eco: <Leaf size={20} className="text-green-500" />,
  };

  return (
    <button 
      onClick={onSelect}
      className={`p-4 border-2 rounded-xl text-left transition-all duration-300 transform ${
        isSelected ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg scale-105' : 'border-gray-200 hover:border-blue-400 hover:shadow-lg hover:scale-102'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icons[route.type]}
          <h3 className="text-lg font-bold capitalize text-indigo-700">{route.type}</h3>
        </div>
        {isSelected && <CheckCircle size={24} className="text-blue-500" />}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>{Math.round(route.duration / 60)} min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowRight size={14} />
          <span>{(route.distance / 1000).toFixed(1)} km</span>
        </div>
      </div>
    </button>
  );
};

// Map component to handle route display
const RouteMap = ({ routes, selectedRoute, origin, destination }) => {
  const map = useMap();
  
  useEffect(() => {
    if (routes && routes.length > 0) {

      // Fit map to show all route coordinates
      const allCoords = routes.flatMap(route => route.coordinates);
      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [routes, map]);

  return (
    <>
      {/* Display routes */}
      {routes && routes.map((route, index) => (
        <Polyline
          key={route.type}
          positions={route.coordinates}
          color={route.type === selectedRoute ? '#007BFF' : route.type === 'eco' ? '#22c55e' : '#A9A9A9'}
          weight={route.type === selectedRoute ? 6 : 4}
          opacity={route.type === selectedRoute ? 1 : 0.7}
        />
      ))}
      
      {/* Origin marker */}
      {origin && (
        <Marker position={[origin.position.lat, origin.position.lng]}>
          <Popup>{origin.name}</Popup>
        </Marker>
      )}
      
      {/* Destination marker */}
      {destination && (
        <Marker position={[destination.position.lat, destination.position.lng]}>
          <Popup>{destination.name}</Popup>
        </Marker>
      )}
    </>
  );
};

// Main Component
const OSMRouteOptimizer: React.FC = () => {
  // State
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originResults, setOriginResults] = useState([]);
  const [destinationResults, setDestinationResults] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoutes | null>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<'fastest' | 'shortest' | 'eco'>('fastest');

  // Advanced Options
  const [vehicleType, setVehicleType] = useState<'car' | 'truck' | 'bicycle' | 'pedestrian'>('car');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Search handlers
  const handleSearch = useCallback(async (query: string, isOrigin: boolean) => {
    if (!query || query.length < 3) return;
    
    try {
      const results = await searchLocation(query + ' Kenya');
      if (isOrigin) setOriginResults(results);
      else setDestinationResults(results);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (originQuery !== origin?.name) handleSearch(originQuery, true);
    }, 300);
    return () => clearTimeout(handler);
  }, [originQuery, origin, handleSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (destinationQuery !== destination?.name) handleSearch(destinationQuery, false);
    }, 300);
    return () => clearTimeout(handler);
  }, [destinationQuery, destination, handleSearch]);

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
    setError(null);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: Location = {
          name: 'My Current Location',
          position: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }
        };
        handleSelectLocation(loc, true);
      },
      (err) => {
        setError("Could not get current location. Please enable location services.");
      }
    );
  };

  const handleFindRoute = async () => {
    if (!origin || !destination) {
      setError('Please select both an origin and a destination.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOptimizedRoutes(null);

    try {
      console.log('Calculating routes with OpenRouteService...');
      
      // Map vehicle types to ORS profiles
      const profileMap = {
        car: 'driving-car',
        truck: 'driving-hgv',
        bicycle: 'cycling-regular',
        pedestrian: 'foot-walking'
      };
      
      const profile = profileMap[vehicleType];
      
      // Calculate multiple route types
      const routePromises = [
        calculateRoute(origin.position, destination.position, profile),
        // For now, we'll use the same profile but could add alternatives
      ];

      const routes = await Promise.all(routePromises);
      const validRoutes = routes.filter(route => route !== null) as Route[];

      if (validRoutes.length === 0) { 
        setError('No route could be calculated. Please try different locations.');
        return;
      }

      // Assign route types
      validRoutes[0].type = 'fastest';
      if (validRoutes[1]) validRoutes[1].type = 'shortest';

      const mainRoute = validRoutes[0];
      const alternativeRoutes = validRoutes.slice(1);

      const summary = `Route: ${(mainRoute.distance / 1000).toFixed(1)} km, estimated travel time is ${Math.round(mainRoute.duration / 60)} minutes.`;

      setOptimizedRoutes({
        mainRoute,
        alternativeRoutes,
        summary,
        aiSummary: 'Route calculated successfully using OpenStreetMap data.'
      });

      setSelectedRouteType('fastest');
    } catch (err) {
      console.error('Route calculation error:', err);
      setError('Failed to find a route. Please check your locations and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get all routes for display
  const allRoutes = optimizedRoutes ? [optimizedRoutes.mainRoute, ...optimizedRoutes.alternativeRoutes] : [];

  return (
    <div className="flex h-screen font-sans bg-gradient-to-r from-green-200 via-blue-200 to-purple-200">
      {/* Left Panel: Controls */}
      <div className="w-[450px] bg-white shadow-xl flex flex-col p-6 overflow-y-auto border-r border-gray-200">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-indigo-900">Smart Route Planner</h1>
          <p className="text-gray-500">Powered by OpenStreetMap</p>
        </header>



        <div className="space-y-4 flex-grow">
          {/* Location Inputs */}
          <LocationInput
            value={originQuery}
            onChange={setOriginQuery}
            onClear={() => { setOriginQuery(''); setOrigin(null); }}
            placeholder="Enter origin..."
            results={originResults}
            onSelect={(loc) => handleSelectLocation(loc, true)}
            onUseCurrentLocation={handleUseCurrentLocation}
          />
          <LocationInput
            value={destinationQuery}
            onChange={setDestinationQuery}
            onClear={() => { setDestinationQuery(''); setDestination(null); }}
            placeholder="Enter destination..."
            results={destinationResults}
            onSelect={(loc) => handleSelectLocation(loc, false)}
          />
          


          {/* Advanced Options */}
          <div className="pt-2">
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center justify-between w-full text-lg font-semibold text-gray-700">
              Advanced Options {showAdvanced ? <ChevronUp /> : <ChevronDown />}
            </button>
            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="font-medium text-gray-600">Vehicle Type</label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {(['car', 'truck', 'bicycle', 'pedestrian'] as const).map(v => (
                      <button key={v} onClick={() => setVehicleType(v)} className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center ${vehicleType === v ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        {v === 'car' && <Car />}
                        {v === 'truck' && <Truck />}
                        {v === 'bicycle' && <Bike />}
                        {v === 'pedestrian' && <Footprints />}
                        <span className="text-xs capitalize mt-1">{v}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button 
            onClick={handleFindRoute} 
            disabled={isLoading || !origin || !destination}
            className="w-full py-3 mt-4 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold rounded-lg hover:from-green-500 hover:to-blue-600 disabled:bg-blue-300 flex items-center justify-center transition-all shadow-lg transform hover:scale-105"
          >
            {isLoading ? <><Loader className="animate-spin mr-2" /> Finding Best Routes...</> : 'Find Routes'}
          </button>
          
          {error && <div className="p-3 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-l-4 border-red-500 rounded-r-lg shadow-sm animate-pulse">{error}</div>}

          {/* Results */}
          {optimizedRoutes && (
            <div className="pt-4 space-y-4">
              <h2 className="text-xl font-bold">Route Options</h2>
              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-r-lg shadow-sm">
                <h3 className="font-semibold text-green-800 flex items-center mb-1"><Info size={16} className="mr-2" /> Summary</h3>
                <p className="text-sm text-green-900">{optimizedRoutes.summary}</p>
              </div>
              <div className="space-y-3">
                <RouteOptionCard 
                  route={optimizedRoutes.mainRoute} 
                  isSelected={selectedRouteType === 'fastest'} 
                  onSelect={() => setSelectedRouteType('fastest')} 
                />
                {optimizedRoutes.alternativeRoutes.map(alt => (
                  <RouteOptionCard 
                    key={alt.type} 
                    route={alt} 
                    isSelected={selectedRouteType === alt.type} 
                    onSelect={() => setSelectedRouteType(alt.type)} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Right Panel: Map */}
      <div className="flex-grow bg-gray-200 relative">
        <MapContainer
          center={[-1.2921, 36.8219]} // Nairobi center
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RouteMap 
            routes={allRoutes}
            selectedRoute={selectedRouteType}
            origin={origin}
            destination={destination}
          />
        </MapContainer>
      </div>
    </div>
  );
};



export default OSMRouteOptimizer;
