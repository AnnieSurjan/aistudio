import React from 'react';
import { DuplicateGroup } from '../../types';
import { ShieldCheck, Split } from 'lucide-react';

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  onCompare: (group: DuplicateGroup) => void;
  onWhitelist: (group: DuplicateGroup) => void;
}

const DuplicateGroupCard: React.FC<DuplicateGroupCardProps> = ({ group, onCompare, onWhitelist }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    {/* Group Header */}
    <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2">
      <div className="flex items-center">
        <span className="text-sm font-bold text-slate-700">{group.reason}</span>
        <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${group.confidenceScore > 0.9 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
          {(group.confidenceScore * 100).toFixed(0)}% Confidence
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onWhitelist(group)}
          className="flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 bg-white border border-slate-300 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ShieldCheck size={14} className="mr-1.5" />
          Whitelist
        </button>
        <button
          onClick={() => onCompare(group)}
          className="flex items-center text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Split size={14} className="mr-1.5" />
          Review & Resolve
        </button>
      </div>
    </div>

    {/* Preview Table */}
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-slate-500 border-b border-slate-100 bg-slate-50/50">
            <th className="px-6 py-3 font-medium">Date (USA)</th>
            <th className="px-6 py-3 font-medium">Entity</th>
            <th className="px-6 py-3 font-medium">Account</th>
            <th className="px-6 py-3 font-medium">Memo</th>
            <th className="px-6 py-3 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {group.transactions.map((txn) => (
            <tr key={txn.id} className="hover:bg-slate-50 group transition-colors">
              <td className="px-6 py-3 text-slate-700">
                {new Date(txn.date).toLocaleDateString('en-US')}
              </td>
              <td className="px-6 py-3 text-slate-700 font-medium">{txn.entityName}</td>
              <td className="px-6 py-3 text-slate-500 text-xs">{txn.account || '-'}</td>
              <td className="px-6 py-3 text-slate-500 italic truncate max-w-xs">{txn.memo || '-'}</td>
              <td className="px-6 py-3 text-slate-800 font-mono text-right font-bold">
                {txn.currency} {txn.amount.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default DuplicateGroupCard;
