import React, { useState, useEffect } from 'react';
import { DuplicateGroup, Transaction, TransactionType } from '../types';
import { detectDuplicates, MOCK_TRANSACTIONS } from '../services/mockData';
import { Play, RotateCcw, Check, Trash2, AlertCircle, Download, Undo, Search, Filter, XCircle, ShieldCheck, ThumbsUp, ExternalLink } from 'lucide-react';

interface ScanManagerProps {
  onExport: () => void;
}

const ScanManager: React.FC<ScanManagerProps> = ({ onExport }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]); // For Undo
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [scanSchedule, setScanSchedule] = useState('daily');

  // Filter States
  const [filterEntity, setFilterEntity] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');

  const runScan = () => {
    setIsScanning(true);
    setProgress(0);
    setDuplicates([]);

    // Simulate process
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          // Perform detection
          const detected = detectDuplicates(MOCK_TRANSACTIONS);
          setDuplicates(detected);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Bulk Resolve (Entire Group)
  const handleResolveGroup = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    setShowReviewModal(true);
  };

  // Individual Actions
  const handleKeepTransaction = (group: DuplicateGroup, txnId: string) => {
    // In a real app, this would mark this txn as the "Master" and potentially auto-resolve others
    // For UI demo: We remove this specific group from view as "Resolved"
    alert(`Transaction ${txnId} marked as primary. Others in group will be archived.`);
    setDuplicates(prev => prev.filter(g => g.id !== group.id));
  };

  const handleDeleteTransaction = (group: DuplicateGroup, txnId: string) => {
     if (group.transactions.length <= 2) {
         // If we delete one from a pair, the group is resolved
         setDuplicates(prev => prev.filter(g => g.id !== group.id));
     } else {
         // Remove just this transaction from the group UI
         setDuplicates(prev => prev.map(g => {
             if (g.id === group.id) {
                 return { ...g, transactions: g.transactions.filter(t => t.id !== txnId) };
             }
             return g;
         }));
     }
  };

  const handleOpenInQB = (txnId: string, type: string) => {
      // Logic to construct Deep Link to QuickBooks Online
      // URL pattern typically looks like: https://app.qbo.intuit.com/app/invoice?txnId=123
      const baseUrl = "https://app.qbo.intuit.com/app";
      let path = "";
      
      switch(type.toLowerCase()) {
          case 'invoice': path = 'invoice'; break;
          case 'bill': path = 'bill'; break;
          case 'payment': path = 'payment'; break;
          case 'journalentry': path = 'journal'; break;
          default: path = 'sales';
      }

      const url = `${baseUrl}/${path}?txnId=${txnId}`;
      
      // Open in new tab
      window.open(url, '_blank');
  };

  // Exception Handling
  const handleAddToExceptions = (groupId: string) => {
      // Mock logic: Remove from current view and pretend to save rule
      if(window.confirm("Are you sure? This pattern will be ignored in future scans.")) {
          setDuplicates(prev => prev.filter(g => g.id !== groupId));
      }
  };

  const confirmDelete = () => {
    if (!selectedGroup) return;

    // Backup for undo
    setHistory((prev) => [...prev, ...selectedGroup.transactions.slice(1)]); // Mock saving the "deleted" ones

    // Remove from list
    setDuplicates((prev) => prev.filter((g) => g.id !== selectedGroup.id));
    setShowReviewModal(false);
    setSelectedGroup(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    // In a real app, this would restore the transaction via API
    alert('Restoring last deleted transaction safely...');
    setHistory([]); // clear undo stack for demo
  };

  // Filter Logic
  const filteredDuplicates = duplicates.filter(group => {
    const mainTxn = group.transactions[0];
    const matchesEntity = mainTxn.entityName.toLowerCase().includes(filterEntity.toLowerCase());
    
    const amount = mainTxn.amount;
    const min = filterMinAmount ? parseFloat(filterMinAmount) : 0;
    const max = filterMaxAmount ? parseFloat(filterMaxAmount) : Infinity;
    const matchesAmount = amount >= min && amount <= max;

    return matchesEntity && matchesAmount;
  });

  const clearFilters = () => {
      setFilterEntity('');
      setFilterMinAmount('');
      setFilterMaxAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Scan & Resolve</h2>
          <p className="text-slate-500">Detect and merge duplicate transactions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
             <div className="relative">
                <select 
                    value={scanSchedule} 
                    onChange={(e) => setScanSchedule(e.target.value)}
                    className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 text-sm h-full shadow-sm"
                >
                    <option value="hourly">Hourly</option>
                    <option value="twice_daily">Twice Daily</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
          <button 
             onClick={onExport}
             className="flex items-center space-x-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors shadow-sm">
            <Download size={18} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button 
            onClick={runScan}
            disabled={isScanning}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-white font-medium transition-all ${
              isScanning ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isScanning ? <RotateCcw className="animate-spin" size={18} /> : <Play size={18} />}
            <span>{isScanning ? 'Scanning...' : 'Run New Scan'}</span>
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-6">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          <p className="text-xs text-center mt-1 text-slate-500">Analyzing transactions...</p>
        </div>
      )}

      {duplicates.length > 0 && (
        <>
            <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-4">
                <div className="flex items-center text-yellow-800">
                    <AlertCircle className="mr-2" size={20}/>
                    <span>Found {duplicates.length} potential duplicate groups.</span>
                </div>
                {history.length > 0 && (
                    <button onClick={handleUndo} className="flex items-center text-sm text-blue-600 hover:underline">
                        <Undo size={14} className="mr-1"/> Undo last delete
                    </button>
                )}
            </div>

            {/* Advanced Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                <div className="flex items-center mb-3 text-slate-700 text-sm font-semibold">
                    <Filter size={16} className="mr-2"/>
                    Filter Results
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute top-2.5 left-3 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="Search Customer/Vendor..." 
                            value={filterEntity}
                            onChange={(e) => setFilterEntity(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                         <input 
                            type="number" 
                            placeholder="Min $" 
                            value={filterMinAmount}
                            onChange={(e) => setFilterMinAmount(e.target.value)}
                            className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                         <input 
                            type="number" 
                            placeholder="Max $" 
                            value={filterMaxAmount}
                            onChange={(e) => setFilterMaxAmount(e.target.value)}
                            className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    {(filterEntity || filterMinAmount || filterMaxAmount) && (
                         <button onClick={clearFilters} className="text-slate-500 hover:text-red-500 transition-colors">
                            <XCircle size={20} />
                         </button>
                    )}
                </div>
            </div>

            <div className="space-y-6">
            {filteredDuplicates.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    No transactions match your filters.
                </div>
            ) : (
                filteredDuplicates.map((group) => (
                    <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Group Header */}
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2">
                        <div className="flex items-center">
                            <span className="text-sm font-bold text-slate-700">{group.reason}</span>
                            <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${group.confidenceScore > 0.9 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                {(group.confidenceScore * 100).toFixed(0)}% Confidence
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Whitelist / Exception Button */}
                            <button 
                                onClick={() => handleAddToExceptions(group.id)}
                                className="flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 bg-white border border-slate-300 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                                title="Ignore this pattern in future scans"
                            >
                                <ShieldCheck size={14} className="mr-1.5"/>
                                Add to Exceptions
                            </button>
                            
                            <button 
                                onClick={() => handleResolveGroup(group)}
                                className="text-xs text-white bg-slate-800 hover:bg-slate-900 px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
                            >
                                Resolve All
                            </button>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                            <tr className="text-slate-500 border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Type</th>
                                <th className="px-6 py-3 font-medium">Entity</th>
                                <th className="px-6 py-3 font-medium">Memo</th>
                                <th className="px-6 py-3 font-medium text-right">Amount</th>
                                <th className="px-6 py-3 font-medium text-center w-40">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {group.transactions.map((txn) => (
                                <tr key={txn.id} className="hover:bg-slate-50 group transition-colors">
                                <td className="px-6 py-4 text-slate-700 align-middle">{txn.date}</td>
                                <td className="px-6 py-4 align-middle">
                                    <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-medium">{txn.type}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-700 align-middle font-medium">{txn.entityName}</td>
                                <td className="px-6 py-4 text-slate-500 italic truncate max-w-xs align-middle">{txn.memo || '-'}</td>
                                <td className="px-6 py-4 text-slate-800 font-mono text-right font-bold align-middle">
                                    {txn.currency} {txn.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <div className="flex justify-center space-x-2">
                                        {/* Deep Link to QuickBooks */}
                                        <button 
                                            onClick={() => handleOpenInQB(txn.id, txn.type)}
                                            className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm"
                                            title="View in QuickBooks Online"
                                        >
                                            <ExternalLink size={16} />
                                        </button>

                                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                                        <button 
                                            onClick={() => handleKeepTransaction(group, txn.id)}
                                            className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-colors shadow-sm"
                                            title="Keep this transaction (Master)"
                                        >
                                            <ThumbsUp size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTransaction(group, txn.id)}
                                            className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors shadow-sm"
                                            title="Delete this transaction"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    </div>
                ))
            )}
            </div>
        </>
      )} 
      
      {duplicates.length === 0 && !isScanning && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <Check className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">All Clean!</h3>
            <p className="text-slate-500">No duplicate transactions found in the mock data.</p>
            <button onClick={runScan} className="mt-4 text-blue-600 hover:underline">Run check again</button>
          </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center text-red-600 mb-4">
                <AlertCircle className="mr-2" />
                <h3 className="text-xl font-bold">Review & Confirm Deletion</h3>
            </div>
            <p className="text-slate-600 mb-4">
              You are about to resolve a duplicate group. This will keep the primary transaction and mark the others for deletion in QuickBooks.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">Transactions to be removed:</p>
                <ul className="mt-2 space-y-1">
                    {selectedGroup.transactions.slice(1).map(t => (
                        <li key={t.id} className="text-sm text-red-500 flex justify-between">
                            <span>{t.date} - {t.entityName}</span>
                            <span>-${t.amount}</span>
                        </li>
                    ))}
                </ul>
                <p className="text-xs text-slate-400 mt-2 italic">Secure backup created allowing undo.</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Trash2 size={16} className="mr-2" />
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanManager;