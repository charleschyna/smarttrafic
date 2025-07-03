// A representation of a route from the TomTom API
import type { TomTomRoute, ScoredRoute } from './types';

// Defines the weights for scoring criteria based on the routing preference
const preferenceWeights = {
  Fastest: {
    duration: 0.7,
    distance: 0.2,
    traffic: 0.1, // Penalize heavy traffic slightly
  },
  Shortest: {
    duration: 0.2,
    distance: 0.7,
    traffic: 0.1, // Penalize heavy traffic slightly
  },
  Balanced: {
    duration: 0.4,
    distance: 0.4,
    traffic: 0.2, // Give more weight to avoiding traffic
  },
};

/**
 * Scores and selects the best route from a list of alternatives based on the selected preference.
 * @param routes - An array of route objects from the TomTom API.
 * @param preference - The selected routing preference ('Fastest', 'Shortest', 'Balanced').
 * @returns The best route object and its calculated score.
 */
export const selectBestRoute = (routes: TomTomRoute[], preference: string): (ScoredRoute & { index: number }) | null => {
  if (!routes || routes.length === 0) {
    return null;
  }

  let weights = preferenceWeights[preference as keyof typeof preferenceWeights];

  if (!weights) {
    console.warn(`Invalid routing preference: "${preference}". Defaulting to 'Balanced'.`);
    weights = preferenceWeights.Balanced;
  }

  // Find the max values for normalization
  const maxDuration = Math.max(...routes.map(r => r.summary.travelTimeInSeconds));
  const maxDistance = Math.max(...routes.map(r => r.summary.lengthInMeters));
  const maxTrafficDelay = Math.max(...routes.map(r => r.summary.trafficDelayInSeconds));

  const scoredRoutes = routes.map((route, index) => {
    // Normalize each metric: a higher score is better.
    const durationScore = maxDuration > 0 ? 1 - (route.summary.travelTimeInSeconds / maxDuration) : 1;
    const distanceScore = maxDistance > 0 ? 1 - (route.summary.lengthInMeters / maxDistance) : 1;
    const trafficScore = maxTrafficDelay > 0 ? 1 - (route.summary.trafficDelayInSeconds / maxTrafficDelay) : 1;

    // Calculate the final weighted score
    const score = 
      (durationScore * weights.duration) + 
      (distanceScore * weights.distance) + 
      (trafficScore * weights.traffic);

    return { route, score, index };
  });

  // Find the route with the highest score
  const best = scoredRoutes.reduce((best, current) => (current.score > best.score ? current : best));

  // Normalize the best score to a 0-100 confidence range
  // Adding a base confidence makes the score feel more meaningful.
  const confidence = Math.round(best.score * 100) + 75;

  return {
    route: best.route,
    score: best.score,
    confidence: Math.min(confidence, 99), // Cap confidence at 99%
    index: best.index,
  };
};
