import React, { useState, useEffect, useRef } from 'react';
import { DuplicateGroup, Transaction, TransactionType, UserProfile, ExclusionRule } from '../types';
import { detectDuplicates, MOCK_TRANSACTIONS } from '../services/mockData';
import { Play, RotateCcw, Check, Trash2, AlertCircle, Download, Undo, Search, Filter, XCircle, ShieldCheck, ThumbsUp, ExternalLink, Settings, Plus, X, Split, ArrowRightLeft, AlertTriangle, Mail, Calendar, Save, FileText, ChevronDown, DollarSign, Tag, Briefcase, User, Layers, Wifi, WifiOff } from 'lucide-react';

const PRODUCTION_BACKEND_URL = 'https://dupdetect-frontend.onrender.com';

interface ScanManagerProps {
  onExport: () => void; // Kept for interface compatibility but logic moved internal
  onAddAuditLog: (action: string, details: string, type: 'info' | 'warning' | 'danger' | 'success') => void;
  user: UserProfile;
}

const ScanManager: React.FC<ScanManagerProps> = ({ onExport, onAddAuditLog, user }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  
  // Undo System State
  const [history, setHistory] = useState<DuplicateGroup[]>([]); 
  const [showUndoToast, setShowUndoToast] = useState(false);
  const undoTimeoutRef = useRef<any>(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [scanSchedule, setScanSchedule] = useState('daily');

  // Filter States
  const [filterEntity, setFilterEntity] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAccountType, setFilterAccountType] = useState('');

  // Dropdown States
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);

  // Export State
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Rules Engine State
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rules, setRules] = useState<ExclusionRule[]>([
      { id: '1', name: 'Ignore small variances', type: 'amount_below', value: 5, isActive: true }
  ]);
  const [newRule, setNewRule] = useState<Partial<ExclusionRule>>({ type: 'vendor_contains', isActive: true, name: '' });

  // Email Reporting State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('client@example.com');
  const [emailFrequency, setEmailFrequency] = useState('weekly');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // Cleanup timeout on unmount
  useEffect(() => {
      return () => {
          if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      };
  }, []);

  const [scanSource, setScanSource] = useState<'live' | 'mock' | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const runScan = async () => {
    setIsScanning(true);
    setProgress(0);
    setDuplicates([]);
    setHistory([]);
    setShowUndoToast(false);
    setScanError(null);

    const isQBConnected = user.isQuickBooksConnected;

    if (isQBConnected) {
      // --- REAL QB API SCAN ---
      onAddAuditLog('Scan Run', 'Live QuickBooks scan initiated', 'info');
      setScanSource('live');
      setProgress(10);

      try {
        setProgress(20);
        const response = await fetch(`${PRODUCTION_BACKEND_URL}/api/quickbooks/scan?userId=user-1`);
        setProgress(50);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (errorData.code === 'NO_CONNECTION') {
            throw new Error('No active QuickBooks connection. Please reconnect QuickBooks from your Profile page.');
          }
          if (errorData.code === 'TOKEN_EXPIRED') {
            throw new Error('QuickBooks session expired. Please reconnect QuickBooks.');
          }
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        setProgress(75);

        if (!data.success || !data.transactions) {
          throw new Error('Invalid response from server');
        }

        const transactions: Transaction[] = data.transactions;
        console.log(`[Scan] Fetched ${transactions.length} transactions from ${data.meta?.companyName}`);

        setProgress(90);
        const detected = detectDuplicates(transactions);
        setProgress(100);
        setIsScanning(false);
        setDuplicates(detected);

        if (detected.length > 0) {
          onAddAuditLog('Scan Completed', `Live scan of "${data.meta?.companyName}" finished. Found ${detected.length} duplicate groups from ${transactions.length} transactions.`, 'warning');
        } else {
          onAddAuditLog('Scan Completed', `Live scan of "${data.meta?.companyName}" finished. No duplicates found in ${transactions.length} transactions.`, 'success');
        }
      } catch (error) {
        console.error('[Scan] QB API error:', error);
        setIsScanning(false);
        setProgress(0);
        setScanError(error instanceof Error ? error.message : 'Failed to fetch QuickBooks data');
        onAddAuditLog('Scan Failed', `Live scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'danger');
      }
    } else {
      // --- MOCK DATA SCAN (fallback) ---
      onAddAuditLog('Scan Run', 'Demo scan initiated (mock data - connect QuickBooks for live data)', 'info');
      setScanSource('mock');

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            const detected = detectDuplicates(MOCK_TRANSACTIONS);
            setDuplicates(detected);
            if (detected.length > 0) {
              onAddAuditLog('Scan Completed', `Demo scan finished. Found ${detected.length} potential duplicate groups.`, 'warning');
            } else {
              onAddAuditLog('Scan Completed', 'Demo scan finished. No duplicates found.', 'info');
            }
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  // Comparison / Review Flow
  const handleCompareGroup = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    setShowReviewModal(true);
  };

  const handleOpenInQB = (txnId: string, type: string) => {
      // Alert user about sandbox limitation
      alert("Opening QuickBooks Sandbox...\n\nNote: You must be logged into your QBO Sandbox account in another tab for this link to load correctly, otherwise it may hang.");

      const baseUrl = "https://app.sandbox.qbo.intuit.com/app";
      let path = "";
      switch(type.toLowerCase()) {
          case 'invoice': path = 'invoice'; break;
          case 'bill': path = 'bill'; break;
          case 'payment': path = 'payment'; break;
          case 'journalentry': path = 'journal'; break;
          default: path = 'sales';
      }
      const url = `${baseUrl}/${path}?txnId=${txnId}`;
      window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Export Logic
  const handleExportCSV = () => {
    if (duplicates.length === 0) {
        alert("No duplicates to export.");
        return;
    }

    const headers = ['Group ID', 'Reason', 'Confidence', 'Txn ID', 'Date', 'Entity', 'Account', 'Amount', 'Currency', 'Memo'];
    const rows = duplicates.flatMap(group => 
        group.transactions.map(txn => [
            group.id,
            `"${group.reason}"`,
            group.confidenceScore,
            txn.id,
            txn.date,
            `"${txn.entityName}"`,
            `"${txn.account || ''}"`,
            txn.amount,
            txn.currency,
            `"${txn.memo || ''}"`
        ].join(','))
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dupdetect_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
    onAddAuditLog('Export', `Exported ${rows.length} duplicate transactions to CSV`, 'info');
  };

  const handleExportPDF = () => {
     if (duplicates.length === 0) {
        alert("No duplicates to export.");
        return;
    }
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        const html = `
            <html>
            <head>
                <title>Duplicate Report - DupDetect</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
                    .meta { color: #64748b; margin-bottom: 20px; font-size: 0.9em; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 0.85em; border: 1px solid #cbd5e1; }
                    td { padding: 8px; font-size: 0.85em; border: 1px solid #cbd5e1; }
                    .group-header { background: #e0f2fe; font-weight: bold; }
                    .amount { text-align: right; font-family: monospace; }
                </style>
            </head>
            <body>
                <h1>Duplicate Transaction Report</h1>
                <div class="meta">
                    Generated on: ${new Date().toLocaleString()}<br/>
                    Total Groups Found: ${duplicates.length}<br/>
                    Generated by: ${user.name}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Entity</th>
                            <th>Account</th>
                            <th>Memo</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${duplicates.map(group => `
                            <tr class="group-header">
                                <td colspan="6">Group: ${group.id} - ${group.reason} (${(group.confidenceScore * 100).toFixed(0)}%)</td>
                            </tr>
                            ${group.transactions.map(t => `
                                <tr>
                                    <td>${t.id}</td>
                                    <td>${t.date}</td>
                                    <td>${t.entityName}</td>
                                    <td>${t.account || '-'}</td>
                                    <td>${t.memo || '-'}</td>
                                    <td class="amount">${t.currency} ${t.amount.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        `).join('')}
                    </tbody>
                </table>
                <script>window.print();</script>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        onAddAuditLog('Export', `Generated PDF report for ${duplicates.length} groups`, 'info');
    }
    setShowExportMenu(false);
  };

  // Exception / Rules Handling
  const handleAddToExceptions = (group: DuplicateGroup) => {
      const vendorName = group.transactions[0].entityName;
      setNewRule({
          name: `Ignore ${vendorName}`,
          type: 'vendor_contains',
          value: vendorName,
          isActive: true
      });
      setShowRulesModal(true);
  };

  const handleAddRule = () => {
      if (!newRule.name || !newRule.value) return;
      const rule: ExclusionRule = {
          id: Date.now().toString(),
          name: newRule.name,
          type: newRule.type as any,
          value: newRule.value,
          isActive: true
      };
      setRules(prev => [...prev, rule]);
      onAddAuditLog('Rule Created', `Created exclusion rule: ${rule.name}`, 'info');
      setNewRule({ type: 'vendor_contains', isActive: true, name: '' });
  };

  const handleDeleteRule = (id: string) => {
      setRules(prev => prev.filter(r => r.id !== id));
  };

  // Email Reporting Handler
  const handleSaveEmailSettings = () => {
      setIsSavingEmail(true);
      setTimeout(() => {
          setIsSavingEmail(false);
          setShowEmailModal(false);
          onAddAuditLog('Reporting', `Updated client reporting: ${emailFrequency} emails to ${emailRecipients}`, 'success');
      }, 1000);
  };

  // Resolution Actions
  const resolveKeepOne = (txnIdToKeep: string) => {
    if (!selectedGroup) return;

    // Identify what we are deleting
    const toDelete = selectedGroup.transactions.filter(t => t.id !== txnIdToKeep);
    const keptTxn = selectedGroup.transactions.find(t => t.id === txnIdToKeep);

    // Push the WHOLE group to history stack so we can restore it exactly
    setHistory((prev) => [...prev, selectedGroup]); 

    onAddAuditLog('Resolve', `Resolved group ${selectedGroup.id}. Kept ${keptTxn?.id}, archived ${toDelete.length} others.`, 'success');

    // Remove from UI
    setDuplicates((prev) => prev.filter((g) => g.id !== selectedGroup.id));
    setShowReviewModal(false);
    setSelectedGroup(null);

    // Trigger Toast Notification
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setShowUndoToast(true);
    undoTimeoutRef.current = setTimeout(() => setShowUndoToast(false), 5000);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    // Get last action
    const groupToRestore = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    setHistory(newHistory);
    // Add back to the list
    setDuplicates((prev) => [groupToRestore, ...prev]); 
    
    onAddAuditLog('Undo', `Restored group ${groupToRestore.id} from history.`, 'warning');
    
    // Reset toast if we just undid the last action
    setShowUndoToast(false);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  // Filter Logic
  const filteredDuplicates = duplicates.filter(group => {
    const mainTxn = group.transactions[0];
    
    // 1. Check Smart Rules
    for (const rule of rules) {
        if (!rule.isActive) continue;
        if (rule.type === 'amount_below' && typeof rule.value === 'number') {
            if (mainTxn.amount < rule.value) return false;
        }
        if (rule.type === 'vendor_contains' && typeof rule.value === 'string') {
            if (mainTxn.entityName.toLowerCase().includes(rule.value.toLowerCase())) return false;
        }
        if (rule.type === 'description_contains' && typeof rule.value === 'string') {
            if (mainTxn.memo && mainTxn.memo.toLowerCase().includes(rule.value.toLowerCase())) return false;
        }
    }

    // 2. Check UI Filters
    const matchesEntity = mainTxn.entityName.toLowerCase().includes(filterEntity.toLowerCase());
    
    // Date Filters
    let matchesDate = true;
    const txnDate = new Date(mainTxn.date);
    if (filterDateStart && txnDate < new Date(filterDateStart)) matchesDate = false;
    if (filterDateEnd && txnDate > new Date(filterDateEnd)) matchesDate = false;

    // Account Filter
    const matchesAccount = filterAccount === '' || (mainTxn.account && mainTxn.account.toLowerCase().includes(filterAccount.toLowerCase()));

    // Transaction Type Filter
    const matchesType = filterType === '' || mainTxn.type === filterType;

    // Account Type Filter (Mocked based on simple string matching for demo)
    // In real app, Transaction would have accountType field.
    // For now we check if account name contains 'Receivable', 'Payable', etc.
    let matchesAccountType = true;
    if (filterAccountType) {
        if (filterAccountType === 'Asset' && !mainTxn.account.includes('Receivable') && !mainTxn.account.includes('Funds')) matchesAccountType = false;
        if (filterAccountType === 'Liability' && !mainTxn.account.includes('Payable')) matchesAccountType = false;
        if (filterAccountType === 'Expense' && !mainTxn.account.includes('Supplies') && !mainTxn.account.includes('Cost')) matchesAccountType = false;
        if (filterAccountType === 'Income' && !mainTxn.account.includes('Sales')) matchesAccountType = false;
    }

    const amount = mainTxn.amount;
    const min = filterMinAmount ? parseFloat(filterMinAmount) : 0;
    const max = filterMaxAmount ? parseFloat(filterMaxAmount) : Infinity;
    const matchesAmount = amount >= min && amount <= max;

    return matchesEntity && matchesAmount && matchesDate && matchesAccount && matchesType && matchesAccountType;
  });

  const clearFilters = () => {
      setFilterEntity('');
      setFilterMinAmount('');
      setFilterMaxAmount('');
      setFilterDateStart('');
      setFilterDateEnd('');
      setFilterAccount('');
      setFilterType('');
      setFilterAccountType('');
      setActiveFilterDropdown(null);
  };

  const activeRulesCount = rules.filter(r => r.isActive).length;
  const isFiltering = filterEntity || filterMinAmount || filterMaxAmount || filterDateStart || filterDateEnd || filterAccount || filterType || filterAccountType;

  // Render a specific dropdown
  const renderDropdown = (type: string) => {
      if (activeFilterDropdown !== type) return null;

      // Click outside listener could be added here for robustness, 
      // but simplistic toggle works for now.
      return (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setActiveFilterDropdown(null)}></div>
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-20 w-72 p-4 animate-in fade-in zoom-in-95">
                {type === 'date' && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-slate-800">Date Range (USA Format)</h4>
                        <div className="space-y-2">
                             <div>
                                <label className="text-xs text-slate-500">From (MM/DD/YYYY)</label>
                                <input 
                                    type="date" 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    value={filterDateStart}
                                    onChange={e => setFilterDateStart(e.target.value)}
                                />
                             </div>
                             <div>
                                <label className="text-xs text-slate-500">To (MM/DD/YYYY)</label>
                                <input 
                                    type="date" 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    value={filterDateEnd}
                                    onChange={e => setFilterDateEnd(e.target.value)}
                                />
                             </div>
                        </div>
                    </div>
                )}
                {type === 'type' && (
                    <div className="space-y-3">
                         <h4 className="font-semibold text-sm text-slate-800">Transaction Type</h4>
                         <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                         >
                             <option value="">All Types</option>
                             {Object.values(TransactionType).map(t => (
                                 <option key={t} value={t}>{t}</option>
                             ))}
                         </select>
                    </div>
                )}
                {type === 'accountType' && (
                     <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-slate-800">Account Type</h4>
                         <select 
                            value={filterAccountType}
                            onChange={(e) => setFilterAccountType(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                         >
                             <option value="">All Account Types</option>
                             <option value="Asset">Asset</option>
                             <option value="Liability">Liability</option>
                             <option value="Equity">Equity</option>
                             <option value="Income">Income</option>
                             <option value="Expense">Expense</option>
                         </select>
                     </div>
                )}
                {type === 'contact' && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-slate-800">Contact / Entity</h4>
                        <input 
                            type="text" 
                            placeholder="Vendor, Customer, Employee"
                            value={filterEntity}
                            onChange={(e) => setFilterEntity(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            autoFocus
                        />
                    </div>
                )}
                {type === 'amount' && (
                    <div className="space-y-3">
                         <h4 className="font-semibold text-sm text-slate-800">Amount Range</h4>
                         <div className="flex space-x-2">
                             <input 
                                type="number" 
                                placeholder="Min"
                                value={filterMinAmount}
                                onChange={(e) => setFilterMinAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                             />
                             <input 
                                type="number" 
                                placeholder="Max"
                                value={filterMaxAmount}
                                onChange={(e) => setFilterMaxAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                             />
                         </div>
                    </div>
                )}
                {type === 'accounts' && (
                     <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-slate-800">Specific Account</h4>
                        <input 
                            type="text" 
                            placeholder="e.g. Office Supplies"
                            value={filterAccount}
                            onChange={(e) => setFilterAccount(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            autoFocus
                        />
                    </div>
                )}
            </div>
          </>
      );
  };

  const FilterPill = ({ id, label, icon: Icon, active, displayValue }: { id: string, label: string, icon: any, active: boolean, displayValue?: string }) => (
      <div className="relative inline-block mr-2 mb-2">
          <button 
            onClick={() => setActiveFilterDropdown(activeFilterDropdown === id ? null : id)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all
                ${active 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}
            `}
          >
              <Icon size={14} className={active ? 'text-blue-500' : 'text-slate-400'} />
              <span>{displayValue || label}</span>
              <ChevronDown size={12} className={`ml-1 transition-transform ${activeFilterDropdown === id ? 'rotate-180' : ''}`} />
          </button>
          {renderDropdown(id)}
      </div>
  );

  return (
    <div className="space-y-6 relative">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Scan & Resolve</h2>
          <p className="text-slate-500">Detect and merge duplicate transactions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <button 
                onClick={() => setShowEmailModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
                <Mail size={18} />
                <span className="hidden sm:inline">Client Reporting</span>
            </button>

            <button 
                onClick={() => setShowRulesModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
                <Settings size={18} />
                <span className="hidden sm:inline">Rules ({activeRulesCount})</span>
            </button>

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

          {/* Export Dropdown */}
          <div className="relative">
             <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors shadow-sm h-full"
             >
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown size={14} />
             </button>
             
             {showExportMenu && (
                 <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-20 overflow-hidden">
                        <button onClick={handleExportCSV} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 flex items-center">
                            <FileText size={16} className="mr-2 text-green-600"/> Export as CSV
                        </button>
                        <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 flex items-center border-t border-slate-100">
                            <FileText size={16} className="mr-2 text-red-600"/> Export as PDF
                        </button>
                    </div>
                 </>
             )}
          </div>

          <button
            onClick={runScan}
            disabled={isScanning}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-white font-medium transition-all ${
              isScanning ? 'bg-blue-400 cursor-wait' : user.isQuickBooksConnected ? 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isScanning ? <RotateCcw className="animate-spin" size={18} /> : <Play size={18} />}
            <span>{isScanning ? 'Scanning...' : user.isQuickBooksConnected ? 'Scan Live QB' : 'Run Demo Scan'}</span>
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-6">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          <p className="text-xs text-center mt-1 text-slate-500">
            {scanSource === 'live' ? 'Fetching live data from QuickBooks...' : 'Analyzing transactions...'}
          </p>
        </div>
      )}

      {scanError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start">
          <AlertCircle className="text-red-500 mr-3 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="text-red-800 font-medium text-sm">Scan Failed</p>
            <p className="text-red-600 text-sm mt-1">{scanError}</p>
          </div>
          <button onClick={() => setScanError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      {duplicates.length > 0 && (
        <>
            <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-4">
                <div className="flex items-center text-yellow-800">
                    <AlertCircle className="mr-2" size={20}/>
                    <span>Found {duplicates.length} potential duplicate groups.</span>
                    {scanSource === 'live' && (
                        <span className="ml-2 inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                            <Wifi size={10} className="mr-1"/> Live QB Data
                        </span>
                    )}
                    {scanSource === 'mock' && (
                        <span className="ml-2 inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            <WifiOff size={10} className="mr-1"/> Demo Data
                        </span>
                    )}
                    {duplicates.length !== filteredDuplicates.length && (
                        <span className="ml-2 text-sm text-slate-500">({duplicates.length - filteredDuplicates.length} hidden by filters/rules)</span>
                    )}
                </div>
                {history.length > 0 && (
                    <button onClick={handleUndo} className="flex items-center text-sm text-blue-600 hover:underline">
                        <Undo size={14} className="mr-1"/> Undo last action
                    </button>
                )}
            </div>

            {/* NEW FILTER BAR */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                <div className="flex items-center mb-3 text-slate-700 text-sm font-semibold">
                    <Filter size={16} className="mr-2"/>
                    Filter Results
                    {isFiltering && (
                        <button onClick={clearFilters} className="ml-3 text-xs text-red-500 hover:text-red-700 font-normal flex items-center">
                            <X size={12} className="mr-1"/> Clear All
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center">
                    <FilterPill 
                        id="date" 
                        label="Date Range" 
                        icon={Calendar} 
                        active={!!filterDateStart || !!filterDateEnd}
                        displayValue={filterDateStart ? `${filterDateStart} - ${filterDateEnd || '...'}` : undefined}
                    />
                    <FilterPill 
                        id="type" 
                        label="Transaction Type" 
                        icon={Tag} 
                        active={!!filterType}
                        displayValue={filterType}
                    />
                    <FilterPill 
                        id="accountType" 
                        label="Account Type" 
                        icon={Layers} 
                        active={!!filterAccountType}
                        displayValue={filterAccountType}
                    />
                     <FilterPill 
                        id="contact" 
                        label="Contact" 
                        icon={User} 
                        active={!!filterEntity}
                        displayValue={filterEntity}
                    />
                    <FilterPill 
                        id="amount" 
                        label="Amount" 
                        icon={DollarSign} 
                        active={!!filterMinAmount || !!filterMaxAmount}
                        displayValue={filterMinAmount ? `$${filterMinAmount} - $${filterMaxAmount || '...'}` : undefined}
                    />
                     <FilterPill 
                        id="accounts" 
                        label="Accounts" 
                        icon={Briefcase} 
                        active={!!filterAccount}
                        displayValue={filterAccount}
                    />
                </div>
            </div>

            <div className="space-y-6">
            {filteredDuplicates.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    No transactions match your filters or rules.
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
                            {/* Whitelist Button */}
                            <button 
                                onClick={() => handleAddToExceptions(group)}
                                className="flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 bg-white border border-slate-300 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <ShieldCheck size={14} className="mr-1.5"/>
                                Whitelist
                            </button>
                            
                            {/* Compare / Resolve Button */}
                            <button 
                                onClick={() => handleCompareGroup(group)}
                                className="flex items-center text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
                            >
                                <Split size={14} className="mr-1.5" />
                                Review & Resolve
                            </button>
                        </div>
                    </div>

                    {/* Preview Table (Simplified) */}
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
                                    {/* Mock US Format conversion */}
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
                ))
            )}
            </div>
        </>
      )} 
      
      {duplicates.length === 0 && !isScanning && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <Check className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">All Clean!</h3>
            <p className="text-slate-500">
              {scanSource === 'live'
                ? 'No duplicate transactions found in your QuickBooks data.'
                : 'No duplicate transactions found. Connect QuickBooks for live data.'}
            </p>
            <button onClick={runScan} className="mt-4 text-blue-600 hover:underline">Run check again</button>
            
             {history.length > 0 && (
                <div className="mt-4">
                    <button onClick={handleUndo} className="text-sm text-slate-500 hover:text-blue-600 underline flex items-center justify-center mx-auto">
                         <Undo size={14} className="mr-1"/> Undo my last deletion
                    </button>
                </div>
            )}
          </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {showReviewModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <ArrowRightLeft size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Compare Transactions</h3>
                        <p className="text-sm text-slate-500">Review details side-by-side before merging.</p>
                    </div>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>

            {/* Comparison Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
                {/* Reason Banner */}
                <div className="mb-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start text-sm text-yellow-800">
                    <AlertTriangle className="mr-2 mt-0.5" size={16} />
                    <span>
                        <strong>AI Detection Reason:</strong> {selectedGroup.reason}. 
                        Confidence: {(selectedGroup.confidenceScore * 100).toFixed(0)}%.
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedGroup.transactions.slice(0, 2).map((txn, index) => (
                        <div key={txn.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                             <div className={`p-3 text-center border-b border-slate-200 font-bold ${index === 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-700'}`}>
                                {index === 0 ? 'Potential Primary' : 'Potential Duplicate'}
                             </div>
                             
                             <div className="p-6 space-y-4 flex-1">
                                 <div>
                                     <label className="text-xs font-bold text-slate-400 uppercase">Transaction ID</label>
                                     <div className="text-slate-900 font-mono text-sm">{txn.id}</div>
                                 </div>
                                 
                                 <div className={`p-2 rounded ${selectedGroup.transactions[0].date !== selectedGroup.transactions[1].date ? 'bg-yellow-50' : ''}`}>
                                     <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                                     <div className="text-slate-900 font-medium">{txn.date}</div>
                                 </div>

                                 <div className={`p-2 rounded ${selectedGroup.transactions[0].amount !== selectedGroup.transactions[1].amount ? 'bg-red-50' : 'bg-green-50'}`}>
                                     <label className="text-xs font-bold text-slate-400 uppercase">Amount</label>
                                     <div className="text-xl font-bold text-slate-900">{txn.currency} {txn.amount.toFixed(2)}</div>
                                 </div>

                                 <div className={`p-2 rounded ${selectedGroup.transactions[0].entityName !== selectedGroup.transactions[1].entityName ? 'bg-yellow-50' : ''}`}>
                                     <label className="text-xs font-bold text-slate-400 uppercase">Payee / Entity</label>
                                     <div className="text-slate-900">{txn.entityName}</div>
                                 </div>

                                 <div className={`p-2 rounded ${selectedGroup.transactions[0].account !== selectedGroup.transactions[1].account ? 'bg-yellow-50' : ''}`}>
                                     <label className="text-xs font-bold text-slate-400 uppercase">Account</label>
                                     <div className="text-slate-900 text-sm">{txn.account || '-'}</div>
                                 </div>

                                 <div>
                                     <label className="text-xs font-bold text-slate-400 uppercase">Memo</label>
                                     <div className="text-slate-600 text-sm italic">{txn.memo || 'No memo provided'}</div>
                                 </div>

                                 <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center">
                                      <button 
                                        onClick={() => handleOpenInQB(txn.id, txn.type)}
                                        className="text-blue-600 text-xs hover:underline flex items-center"
                                      >
                                          <ExternalLink size={12} className="mr-1"/> View in QB (Sandbox)
                                      </button>
                                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{txn.type}</span>
                                 </div>
                             </div>

                             <div className="p-4 bg-slate-50 border-t border-slate-200">
                                 <button 
                                    onClick={() => resolveKeepOne(txn.id)}
                                    className="w-full py-3 bg-white border border-slate-300 hover:border-green-500 hover:text-green-600 hover:bg-green-50 text-slate-700 font-bold rounded-lg transition-all shadow-sm flex items-center justify-center"
                                 >
                                     <Check size={18} className="mr-2"/> Keep This One
                                 </button>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end space-x-3">
                 <button 
                    onClick={() => setShowReviewModal(false)}
                    className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                 >
                    Cancel
                 </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Reporting Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-2xl max-w-md w-full flex flex-col">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                     <div className="flex items-center space-x-3">
                         <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                             <Mail size={20} />
                         </div>
                         <div>
                             <h3 className="text-lg font-bold text-slate-800">Client Reporting</h3>
                             <p className="text-slate-500 text-xs">Automate scan summaries for your clients.</p>
                         </div>
                     </div>
                     <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600">
                         <X size={20}/>
                     </button>
                 </div>
                 
                 <div className="p-6 space-y-4">
                     <div>
                         <label className="block text-sm font-semibold text-slate-700 mb-1">Recipient Emails</label>
                         <p className="text-xs text-slate-400 mb-2">Separate multiple emails with commas.</p>
                         <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="client@company.com, accountant@firm.com"
                            value={emailRecipients}
                            onChange={(e) => setEmailRecipients(e.target.value)}
                         />
                     </div>
                     
                     <div>
                         <label className="block text-sm font-semibold text-slate-700 mb-1">Report Frequency</label>
                         <div className="relative">
                             <Calendar className="absolute top-2.5 left-3 text-slate-400" size={16} />
                             <select 
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={emailFrequency}
                                onChange={(e) => setEmailFrequency(e.target.value)}
                             >
                                 <option value="daily">Daily Summary</option>
                                 <option value="weekly">Weekly Report</option>
                                 <option value="monthly">Monthly Audit</option>
                             </select>
                         </div>
                     </div>

                     <div className="bg-blue-50 p-3 rounded-lg flex items-start text-xs text-blue-800 border border-blue-100">
                         <AlertCircle size={14} className="mr-2 mt-0.5 shrink-0" />
                         Reports will include number of duplicates found, amount saved, and resolution status based on your {emailFrequency} scans.
                     </div>
                 </div>
                 
                 <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 rounded-b-xl">
                     <button 
                        onClick={() => setShowEmailModal(false)} 
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={handleSaveEmailSettings}
                        disabled={isSavingEmail}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center disabled:opacity-70"
                     >
                        {isSavingEmail ? 'Saving...' : (
                            <>
                                <Save size={16} className="mr-2" /> Save Settings
                            </>
                        )}
                     </button>
                 </div>
             </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                     <div>
                        <h3 className="text-xl font-bold text-slate-800">Smart Exclusion Rules</h3>
                        <p className="text-slate-500 text-sm">Automatically filter out false positives.</p>
                     </div>
                     <button onClick={() => setShowRulesModal(false)} className="text-slate-400 hover:text-slate-600">
                         <X size={24}/>
                     </button>
                 </div>
                 
                 <div className="p-6 overflow-y-auto flex-1">
                     {/* Add New Rule */}
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                         <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                             <Plus size={16} className="mr-1"/> Add New Rule
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                             <div className="md:col-span-4">
                                 <input 
                                    type="text" 
                                    placeholder="Rule Name (e.g. Ignore Uber)" 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newRule.name}
                                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                                 />
                             </div>
                             <div className="md:col-span-3">
                                 <select 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                                    value={newRule.type}
                                    onChange={(e) => setNewRule(prev => ({ ...prev, type: e.target.value as any }))}
                                 >
                                     <option value="vendor_contains">Vendor Contains</option>
                                     <option value="description_contains">Memo Contains</option>
                                     <option value="amount_below">Amount Below</option>
                                 </select>
                             </div>
                             <div className="md:col-span-3">
                                 <input 
                                    type={newRule.type === 'amount_below' ? "number" : "text"}
                                    placeholder="Value" 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newRule.value || ''}
                                    onChange={(e) => setNewRule(prev => ({ 
                                        ...prev, 
                                        value: newRule.type === 'amount_below' ? parseFloat(e.target.value) : e.target.value 
                                    }))}
                                 />
                             </div>
                             <div className="md:col-span-2">
                                 <button 
                                    onClick={handleAddRule}
                                    className="w-full h-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
                                 >
                                     Add
                                 </button>
                             </div>
                         </div>
                     </div>

                     {/* Rules List */}
                     <div className="space-y-3">
                         <h4 className="text-sm font-bold text-slate-700">Active Rules</h4>
                         {rules.length === 0 && <p className="text-slate-400 text-sm italic">No rules defined.</p>}
                         {rules.map(rule => (
                             <div key={rule.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                                 <div className="flex items-center space-x-3">
                                     <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                                         <ShieldCheck size={18}/>
                                     </div>
                                     <div>
                                         <p className="font-medium text-slate-800 text-sm">{rule.name}</p>
                                         <p className="text-xs text-slate-500">
                                             {rule.type === 'amount_below' ? `Amount < ${rule.value}` : 
                                              rule.type === 'vendor_contains' ? `Vendor contains "${rule.value}"` :
                                              `Memo contains "${rule.value}"`}
                                         </p>
                                     </div>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                     <button 
                                        onClick={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r))}
                                        className={`text-xs px-2 py-1 rounded font-medium border ${rule.isActive ? 'bg-white border-slate-300 text-slate-600' : 'bg-slate-100 text-slate-400'}`}
                                     >
                                         {rule.isActive ? 'Disable' : 'Enable'}
                                     </button>
                                     <button onClick={() => handleDeleteRule(rule.id)} className="text-slate-400 hover:text-red-500 p-1">
                                         <Trash2 size={16}/>
                                     </button>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
                 
                 <div className="p-4 border-t border-slate-100 flex justify-end">
                     <button onClick={() => setShowRulesModal(false)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Done</button>
                 </div>
             </div>
        </div>
      )}

      {/* Undo Toast Notification */}
      {showUndoToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-4 z-50 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col">
                <span className="font-medium text-sm">Transaction resolved.</span>
                <span className="text-xs text-slate-400">Moved to archive (secure backup created).</span>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <button onClick={handleUndo} className="text-blue-400 hover:text-blue-300 font-bold text-sm flex items-center">
                <Undo size={16} className="mr-1.5"/> UNDO
            </button>
            <button onClick={() => setShowUndoToast(false)} className="text-slate-500 hover:text-slate-300 ml-2">
                <X size={16} />
            </button>
        </div>
      )}

    </div>
  );
};

export default ScanManager;