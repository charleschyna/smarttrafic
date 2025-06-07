// Common types for AI responses and requests
export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface TrafficInsight {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  type: 'congestion' | 'incident' | 'construction' | 'weather' | 'other';
  details: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

export interface TrafficPrediction {
  level: 'low' | 'medium' | 'high';
  confidence: number;
  details: string;
  location: {
    lat: number;
    lng: number;
  };
} 