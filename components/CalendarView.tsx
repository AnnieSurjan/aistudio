import React from 'react';
import { ScanResult } from '../types';
import { CheckCircle, XCircle } from 'lucide-react';

interface CalendarViewProps {
  history: ScanResult[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ history }) => {
  // Simplified calendar visualization for list view in this demo
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Scan History</h2>
        <button className="text-blue-600 hover:underline text-sm font-medium">Download Report (PDF)</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Scan ID</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Duplicates Found</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((scan) => (
              <tr key={scan.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-600 font-mono text-sm">{scan.id}</td>
                <td className="px-6 py-4 text-slate-800">{scan.date}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {scan.status === 'Completed' ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <XCircle size={16} className="text-red-500" />
                    )}
                    <span className={`text-sm ${scan.status === 'Completed' ? 'text-green-700' : 'text-red-700'}`}>
                      {scan.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-medium text-slate-800">
                  {scan.duplicatesFound}
                </td>
                 <td className="px-6 py-4 text-right">
                    <button onClick={() => alert(`Resending report for ${scan.id}`)} className="text-blue-600 hover:text-blue-800 text-sm">Resend Email</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CalendarView;
