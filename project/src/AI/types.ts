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
 * Represents a single data point for the area comparison chart.
 */
export interface AreaComparisonData {
  name: string;
  congestion: number;
}

/**
 * Represents a single data point for a congestion heatmap.
 */
export interface HeatmapDataPoint {
  area: string;
  congestion: number; // Percentage
  trend: 'up' | 'down' | 'stable';
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
 * Represents a traffic incident on a route.
 */
export interface TrafficIncident {
  summary: string; // e.g., 'CONSTRUCTION', 'JAM'
  details: string; // TomTom-specific incident ID
  position: { lat: number; lng: number };
}

/**
 * Represents the detailed properties of a single calculated route leg.
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
  summary: string;
  aiSummary: string;
  mainRoute: RouteLeg;
  alternativeRoutes: RouteLeg[];
  incidents: TrafficIncident[];
}

/**
 * Defines the supported vehicle types for route optimization, matching TomTom's API.
 */
export type VehicleType = 'car' | 'truck' | 'taxi' | 'bus' | 'van' | 'motorcycle' | 'bicycle' | 'pedestrian';