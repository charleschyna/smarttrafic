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
  lat: number;
  lng: number;
  weight: number;
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
 * Represents a traffic incident on a route, matching the TomTom API structure.
 */
export interface TrafficIncident {
  type: 'Feature';
  properties: {
    id: string;
    iconCategory: string;
    magnitudeOfDelay: number;
    from: string;
    to: string;
    length: number;
    delay: number;
    roadNumbers: string[];
    aci: {
      probabilityOfOccurrence: string;
      numberOfReports: number;
      lastReportTime: string;
    };
  };
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
}

/**
 * Represents a raw route object from the TomTom API, combining all known properties.
 */
export interface TomTomRoute {
  summary: {
    lengthInMeters: number;
    travelTimeInSeconds: number;
    trafficDelayInSeconds: number;
    departureTime: string;
    arrivalTime: string;
    trafficIncidents?: TrafficIncident[];
  };
  legs: {
    points: { latitude: number; longitude: number }[];
    instructions?: { message: string }[];
  }[];
  sections: {
    startPointIndex: number;
    endPointIndex: number;
    sectionType: string;
    simpleCategory?: string;
    effectiveSpeedInKmh?: number;
    trafficDelayInSeconds?: number;
  }[];
  guidance?: {
    instructions: {
      message?: string;
      instruction?: string;
      street?: string;
      turnAngle?: number;
    }[];
  };
  [key: string]: any; // Allow other properties for flexibility
}

/**
 * Represents a route that has been scored and selected.
 */
export interface ScoredRoute {
  route: TomTomRoute;
  score: number;
  confidence: number;
  [key: string]: any; // Allow other properties for flexibility
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