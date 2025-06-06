export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface TrafficData {
  id: string;
  location: string;
  congestionLevel: number;
  avgTripTime: number;
  incidents: number;
}

export interface RouteData {
  id: string;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  congestionLevel: number;
}

export interface Insight {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

export interface AreaData {
  id: string;
  name: string;
  congestionLevel: number;
  avgTripTime: number;
}

export interface TimeSeriesData {
  time: string;
  congestion: number;
}

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
}