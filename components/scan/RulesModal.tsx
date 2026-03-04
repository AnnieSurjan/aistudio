import React from 'react';
import { ExclusionRule } from '../../types';
import { X, Plus, ShieldCheck, Trash2 } from 'lucide-react';

interface RulesModalProps {
  rules: ExclusionRule[];
  newRule: Partial<ExclusionRule>;
  onNewRuleChange: (rule: Partial<ExclusionRule>) => void;
  onAddRule: () => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({
  rules, newRule, onNewRuleChange, onAddRule, onDeleteRule, onToggleRule, onClose
}) => (
  <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Smart Exclusion Rules</h3>
          <p className="text-slate-500 text-sm">Automatically filter out false positives.</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {/* Add New Rule */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
          <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
            <Plus size={16} className="mr-1" /> Add New Rule
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <input
                type="text"
                placeholder="Rule Name (e.g. Ignore Uber)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={newRule.name}
                onChange={(e) => onNewRuleChange({ ...newRule, name: e.target.value })}
              />
            </div>
            <div className="md:col-span-3">
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                value={newRule.type}
                onChange={(e) => onNewRuleChange({ ...newRule, type: e.target.value as any })}
              >
                <option value="vendor_contains">Vendor Contains</option>
                <option value="description_contains">Memo Contains</option>
                <option value="amount_below">Amount Below</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <input
                type={newRule.type === 'amount_below' ? 'number' : 'text'}
                placeholder="Value"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={newRule.value || ''}
                onChange={(e) => onNewRuleChange({
                  ...newRule,
                  value: newRule.type === 'amount_below' ? parseFloat(e.target.value) : e.target.value
                })}
              />
            </div>
            <div className="md:col-span-2">
              <button
                onClick={onAddRule}
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
                  <ShieldCheck size={18} />
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
                  onClick={() => onToggleRule(rule.id)}
                  className={`text-xs px-2 py-1 rounded font-medium border ${rule.isActive ? 'bg-white border-slate-300 text-slate-600' : 'bg-slate-100 text-slate-400'}`}
                >
                  {rule.isActive ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => onDeleteRule(rule.id)} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 flex justify-end">
        <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Done</button>
      </div>
    </div>
  </div>
);

export default RulesModal;
