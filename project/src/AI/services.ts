import type {
  TrafficInsight,
  TrafficPrediction,
  OptimizedRoute,
  RouteLeg,
  MapboxRoute,
  ScoredRoute,
  RouteInstruction,
  PredictiveAnalyticsData,
  PredictiveAnalyticsV2Data,
  DashboardData,
} from './types';
import { selectBestRoute } from './scoring';

// MOCK DATA AND HELPERS (to be replaced with actual API calls)

const MOCK_INSIGHTS: TrafficInsight[] = [
  {
    severity: 'critical',
    message: 'Major accident on I-280 S',
    type: 'incident',
    details: 'A multi-car pile-up is blocking all lanes. Expect major delays.',
    location: { lat: 37.7749, lng: -122.4194, address: 'I-280, San Francisco' },
  },
  {
    severity: 'warning',
    message: 'Heavy congestion on Bay Bridge',
    type: 'congestion',
    details: 'Traffic is moving at less than 10 mph. Consider alternative routes.',
    location: { lat: 37.7984, lng: -122.3777, address: 'Bay Bridge, San Francisco' },
  },
  {
    severity: 'info',
    message: 'Roadwork on 19th Avenue',
    type: 'construction',
    details: 'Lane closures are in effect until 5 PM.',
    location: { lat: 37.7506, lng: -122.4764, address: '19th Ave, San Francisco' },
  },
];

const MOCK_PREDICTIONS: TrafficPrediction[] = [
  {
    level: 'high',
    confidence: 0.85,
    details: 'High probability of gridlock during evening commute hours.',
    location: { lat: 37.7749, lng: -122.4194 },
  },
  {
    level: 'medium',
    confidence: 0.7,
    details: 'Moderate congestion expected due to a downtown event.',
    location: { lat: 37.7833, lng: -122.4167 },
  },
];

/**
 * =======================================================================
 * Public API Functions
 * =======================================================================
 */

/**
 * Fetches real-time traffic insights for a given area.
 * @param _lat - Latitude of the area center.
 * @param _lng - Longitude of the area center.
 * @returns A promise that resolves to an array of traffic insights.
 */
export const getTrafficInsights = async (
  _lat: number,
  _lng: number
): Promise<TrafficInsight[]> => {
  // In a real implementation, this would call a dedicated AI service.
  // For now, we return mock data.
  console.log('Fetching traffic insights for:', { _lat, _lng });
  return Promise.resolve(MOCK_INSIGHTS);
};

/**
 * Fetches traffic predictions for a given area.
 * @param _lat - Latitude of the area center.
 * @param _lng - Longitude of the area center.
 * @returns A promise that resolves to an array of traffic predictions.
 */
export const getTrafficPredictions = async (
  _lat: number,
  _lng: number
): Promise<TrafficPrediction[]> => {
  // In a real implementation, this would call a dedicated AI service.
  console.log('Fetching traffic predictions for:', { _lat, _lng });
  return Promise.resolve(MOCK_PREDICTIONS);
};

/**
 * Mocks fetching predictive analytics data.
 * @param _location - The location for which to fetch data.
 * @param _timeFrame - The time frame for the data.
 * @returns A promise that resolves to the predictive analytics data.
 */
export const getPredictiveAnalyticsData = async (
  _location: { lat: number; lng: number },
  _timeFrame: string
): Promise<{ success: boolean; data?: PredictiveAnalyticsData; error?: string }> => {
  console.warn('Using mock data for predictive analytics.');

  const mockData: PredictiveAnalyticsData = {
    heatmaps: {
      oneHour: [
        { area: 'CBD', congestion: 0.8 },
        { area: 'Westlands', congestion: 0.6 },
        { area: 'Upper Hill', congestion: 0.7 },
      ],
      fourHour: [
        { area: 'CBD', congestion: 0.7 },
        { area: 'Westlands', congestion: 0.65 },
        { area: 'Upper Hill', congestion: 0.75 },
      ],
      twentyFourHour: [
        { area: 'CBD', congestion: 0.5 },
        { area: 'Westlands', congestion: 0.4 },
        { area: 'Upper Hill', congestion: 0.6 },
      ],
    },
    trends: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      congestion: Math.random() * 100,
    })),
  };

  return Promise.resolve({ success: true, data: mockData });
};

/**
 * Mocks submitting the contact form.
 * @param _data - The contact form data.
 * @returns A promise that resolves to a success or error object.
 */
export const submitContactForm = async (
  _data: { name: string; email: string; message: string }
): Promise<{ success: boolean; error?: string }> => {
  console.warn('Using mock data for contact form submission.');
  // Simulate a network request
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

/**
 * Mocks fetching V2 predictive analytics data.
 * @param _location - The location for which to fetch data.
 * @param _radius - The search radius.
 * @returns A promise that resolves to the V2 predictive analytics data.
 */
export const getPredictiveAnalyticsV2Data = async (
  _location: { lat: number; lng: number },
  _radius: number
): Promise<{ success: boolean; data?: PredictiveAnalyticsV2Data; error?: string }> => {
  console.warn('Using mock data for V2 predictive analytics.');

  const mockData: PredictiveAnalyticsV2Data = {
    hotspotAlerts: [
      {
        id: 'hs-1',
        areaName: 'Moi Avenue',
        severity: 'High',
        predictedCongestion: 0.85,
        confidence: 0.9,
        details: 'Major event at the National Archives.',
      },
      {
        id: 'hs-2',
        areaName: 'Uhuru Highway',
        severity: 'Medium',
        predictedCongestion: 0.6,
        confidence: 0.8,
        details: 'Road construction near the roundabout.',
      },
    ],
    aiRecommendations: [
      {
        id: 'rec-1',
        title: 'Reroute Westlands Traffic',
        summary: 'Divert traffic from Waiyaki Way to avoid construction delays.',
        priority: 'High',
        actionableInsights: [
          'Update digital signboards with new route information.',
          'Deploy traffic marshals to key intersections.',
        ],
      },
    ],
  };

  return Promise.resolve({ success: true, data: mockData });
};

/**
 * Mocks fetching the main dashboard data.
 * @param _location - The location for which to fetch data.
 * @param _radius - The search radius.
 * @param _timeFrame - The time frame for the data.
 * @returns A promise that resolves to the main dashboard data.
 */
export const getDashboardData = async (
  _location: { lat: number; lng: number },
  _radius: number,
  _timeFrame: string
): Promise<{ success: boolean; data?: DashboardData; error?: string }> => {
  console.warn('Using mock data for main dashboard.');

  const mockData: DashboardData = {
    congestionLevel: 68,
    avgTripTime: 25,
    activeIncidents: 3,
    freeFlowTravelTime: 15 * 60, // 15 minutes in seconds
    trends: {
      congestionTrend: 'up',
      avgTripTimeTrend: 'down',
      activeIncidentsTrend: 'stable',
    },
    incidents: [
      { id: 'inc-1', title: 'Accident on Uhuru Highway', description: 'A multi-vehicle accident is causing major delays.', severity: 'Critical', timestamp: new Date().toISOString() },
      { id: 'inc-2', title: 'Construction on Waiyaki Way', description: 'Roadwork is slowing traffic near Westlands.', severity: 'Medium', timestamp: new Date().toISOString() },
    ],
    congestionForecast: [
      { hour: '1 PM', congestion: 0.65 },
      { hour: '2 PM', congestion: 0.70, isForecast: true },
      { hour: '3 PM', congestion: 0.75, isForecast: true },
    ],
    areaComparisonData: [
      { name: 'CBD', congestion: 85 },
      { name: 'Westlands', congestion: 70 },
      { name: 'Kilimani', congestion: 60 },
    ],
  };

  return Promise.resolve({ success: true, data: mockData });
};

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

/**
 * Generates a traffic report summary string from raw insights.
 * @param location - The location to generate the report for.
 * @param radius - The search radius.
 * @returns A promise that resolves to an object containing the report.
 */
export const generateTrafficInsights = async (
  location: Location,
  radius: number
): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    const insights = await getTrafficInsights(location.lat, location.lng);

    if (!insights || insights.length === 0) {
      return {
        success: true,
        data: 'No significant traffic insights found for the selected area.',
      };
    }

    let summary = `### Traffic Report for ${
      location.address || 'the selected area'
    }\n\n`;
    summary += `Here are the key traffic insights within a ${radius}km radius:\n\n`;

    insights.forEach(insight => {
      const severityEmoji =
        {
          critical: '🔴',
          warning: '🟡',
          info: '🔵',
        }[insight.severity] || '⚪️';

      summary += `**${severityEmoji} ${insight.message}**\n`;
      summary += `- **Type:** ${insight.type}\n`;
      summary += `- **Details:** ${insight.details}\n`;
      if (insight.location.address) {
        summary += `- **Location:** ${insight.location.address}\n\n`;
      } else {
        summary += `\n`;
      }
    });

    return { success: true, data: summary };
  } catch (error: any) {
    console.error('Error generating traffic insights summary:', error);
    return {
      success: false,
      error:
        error.message ||
        'An unknown error occurred while generating the report.',
    };
  }
};

/**
 * =======================================================================
 * Route Optimization AI Services
 * =======================================================================
 */



/**
 * Generates a human-readable summary of a route using an AI model.
 * @param scoredRoute - The selected best route object.
 * @param preference - The user's routing preference.
 * @returns A promise that resolves to a string containing the AI-generated summary.
 */
export const generateRouteSummary = async (
  scoredRoute: ScoredRoute,
  preference: string
): Promise<string> => {
  const { route } = scoredRoute;
  const distanceKm = (route.distance / 1000).toFixed(1);
  const durationMin = Math.round(route.duration / 60);

  // The prompt for the AI model is constructed here, but currently unused.
  // To re-enable AI-powered summaries, uncomment this and the getAIChatCompletion call below.
  /*
  const prompt = `
    You are an expert driving assistant AI. Your goal is to provide a clear, conversational, and helpful summary of a driving route.
    The user's routing preference was \"${preference}\".
    The route is ${distanceKm} km and will take about ${durationMin} minutes.
    There is a traffic delay of about ${trafficDelayMin} minutes.
    We are ${confidence.toFixed(0)}% confident this is the best route.
    Key turns for context: ${instructions}
    
    Based on this, generate a concise, friendly, 4-6 sentence summary for the driver.
    Highlight the key benefits (e.g., fastest, shortest, balanced) and weave in the traffic information naturally.
    Do not just list the instructions. Conclude with a friendly sign-off like "Drive safe!"
  `;
  */

  try {
    // Using a mock summary to avoid API calls during this refactoring phase
    // const summaryText = await getAIChatCompletion('deepseek/deepseek-chat', prompt, false, 'routing');
    const summaryText = `This is a mock summary based on your preference for the '${preference}' route. The journey is about ${distanceKm} km and will take around ${durationMin} minutes. Drive safe!`;
    return summaryText;
  } catch (error) {
    console.error('Error generating AI route summary:', error);
    return 'Could not generate AI summary at this time.';
  }
};

/**
 * Processes raw route data, selects the best route, and prepares it for the UI.
 * @param routes - An array of raw route objects from the Mapbox API.
 * @param preference - The user's routing preference.
 * @returns A promise that resolves to a fully processed OptimizedRoute object.
 */
export const processRouteData = async (
  routes: MapboxRoute[],
  preference: string
): Promise<OptimizedRoute | null> => {
  if (!routes || routes.length === 0) {
    return null;
  }

  const bestRouteResult = selectBestRoute(routes, preference);

  if (!bestRouteResult) {
    return null;
  }

  const bestRoute: ScoredRoute = {
    ...bestRouteResult,
    leg: _processSingleRoute(bestRouteResult.route),
  };

  if (!bestRoute.leg) {
    console.error('Could not process route leg for the best route.');
    return null;
  }

  const summary = `Selected Route: ${bestRoute.leg.distanceInMeters.toFixed(0)}m, ${bestRoute.leg.travelTimeInSeconds.toFixed(0)}s`;

  const aiSummary = await generateRouteSummary(bestRoute, preference);

  return {
    bestRoute,
    summary,
    aiSummary,
    rawRoutes: routes,
  };
};

/**
 * =======================================================================
 * Internal Helper Functions
 * =======================================================================
 */

/**
 * Processes a single Mapbox route object into a standardized RouteLeg format.
 * @param route - A raw MapboxRoute object.
 * @returns A processed RouteLeg object.
 */
const _processSingleRoute = (route: MapboxRoute): RouteLeg => {
  const leg = route.legs[0];
  if (!leg) {
    throw new Error('Route object is missing a leg.');
  }

  const instructions: RouteInstruction[] = leg.steps.flatMap(step =>
    step.maneuver.instruction ? [{ message: step.maneuver.instruction }] : []
  );

  return {
    distanceInMeters: route.distance,
    travelTimeInSeconds: route.duration,
    trafficDelayInSeconds: route.duration_traffic
      ? route.duration_traffic - route.duration
      : 0,
    geometry: route.geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] })),
    instructions: instructions,
  };
};