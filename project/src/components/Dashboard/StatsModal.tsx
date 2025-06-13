import React from 'react';
import { X } from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
  unit?: string;
}

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  stats: Stat[];
  description?: string;
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, title, stats, description }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <ul className="space-y-3">
            {stats.map((stat, index) => (
              <li key={index} className="flex justify-between items-center text-lg">
                <span className="text-gray-600">{stat.label}:</span>
                <span className="font-bold text-primary-700">{stat.value} {stat.unit || ''}</span>
              </li>
            ))}
          </ul>
          {description && (
            <p className="text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200">{description}</p>
          )}
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg text-right">
          <button onClick={onClose} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
