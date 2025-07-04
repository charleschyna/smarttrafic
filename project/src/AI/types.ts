/**
 * Represents a single traffic insight item.
 */
export interface TrafficInsight {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  type: 'congestion' | 'incident' | 'construction' | 'weather' | 'other';
  details: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
}

/**
 * Represents a traffic prediction.
 */
export interface TrafficPrediction {
  level: 'low' | 'medium' | 'high';
  confidence: number;
  details: string;
  location: {
    lat: number;
    lng: number;
  };
}

/**
 * A generic AI response structure that can hold different data types.
 */
export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Represents the aggregated traffic flow data from multiple sample points.
 */
export interface TrafficFlowData {
  currentSpeed: number;
  freeFlowSpeed: number;
  currentTravelTime: number;
  freeFlowTravelTime: number;
  confidence: number;
}

/**
 * Represents a single point in the hourly congestion forecast.
 */
export interface CongestionForecast {
  hour: string;
  congestion: number;
  isForecast?: boolean;
}



/**
 * Represents a single data point for a congestion heatmap.
 */
export interface HeatmapDataPoint {
  area: string;
  congestion: number;
}

/**
 * Represents the complete dataset for the Predictive Analytics page.
 */
export interface PredictiveAnalyticsData {
  heatmaps: {
    oneHour: HeatmapDataPoint[];
    fourHour: HeatmapDataPoint[];
    twentyFourHour: HeatmapDataPoint[];
  };
  trends: CongestionForecast[];
}

/**
 * Represents a single hotspot alert for the V2 analytics page.
 */
export interface HotspotAlert {
  id: string;
  areaName: string;
  severity: 'High' | 'Medium' | 'Low';
  predictedCongestion: number;
  confidence: number;
  details: string;
}

/**
 * Represents a single AI-powered recommendation.
 */
export interface AIRecommendation {
  id: string;
  title: string;
  summary: string;
  priority: 'High' | 'Medium' | 'Low';
  actionableInsights: string[];
}

/**
 * Represents the complete dataset for the V2 Predictive Analytics page.
 */
export interface PredictiveAnalyticsV2Data {
  hotspotAlerts: HotspotAlert[];
  aiRecommendations: AIRecommendation[];
}

/**
 * Represents a single traffic incident for the main dashboard.
 */
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  timestamp: string;
}

/**
 * Represents data for comparing congestion across different areas.
 */
export interface AreaComparison {
  name: string;
  congestion: number;
}

/**
 * Represents the complete dataset for the main dashboard.
 */
export interface DashboardData {
  congestionLevel: number;
  avgTripTime: number;
  activeIncidents: number;
  freeFlowTravelTime: number;
  trends: {
    congestionTrend: 'up' | 'down' | 'stable';
    avgTripTimeTrend: 'up' | 'down' | 'stable';
    activeIncidentsTrend: 'up' | 'down' | 'stable';
  };
  incidents: Incident[];
  congestionForecast: CongestionForecast[];
  areaComparisonData: AreaComparison[];
}

/**
 * =======================================================================
 * Route Optimization Types
 * =======================================================================
 */

/**
 * Represents a single turn-by-turn instruction for a route.
 */
export interface RouteInstruction {
  message: string;
}

/**
 * Represents a route leg from the Mapbox Directions API.
 */
export interface MapboxRouteLeg {
  distance: number; // in meters
  duration: number; // in seconds
  summary: string;
  steps: {
    maneuver: {
      instruction: string;
    };
  }[];
}

/**
 * Represents a raw route object from the Mapbox Directions API.
 */
export interface MapboxRoute {
  distance: number; // in meters
  duration: number; // in seconds
  duration_traffic: number; // in seconds, with current traffic
  geometry: {
    type: 'LineString';
    coordinates: number[][]; // [lng, lat]
  };
  legs: MapboxRouteLeg[];
  weight: number;
  weight_name: string;
  [key: string]: any; // Allow other properties
}

/**
 * Represents a route that has been scored and selected.
 */
export interface ScoredRoute {
  route: MapboxRoute;
  score: number;
  confidence: number;
  leg?: RouteLeg; // Include the processed leg for easier access
  [key: string]: any;
}

/**
 * Represents the detailed properties of a single calculated route leg.
 * This is a processed, app-specific format derived from a MapboxRouteLeg.
 */
export interface RouteLeg {
  distanceInMeters: number;
  travelTimeInSeconds: number;
  trafficDelayInSeconds: number;
  geometry: { lat: number; lng: number }[];
  instructions: RouteInstruction[];
}

/**
 * Represents the complete result for a route optimization query.
 */
export interface OptimizedRoute {
  bestRoute: ScoredRoute;
  summary: string;
  aiSummary: string;
  rawRoutes: MapboxRoute[];
}

/**
 * Defines the supported vehicle types for route optimization.
 */
export type VehicleType = 'car' | 'truck' | 'bicycle' | 'pedestrian';