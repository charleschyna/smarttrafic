import React, { useState, useEffect, useRef, useCallback } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import { services, FuzzySearchOptions } from '@tomtom-international/web-sdk-services';
import type { LngLatLike, Map } from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader, Zap, BrainCircuit } from 'lucide-react';
import { getOptimizedRoute } from '../../AI/services';
import type { Route } from '../../AI/types';

// --- Type Definitions ---
interface SearchResult {
    type: string;
    id: string;
    score: number;
    address: { freeformAddress: string };
    position: { lat: number; lon: number };
}

const VITE_TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;

// --- Utility Functions ---
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
        new Promise(resolve => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => resolve(func(...args)), waitFor);
        });
};

// --- Main Component ---
const RouteOptimizer: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<Map | null>(null);
    const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);

    const [origin, setOrigin] = useState<[number, number] | null>(null);
    const [destination, setDestination] = useState<[number, number] | null>(null);
    const [originQuery, setOriginQuery] = useState('');
    const [destinationQuery, setDestinationQuery] = useState('');
    const [originResults, setOriginResults] = useState<SearchResult[]>([]);
    const [destinationResults, setDestinationResults] = useState<SearchResult[]>([]);
    const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
    const [isSearchingDestination, setIsSearchingDestination] = useState(false);

    const [originMarker, setOriginMarker] = useState<tt.Marker | null>(null);
    const [destinationMarker, setDestinationMarker] = useState<tt.Marker | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [routes, setRoutes] = useState<Route[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);

    // Effect to get user's initial location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setInitialCenter([longitude, latitude]);
                },
                () => {
                    setInitialCenter([36.8219, -1.2921]); // Fallback to Nairobi
                }
            );
        } else {
            setInitialCenter([36.8219, -1.2921]); // Fallback for no geolocation support
        }
    }, []);

    // Effect to initialize the map
    useEffect(() => {
        if (!mapContainer.current || !initialCenter || !VITE_TOMTOM_API_KEY) return;

        const mapInstance = tt.map({
            key: VITE_TOMTOM_API_KEY,
            container: mapContainer.current,
            center: initialCenter,
            zoom: 13,
            style: 'tomtom://vector/s1/main',
        });

        mapInstance.addControl(new tt.FullscreenControl());
        mapInstance.addControl(new tt.NavigationControl());
        setMap(mapInstance);

        return () => mapInstance.remove();
    }, [initialCenter]);

    // Debounced search handler
    const handleSearch = async (query: string, type: 'origin' | 'destination') => {
        if (query.length < 3 || !VITE_TOMTOM_API_KEY) {
            type === 'origin' ? setOriginResults([]) : setDestinationResults([]);
            return;
        }

        try {
            const searchOptions: FuzzySearchOptions = {
                key: VITE_TOMTOM_API_KEY,
                query: query,
                center: map?.getCenter().toArray() as LngLatLike,
                countrySet: 'KE', // Focus on Kenya
            };
            const response = await services.fuzzySearch(searchOptions);
            if (type === 'origin') {
                setOriginResults(response.results);
            } else {
                setDestinationResults(response.results);
            }
        } catch (error) {
            console.error('Fuzzy search failed:', error);
        }
    };

    const debouncedSearch = useCallback(debounce(handleSearch, 300), [map]);

    // Function to handle location selection from search results
    const selectLocation = (location: SearchResult, type: 'origin' | 'destination') => {
        const position: [number, number] = [location.position.lon, location.position.lat];

        const updateMarker = (marker: tt.Marker | null, setter: React.Dispatch<React.SetStateAction<tt.Marker | null>>, markerColor?: string) => {
            if (marker) {
                marker.setLngLat(position);
            } else {
                const newMarker = new tt.Marker({ color: markerColor, draggable: true })
                    .setLngLat(position)
                    .addTo(map!);
                newMarker.on('dragend', () => {
                    const newPos = newMarker.getLngLat();
                    const newCoords: [number, number] = [newPos.lng, newPos.lat];
                    if (type === 'origin') setOrigin(newCoords);
                    else setDestination(newCoords);
                });
                setter(newMarker);
            }
        };

        if (type === 'origin') {
            setOrigin(position);
            setOriginQuery(location.address.freeformAddress);
            setOriginResults([]);
            setIsSearchingOrigin(false);
            updateMarker(originMarker, setOriginMarker);
        } else {
            setDestination(position);
            setDestinationQuery(location.address.freeformAddress);
            setDestinationResults([]);
            setIsSearchingDestination(false);
            updateMarker(destinationMarker, setDestinationMarker, '#00c853'); // Green for destination
        }

        if (origin && destination) {
            map?.fitBounds([origin, position], { padding: 100 });
        } else {
            map?.flyTo({ center: position, zoom: 14 });
        }
    };

    const useCurrentLocation = (type: 'origin' | 'destination') => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const pos: [number, number] = [longitude, latitude];

                try {
                    const response = await services.reverseGeocode({
                        key: VITE_TOMTOM_API_KEY,
                        position: pos
                    });
                    const address = response.addresses[0]?.address.freeformAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    selectLocation({ type: 'Point Address', id: '', score: 0, address: { freeformAddress: address }, position: { lat: latitude, lon: longitude } }, type);
                } catch (error) {
                    console.error('Reverse geocoding failed:', error);
                    selectLocation({ type: 'Point Address', id: '', score: 0, address: { freeformAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }, position: { lat: latitude, lon: longitude } }, type);
                }
            });
        }
    };

    const calculateRoute = async () => {
        if (!origin || !destination) {
            alert('Please select both origin and destination.');
            return;
        }

        setIsLoading(true);
        setAiSummary('');
        setRoutes([]);
        setSelectedRouteIndex(null);

        // Clear previous routes from the map
        if (map) {
            routes.forEach((_, index) => {
                if (map.getLayer(`route-outline-${index}`)) map.removeLayer(`route-outline-${index}`);
                if (map.getSource(`route-outline-${index}`)) map.removeSource(`route-outline-${index}`);
                if (map.getLayer(`route-${index}`)) map.removeLayer(`route-${index}`);
                if (map.getSource(`route-${index}`)) map.removeSource(`route-${index}`);
            });
        }

        try {
            const aiResponse = await getOptimizedRoute(origin, destination);
            setAiSummary(aiResponse.summary);
            setRoutes(aiResponse.routes);
            setSelectedRouteIndex(0);

            aiResponse.routes.forEach((route, index) => {
                if (!map) return;
                const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: route.points.map(p => [p.longitude, p.latitude])
                    }
                };

                map.addSource(`route-${index}`, { type: 'geojson', data: geojson });

                map.addLayer({
                    id: `route-outline-${index}`,
                    type: 'line',
                    source: `route-${index}`,
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': index === 0 ? '#ffffff' : '#a0a0a0', 'line-width': 8, 'line-opacity': 0.5 }
                });

                map.addLayer({
                    id: `route-${index}`,
                    type: 'line',
                    source: `route-${index}`,
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': index === 0 ? '#0d6efd' : '#808080', 'line-width': 5 }
                });
            });

            if (map && aiResponse.routes.length > 0) {
                const bounds = new tt.LngLatBounds();
                aiResponse.routes.forEach(route => route.points.forEach(p => bounds.extend([p.longitude, p.latitude])));
                map.fitBounds(bounds, { padding: 100, duration: 1000 });
            }
        } catch (error) {
            console.error('Failed to get optimized route:', error);
            alert('Failed to calculate route. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRouteSelection = (index: number) => {
        setSelectedRouteIndex(index);
        if (!map) return;

        routes.forEach((_, i) => {
            map.setPaintProperty(`route-outline-${i}`, 'line-color', i === index ? '#ffffff' : '#a0a0a0');
            map.setPaintProperty(`route-${i}`, 'line-color', i === index ? '#0d6efd' : '#808080');
        });

        map.moveLayer(`route-outline-${index}`);
        map.moveLayer(`route-${index}`);

        const selectedRoute = routes[index];
        const bounds = new tt.LngLatBounds();
        selectedRoute.points.forEach(p => bounds.extend([p.longitude, p.latitude]));
        map.fitBounds(bounds, { padding: 120, duration: 500 });
    };

    const handleRouteHover = (index: number | null) => {
        if (map) {
            routes.forEach((_, i) => {
                if (i !== selectedRouteIndex) {
                    map.setPaintProperty(`route-${i}`, 'line-width', i === index ? 7 : 5);
                }
            });
        }
    };

    return (
        <div className="relative w-full h-screen font-sans bg-gray-900 text-white">
            <div ref={mapContainer} className="absolute top-0 left-0 w-full h-full" />

            <AnimatePresence>
                <motion.div
                    className="absolute top-4 left-4 z-10"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl p-4 space-y-4 w-96">
                        <h1 className="text-2xl font-bold text-green-400">Smart-Traffic Design Studio</h1>
                        
                        <div className="relative">
                            <div className="flex items-center bg-gray-700 rounded-md pr-2">
                                <input
                                    type="text"
                                    placeholder="Enter origin..."
                                    value={originQuery}
                                    onChange={(e) => { setOriginQuery(e.target.value); debouncedSearch(e.target.value, 'origin'); }}
                                    onFocus={() => setIsSearchingOrigin(true)}
                                    onBlur={() => setTimeout(() => setIsSearchingOrigin(false), 200)}
                                    className="w-full bg-transparent p-3 focus:outline-none"
                                />
                                <button onClick={() => useCurrentLocation('origin')} title="Use current location">
                                    <MapPin className="w-6 h-6 text-green-400 hover:text-green-300 transition-colors" />
                                </button>
                            </div>
                            {isSearchingOrigin && originResults.length > 0 && (
                                <SearchResultsPanel results={originResults} onSelect={(loc) => selectLocation(loc, 'origin')} />
                            )}
                        </div>

                        <div className="relative">
                             <div className="flex items-center bg-gray-700 rounded-md pr-2">
                                <input
                                    type="text"
                                    placeholder="Enter destination..."
                                    value={destinationQuery}
                                    onChange={(e) => { setDestinationQuery(e.target.value); debouncedSearch(e.target.value, 'destination'); }}
                                    onFocus={() => setIsSearchingDestination(true)}
                                    onBlur={() => setTimeout(() => setIsSearchingDestination(false), 200)}
                                    className="w-full bg-transparent p-3 focus:outline-none"
                                />
                                 <button onClick={() => useCurrentLocation('destination')} title="Use current location">
                                    <MapPin className="w-6 h-6 text-green-400 hover:text-green-300 transition-colors" />
                                </button>
                            </div>
                            {isSearchingDestination && destinationResults.length > 0 && (
                                <SearchResultsPanel results={destinationResults} onSelect={(loc) => selectLocation(loc, 'destination')} />
                            )}
                        </div>

                        <button
                            onClick={calculateRoute}
                            disabled={isLoading || !origin || !destination}
                            className="w-full bg-green-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-green-400 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                        >
                            {isLoading ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                    <Loader className="w-6 h-6" />
                                </motion.div>
                            ) : (
                                <><Zap className="w-5 h-5 mr-2" /> Optimize Route</>
                            )}
                        </button>
                    </div>
                </motion.div>

                {(aiSummary || routes.length > 0) && (
                    <motion.div
                        className="absolute bottom-4 right-4 z-10 w-96"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-lg shadow-2xl p-4">
                            <h2 className="text-xl font-semibold text-green-400 mb-3 flex items-center"><BrainCircuit className="w-6 h-6 mr-2" /> AI Route Summary</h2>
                            <p className="text-sm text-gray-300 mb-4">{aiSummary}</p>
                            <div className="space-y-3">
                                {routes.map((route, index) => (
                                    <motion.div
                                        key={index}
                                        className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${selectedRouteIndex === index ? 'bg-green-500/20 border-green-400' : 'bg-gray-700/50 border-transparent hover:border-green-500/50'}`}
                                        onClick={() => handleRouteSelection(index)}
                                        onHoverStart={() => handleRouteHover(index)}
                                        onHoverEnd={() => handleRouteHover(null)}
                                        layout
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold">Route {index + 1}: {route.summary.trafficDelayInSeconds > 60 ? 'Traffic' : 'Clear'}</span>
                                            <span className="text-sm">~{Math.round(route.summary.lengthInMeters / 1000)} km</span>
                                        </div>
                                        <div className="text-xs text-gray-400">Travel Time: {Math.round(route.summary.travelTimeInSeconds / 60)} min</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SearchResultsPanel = ({ results, onSelect }: { results: SearchResult[], onSelect: (location: SearchResult) => void }) => (
    <motion.ul 
        className="absolute z-20 w-full bg-gray-800 rounded-lg shadow-xl mt-2 overflow-hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
    >
        {results.map((result) => (
            <li
                key={result.id}
                onClick={() => onSelect(result)}
                className="p-3 hover:bg-green-500/20 cursor-pointer transition-colors text-sm"
            >
                {result.address.freeformAddress}
            </li>
        ))}
    </motion.ul>
);

export default RouteOptimizer;                <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                        <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                        <input 
                            type="text" 
                            placeholder="Choose starting point..."
                            className="w-full bg-transparent pl-10 pr-4 py-3 text-lg font-semibold focus:outline-none"
                            value={originQuery}
                            onChange={(e) => setOriginQuery(e.target.value)}
                            onFocus={() => setActiveInput('origin')}
                        />
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="relative flex-grow">
                        <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-600" />
                        <input 
                            type="text" 
                            placeholder="Choose destination..."
                            className="w-full bg-transparent pl-10 pr-4 py-3 text-lg font-semibold focus:outline-none"
                            value={destinationQuery}
                            onChange={(e) => setDestinationQuery(e.target.value)}
                            onFocus={() => setActiveInput('destination')}
                        />
                    </div>
                    <button 
                        onClick={handleFindRoute} 
                        disabled={isLoading || !origin || !destination}
                        className="px-6 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {isLoading ? <Loader className="animate-spin" /> : <Wind size={20} />}
                        <span className="hidden md:inline">{isLoading ? 'Searching...' : 'Find Route'}</span>
                    </button>
                </div>
            </motion.div>

            {/* Search Results Panel */}
            <AnimatePresence>
                {activeInput && searchResults.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-4xl bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden"
                    >
                        <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                            {searchResults.map(loc => (
                                <li key={loc.id}>
                                    <button 
                                        onClick={() => handleSelectLocation(loc, activeInput)}
                                        className="w-full text-left px-6 py-3 hover:bg-sky-100 transition-colors"
                                    >
                                        <p className="font-semibold text-slate-800">{loc.address.municipality || loc.address.freeformAddress}</p>
                                        <p className="text-sm text-slate-500">{loc.address.freeformAddress}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Route Briefing Panel */}
            <AnimatePresence>
                {optimizedRoutes && (
                    <motion.div
                        initial={{ y: 300, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 300, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                        className="absolute bottom-0 left-0 right-0 p-4 bg-white/60 backdrop-blur-xl border-t border-white/50"
                        onMouseLeave={() => setHoveredRouteType(null)}
                    >
                        <div className="max-w-7xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-1 p-4 bg-white/50 rounded-xl">
                                    <h3 className="font-bold text-lg mb-2">AI Route Summary</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">{optimizedRoutes.aiSummary}</p>
                                </div>
                                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(['fastest', 'shortest', 'eco'] as RouteType[]).map(type => {
                                        const route = type === 'fastest' ? optimizedRoutes.mainRoute : optimizedRoutes.alternativeRoutes.find(r => r.type === type);
                                        if (!route) return null;
                                        const isSelected = selectedRouteType === type;
                                        return (
                                            <button 
                                                key={type}
                                                onClick={() => setSelectedRouteType(type)}
                                                onMouseEnter={() => setHoveredRouteType(type)}
                                                className={`p-4 rounded-2xl transition-all duration-300 transform ${isSelected ? 'bg-sky-500 text-white shadow-2xl scale-105' : 'bg-white/80 hover:bg-white'}`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className={`text-xl font-bold capitalize ${isSelected ? 'text-white' : 'text-slate-800'}`}>{type}</h4>
                                                    {renderRouteCardIcon(type)}
                                                </div>
                                                <div className={`text-left space-y-1 ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                                                    <p className="flex items-center gap-2"><Clock size={16} /><span className={`font-bold text-2xl ${isSelected ? 'text-white' : 'text-slate-900'}`}>{Math.round(route.travelTimeInSeconds / 60)}</span> min</p>
                                                    <p className="flex items-center gap-2"><ArrowRight size={16} /><span>{(route.distanceInMeters / 1000).toFixed(1)} km</span></p>
                                                    <p className="flex items-center gap-2"><AlertTriangle size={16} /><span>{Math.round(route.trafficDelayInSeconds / 60)} min delay</span></p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RouteOptimizer;