import React, { useState, useEffect, useRef } from 'react';
import { services } from '@tomtom-international/web-sdk-services';
import tt, { LngLatLike } from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { Download, Car, Bus, Truck, Bike, AlertTriangle, ArrowRight, Loader, Info, MapPin, Crosshair } from 'lucide-react';
import { getOptimizedRoute } from '../../AI/services';
import type { OptimizedRoute, VehicleType } from '../../AI/types';

// Interfaces for our data structures
interface Location {
  name: string;
  position: { 
    lat: number; 
    lng: number; 
  };
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
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');

  // Initialize map
  useEffect(() => {
    const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
    if (!apiKey) {
      console.error("TomTom API key is not configured.");
      setError("TomTom API key is not configured.");
      return;
    }

    const initializeMap = (center: [number, number], zoom: number) => {
      if (mapRef.current) {
        const newMap = tt.map({
          key: apiKey,
          container: mapRef.current,
          center: center,
          zoom: zoom,
          stylesVisibility: {
            trafficIncidents: true,
            trafficFlow: true,
          },
        });
        newMap.addControl(new tt.FullscreenControl());
        newMap.addControl(new tt.NavigationControl());
        mapInstance.current = newMap;
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setOrigin({ name: 'Your Current Location', position: userLocation });
          initializeMap([userLocation.lng, userLocation.lat], 13);
        },
        () => {
          // On error or denial, default to Nairobi
          initializeMap([36.8172, -1.2864], 12);
        }
      );
    } else {
      // Geolocation not supported
      initializeMap([36.8172, -1.2864], 12);
    }

    return () => {
      mapInstance.current?.remove();
    };
  }, []); // Run only once on mount

  // Effect to add a marker for the user's current location
  useEffect(() => {
    if (mapInstance.current && origin?.name === 'Your Current Location' && origin.position) {
      const marker = new tt.Marker({ color: '#28a745' }) // Green marker
        .setLngLat([origin.position.lng, origin.position.lat])
        .addTo(mapInstance.current);
      
      const popup = new tt.Popup({ offset: 25 }).setText('You are here');
      marker.setPopup(popup);
      markers.current.push(marker);
    }
  }, [mapInstance, origin]);

    const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          const newOrigin = { name: 'Your Current Location', position: userLocation };
          setOrigin(newOrigin);
          setOriginQuery(newOrigin.name); // Update the input field text
          if (mapInstance.current) {
            mapInstance.current.setCenter([userLocation.lng, userLocation.lat]);
            mapInstance.current.setZoom(13);
          }
        },
        (error) => {
          console.error("Error getting current location:", error);
          setError("Could not retrieve your location. Please enable location services in your browser.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  // Debounced location search
  const handleSearch = async (query: string, isOrigin: boolean) => {
    if (!query || !apiKey) return;
    try {
      // Focus search on Kenya
      const response = await services.fuzzySearch({ key: apiKey, query: `${query}, Nairobi, KE` });
      if (isOrigin) setOriginResults(response.results || []);
      else setDestinationResults(response.results || []);
    } catch (err) {
      setError('Failed to search for locations.');
      console.error(err);
    }
  };

  useEffect(() => {
    // Do not re-search if the query is the same as the selected location
    if (origin && origin.name === originQuery) {
      setOriginResults([]);
      return;
    }
    const handler = setTimeout(() => {
      if (originQuery) handleSearch(originQuery, true);
      else setOriginResults([]);
    }, 500);
    return () => clearTimeout(handler);
  }, [originQuery, origin]);

  useEffect(() => {
    // Do not re-search if the query is the same as the selected location
    if (destination && destination.name === destinationQuery) {
      setDestinationResults([]);
      return;
    }
    const handler = setTimeout(() => {
      if (destinationQuery) handleSearch(destinationQuery, false);
      else setDestinationResults([]);
    }, 500);
    return () => clearTimeout(handler);
  }, [destinationQuery, destination]);

  // Clear existing markers and routes from the map
  const clearMap = () => {
    if (mapInstance.current) {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      if (mapInstance.current.getLayer('route')) {
        mapInstance.current.removeLayer('route');
        mapInstance.current.removeSource('route');
      }
      if (mapInstance.current.getLayer('alternative_route')) {
        mapInstance.current.removeLayer('alternative_route');
        mapInstance.current.removeSource('alternative_route');
      }
    }
  };
  
  // Calculate and display the optimal route
  const handleFindRoute = async () => {
    if (!origin || !destination || !mapInstance.current) {
      setError('Please select both an origin and a destination.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOptimizedRoute(null);
    clearMap();

    try {
      const result = await getOptimizedRoute(origin.position, destination.position, vehicleType);

      if (!result) {
        setError('Could not find an optimized route. Please try again.');
        setIsLoading(false);
        return;
      }

      setOptimizedRoute(result);

      // Draw the main route on the map
      const mainRouteGeoJSON = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: result.mainRoute.geometry.map(p => [p.lng, p.lat]),
        },
      };

      mapInstance.current.addSource('route', { type: 'geojson', data: mainRouteGeoJSON as any });
      mapInstance.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#16a34a', 'line-width': 8, 'line-opacity': 0.9 },
      });

      // Add markers for origin, destination, and incidents
      const originMarker = new tt.Marker({ color: '#22c55e' }).setLngLat(origin.position as LngLatLike).addTo(mapInstance.current);
      const destMarker = new tt.Marker({ color: '#ef4444' }).setLngLat(destination.position as LngLatLike).addTo(mapInstance.current);
      markers.current = [originMarker, destMarker];

      result.incidents.forEach(incident => {
        const popup = new tt.Popup({ offset: 25 }).setText(incident.summary);
        const incidentMarker = new tt.Marker({ color: '#f59e0b' })
          .setLngLat(incident.position as LngLatLike)
          .setPopup(popup)
          .addTo(mapInstance.current!);
        markers.current.push(incidentMarker);
      });

      // Fit map to bounds
      const bounds = new tt.LngLatBounds();
      result.mainRoute.geometry.forEach(point => bounds.extend([point.lng, point.lat]));
      mapInstance.current.fitBounds(bounds, { padding: 100, duration: 500 });
      
    } catch (err) {
      setError('An unexpected error occurred while fetching the route.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Renders the dropdown for location search results
  const renderLocationDropdown = (results: any[], onSelect: (location: Location) => void) => (
    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
      {results.map((result) => (
        <button
          key={result.id}
          onClick={() => {
            onSelect({
              name: result.address.freeformAddress,
              position: { 
                lat: result.position.lat, 
                lng: result.position.lng // Corrected from .lon to .lng
              }
            });
          }}
          className="w-full px-4 py-2 text-left hover:bg-green-50 transition-colors"
        >
          {result.address.freeformAddress}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 font-sans bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">AI Route Planner</h1>
          <p className="text-gray-500">Smart logistics and traffic analysis for Kenya</p>
        </div>
        <button className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">
          <Download size={18} className="mr-2" />
          Export
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 bg-white rounded-xl p-6 shadow-md space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Plan Your Route</h2>
            <div className="space-y-4">
                <div className="relative">
                  <input type="text" value={originQuery} onChange={(e) => setOriginQuery(e.target.value)} placeholder="Origin Location" className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 transition-colors"/>
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                  <button
                    onClick={handleUseCurrentLocation}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500 transition-colors"
                    title="Use my current location"
                  >
                    <Crosshair size={20} />
                  </button>
                  {originResults.length > 0 && renderLocationDropdown(originResults, (loc) => {
                    setOrigin(loc);
                    setOriginQuery(loc.name);
                    setOriginResults([]);
                  })}
                </div>
                <div className="relative">
                  <input type="text" value={destinationQuery} onChange={(e) => setDestinationQuery(e.target.value)} placeholder="Destination Location" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 transition-colors"/>
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                  {destinationResults.length > 0 && renderLocationDropdown(destinationResults, (loc) => {
                    setDestination(loc);
                    setDestinationQuery(loc.name);
                    setDestinationResults([]);
                  })}
                </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Select Vehicle</h3>
            <div className="grid grid-cols-2 gap-3">
                {(['car', 'bus', 'truck', 'bicycle'] as const).map(v => (
                    <button key={v} onClick={() => setVehicleType(v)} className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-center capitalize transition-colors ${vehicleType === v ? 'border-green-500 bg-green-50 shadow-inner' : 'border-gray-200 hover:border-gray-300'}`}>
                        {v === 'bicycle' ? <Bike size={20}/> : v === 'bus' ? <Bus size={20}/> : v === 'truck' ? <Truck size={20}/> : <Car size={20}/>}
                        <span className="font-medium">{v}</span>
                    </button>
                ))}
            </div>
          </div>

          <button onClick={handleFindRoute} disabled={isLoading || !origin || !destination} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            {isLoading ? <><Loader className="animate-spin mr-3" size={20} /> Calculating...</> : 'Find Optimal Route'}
          </button>
        </div>

        {/* Right Column: Map & Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div style={{height: '450px'}} className="bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden" ref={mapRef}>
              {!optimizedRoute && !error && !isLoading && 
                <div className="text-gray-500 text-center">
                  <MapPin size={40} className="mx-auto text-gray-400 mb-2"/>
                  <p>Your route map will appear here.</p>
                </div>
              }
              {isLoading && <div className="text-gray-500 flex items-center"><Loader className="animate-spin mr-3" /> Searching for the best route...</div>}
            </div>
          </div>

          {error && <div className="p-4 bg-red-100 text-red-800 border-l-4 border-red-500 rounded-r-lg shadow-md">{error}</div>}

          {optimizedRoute ? (
            <div className="bg-white rounded-xl p-6 shadow-md space-y-6">
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                <h3 className="font-semibold text-green-800 flex items-center mb-2"><Info size={18} className="mr-2" /> AI Summary</h3>
                <p className="text-sm text-green-900 leading-relaxed">{optimizedRoute.aiSummary}</p>
              </div>

              <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center font-semibold text-gray-700 truncate"><div className="w-3 h-3 rounded-full bg-green-500 mr-3 flex-shrink-0"/>{origin?.name}</div>
                  <ArrowRight className="text-gray-400 mx-2 sm:mx-4" />
                  <div className="flex items-center font-semibold text-gray-700 truncate"><div className="w-3 h-3 rounded-full bg-red-500 mr-3 flex-shrink-0"/>{destination?.name}</div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center p-4 bg-gray-50 rounded-lg">
                <div><div className="text-2xl font-bold text-gray-800">{(optimizedRoute.mainRoute.distanceInMeters / 1000).toFixed(1)} km</div><div className="text-sm text-gray-500">Distance</div></div>
                <div><div className="text-2xl font-bold text-gray-800">{Math.round(optimizedRoute.mainRoute.travelTimeInSeconds / 60)} min</div><div className="text-sm text-gray-500">Duration</div></div>
                <div><div className="text-2xl font-bold text-gray-800">{Math.round(optimizedRoute.mainRoute.trafficDelayInSeconds / 60)} min</div><div className="text-sm text-gray-500">Traffic Delay</div></div>
              </div>

              {optimizedRoute.incidents.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center"><AlertTriangle size={18} className="mr-2 text-yellow-600" /> Incidents on Route</h3>
                  <div className="space-y-3">
                    {optimizedRoute.incidents.map((incident, index) => (
                      <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                        <p className="font-semibold text-sm text-yellow-800">{incident.summary}</p>
                        <p className="text-xs text-yellow-700 mt-1">{incident.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {optimizedRoute.alternativeRoutes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center"><MapPin size={18} className="mr-2 text-gray-600" /> Alternative Routes</h3>
                  <div className="space-y-2">
                    {optimizedRoute.alternativeRoutes.map((altRoute, index) => (
                      <div key={index} className="p-3 bg-gray-100 border rounded-lg text-sm hover:bg-gray-200 transition-colors">
                        <span className="font-semibold">Alternative {index + 1}:</span> {Math.round(altRoute.travelTimeInSeconds / 60)} min, {(altRoute.distanceInMeters / 1000).toFixed(1)} km
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
             !isLoading && !error && (
                <div className="bg-white rounded-xl p-6 shadow-md text-center text-gray-500">
                  <Info className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700">Route analysis will appear here.</h3>
                  <p>Enter an origin and destination to get started.</p>
                </div>
             )
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteOptimizer;