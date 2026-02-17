import React, { useState, useEffect, useRef } from 'react';
import { DuplicateGroup, Transaction, UserProfile, ExclusionRule } from '../types';
import { detectDuplicates, MOCK_TRANSACTIONS } from '../services/mockData';
import { Play, RotateCcw, Check, AlertCircle, Download, Undo, Settings, Mail, FileText, ChevronDown, Wifi, WifiOff } from 'lucide-react';

import ScanTerminal from './scan/ScanTerminal';
import ReviewModal from './scan/ReviewModal';
import EmailReportingModal from './scan/EmailReportingModal';
import RulesModal from './scan/RulesModal';
import FilterBar from './scan/FilterBar';
import DuplicateGroupCard from './scan/DuplicateGroupCard';
import UndoToast from './scan/UndoToast';
import DirectorModeTools from './scan/DirectorModeTools';

const PRODUCTION_BACKEND_URL = window.location.origin;

interface ScanManagerProps {
  onExport: () => void;
  onAddAuditLog: (action: string, details: string, type: 'info' | 'warning' | 'danger' | 'success') => void;
  user: UserProfile;
}

const ScanManager: React.FC<ScanManagerProps> = ({ onExport, onAddAuditLog, user }) => {
  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [scanSource, setScanSource] = useState<'live' | 'mock' | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [liveSources, setLiveSources] = useState<string[]>([]);

  // Undo state
  const [history, setHistory] = useState<DuplicateGroup[]>([]);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const undoTimeoutRef = useRef<any>(null);

  // UI state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [scanSchedule, setScanSchedule] = useState('daily');
  const [showDemoTools, setShowDemoTools] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Filter state
  const [filterEntity, setFilterEntity] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAccountType, setFilterAccountType] = useState('');
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);

  // Rules state
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rules, setRules] = useState<ExclusionRule[]>([
    { id: '1', name: 'Ignore small variances', type: 'amount_below', value: 5, isActive: true }
  ]);
  const [newRule, setNewRule] = useState<Partial<ExclusionRule>>({ type: 'vendor_contains', isActive: true, name: '' });

  // Email state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('client@example.com');
  const [emailFrequency, setEmailFrequency] = useState('weekly');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  useEffect(() => {
    return () => { if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current); };
  }, []);

  // --- Helpers ---
  const formatDateUS = (isoDate: string) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${m}/${d}/${y}`;
  };

  // --- Demo Mode ---
  const triggerDemoScenario = (scenario: 'scan_running' | 'results_found' | 'all_clean') => {
    setIsScanning(false);
    setDuplicates([]);
    setScanLog([]);
    setShowReviewModal(false);
    setShowUndoToast(false);

    if (scenario === 'scan_running') {
      setIsScanning(true);
      setProgress(67);
      setScanLog([
        'Initializing AI engine... OK',
        'Fetching recent transactions from QuickBooks... OK',
        'Analyzing Invoice #1042 vs #1089...',
        'Checking fuzzy match logic on "Office Dept" vs "Office Depot"...',
        '> Potential match identified (Confidence: 85%)',
        'Cross-referencing currency exchange rates...'
      ]);
    } else if (scenario === 'results_found') {
      setDuplicates(detectDuplicates(MOCK_TRANSACTIONS));
      onAddAuditLog('Demo', 'Injected demo results for screenshot', 'warning');
    } else if (scenario === 'all_clean') {
      setDuplicates([]);
      onAddAuditLog('Demo', 'Cleared all results for screenshot', 'success');
    }
    setShowDemoTools(false);
  };

  // --- Scan ---
  const runScan = async () => {
    setIsScanning(true);
    setProgress(0);
    setDuplicates([]);
    setHistory([]);
    setScanLog(['Initializing AI engine...']);
    setShowUndoToast(false);
    setScanError(null);
    setLiveSources([]);

    const isQBConnected = user.isQuickBooksConnected;
    const isXeroConnected = user.isXeroConnected;
    const hasLiveSource = isQBConnected || isXeroConnected;

    if (hasLiveSource) {
      const sources: string[] = [];
      if (isQBConnected) sources.push('QuickBooks');
      if (isXeroConnected) sources.push('Xero');
      setLiveSources(sources);
      setScanLog(prev => [...prev, `Fetching recent transactions from ${sources.join(' + ')}...`]);
      onAddAuditLog('Scan Run', `Live scan initiated from: ${sources.join(' + ')}`, 'info');
      setScanSource('live');
      setProgress(10);

      try {
        const fetchPromises: Promise<{ transactions: Transaction[]; source: string; companyName: string }>[] = [];

        if (isQBConnected) {
          fetchPromises.push(
            fetch(`${PRODUCTION_BACKEND_URL}/api/quickbooks/scan`, { credentials: 'include' })
              .then(async (res) => {
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err.error || `QuickBooks error: ${res.status}`);
                }
                const data = await res.json();
                return { transactions: data.transactions || [], source: 'QuickBooks', companyName: data.meta?.companyName || 'QB' };
              })
          );
        }
        if (isXeroConnected) {
          fetchPromises.push(
            fetch(`${PRODUCTION_BACKEND_URL}/api/xero/scan`, { credentials: 'include' })
              .then(async (res) => {
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err.error || `Xero error: ${res.status}`);
                }
                const data = await res.json();
                return { transactions: data.transactions || [], source: 'Xero', companyName: data.meta?.companyName || 'Xero' };
              })
          );
        }

        setProgress(20);
        setScanLog(prev => [...prev, '> Connecting to API...']);
        const results = await Promise.all(fetchPromises);
        setProgress(60);

        let allTransactions: Transaction[] = [];
        const sourceNames: string[] = [];
        for (const result of results) {
          allTransactions = [...allTransactions, ...result.transactions];
          sourceNames.push(`${result.companyName} (${result.transactions.length})`);
          setScanLog(prev => [...prev, `> ${result.source}: ${result.transactions.length} transactions loaded`]);
        }

        setProgress(85);
        setScanLog(prev => [...prev, '> Running duplicate detection algorithm...']);
        const detected = detectDuplicates(allTransactions);
        setScanLog(prev => [...prev, `> Analysis complete. ${detected.length} duplicate groups found.`]);
        setProgress(100);
        setIsScanning(false);
        setDuplicates(detected);

        const summaryMsg = `Live scan of ${sourceNames.join(' + ')} finished.`;
        if (detected.length > 0) {
          onAddAuditLog('Scan Completed', `${summaryMsg} Found ${detected.length} duplicate groups from ${allTransactions.length} transactions.`, 'warning');
        } else {
          onAddAuditLog('Scan Completed', `${summaryMsg} No duplicates found in ${allTransactions.length} transactions.`, 'success');
        }
      } catch (error) {
        console.error('[Scan] API error:', error);
        setScanLog(prev => [...prev, `> ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`]);
        setIsScanning(false);
        setProgress(0);
        setScanError(error instanceof Error ? error.message : 'Failed to fetch transaction data');
        onAddAuditLog('Scan Failed', `Live scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'danger');
      }
    } else {
      setScanLog(prev => [...prev, 'Fetching recent transactions from QuickBooks...', 'Fetching recent transactions from Xero...']);
      onAddAuditLog('Scan Run', 'Demo scan initiated (mock data - connect QuickBooks or Xero for live data)', 'info');
      setScanSource('mock');

      let step = 0;
      const interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 5;
          if (next >= 100) {
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
          if (step % 4 === 0) {
            const logs = [
              `Analyzing Invoice #${1000 + step}... OK`,
              `Comparing Vendor "Acme Corp" vs "Acme Inc"...`,
              `Checking Invoice #${1000 + step + 1}... Potential Match Found`,
              `Verifying currency consistency (USD/EUR)...`,
              `Cross-referencing Purchase Orders...`,
              `Applying exclusion rules...`
            ];
            const randomLog = logs[Math.floor(Math.random() * logs.length)];
            setScanLog(prev => [...prev.slice(-4), `> ${randomLog}`]);
          }
          step++;
          return next;
        });
      }, 150);
    }
  };

  // --- Resolution ---
  const handleCompareGroup = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    setShowReviewModal(true);
  };

  const handleOpenSource = (txnId: string, type: string) => {
    if (user.isXeroConnected && !user.isQuickBooksConnected) {
      alert(`Opening Xero Transaction ${txnId}...\n\n(Simulated Link to Xero)`);
      return;
    }
    alert("Opening QuickBooks Sandbox...\n\nNote: You must be logged into your QBO Sandbox account in another tab for this link to load correctly, otherwise it may hang.");
    const baseUrl = "https://app.sandbox.qbo.intuit.com/app";
    let path = "";
    switch (type.toLowerCase()) {
      case 'invoice': path = 'invoice'; break;
      case 'bill': path = 'bill'; break;
      case 'payment': path = 'payment'; break;
      case 'journalentry': path = 'journal'; break;
      default: path = 'sales';
    }
    window.open(`${baseUrl}/${path}?txnId=${txnId}`, '_blank', 'noopener,noreferrer');
  };

  const triggerUndoToast = () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setShowUndoToast(true);
    undoTimeoutRef.current = setTimeout(() => setShowUndoToast(false), 5000);
  };

  const resolveKeepOne = (txnIdToKeep: string) => {
    if (!selectedGroup) return;
    const toDelete = selectedGroup.transactions.filter(t => t.id !== txnIdToKeep);
    const keptTxn = selectedGroup.transactions.find(t => t.id === txnIdToKeep);
    setHistory((prev) => [...prev, selectedGroup]);
    onAddAuditLog('Resolve', `Resolved group ${selectedGroup.id}. Kept ${keptTxn?.id}, archived ${toDelete.length} others.`, 'success');
    setDuplicates((prev) => prev.filter((g) => g.id !== selectedGroup.id));
    setShowReviewModal(false);
    setSelectedGroup(null);
    triggerUndoToast();
  };

  const resolveKeepBoth = () => {
    if (!selectedGroup) return;
    setHistory((prev) => [...prev, selectedGroup]);
    onAddAuditLog('Dismiss', `Dismissed group ${selectedGroup.id}. Kept all transactions.`, 'info');
    setDuplicates((prev) => prev.filter((g) => g.id !== selectedGroup.id));
    setShowReviewModal(false);
    setSelectedGroup(null);
    triggerUndoToast();
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const groupToRestore = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setDuplicates((prev) => [groupToRestore, ...prev]);
    onAddAuditLog('Undo', `Restored group ${groupToRestore.id} from history.`, 'warning');
    setShowUndoToast(false);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  // --- Export ---
  const handleExportCSV = () => {
    if (duplicates.length === 0) { alert("No duplicates to export."); return; }
    const headers = ['Group ID', 'Reason', 'Confidence', 'Txn ID', 'Date', 'Entity', 'Account', 'Amount', 'Currency', 'Memo'];
    const rows = duplicates.flatMap(group =>
      group.transactions.map(txn => [
        group.id, `"${group.reason}"`, group.confidenceScore, txn.id, txn.date,
        `"${txn.entityName}"`, `"${txn.account || ''}"`, txn.amount, txn.currency, `"${txn.memo || ''}"`
      ].join(','))
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dup-detect_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
    onAddAuditLog('Export', `Exported ${rows.length} duplicate transactions to CSV`, 'info');
  };

  const handleExportPDF = () => {
    if (duplicates.length === 0) { alert("No duplicates to export."); return; }
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const html = `
        <html><head><title>Duplicate Report - Dup-Detect</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          .meta { color: #64748b; margin-bottom: 20px; font-size: 0.9em; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 0.85em; border: 1px solid #cbd5e1; }
          td { padding: 8px; font-size: 0.85em; border: 1px solid #cbd5e1; }
          .group-header { background: #e0f2fe; font-weight: bold; }
          .amount { text-align: right; font-family: monospace; }
        </style></head><body>
        <h1>Duplicate Transaction Report</h1>
        <div class="meta">Generated on: ${new Date().toLocaleString()}<br/>Total Groups Found: ${duplicates.length}<br/>Generated by: ${user.name}</div>
        <table><thead><tr><th>ID</th><th>Date</th><th>Entity</th><th>Account</th><th>Memo</th><th>Amount</th></tr></thead>
        <tbody>${duplicates.map(group => `
          <tr class="group-header"><td colspan="6">Group: ${group.id} - ${group.reason} (${(group.confidenceScore * 100).toFixed(0)}%)</td></tr>
          ${group.transactions.map(t => `<tr><td>${t.id}</td><td>${t.date}</td><td>${t.entityName}</td><td>${t.account || '-'}</td><td>${t.memo || '-'}</td><td class="amount">${t.currency} ${t.amount.toFixed(2)}</td></tr>`).join('')}
        `).join('')}</tbody></table>
        <script>window.print();</script></body></html>`;
      printWindow.document.write(html);
      printWindow.document.close();
      onAddAuditLog('Export', `Generated PDF report for ${duplicates.length} groups`, 'info');
    }
    setShowExportMenu(false);
  };

  // --- Rules ---
  const handleAddToExceptions = (group: DuplicateGroup) => {
    const vendorName = group.transactions[0].entityName;
    setNewRule({ name: `Ignore ${vendorName}`, type: 'vendor_contains', value: vendorName, isActive: true });
    setShowRulesModal(true);
  };

  const handleAddRule = () => {
    if (!newRule.name || !newRule.value) return;
    const rule: ExclusionRule = {
      id: Date.now().toString(), name: newRule.name, type: newRule.type as any, value: newRule.value, isActive: true
    };
    setRules(prev => [...prev, rule]);
    onAddAuditLog('Rule Created', `Created exclusion rule: ${rule.name}`, 'info');
    setNewRule({ type: 'vendor_contains', isActive: true, name: '' });
  };

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  // --- Email ---
  const handleSaveEmailSettings = () => {
    setIsSavingEmail(true);
    setTimeout(() => {
      setIsSavingEmail(false);
      setShowEmailModal(false);
      onAddAuditLog('Reporting', `Updated client reporting: ${emailFrequency} emails to ${emailRecipients}`, 'success');
    }, 1000);
  };

  // --- Filters ---
  const filters = {
    filterEntity, filterMinAmount, filterMaxAmount,
    filterDateStart, filterDateEnd, filterAccount,
    filterType, filterAccountType
  };

  const isFiltering = !!(filterEntity || filterMinAmount || filterMaxAmount || filterDateStart || filterDateEnd || filterAccount || filterType || filterAccountType);
  const activeRulesCount = rules.filter(r => r.isActive).length;

  const handleFilterChange = (key: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      filterEntity: setFilterEntity, filterMinAmount: setFilterMinAmount, filterMaxAmount: setFilterMaxAmount,
      filterDateStart: setFilterDateStart, filterDateEnd: setFilterDateEnd, filterAccount: setFilterAccount,
      filterType: setFilterType, filterAccountType: setFilterAccountType,
    };
    setters[key]?.(value);
  };

  const clearFilters = () => {
    setFilterEntity(''); setFilterMinAmount(''); setFilterMaxAmount('');
    setFilterDateStart(''); setFilterDateEnd(''); setFilterAccount('');
    setFilterType(''); setFilterAccountType(''); setActiveFilterDropdown(null);
  };

  const filteredDuplicates = duplicates.filter(group => {
    const mainTxn = group.transactions[0];

    for (const rule of rules) {
      if (!rule.isActive) continue;
      if (rule.type === 'amount_below' && typeof rule.value === 'number' && mainTxn.amount < rule.value) return false;
      if (rule.type === 'vendor_contains' && typeof rule.value === 'string' && mainTxn.entityName.toLowerCase().includes(rule.value.toLowerCase())) return false;
      if (rule.type === 'description_contains' && typeof rule.value === 'string' && mainTxn.memo && mainTxn.memo.toLowerCase().includes(rule.value.toLowerCase())) return false;
    }

    const matchesEntity = mainTxn.entityName.toLowerCase().includes(filterEntity.toLowerCase());
    let matchesDate = true;
    const txnDate = new Date(mainTxn.date);
    if (filterDateStart && txnDate < new Date(filterDateStart)) matchesDate = false;
    if (filterDateEnd && txnDate > new Date(filterDateEnd)) matchesDate = false;
    const matchesAccount = filterAccount === '' || (mainTxn.account && mainTxn.account.toLowerCase().includes(filterAccount.toLowerCase()));
    const matchesType = filterType === '' || mainTxn.type === filterType;

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

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="space-y-6 relative">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Scan & Resolve</h2>
          <p className="text-slate-500">Detect and merge duplicate transactions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowEmailModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <Mail size={18} /><span className="hidden sm:inline">Client Reporting</span>
          </button>
          <button onClick={() => setShowRulesModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <Settings size={18} /><span className="hidden sm:inline">Rules ({activeRulesCount})</span>
          </button>
          <div className="relative">
            <select value={scanSchedule} onChange={(e) => setScanSchedule(e.target.value)}
              className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 text-sm h-full shadow-sm">
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
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center space-x-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors shadow-sm h-full">
              <Download size={18} /><span className="hidden sm:inline">Export</span><ChevronDown size={14} />
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

          <button onClick={runScan} disabled={isScanning}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-white font-medium transition-all ${
              isScanning ? 'bg-blue-400 cursor-wait' : (user.isQuickBooksConnected || user.isXeroConnected) ? 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}>
            {isScanning ? <RotateCcw className="animate-spin" size={18} /> : <Play size={18} />}
            <span>{isScanning ? 'Scanning...' : (user.isQuickBooksConnected || user.isXeroConnected) ? `Scan Live${user.isQuickBooksConnected && user.isXeroConnected ? ' (QB + Xero)' : user.isXeroConnected ? ' Xero' : ' QB'}` : 'Run Demo Scan'}</span>
          </button>
        </div>
      </div>

      {/* Scan Terminal */}
      {isScanning && (
        <ScanTerminal progress={progress} scanLog={scanLog} scanSource={scanSource} liveSources={liveSources} />
      )}

      {/* Results */}
      {duplicates.length > 0 && (
        <>
          <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center text-yellow-800">
              <AlertCircle className="mr-2" size={20}/>
              <span>Found {duplicates.length} potential duplicate groups.</span>
              {scanSource === 'live' && (
                <span className="ml-2 inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  <Wifi size={10} className="mr-1"/> Live Data ({liveSources.join(' + ')})
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

          <FilterBar
            filters={filters}
            isFiltering={isFiltering}
            activeFilterDropdown={activeFilterDropdown}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            onSetActiveDropdown={setActiveFilterDropdown}
            formatDateUS={formatDateUS}
          />

          <div className="space-y-6">
            {filteredDuplicates.length === 0 ? (
              <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                No transactions match your filters or rules.
              </div>
            ) : (
              filteredDuplicates.map((group) => (
                <DuplicateGroupCard
                  key={group.id}
                  group={group}
                  onCompare={handleCompareGroup}
                  onWhitelist={handleAddToExceptions}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {duplicates.length === 0 && !isScanning && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <Check className="mx-auto h-12 w-12 text-green-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">All Clean!</h3>
          <p className="text-slate-500">
            {scanSource === 'live'
              ? `No duplicate transactions found in your ${liveSources.join(' + ')} data.`
              : 'No duplicate transactions found. Connect QuickBooks or Xero for live data.'}
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

      {/* Modals */}
      {showReviewModal && selectedGroup && (
        <ReviewModal
          selectedGroup={selectedGroup}
          user={user}
          onResolveKeepOne={resolveKeepOne}
          onResolveKeepBoth={resolveKeepBoth}
          onOpenSource={handleOpenSource}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {showEmailModal && (
        <EmailReportingModal
          emailRecipients={emailRecipients}
          emailFrequency={emailFrequency}
          isSavingEmail={isSavingEmail}
          onRecipientsChange={setEmailRecipients}
          onFrequencyChange={setEmailFrequency}
          onSave={handleSaveEmailSettings}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      {showRulesModal && (
        <RulesModal
          rules={rules}
          newRule={newRule}
          onNewRuleChange={setNewRule}
          onAddRule={handleAddRule}
          onDeleteRule={handleDeleteRule}
          onToggleRule={handleToggleRule}
          onClose={() => setShowRulesModal(false)}
        />
      )}

      {/* Undo Toast */}
      {showUndoToast && (
        <UndoToast onUndo={handleUndo} onDismiss={() => setShowUndoToast(false)} />
      )}

      {/* Director Mode */}
      <DirectorModeTools
        show={showDemoTools}
        onToggle={setShowDemoTools}
        onTrigger={triggerDemoScenario}
      />
    </div>
  );
};

export default ScanManager;
