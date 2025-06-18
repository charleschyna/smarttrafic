// src/components/PredictiveAnalyticsV2/RecommendationsPanel.tsx
import React from 'react';
import type { AIRecommendation } from '../../AI/types';
import { Lightbulb, FileText, TrendingUp } from 'lucide-react';

interface RecommendationsPanelProps {
  recommendations: AIRecommendation[];
  isLoading: boolean;
}

const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({ recommendations, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Prescriptive AI Recommendations</h2>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col space-y-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-8 w-8"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
              <div className="pl-11">
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mt-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Prescriptive AI Recommendations</h2>
      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No recommendations available at this time.</p>
        ) : (
          recommendations.map((rec, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-start space-x-3">
                <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                <p className="flex-1 font-semibold text-gray-800 dark:text-gray-200">{rec.recommendation}</p>
              </div>
              <div className="mt-3 pl-8 space-y-2">
                <div className="flex items-start space-x-3 text-sm">
                  <FileText className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="flex-1 text-gray-600 dark:text-gray-400"><span className="font-medium">Justification:</span> {rec.justification}</p>
                </div>
                <div className="flex items-start space-x-3 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="flex-1 text-gray-600 dark:text-gray-400"><span className="font-medium">Expected Impact:</span> {rec.expectedImpact}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecommendationsPanel;
