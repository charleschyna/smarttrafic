import React from 'react';
import { X } from 'lucide-react';

interface Incident {
  properties: {
    id: string;
    iconCategory: string;
    events: { description: string }[];
    from: string;
    to: string;
    startTime: string;
  };
}

interface IncidentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
}

const IncidentsModal: React.FC<IncidentsModalProps> = ({ isOpen, onClose, incidents }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Active Incidents</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {incidents.length > 0 ? (
            <ul className="space-y-4">
              {incidents.map((incident) => (
                <li key={incident.properties.id} className="p-3 bg-gray-50 rounded-md border">
                  <p className="font-bold text-primary-700">{incident.properties.events[0]?.description || 'No description'}</p>
                  <p className="text-sm text-gray-600">From: {incident.properties.from}</p>
                  <p className="text-sm text-gray-600">To: {incident.properties.to || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-1">Started: {new Date(incident.properties.startTime).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No active incidents to display.</p>
          )}
        </div>
        <div className="p-4 border-t text-right">
          <button onClick={onClose} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentsModal;
