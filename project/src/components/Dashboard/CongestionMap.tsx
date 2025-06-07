import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ZoomIn, ZoomOut, Layers, AlertCircle, Loader } from 'lucide-react';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import * as tt from '@tomtom-international/web-sdk-maps';

interface TrafficData {
  location: { lat: number; lng: number };
  lastUpdated: Date;
}

const DEFAULT_CENTER = { lat: 51.5074, lng: -0.1278 }; // London as default

const CongestionMap: React.FC = () => {
  const mapElement = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<tt.Map | null>(null);
  const [mapView, setMapView] = useState('traffic');
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapInstance = useRef<tt.Map | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        let center = DEFAULT_CENTER;

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });

          center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(center);
        } catch (locErr) {
          console.warn('Using default location:', locErr);
        }

        if (mapElement.current && !mapInstance.current) {
          const apiKey = 'B0e9ZcFGi7FVZxlubq4CQxECwSDjlcvE';

          const mapConfig: tt.MapOptions = {
            key: apiKey,
            container: mapElement.current,
            center: [center.lng, center.lat],
            zoom: 13,
            language: 'en-GB',
            stylesVisibility: {
              trafficFlow: true,
              trafficIncidents: true
            }
          };

          const newMap = tt.map(mapConfig);

          // Add error handler for authentication issues
          newMap.on('error', (e: any) => {
            console.error('Map error:', e);
            if (e.error && e.error.status === 403) {
              setError('API key authentication failed. Please check your TomTom API key permissions.');
            }
          });

          newMap.on('load', () => {
            if (userLocation) {
              new tt.Marker({
                element: createMarkerElement()
              })
              .setLngLat([userLocation.lng, userLocation.lat])
              .addTo(newMap);
            }

            // Enable traffic visualization
            try {
              // Add traffic flow layer
              newMap.addSource('traffic-flow', {
                type: 'vector',
                url: `https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.pbf?key=${apiKey}`
              });

              newMap.addLayer({
                'id': 'traffic-flow',
                'type': 'line',
                'source': 'traffic-flow',
                'source-layer': 'flow',
                'layout': {
                  'line-cap': 'round',
                  'line-join': 'round'
                },
                'paint': {
                  'line-width': 3,
                  'line-color': [
                    'match',
                    ['get', 'currentSpeed'],
                    4, '#00ff00',  // free flow - green
                    3, '#ffff00',  // moderate - yellow
                    2, '#ffa500',  // slow - orange
                    1, '#ff0000',  // very slow - red
                    0, '#7f0000',  // stopped - dark red
                    '#808080'      // default - gray
                  ],
                  'line-opacity': 0.8
                }
              });

            } catch (err) {
              console.error('Error enabling traffic:', err);
            }

            setTrafficData([{
              location: center,
              lastUpdated: new Date()
            }]);
          });

          mapInstance.current = newMap;
          setMap(newMap);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error initializing map:', err);
        let errorMessage = 'Failed to initialize map. ';
        
        if (err.code === 1) {
          errorMessage += 'Please enable location access in your browser settings.';
        } else if (err.code === 2) {
          errorMessage += 'Location information is unavailable.';
        } else if (err.code === 3) {
          errorMessage += 'Location request timed out.';
        } else if (err.response && err.response.status === 403) {
          errorMessage += 'API key authentication failed. Please check your TomTom API key permissions.';
        } else {
          errorMessage += 'Please check your connection and try again.';
        }
        
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Create custom marker element
  const createMarkerElement = () => {
    const element = document.createElement('div');
    element.className = 'custom-marker';
    element.style.backgroundColor = '#4CAF50';
    element.style.borderRadius = '50%';
    element.style.width = '20px';
    element.style.height = '20px';
    element.style.border = '3px solid white';
    element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    return element;
  };

  // Update the map style change handler
  useEffect(() => {
    if (mapInstance.current && userLocation) {
      try {
        const style = {
          map: mapView === 'satellite' ? 'satellite' : 'basic',
          trafficFlow: true,
          trafficIncidents: true
        };
        
        mapInstance.current.setStyle(style);
        
        // Re-enable traffic visualization after style change
        mapInstance.current.once('style.load', () => {
          try {
            if (mapInstance.current) {
              const apiKey = 'B0e9ZcFGi7FVZxlubq4CQxECwSDjlcvE';
              
              // Re-add traffic flow layer after style change
              if (!mapInstance.current.getSource('traffic-flow')) {
                mapInstance.current.addSource('traffic-flow', {
                  type: 'vector',
                  url: `https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.pbf?key=${apiKey}`
                });

                mapInstance.current.addLayer({
                  'id': 'traffic-flow',
                  'type': 'line',
                  'source': 'traffic-flow',
                  'source-layer': 'flow',
                  'layout': {
                    'line-cap': 'round',
                    'line-join': 'round'
                  },
                  'paint': {
                    'line-width': 3,
                    'line-color': [
                      'match',
                      ['get', 'currentSpeed'],
                      4, '#00ff00',  // free flow - green
                      3, '#ffff00',  // moderate - yellow
                      2, '#ffa500',  // slow - orange
                      1, '#ff0000',  // very slow - red
                      0, '#7f0000',  // stopped - dark red
                      '#808080'      // default - gray
                    ],
                    'line-opacity': 0.8
                  }
                });
              }
            }
          } catch (err) {
            console.error('Error re-enabling traffic:', err);
          }
        });
      } catch (err) {
        console.error('Error changing map style:', err);
        setError('Failed to change map style. Please try again.');
      }
    }
  }, [mapView, userLocation]);

  // Handle zoom controls
  const handleZoom = (direction: 'in' | 'out') => {
    if (mapInstance.current) {
      const currentZoom = mapInstance.current.getZoom();
      mapInstance.current.setZoom(direction === 'in' ? currentZoom + 1 : currentZoom - 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden h-[400px] relative">
      {/* Map Controls */}
      <div className="absolute top-3 left-3 z-10 bg-white rounded-md shadow-sm p-1.5">
        <div className="flex space-x-1">
          <button 
            className={`p-1.5 rounded-md ${mapView === 'traffic' ? 'bg-primary-50 text-primary-500' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setMapView('traffic')}
          >
            <MapPin size={18} />
          </button>
          <button 
            className={`p-1.5 rounded-md ${mapView === 'satellite' ? 'bg-primary-50 text-primary-500' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setMapView('satellite')}
          >
            <Layers size={18} />
          </button>
        </div>
      </div>
      
      <div className="absolute top-3 right-3 z-10 bg-white rounded-md shadow-sm p-1.5">
        <div className="flex flex-col space-y-1">
          <button 
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => handleZoom('in')}
          >
            <ZoomIn size={18} />
          </button>
          <button 
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => handleZoom('out')}
          >
            <ZoomOut size={18} />
          </button>
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex items-center space-x-2">
            <Loader className="animate-spin" size={24} />
            <span>Loading map...</span>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-20 bg-red-50 text-red-600 px-4 py-2 rounded-md flex items-center space-x-2">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapElement} className="w-full h-full" />
      
      {/* Traffic Legend */}
      {!isLoading && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm p-3 rounded-md shadow-sm z-10">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-secondary-900">Live Traffic Conditions</h4>
            <span className="text-xs text-secondary-500">
              Last updated: {trafficData[0]?.lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="block w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-xs text-secondary-700">Free flow</span>
            
            <span className="block w-3 h-3 rounded-full bg-yellow-500 ml-2"></span>
            <span className="text-xs text-secondary-700">Slow traffic</span>
            
            <span className="block w-3 h-3 rounded-full bg-red-500 ml-2"></span>
            <span className="text-xs text-secondary-700">Traffic jam</span>
          </div>
          <div className="mt-2 text-xs text-secondary-600">
            Live traffic data from TomTom
          </div>
        </div>
      )}
    </div>
  );
};

export default CongestionMap;