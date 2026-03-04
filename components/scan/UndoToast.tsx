import React from 'react';
import { Undo, X } from 'lucide-react';

interface UndoToastProps {
  onUndo: () => void;
  onDismiss: () => void;
}

const UndoToast: React.FC<UndoToastProps> = ({ onUndo, onDismiss }) => (
  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-4 z-50 animate-in fade-in slide-in-from-bottom-4">
    <div className="flex flex-col">
      <span className="font-medium text-sm">Transaction resolved.</span>
      <span className="text-xs text-slate-400">Moved to archive (secure backup created).</span>
    </div>
    <div className="h-8 w-px bg-slate-700"></div>
    <button onClick={onUndo} className="text-blue-400 hover:text-blue-300 font-bold text-sm flex items-center">
      <Undo size={16} className="mr-1.5" /> UNDO
    </button>
    <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300 ml-2">
      <X size={16} />
    </button>
  </div>
);

export default UndoToast;
