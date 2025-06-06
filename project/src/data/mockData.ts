import { TrafficData, Insight, AreaData, TimeSeriesData, RouteData, ChartData } from '../types';

export const trafficData: TrafficData = {
  id: '1',
  location: 'Nairobi',
  congestionLevel: 67,
  avgTripTime: 42,
  incidents: 5,
};

export const insights: Insight[] = [
  {
    id: '1',
    message: 'Predicted congestion on Thika Rd at 5 PM',
    severity: 'warning',
    timestamp: '10:15 AM',
  },
  {
    id: '2',
    message: 'Traffic signals optimized at CBD intersections',
    severity: 'info',
    timestamp: '9:30 AM',
  },
  {
    id: '3',
    message: 'Accident reported on Mombasa Rd near SGR terminal',
    severity: 'critical',
    timestamp: '8:45 AM',
  },
  {
    id: '4',
    message: 'Construction on Ngong Rd causing delays',
    severity: 'warning',
    timestamp: '8:20 AM',
  },
];

export const areaData: AreaData[] = [
  { id: '1', name: 'CBD', congestionLevel: 78, avgTripTime: 35 },
  { id: '2', name: 'Westlands', congestionLevel: 65, avgTripTime: 28 },
  { id: '3', name: 'Eastleigh', congestionLevel: 82, avgTripTime: 44 },
  { id: '4', name: 'Karen', congestionLevel: 45, avgTripTime: 22 },
  { id: '5', name: 'Kileleshwa', congestionLevel: 58, avgTripTime: 25 },
];

export const congestionByHour: TimeSeriesData[] = [
  { time: '6 AM', congestion: 35 },
  { time: '7 AM', congestion: 65 },
  { time: '8 AM', congestion: 85 },
  { time: '9 AM', congestion: 75 },
  { time: '10 AM', congestion: 60 },
  { time: '11 AM', congestion: 55 },
  { time: '12 PM', congestion: 58 },
  { time: '1 PM', congestion: 62 },
  { time: '2 PM', congestion: 58 },
  { time: '3 PM', congestion: 60 },
  { time: '4 PM', congestion: 70 },
  { time: '5 PM', congestion: 90 },
  { time: '6 PM', congestion: 80 },
  { time: '7 PM', congestion: 65 },
  { time: '8 PM', congestion: 45 },
];

export const routeData: RouteData[] = [
  {
    id: '1',
    origin: 'Westlands',
    destination: 'CBD',
    distance: '7.2 km',
    duration: '28 min',
    congestionLevel: 65,
  },
  {
    id: '2',
    origin: 'Karen',
    destination: 'Westlands',
    distance: '12.5 km',
    duration: '45 min',
    congestionLevel: 72,
  },
  {
    id: '3',
    origin: 'Eastleigh',
    destination: 'Industrial Area',
    distance: '9.8 km',
    duration: '38 min',
    congestionLevel: 58,
  },
];

export const vehicleTypeData: ChartData[] = [
  { name: 'Private Cars', value: 45, fill: '#2F9E44' },
  { name: 'Matatus', value: 30, fill: '#E03131' },
  { name: 'Motorcycles', value: 15, fill: '#3B82F6' },
  { name: 'Trucks', value: 10, fill: '#F59E0B' },
];

export const forecastData = {
  oneHour: [
    { area: 'CBD', level: 80 },
    { area: 'Westlands', level: 70 },
    { area: 'Eastleigh', level: 85 },
    { area: 'Karen', level: 40 },
    { area: 'Kileleshwa', level: 60 },
  ],
  fourHour: [
    { area: 'CBD', level: 90 },
    { area: 'Westlands', level: 85 },
    { area: 'Eastleigh', level: 75 },
    { area: 'Karen', level: 50 },
    { area: 'Kileleshwa', level: 65 },
  ],
  twentyFourHour: [
    { area: 'CBD', level: 75 },
    { area: 'Westlands', level: 60 },
    { area: 'Eastleigh', level: 70 },
    { area: 'Karen', level: 35 },
    { area: 'Kileleshwa', level: 50 },
  ],
};