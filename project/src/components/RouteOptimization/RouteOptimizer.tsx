import React, { useState, useEffect, useRef } from 'react';
import { services } from '@tomtom-international/web-sdk-services';
import tt, { LngLatLike } from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { Filter, Download, Car, Bus, Truck, Bike, AlertTriangle, ArrowRight, Loader } from 'lucide-react';

// Interfaces for our data structures
interface Location {
  name: string;
  position: {
    lat: number;
    lng: number;
  };
}

interface RouteDetails {
  distance: string;
  duration: string;
  congestion: number;
  instructions: { message: string }[];
}

const RouteOptimizer: React.FC = () => {
  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY || '';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<tt.Map | null>(null);
  const markers = useRef<tt.Marker[]>([]);

  // State management
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [destinationResults, setDestinationResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [vehicleType, setVehicleType] = useState<'car' | 'bus' | 'truck' | 'bicycle'>('car');
  const [city, setCity] = useState('Nairobi');
  const [timeSlot, setTimeSlot] = useState('Morning (6AM-12PM)');

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !apiKey) return;

    const map = tt.map({
      key: apiKey,
      container: mapRef.current,
      center: [36.8219, -1.2921], // Default to Nairobi
      zoom: 12,
      stylesVisibility: {
        trafficIncidents: true,
        trafficFlow: true,
      },
    });

    map.addControl(new tt.FullscreenControl());
    map.addControl(new tt.NavigationControl());
    mapInstance.current = map;

    return () => map.remove();
  }, [apiKey]);

  // Debounced location search
  const handleSearch = async (query: string, city: string, isOrigin: boolean) => {
    if (!query || !apiKey) return;
    try {
      const response = await services.fuzzySearch({ key: apiKey, query: `${query}, ${city}` });
      if (isOrigin) setOriginResults(response.results || []);
      else setDestinationResults(response.results || []);
    } catch (err) {
      setError('Failed to search for locations.');
      console.error(err);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (originQuery) handleSearch(originQuery, city, true);
      else setOriginResults([]);
    }, 500);
    return () => clearTimeout(handler);
  }, [originQuery, city]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (destinationQuery) handleSearch(destinationQuery, city, false);
      else setDestinationResults([]);
    }, 500);
    return () => clearTimeout(handler);
  }, [destinationQuery, city]);

  // Clear existing markers and routes from the map
  const clearMap = () => {
    if (mapInstance.current) {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      if (mapInstance.current.getLayer('route')) {
        mapInstance.current.removeLayer('route');
        mapInstance.current.removeSource('route');
      }
    }
  };
  
  // Calculate and display the optimal route
  const findOptimalRoute = async () => {
    if (!origin || !destination || !mapInstance.current) {
      setError('Please select both an origin and a destination.');
      return;
    }

    setIsLoading(true);
    setError(null);
    clearMap();

    try {
      const routeResponse = await services.calculateRoute({
        key: apiKey,
        locations: [origin.position, destination.position],
        travelMode: vehicleType,
        traffic: true,
        instructionsType: 'text',
      });

      const route = routeResponse.routes[0];
      if (!route) {
        setError('No route found.');
        setIsLoading(false);
        return;
      }

      const { lengthInMeters, travelTimeInSeconds, trafficDelayInSeconds } = route.summary;
      setRouteDetails({
        distance: `${(lengthInMeters / 1000).toFixed(1)} km`,
        duration: `${Math.round(travelTimeInSeconds / 60)} min`,
        congestion: Math.round((trafficDelayInSeconds / travelTimeInSeconds) * 100),
        instructions: route.guidance?.instructions?.map((i: any) => ({ message: i.message })) || [],
      });
      
      const coordinates = route.legs.flatMap(leg => 
        leg.points.map(p => [p.lng, p.lat])
      ) as [number, number][];

      const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates,
        },
      };

      mapInstance.current.addSource('route', { type: 'geojson', data: geojson });
      mapInstance.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#007cff', 'line-width': 6 },
      });

      const originMarker = new tt.Marker({ color: 'green' }).setLngLat(origin.position as LngLatLike).addTo(mapInstance.current);
      const destMarker = new tt.Marker({ color: 'red' }).setLngLat(destination.position as LngLatLike).addTo(mapInstance.current);
      markers.current = [originMarker, destMarker];

      const bounds = new tt.LngLatBounds();
      coordinates.forEach(point => bounds.extend(point));
      mapInstance.current.fitBounds(bounds, { padding: 50, duration: 300 });

    } catch (err) {
      setError('Failed to calculate the route.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLocationDropdown = (results: any[], onSelect: (location: Location) => void) => (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
      {results.map((result) => (
        <button
          key={result.id}
          onClick={() => onSelect({
            name: result.address.freeformAddress,
            position: { lat: result.position.lat, lng: result.position.lon }
          })}
          className="w-full px-4 py-2 text-left hover:bg-gray-50"
        >
          {result.address.freeformAddress}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Route Optimization</h1>
          <p className="text-gray-500">Find the most efficient routes with real-time traffic data</p>
        </div>
        <button className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">
          <Download size={18} className="mr-2" />
          Export Route
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
          <Filter size={20} className="text-gray-500" />
          <span className="text-gray-700 font-semibold">Filters</span>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option>Nairobi</option>
          <option>Mombasa</option>
          <option>Kisumu</option>
        </select>
        <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option>Morning (6AM-12PM)</option>
          <option>Afternoon (12PM-6PM)</option>
          <option>Evening (6PM-12AM)</option>
        </select>
        <button onClick={() => { /* Reset filters */ }} className="text-blue-600 font-semibold hover:underline">Reset</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">Find Optimal Route</h2>
          <div className="space-y-5">
            <div className="relative">
              <input type="text" value={originQuery} onChange={(e) => setOriginQuery(e.target.value)} placeholder="Origin" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"/>
              {originResults.length > 0 && renderLocationDropdown(originResults, (loc) => {
                setOrigin(loc);
                setOriginQuery(loc.name);
                setOriginResults([]);
              })}
            </div>
            <div className="relative">
              <input type="text" value={destinationQuery} onChange={(e) => setDestinationQuery(e.target.value)} placeholder="Destination" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"/>
              {destinationResults.length > 0 && renderLocationDropdown(destinationResults, (loc) => {
                setDestination(loc);
                setDestinationQuery(loc.name);
                setDestinationResults([]);
              })}
            </div>
            <div className="flex justify-around gap-3">
                {(['car', 'bus', 'truck', 'bicycle'] as const).map(v => (
                    <button key={v} onClick={() => setVehicleType(v)} className={`flex-1 p-4 rounded-lg border-2 text-center capitalize transition-colors ${vehicleType === v ? 'border-blue-500 bg-blue-50 shadow-inner' : 'border-gray-200 hover:border-gray-400'}`}>
                        {v === 'bicycle' ? <Bike className="mx-auto h-6 w-6"/> : v === 'bus' ? <Bus className="mx-auto h-6 w-6"/> : v === 'truck' ? <Truck className="mx-auto h-6 w-6"/> : <Car className="mx-auto h-6 w-6"/>}
                        <span className="text-sm font-medium mt-2 block">{v}</span>
                    </button>
                ))}
            </div>
            <button onClick={findOptimalRoute} disabled={isLoading} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-all">
              {isLoading ? <><Loader className="animate-spin mr-3" size={20} /> Calculating...</> : 'Find Optimal Route'}
            </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Route Details</h2>
          {error && <div className="p-4 mb-4 bg-red-100 text-red-800 border-l-4 border-red-500 rounded-r-lg">{error}</div>}
          
          <div className="h-64 bg-gray-200 rounded-lg mb-4" ref={mapRef}>
             {!routeDetails && !error && <div className="flex items-center justify-center h-full text-gray-500">Enter a route to see the map</div>}
          </div>

          {routeDetails ? (
            <div>
              <div className="flex items-center justify-between mb-4 text-sm">
                  <div className="flex items-center font-semibold text-gray-700 truncate"><div className="w-3 h-3 rounded-full bg-green-500 mr-3 flex-shrink-0"/>{origin?.name}</div>
                  <ArrowRight className="text-gray-400 mx-4" />
                  <div className="flex items-center font-semibold text-gray-700 truncate"><div className="w-3 h-3 rounded-full bg-red-500 mr-3 flex-shrink-0"/>{destination?.name}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center mb-6 p-4 bg-gray-50 rounded-lg">
                <div><div className="text-2xl font-bold text-gray-800">{routeDetails.distance}</div><div className="text-sm text-gray-500">Distance</div></div>
                <div><div className="text-2xl font-bold text-gray-800">{routeDetails.duration}</div><div className="text-sm text-gray-500">Duration</div></div>
                <div><div className="text-2xl font-bold text-gray-800">{routeDetails.congestion}%</div><div className="text-sm text-gray-500">Congestion</div></div>
              </div>

              {routeDetails.congestion > 50 && (
                <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded-r-lg flex items-center">
                  <AlertTriangle className="text-yellow-600 mr-3" />
                  <p className="text-sm font-medium text-yellow-800">High traffic detected. Consider an alternative route.</p>
                </div>
              )}

              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Turn-by-turn Directions</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
                  {routeDetails.instructions.length > 0 ? routeDetails.instructions.map((inst, index) => <div key={index} className="text-sm text-gray-700">{inst.message}</div>) : <div className="text-sm text-gray-500">No instructions available.</div>}
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center text-gray-500 py-12">Enter origin and destination to see route details.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteOptimizer; 