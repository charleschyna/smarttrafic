import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import ReactMarkdown from 'react-markdown';
import { db } from '../../db';
import { ChevronDown, Clock, MapPin } from 'lucide-react';

const ReportHistory: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Fetch reports from the database, newest first
  const reports = useLiveQuery(() => 
    db.reports.orderBy('createdAt').reverse().toArray()
  );

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-700">Report History</h3>
        <p className="text-gray-500 mt-2">No reports saved yet. Generate a new report to see it here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Report History</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {reports.map((report) => (
          <div key={report.id} className="p-4">
            <button 
              onClick={() => toggleExpand(report.id!)}
              className="w-full flex justify-between items-center text-left focus:outline-none"
            >
              <div className="flex-1">
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <MapPin size={14} className="mr-2" />
                  <span>{report.location.address || 'Unknown Location'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock size={14} className="mr-2" />
                  <span>{new Date(report.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <ChevronDown 
                size={20} 
                className={`transition-transform ${expandedId === report.id ? 'rotate-180' : ''}`}
              />
            </button>
            {expandedId === report.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{report.content}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportHistory;
