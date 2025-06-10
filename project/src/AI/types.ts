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