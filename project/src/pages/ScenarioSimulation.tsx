import React from 'react';
import { Download } from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import ScenarioForm from '../components/ScenarioSimulation/ScenarioForm';
import ScenarioResults from '../components/ScenarioSimulation/ScenarioResults';

const ScenarioSimulation: React.FC = () => {
  return (
    <div>
      <PageHeader 
        title="Scenario Simulation" 
        subtitle="Test the impact of road closures, events, and traffic changes"
        actions={
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 bg-white hover:bg-gray-50">
            <Download size={16} className="mr-2" />
            Export Simulation
          </button>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <ScenarioForm />
        </div>
        <div className="lg:col-span-2">
          <ScenarioResults />
        </div>
      </div>
    </div>
  );
};

export default ScenarioSimulation;