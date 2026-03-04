import React from 'react';
import { TransactionType } from '../../types';
import { Filter, X, ChevronDown, Calendar, Tag, Layers, User, DollarSign, Briefcase } from 'lucide-react';

interface FilterState {
  filterEntity: string;
  filterMinAmount: string;
  filterMaxAmount: string;
  filterDateStart: string;
  filterDateEnd: string;
  filterAccount: string;
  filterType: string;
  filterAccountType: string;
}

interface FilterBarProps {
  filters: FilterState;
  isFiltering: boolean;
  activeFilterDropdown: string | null;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
  onSetActiveDropdown: (id: string | null) => void;
  formatDateUS: (isoDate: string) => string;
}

const FilterPill = ({
  id, label, icon: Icon, active, displayValue, activeFilterDropdown, onToggle, children
}: {
  id: string; label: string; icon: any; active: boolean; displayValue?: string;
  activeFilterDropdown: string | null; onToggle: (id: string | null) => void;
  children: React.ReactNode;
}) => (
  <div className="relative inline-block mr-2 mb-2">
    <button
      onClick={() => onToggle(activeFilterDropdown === id ? null : id)}
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
    {activeFilterDropdown === id && (
      <>
        <div className="fixed inset-0 z-10" onClick={() => onToggle(null)}></div>
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-20 w-72 p-4 animate-in fade-in zoom-in-95">
          {children}
        </div>
      </>
    )}
  </div>
);

const FilterBar: React.FC<FilterBarProps> = ({
  filters, isFiltering, activeFilterDropdown,
  onFilterChange, onClearFilters, onSetActiveDropdown, formatDateUS
}) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
    <div className="flex items-center mb-3 text-slate-700 text-sm font-semibold">
      <Filter size={16} className="mr-2" />
      Filter Results
      {isFiltering && (
        <button onClick={onClearFilters} className="ml-3 text-xs text-red-500 hover:text-red-700 font-normal flex items-center">
          <X size={12} className="mr-1" /> Clear All
        </button>
      )}
    </div>

    <div className="flex flex-wrap items-center">
      <FilterPill
        id="date" label="Date Range" icon={Calendar}
        active={!!filters.filterDateStart || !!filters.filterDateEnd}
        displayValue={filters.filterDateStart ? `${formatDateUS(filters.filterDateStart)} - ${formatDateUS(filters.filterDateEnd) || '...'}` : undefined}
        activeFilterDropdown={activeFilterDropdown} onToggle={onSetActiveDropdown}
      >
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-slate-800">Date Range (USA Format)</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-slate-500">From (MM/DD/YYYY)</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={filters.filterDateStart} onChange={e => onFilterChange('filterDateStart', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500">To (MM/DD/YYYY)</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={filters.filterDateEnd} onChange={e => onFilterChange('filterDateEnd', e.target.value)} />
            </div>
          </div>
        </div>
      </FilterPill>

      <FilterPill
        id="type" label="Transaction Type" icon={Tag}
        active={!!filters.filterType} displayValue={filters.filterType}
        activeFilterDropdown={activeFilterDropdown} onToggle={onSetActiveDropdown}
      >
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-slate-800">Transaction Type</h4>
          <select value={filters.filterType} onChange={(e) => onFilterChange('filterType', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="">All Types</option>
            {Object.values(TransactionType).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </FilterPill>

      <FilterPill
        id="accountType" label="Account Type" icon={Layers}
        active={!!filters.filterAccountType} displayValue={filters.filterAccountType}
        activeFilterDropdown={activeFilterDropdown} onToggle={onSetActiveDropdown}
      >
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-slate-800">Account Type</h4>
          <select value={filters.filterAccountType} onChange={(e) => onFilterChange('filterAccountType', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="">All Account Types</option>
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Equity">Equity</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
        </div>
      </FilterPill>

      <FilterPill
        id="contact" label="Contact" icon={User}
        active={!!filters.filterEntity} displayValue={filters.filterEntity}
        activeFilterDropdown={activeFilterDropdown} onToggle={onSetActiveDropdown}
      >
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-slate-800">Contact / Entity</h4>
          <input type="text" placeholder="Vendor, Customer, Employee"
            value={filters.filterEntity} onChange={(e) => onFilterChange('filterEntity', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" autoFocus />
        </div>
      </FilterPill>

      <FilterPill
        id="amount" label="Amount" icon={DollarSign}
        active={!!filters.filterMinAmount || !!filters.filterMaxAmount}
        displayValue={filters.filterMinAmount ? `$${filters.filterMinAmount} - $${filters.filterMaxAmount || '...'}` : undefined}
        activeFilterDropdown={activeFilterDropdown} onToggle={onSetActiveDropdown}
      >
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-slate-800">Amount Range</h4>
          <div className="flex space-x-2">
            <input type="number" placeholder="Min" value={filters.filterMinAmount}
              onChange={(e) => onFilterChange('filterMinAmount', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            <input type="number" placeholder="Max" value={filters.filterMaxAmount}
              onChange={(e) => onFilterChange('filterMaxAmount', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
        </div>
      </FilterPill>

      <FilterPill
        id="accounts" label="Accounts" icon={Briefcase}
        active={!!filters.filterAccount} displayValue={filters.filterAccount}
        activeFilterDropdown={activeFilterDropdown} onToggle={onSetActiveDropdown}
      >
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-slate-800">Specific Account</h4>
          <input type="text" placeholder="e.g. Office Supplies"
            value={filters.filterAccount} onChange={(e) => onFilterChange('filterAccount', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" autoFocus />
        </div>
      </FilterPill>
    </div>
  </div>
);

export default FilterBar;
