import React, { useState } from 'react';
import { ScanResult } from '../types';
import { CheckCircle, XCircle, FileText, X, AlertTriangle, CheckSquare } from 'lucide-react';

interface CalendarViewProps {
  history: ScanResult[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ history }) => {
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);

  // Mock details generator for the modal since history type is simple
  const getMockDetails = (scan: ScanResult) => {
      // In a real app, this data would come from the backend or be part of the ScanResult object
      if (scan.duplicatesFound === 0) return [];
      
      return Array.from({ length: scan.duplicatesFound }).map((_, i) => ({
          id: `DUP-${scan.id}-${i+1}`,
          description: `Duplicate Invoice group for Vendor #${100+i}`,
          status: i % 2 === 0 ? 'Resolved (Merged)' : 'Ignored (False Positive)',
          actionTime: '10:42 AM'
      }));
  };

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
              <tr 
                key={scan.id} 
                className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedScan(scan)}
              >
                <td className="px-6 py-4 text-slate-600 font-mono text-sm group-hover:text-blue-600 font-medium">{scan.id}</td>
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
                    <button 
                        onClick={(e) => { e.stopPropagation(); alert(`Resending report for ${scan.id}`); }} 
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                        Resend Email
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* History Detail Modal */}
      {selectedScan && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <div>
                          <h3 className="text-lg font-bold text-slate-900 flex items-center">
                              <FileText size={20} className="mr-2 text-slate-500"/>
                              Scan Details: {selectedScan.id}
                          </h3>
                          <p className="text-sm text-slate-500">Executed on {selectedScan.date}</p>
                      </div>
                      <button onClick={() => setSelectedScan(null)} className="text-slate-400 hover:text-slate-600 p-1">
                          <X size={24}/>
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto">
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 bg-white border border-slate-200 p-4 rounded-lg text-center">
                                <div className="text-sm text-slate-500 uppercase font-bold tracking-wide mb-1">Status</div>
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-bold ${selectedScan.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {selectedScan.status}
                                </div>
                            </div>
                            <div className="flex-1 bg-white border border-slate-200 p-4 rounded-lg text-center">
                                <div className="text-sm text-slate-500 uppercase font-bold tracking-wide mb-1">Found</div>
                                <div className="text-2xl font-bold text-slate-800">{selectedScan.duplicatesFound}</div>
                            </div>
                        </div>

                        <h4 className="font-bold text-slate-800 mb-3 text-sm border-b border-slate-100 pb-2">Resolution History</h4>
                        
                        {selectedScan.duplicatesFound === 0 ? (
                            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                                <CheckCircle size={32} className="mx-auto text-green-400 mb-2"/>
                                No duplicates were found during this scan.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {getMockDetails(selectedScan).map((item, idx) => (
                                    <div key={idx} className="flex items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className={`mt-0.5 p-1 rounded-full mr-3 ${item.status.includes('Resolved') ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                                            {item.status.includes('Resolved') ? <CheckSquare size={14}/> : <AlertTriangle size={14}/>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <span className="font-semibold text-slate-700 text-sm">{item.id}</span>
                                                <span className="text-xs text-slate-400">{item.actionTime}</span>
                                            </div>
                                            <p className="text-sm text-slate-600">{item.description}</p>
                                            <div className="mt-1 text-xs font-medium text-slate-500">
                                                Action: <span className={item.status.includes('Resolved') ? 'text-green-600' : 'text-slate-600'}>{item.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                  </div>

                  <div className="p-4 border-t border-slate-100 flex justify-end">
                      <button onClick={() => setSelectedScan(null)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg">Close</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CalendarView;