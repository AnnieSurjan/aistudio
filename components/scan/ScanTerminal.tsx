import React from 'react';
import { Terminal, Wifi } from 'lucide-react';

interface ScanTerminalProps {
  progress: number;
  scanLog: string[];
  scanSource: 'live' | 'mock' | null;
  liveSources: string[];
}

const ScanTerminal: React.FC<ScanTerminalProps> = ({ progress, scanLog, scanSource, liveSources }) => (
  <div className="w-full bg-slate-900 rounded-xl p-4 shadow-xl border border-slate-700 mb-6 overflow-hidden">
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center space-x-2 text-blue-400">
        <Terminal size={18} />
        <span className="font-mono text-sm font-bold">
          {scanSource === 'live' ? `LIVE SCAN — ${liveSources.join(' + ')}` : 'LIVE SCAN TERMINAL'}
        </span>
      </div>
      <div className="text-slate-400 text-xs font-mono">{progress}% Complete</div>
    </div>

    <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4">
      <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
    </div>

    <div className="h-32 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
      {scanLog.map((log, i) => (
        <div key={i} className="animate-in fade-in slide-in-from-left-2">{log}</div>
      ))}
    </div>
  </div>
);

export default ScanTerminal;
