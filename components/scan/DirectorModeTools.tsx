import React from 'react';
import { Camera, MonitorPlay, X } from 'lucide-react';

interface DirectorModeToolsProps {
  show: boolean;
  onToggle: (show: boolean) => void;
  onTrigger: (scenario: 'scan_running' | 'results_found' | 'all_clean') => void;
}

const DirectorModeTools: React.FC<DirectorModeToolsProps> = ({ show, onToggle, onTrigger }) => (
  <div className="fixed bottom-24 right-20 z-40">
    {show ? (
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl w-64 animate-in fade-in slide-in-from-bottom-2 border border-slate-700">
        <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
          <div className="flex items-center font-bold text-sm">
            <MonitorPlay size={16} className="mr-2 text-green-400" /> Director Mode
          </div>
          <button onClick={() => onToggle(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => onTrigger('scan_running')}
            className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 hover:text-white transition-colors flex items-center"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> 1. Force "Scanning..."
          </button>
          <button
            onClick={() => onTrigger('results_found')}
            className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 hover:text-white transition-colors flex items-center"
          >
            <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span> 2. Force "Results Found"
          </button>
          <button
            onClick={() => onTrigger('all_clean')}
            className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 hover:text-white transition-colors flex items-center"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> 3. Force "All Clean"
          </button>
        </div>
      </div>
    ) : (
      <button
        onClick={() => onToggle(true)}
        className="w-10 h-10 bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-900 rounded-full shadow-md flex items-center justify-center transition-all opacity-50 hover:opacity-100"
        title="Open Director Mode (For Screenshots)"
      >
        <Camera size={20} />
      </button>
    )}
  </div>
);

export default DirectorModeTools;
