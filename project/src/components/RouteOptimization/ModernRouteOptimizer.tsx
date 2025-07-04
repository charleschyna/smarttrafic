import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Truck, Bike, Footprints, Clock, MapPin, X, Search, Loader, AlertTriangle, TrendingUp, Route as RouteIcon, Zap, Brain, Star
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
  distance: number;
  duration: number;
  instructions: string[];
  type: 'optimal' | 'alternative';
  traffic?: string;
  score?: number;
}

interface OptimizedRoutes {
  mainRoute: Route;
  alternativeRoutes: Route[];
  summary: string;
  aiSummary: string;
  trafficConditions?: string;
}

interface MapboxFeature {
  place_name: string;
  center: [number, number];
  place_type: string[];
  properties: {
    category?: string;
  };
  category?: string;
  relevance_score?: number;
  text?: string;
}

// Mapbox API key from environment variables (Vite)
const MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Debug function to check if API key is set
const checkApiKey = () => {
  console.log('🔧 Debug: Checking API key...');
  console.log('🔧 Debug: MAPBOX_API_KEY value:', MAPBOX_API_KEY ? `${MAPBOX_API_KEY.substring(0, 10)}...` : 'undefined');
  console.log('🔧 Debug: Environment variables:', {
    VITE_MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? `${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN.substring(0, 10)}...` : 'undefined'
  });
  
  if (!MAPBOX_API_KEY) {
    console.error('❌ Mapbox API key not found! Please add VITE_MAPBOX_ACCESS_TOKEN to your .env file');
    console.error('Example .env entry: VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here');
    console.error('Current .env variables:', Object.keys(import.meta.env));
    return false;
  }
  console.log('✅ Mapbox API key loaded successfully');
  return true;
};

// Popular Kenya locations database for fallback
const KENYA_LANDMARKS = {
  // Universities & Education
  'jkuat': { name: 'Jomo Kenyatta University of Agriculture and Technology (JKUAT)', coordinates: [-1.0955, 37.0142], category: '🎓 University' },
  'uon': { name: 'University of Nairobi', coordinates: [-1.2794, 36.8155], category: '🎓 University' },
  'strathmore': { name: 'Strathmore University', coordinates: [-1.3107, 36.8108], category: '🎓 University' },
  'ku': { name: 'Kenyatta University', coordinates: [-1.1747, 36.9338], category: '🎓 University' },
  'mku': { name: 'Mount Kenya University', coordinates: [-0.3031, 37.6503], category: '🎓 University' },
  'usiu': { name: 'United States International University (USIU)', coordinates: [-1.2326, 36.8815], category: '🎓 University' },
  'daystar': { name: 'Daystar University', coordinates: [-1.0531, 36.7820], category: '🎓 University' },
  
  // Hospitals & Medical
  'knh': { name: 'Kenyatta National Hospital', coordinates: [-1.3013, 36.8073], category: '🏥 Hospital' },
  'aga khan': { name: 'Aga Khan University Hospital', coordinates: [-1.2775, 36.8018], category: '🏥 Hospital' },
  'mp shah': { name: 'MP Shah Hospital', coordinates: [-1.2764, 36.8064], category: '🏥 Hospital' },
  'nairobi hospital': { name: 'Nairobi Hospital', coordinates: [-1.2926, 36.8115], category: '🏥 Hospital' },
  'karen hospital': { name: 'Karen Hospital', coordinates: [-1.3190, 36.7017], category: '🏥 Hospital' },
  'gertrudes': { name: 'Gertrudes Children Hospital', coordinates: [-1.2762, 36.8024], category: '🏥 Hospital' },
  
  // Airports
  'jkia': { name: 'Jomo Kenyatta International Airport', coordinates: [-1.3192, 36.9278], category: '✈️ Airport' },
  'wilson': { name: 'Wilson Airport', coordinates: [-1.3218, 36.8148], category: '✈️ Airport' },
  
  // Shopping Malls
  'westgate': { name: 'Westgate Shopping Mall', coordinates: [-1.2672, 36.8062], category: '🏬 Mall' },
  'sarit': { name: 'Sarit Centre', coordinates: [-1.2637, 36.7879], category: '🏬 Mall' },
  'village market': { name: 'Village Market', coordinates: [-1.2520, 36.8015], category: '🏬 Mall' },
  'two rivers': { name: 'Two Rivers Mall', coordinates: [-1.2219, 36.8819], category: '🏬 Mall' },
  'the junction': { name: 'The Junction Mall', coordinates: [-1.2368, 36.8062], category: '🏬 Mall' },
  'garden city': { name: 'Garden City Mall', coordinates: [-1.2408, 36.7834], category: '🏬 Mall' },
  'galleria': { name: 'Galleria Shopping Mall', coordinates: [-1.2520, 36.8015], category: '🏬 Mall' },
  
  // Churches & Religious Places
  'nairobi chapel': { name: 'Nairobi Chapel', coordinates: [-1.2921, 36.7820], category: '⛪ Church' },
  'all saints cathedral': { name: 'All Saints Cathedral', coordinates: [-1.2869, 36.8172], category: '⛪ Cathedral' },
  'st andrews': { name: 'St Andrews Presbyterian Church', coordinates: [-1.2869, 36.8172], category: '⛪ Church' },
  'holy family cathedral': { name: 'Holy Family Cathedral', coordinates: [-1.2869, 36.8172], category: '⛪ Cathedral' },
  'citam': { name: 'Christ Is The Answer Ministries (CITAM)', coordinates: [-1.2521, 36.7879], category: '⛪ Church' },
  'pentecost church': { name: 'Pentecost Church', coordinates: [-1.2869, 36.8172], category: '⛪ Church' },
  'mavuno church': { name: 'Mavuno Church', coordinates: [-1.2637, 36.7879], category: '⛪ Church' },
  'karen country club': { name: 'Karen Country Club Chapel', coordinates: [-1.3190, 36.7017], category: '⛪ Chapel' },
  'st marks': { name: 'St Marks Catholic Church', coordinates: [-1.2869, 36.8172], category: '⛪ Church' },
  'st pauls': { name: 'St Pauls Catholic Church', coordinates: [-1.2869, 36.8172], category: '⛪ Church' },
  'jamia mosque': { name: 'Jamia Mosque', coordinates: [-1.2869, 36.8219], category: '🕌 Mosque' },
  'south c mosque': { name: 'South C Mosque', coordinates: [-1.3139, 36.8297], category: '🕌 Mosque' },
  'eastleigh mosque': { name: 'Eastleigh Grand Mosque', coordinates: [-1.2637, 36.8616], category: '🕌 Mosque' },
  'hindu temple': { name: 'Nairobi Hindu Temple', coordinates: [-1.2869, 36.8172], category: '🛕 Temple' },
  
  // Government & Offices
  'kicc': { name: 'Kenyatta International Conference Centre', coordinates: [-1.2921, 36.8219], category: '🏢 Conference Centre' },
  'times tower': { name: 'Times Tower', coordinates: [-1.2921, 36.8219], category: '🏢 Office Building' },
  'anniversary towers': { name: 'Anniversary Towers', coordinates: [-1.2869, 36.8172], category: '🏢 Office Building' },
  'teleposta towers': { name: 'Teleposta Towers', coordinates: [-1.2869, 36.8172], category: '🏢 Office Building' },
  'harambee house': { name: 'Harambee House', coordinates: [-1.2869, 36.8172], category: '🏛️ Government' },
  'treasury building': { name: 'Treasury Building', coordinates: [-1.2869, 36.8172], category: '🏛️ Government' },
  
  // Parks & Recreation
  'uhuru park': { name: 'Uhuru Park', coordinates: [-1.2849, 36.8172], category: '🌳 Park' },
  'central park': { name: 'Central Park', coordinates: [-1.2849, 36.8172], category: '🌳 Park' },
  'jeevanjee gardens': { name: 'Jeevanjee Gardens', coordinates: [-1.2869, 36.8219], category: '🌳 Park' },
  'karura forest': { name: 'Karura Forest', coordinates: [-1.2408, 36.8406], category: '🌲 Forest' },
  'city park': { name: 'City Park', coordinates: [-1.2637, 36.8344], category: '🌳 Park' },
  
  // Restaurants & Entertainment
  'carnivore': { name: 'Carnivore Restaurant', coordinates: [-1.3679, 36.8521], category: '🍽️ Restaurant' },
  'tamambo': { name: 'Tamambo Karen Blixen', coordinates: [-1.3190, 36.7017], category: '🍽️ Restaurant' },
  'java house': { name: 'Java House', coordinates: [-1.2869, 36.8172], category: '☕ Cafe' },
  'artcaffe': { name: 'ArtCaffe', coordinates: [-1.2869, 36.8172], category: '☕ Cafe' },
  
  // Sports & Stadiums
  'nyayo stadium': { name: 'Nyayo National Stadium', coordinates: [-1.3139, 36.8297], category: '🏟️ Stadium' },
  'kasarani': { name: 'Moi International Sports Centre Kasarani', coordinates: [-1.2169, 36.8906], category: '🏟️ Stadium' },
  'city stadium': { name: 'City Stadium', coordinates: [-1.2869, 36.8297], category: '🏟️ Stadium' },
  
  // Hotels
  'serena hotel': { name: 'Nairobi Serena Hotel', coordinates: [-1.2869, 36.8172], category: '🏨 Hotel' },
  'hilton': { name: 'Hilton Nairobi', coordinates: [-1.2869, 36.8172], category: '🏨 Hotel' },
  'intercontinental': { name: 'InterContinental Nairobi', coordinates: [-1.2869, 36.8172], category: '🏨 Hotel' },
  'safari park': { name: 'Safari Park Hotel', coordinates: [-1.2408, 36.8815], category: '🏨 Hotel' },
  'ole sereni': { name: 'Ole Sereni Hotel', coordinates: [-1.3192, 36.9278], category: '🏨 Hotel' },
  
  // Markets
  'city market': { name: 'City Market', coordinates: [-1.2869, 36.8219], category: '🏪 Market' },
  'maasai market': { name: 'Maasai Market', coordinates: [-1.2869, 36.8172], category: '🏪 Market' },
  'wakulima market': { name: 'Wakulima Market', coordinates: [-1.2869, 36.8344], category: '🏪 Market' },
};

// --- Mapbox API Functions ---
const searchLocationMapbox = async (query: string): Promise<MapboxFeature[]> => {
  if (!query || query.length < 2) return [];
  
  // Check if API key is properly set
  if (!checkApiKey()) {
    console.error('Mapbox API key is not configured. Please add your API key.');
    return [];
  }
  
  console.log('🔍 Searching for:', query); // Debug log
  
  // Check for popular Kenya landmarks first
  const landmark = checkKenyaLandmarks(query);
  if (landmark.length > 0) {
    console.log('📍 Found Kenya landmark:', landmark);
    return landmark;
  }
  
  try {
    // Primary search with all location types
    const primaryResponse = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
      `access_token=${MAPBOX_API_KEY}&` +
      `country=KE&` +
      `types=country,region,postcode,district,place,locality,neighborhood,address,poi&` +
      `limit=10&` +
      `autocomplete=true&` +
      `bbox=33.908859,-4.676667,41.899078,4.62&` + // Kenya bounding box
      `proximity=36.8219,-1.2921` // Nairobi coordinates for relevance
    );
    
    // Secondary broader search without country restriction for better coverage
    const secondaryResponse = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query + ' Kenya')}.json?` +
      `access_token=${MAPBOX_API_KEY}&` +
      `types=poi,place,locality,neighborhood,address&` +
      `limit=10&` +
      `autocomplete=true&` +
      `bbox=33.908859,-4.676667,41.899078,4.62&` + // Kenya bounding box
      `proximity=36.8219,-1.2921` // Nairobi coordinates for relevance
    );
    
    let allFeatures: any[] = [];
    
    // Process primary response
    if (primaryResponse.ok) {
      const primaryData = await primaryResponse.json();
      allFeatures = [...(primaryData.features || [])];
    }
    
    // Process secondary response and merge unique results
    if (secondaryResponse.ok) {
      const secondaryData = await secondaryResponse.json();
      const secondaryFeatures = secondaryData.features || [];
      
      // Add unique features from secondary search
      secondaryFeatures.forEach((feature: any) => {
        const exists = allFeatures.some(existing => 
          existing.place_name === feature.place_name ||
          (existing.center[0] === feature.center[0] && existing.center[1] === feature.center[1])
        );
        if (!exists) {
          allFeatures.push(feature);
        }
      });
    }
    
    // If no results, try one more broader search
    if (allFeatures.length === 0) {
      const broadResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_API_KEY}&` +
        `limit=15&` +
        `autocomplete=true&` +
        `bbox=33.908859,-4.676667,41.899078,4.62&` + // Kenya bounding box
        `proximity=36.8219,-1.2921` // Nairobi coordinates for relevance
      );
      
      if (broadResponse.ok) {
        const broadData = await broadResponse.json();
        allFeatures = (broadData.features || []).filter((feature: any) => {
          // Filter to keep only Kenya-related results
          return feature.place_name.toLowerCase().includes('kenya') ||
                 feature.context?.some((ctx: any) => ctx.text?.toLowerCase().includes('kenya')) ||
                 (feature.center[0] >= 33.908859 && feature.center[0] <= 41.899078 &&
                  feature.center[1] >= -4.676667 && feature.center[1] <= 4.62);
        });
      }
    }
    
    console.log('📍 Search results:', allFeatures?.length || 0, 'locations found'); // Debug log
    
    // Filter and enhance results for better Kenya-specific suggestions
    const features = allFeatures.map((feature: any) => {
      // Add category information for better UI display
      const placeType = feature.place_type[0];
      let category = '';
      
      switch (placeType) {
        case 'poi':
          category = getPoiCategory(feature.properties?.category || feature.text || '', feature.place_name);
          break;
        case 'address':
          category = '📍 Address';
          break;
        case 'place':
        case 'locality':
          category = '🏘️ City/Town';
          break;
        case 'neighborhood':
          category = '🏙️ Area';
          break;
        case 'district':
          category = '📍 District';
          break;
        case 'region':
          category = '🗺️ County';
          break;
        default:
          category = '📍 Location';
      }
      
      return {
        ...feature,
        category,
        relevance_score: feature.relevance || 0
      };
    });
    
    // Sort by relevance and return
    return features.sort((a: any, b: any) => b.relevance_score - a.relevance_score);
    
  } catch (error) {
    console.error('Mapbox search failed:', error);
    return [];
  }
};
// Helper function to categorize POIs
const getPoiCategory = (category: string, placeName: string = ''): string => {
  const categoryMap: { [key: string]: string } = {
    'school': '🏫 School',
    'university': '🎓 University',
    'college': '🎓 College',
    'academy': '🏫 Academy',
    'institute': '🏫 Institute',
    'hospital': '🏥 Hospital',
    'clinic': '🏥 Clinic',
    'pharmacy': '💊 Pharmacy',
    'bank': '🏦 Bank',
    'atm': '🏧 ATM',
    'restaurant': '🍽️ Restaurant',
    'cafe': '☕ Cafe',
    'hotel': '🏨 Hotel',
    'lodge': '🏨 Lodge',
    'fuel': '⛽ Fuel Station',
    'petrol': '⛽ Petrol Station',
    'gas': '⛽ Gas Station',
    'shopping': '🛍️ Shopping',
    'mall': '🏬 Mall',
    'supermarket': '🛒 Supermarket',
    'market': '🏪 Market',
    'airport': '✈️ Airport',
    'bus': '🚌 Bus Station',
    'train': '🚂 Train Station',
    'matatu': '🚐 Matatu Stage',
    'government': '🏛️ Government',
    'ministry': '🏛️ Ministry',
    'office': '🏢 Office',
    'police': '👮 Police',
    'fire': '🚒 Fire Station',
    'church': '⛪ Church',
    'cathedral': '⛪ Cathedral',
    'mosque': '🕌 Mosque',
    'temple': '🛕 Temple',
    'park': '🌳 Park',
    'garden': '🌺 Garden',
    'museum': '🏛️ Museum',
    'stadium': '🏟️ Stadium',
    'cinema': '🎬 Cinema',
    'theatre': '🎭 Theatre',
    'gym': '💪 Gym',
    'fitness': '💪 Fitness',
    'library': '📚 Library',
    'post': '📮 Post Office',
    'court': '⚖️ Court',
    'embassy': '🏛️ Embassy'
  };
  
  const lowerCategory = category.toLowerCase();
  const lowerPlaceName = placeName.toLowerCase();
  
  // Check both category and place name for matches
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key) || lowerPlaceName.includes(key)) {
      return value;
    }
  }
  
  // Special cases for universities and schools based on common naming patterns
  if (lowerPlaceName.includes('university') || lowerPlaceName.includes('varsity')) {
    return '🎓 University';
  }
  if (lowerPlaceName.includes('college') || lowerPlaceName.includes('academy')) {
    return '🎓 College';
  }
  if (lowerPlaceName.includes('school') || lowerPlaceName.includes('primary') || lowerPlaceName.includes('secondary')) {
    return '🏫 School';
  }
  if (lowerPlaceName.includes('hospital') || lowerPlaceName.includes('medical')) {
    return '🏥 Hospital';
  }
  
  return '📍 Place of Interest';
};

// Check for popular Kenya landmarks
const checkKenyaLandmarks = (query: string): MapboxFeature[] => {
  const lowerQuery = query.toLowerCase().trim();
  const results: MapboxFeature[] = [];
  
  for (const [key, landmark] of Object.entries(KENYA_LANDMARKS)) {
    if (key.includes(lowerQuery) || landmark.name.toLowerCase().includes(lowerQuery)) {
      results.push({
        place_name: landmark.name,
        center: [landmark.coordinates[1], landmark.coordinates[0]] as [number, number], // lng, lat for Mapbox
        place_type: ['poi'],
        properties: { category: 'landmark' },
        category: landmark.category,
        relevance_score: 1.0,
        text: landmark.name.split(' ')[0]
      });
    }
  }
  
  return results.slice(0, 5); // Return top 5 matches
};

const calculateMapboxRoute = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  profile: string = 'driving-traffic'
): Promise<Route[]> => {
  try {
    console.log('🔧 Debug: Calculating route from', origin, 'to', destination, 'with profile', profile);
    
    // Get optimal route with traffic - Mapbox expects longitude,latitude format
    // Note: overview=full is required when using congestion annotations
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?alternatives=true&geometries=geojson&steps=true&overview=full&access_token=${MAPBOX_API_KEY}&annotations=duration,distance,congestion`;
    console.log('🔧 Debug: API URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('🔧 Debug: Mapbox API Error Response:', response.status, errorData);
      throw new Error(`Mapbox Directions API error: ${response.status} - ${errorData}`);
    }
    const data = await response.json();
    console.log('🔧 Debug: Mapbox route data:', data);
    
    if (!data.routes || data.routes.length === 0) return [];
    
    const routes: Route[] = data.routes.map((route: any, index: number) => {
      const coordinates: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
      
      return {
        coordinates,
        distance: route.distance,
        duration: route.duration,
        instructions: route.legs[0]?.steps?.map((step: any) => step.maneuver.instruction) || [],
        type: index === 0 ? 'optimal' : 'alternative',
        traffic: getTrafficCondition(route.duration, route.distance),
        score: calculateRouteScore(route.distance, route.duration)
      };
    });
    
    return routes;
  } catch (error) {
    console.error('Mapbox route calculation failed:', error);
    return [];
  }
};

const getTrafficCondition = (duration: number, distance: number): string => {
  const speed = (distance / 1000) / (duration / 3600); // km/h
  if (speed > 50) return 'Light';
  if (speed > 30) return 'Moderate';
  return 'Heavy';
};

const calculateRouteScore = (distance: number, duration: number): number => {
  // AI-like scoring based on distance, time, and efficiency
  const efficiency = distance / duration;
  return Math.round((efficiency * 100) + Math.random() * 10);
};

// --- AI Summary Generation ---
const generateAISummary = async (routes: Route[], origin: Location, destination: Location): Promise<string> => {
  // Placeholder for AI service integration
  // Replace this with your actual AI API call (OpenAI, Claude, etc.)
  const mainRoute = routes[0];
  const distance = (mainRoute.distance / 1000).toFixed(1);
  const duration = Math.round(mainRoute.duration / 60);
  const traffic = mainRoute.traffic || 'Unknown';
  
  // Simulated AI summary - replace with actual AI service
  const summaries = [
    `🚗 Optimal route from ${origin.name} to ${destination.name} covers ${distance}km in ${duration} minutes. Current traffic is ${traffic.toLowerCase()}. This route is recommended for its balance of time and distance efficiency.`,
    `🎯 Best path identified: ${distance}km journey taking approximately ${duration} minutes. Traffic conditions are ${traffic.toLowerCase()}. The route avoids major congestion points and provides smooth travel.`,
    `📍 Recommended route: ${distance}km distance with ${duration}-minute travel time. Traffic status: ${traffic.toLowerCase()}. This path optimizes for current conditions and minimal delays.`
  ];
  
  return summaries[Math.floor(Math.random() * summaries.length)];
};

// --- UI Components ---
const LocationInput = ({ value, onChange, onClear, placeholder, results, onSelect, onUseCurrentLocation, isLoading }: any) => (
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
          {(results.length > 0) && (
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
          {results.map((result: MapboxFeature, index: number) => (
            <button
              key={index}
              onClick={() => {
                const [lng, lat] = result.center;
                onSelect({ name: result.place_name, position: { lat, lng } });
              }}
              className="w-full px-4 py-3 text-left text-gray-700 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {result.place_type.includes('poi') ? (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  ) : result.place_type.includes('address') ? (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-gray-900 truncate group-hover:text-blue-700">
                    {result.text || result.place_name.split(',')[0]}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {result.category && (
                      <span className="inline-block mr-2 px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                        {result.category}
                      </span>
                    )}
                    {result.place_name}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const RouteMap = ({ routes, origin, destination }: any) => {
  const map = useMap();
  
  useEffect(() => {
    if (routes && routes.length > 0) {
      const allCoords = routes.flatMap((r: Route) => r.coordinates);
      if (allCoords.length > 0) {
        map.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50] });
      }
    } else if (origin && destination) {
      map.fitBounds(L.latLngBounds([origin.position, destination.position]), { padding: [50, 50] });
    }
  }, [routes, origin, destination, map]);

  return (
    <>
      {routes && routes.map((route: Route, index: number) => (
        <Polyline
          key={index}
          positions={route.coordinates}
          color={route.type === 'optimal' ? '#10b981' : '#6b7280'}
          weight={route.type === 'optimal' ? 6 : 4}
          opacity={route.type === 'optimal' ? 1 : 0.7}
          dashArray={route.type === 'alternative' ? '10, 5' : undefined}
        />
      ))}
      {origin && (
        <Marker position={origin.position}>
          <Popup>📍 Start: {origin.name}</Popup>
        </Marker>
      )}
      {destination && (
        <Marker position={destination.position}>
          <Popup>🎯 Destination: {destination.name}</Popup>
        </Marker>
      )}
    </>
  );
};

// --- Main Component ---
const ModernRouteOptimizer: React.FC = () => {
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originResults, setOriginResults] = useState<MapboxFeature[]>([]);
  const [destinationResults, setDestinationResults] = useState<MapboxFeature[]>([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [destinationLoading, setDestinationLoading] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoutes | null>(null);
  const [vehicleType, setVehicleType] = useState('car');

  const handleSearch = useCallback(async (query: string, isOrigin: boolean) => {
    console.log(`🔧 Debug: handleSearch called with query="${query}", isOrigin=${isOrigin}`);
    if (isOrigin) setOriginLoading(true); else setDestinationLoading(true);
    try {
      console.log('🔧 Debug: Calling searchLocationMapbox...');
      const results = await searchLocationMapbox(query);
      console.log(`🔧 Debug: Got ${results.length} results:`, results);
      if (isOrigin) {
        setOriginResults(results);
        console.log('🔧 Debug: Set origin results');
      } else {
        setDestinationResults(results);
        console.log('🔧 Debug: Set destination results');
      }
    } catch (error) {
      console.error('🔧 Debug: Error in handleSearch:', error);
    } finally {
      if (isOrigin) setOriginLoading(false); else setDestinationLoading(false);

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
>>>>>>> 1534f86a9eed8545b8419ce093162eb536f6f9d2
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
<<<<<<< HEAD
    console.log(`🔧 Debug: Origin query changed to: "${originQuery}"`);
    const handler = setTimeout(() => {
      if (originQuery && originQuery.length >= 2) {
        console.log(`🔧 Debug: Triggering search for origin: "${originQuery}"`);
        handleSearch(originQuery, true);
      } else {
        console.log('🔧 Debug: Clearing origin results (query too short)');
        setOriginResults([]);
      }
    }, 300); // Faster response for better UX
    return () => clearTimeout(handler);
  }, [originQuery, handleSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (destinationQuery && destinationQuery.length >= 2) handleSearch(destinationQuery, false);
      else setDestinationResults([]);
    }, 300); // Faster response for better UX
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
=======
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
>>>>>>> 1534f86a9eed8545b8419ce093162eb536f6f9d2
    }
  }, [userPreference]);

<<<<<<< HEAD
const handleFindRoute = async () => {
    if (!origin || !destination) {
      setError('Please set both origin and destination to find a route.');
      return;
      setError('Please select a valid start and destination.');
      return;
    }

>>>>>>> 1534f86a9eed8545b8419ce093162eb536f6f9d2
    setIsLoading(true);
    setError(null);
    setRoutes(null);
    setSelectedRouteSummary(null);
    setAiSummary(null);

    try {
<<<<<<< HEAD
      const profileMap = {
        car: 'driving-traffic',
        truck: 'driving',
        bicycle: 'cycling',
        pedestrian: 'walking'
      };
      
      const routes = await calculateMapboxRoute(
        origin.position,
        destination.position,
        profileMap[vehicleType as keyof typeof profileMap]
      );

      if (!routes || routes.length === 0) {
        setError('Could not calculate a route. Please try different locations.');
        return;
      }

      const mainRoute = routes[0];
      const alternativeRoutes = routes.slice(1);
      
      // Generate AI summary
      const aiSummary = await generateAISummary(routes, origin, destination);
      
      setOptimizedRoutes({
        mainRoute,
        alternativeRoutes,
        summary: `Optimal route: ${(mainRoute.distance / 1000).toFixed(1)} km, ${Math.round(mainRoute.duration / 60)} min`,
        aiSummary,
        trafficConditions: mainRoute.traffic
      });

    } catch (err) {
      console.error('Route calculation error:', err);
      setError('Failed to calculate route. Please check your internet connection and try again.');
=======
      const data = await getDirections(
        [{ longitude: startCoords[0], latitude: startCoords[1] }, { longitude: endCoords[0], latitude: endCoords[1] }],
        travelMode
      );

      if (data && data.routes && data.routes.length > 0) {
        // NOTE: selectBestRoute and generateRouteSummary still expect TomTom data.
        // This will be fixed in subsequent steps. For now, we adapt the data as best as possible.
        const bestRouteResult = selectBestRoute(data.routes, userPreference);
        
        if (bestRouteResult) {
          const { route: bestRoute, confidence, index: bestRouteIndex } = bestRouteResult;
          const geoJsonRoutes = toGeoJSON(data.routes, bestRouteIndex);
          setRoutes(geoJsonRoutes);

          setSelectedRouteSummary({
            distance: bestRoute.distance,
            duration: bestRoute.duration,
            confidence: confidence,
            trafficDelay: bestRoute.duration_traffic ? bestRoute.duration_traffic - bestRoute.duration : 0,
          });

          // Mapbox does not provide incidents in the same way, so we generate the summary without them.
          const summaryText = await generateRouteSummary(bestRouteResult, userPreference);
          setAiSummary(summaryText);
        } else {
          setError('Could not determine the best route.');
        }
      } else {
        setError('No routes could be found.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
>>>>>>> 1534f86a9eed8545b8419ce093162eb536f6f9d2
    } finally {
      setIsLoading(false);
    }
  };
<<<<<<< HEAD

  const allRoutes = optimizedRoutes ? [optimizedRoutes.mainRoute, ...optimizedRoutes.alternativeRoutes] : [];

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800">
      {/* Left Panel: Input Fields */}
      <motion.div
        className="w-1/3 max-w-md bg-white p-8 shadow-2xl overflow-y-auto flex flex-col border-r border-gray-200"
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex-grow">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                <RouteIcon className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smart Route
              </h1>
            </div>
            <p className="text-gray-600">AI-powered route optimization</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Starting Point</label>
              <LocationInput
                value={originQuery}
                onChange={setOriginQuery}
                onClear={() => { setOrigin(null); setOriginQuery(''); }}
                placeholder="Enter starting location..."
                results={originResults}
                onSelect={(loc: Location) => handleSelectLocation(loc, true)}
                isLoading={originLoading}
                onUseCurrentLocation={() => {/* Implement geolocation */}}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🎯 Destination</label>
              <LocationInput
                value={destinationQuery}
                onChange={setDestinationQuery}
                onClear={() => { setDestination(null); setDestinationQuery(''); }}
                placeholder="Enter destination..."
                results={destinationResults}
                onSelect={(loc: Location) => handleSelectLocation(loc, false)}
                isLoading={destinationLoading}
              />
            </div>
          </div>

          <div className="my-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">🚗 Vehicle Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'car', icon: Car, label: 'Car' },
                { key: 'truck', icon: Truck, label: 'Truck' },
                { key: 'bicycle', icon: Bike, label: 'Bike' },
                { key: 'pedestrian', icon: Footprints, label: 'Walk' }
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setVehicleType(key)}
                  className={`p-4 rounded-xl transition-all duration-300 flex flex-col items-center gap-2 ${
                    vehicleType === key
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleFindRoute}
            disabled={isLoading || !origin || !destination}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-blue-700 transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-105 shadow-lg"
          >
            {isLoading ? (
              <><Loader className="animate-spin" size={20} />Optimizing Route...</>
            ) : (
              <><Zap size={20} />Find Optimal Route</>
            )}
          </button>
        </div>

        {/* Route Details & AI Summary */}
        <AnimatePresence>
          {optimizedRoutes && (
            <motion.div
              className="mt-8 pt-6 border-t border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-green-700">
                    <TrendingUp size={20} />Route Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-bold text-gray-900">
                        {(optimizedRoutes.mainRoute.distance / 1000).toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-bold text-gray-900">
                        {Math.round(optimizedRoutes.mainRoute.duration / 60)} min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Traffic:</span>
                      <span className={`font-bold ${
                        optimizedRoutes.trafficConditions === 'Light' ? 'text-green-600' :
                        optimizedRoutes.trafficConditions === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {optimizedRoutes.trafficConditions}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-purple-700">
                    <Brain size={20} />AI Insights
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {optimizedRoutes.aiSummary}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Right Panel: Map */}
      <div className="flex-grow h-full relative">
        <MapContainer
          center={[-1.286389, 36.817223]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RouteMap routes={allRoutes} origin={origin} destination={destination} />
        </MapContainer>
        
        {/* Route Legend */}
        {optimizedRoutes && (
          <motion.div
            className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow-lg border border-gray-200 z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h4 className="font-bold mb-2 text-gray-800">Route Legend</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500 rounded"></div>
                <span>Optimal Route</span>
              </div>
              {optimizedRoutes.alternativeRoutes.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-gray-500 rounded" style={{borderStyle: 'dashed'}}></div>
                  <span>Alternative Routes</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white p-4 rounded-xl shadow-lg font-semibold z-50"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} />
              {error}
            </div>
          </motion.div>
=======

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
>>>>>>> 1534f86a9eed8545b8419ce093162eb536f6f9d2
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
