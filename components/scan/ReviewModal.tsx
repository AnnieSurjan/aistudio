import React from 'react';
import { DuplicateGroup, UserProfile } from '../../types';
import { X, ArrowRightLeft, AlertTriangle, ExternalLink, Check, Ban } from 'lucide-react';

interface ReviewModalProps {
  selectedGroup: DuplicateGroup;
  user: UserProfile;
  onResolveKeepOne: (txnId: string) => void;
  onResolveKeepBoth: () => void;
  onOpenSource: (txnId: string, type: string) => void;
  onClose: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ selectedGroup, user, onResolveKeepOne, onResolveKeepBoth, onOpenSource, onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95 duration-200">
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col h-[90vh]">

      {/* Header */}
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
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
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
                    onClick={() => onOpenSource(txn.id, txn.type)}
                    className="text-blue-600 text-xs hover:underline flex items-center"
                  >
                    <ExternalLink size={12} className="mr-1" />
                    {user.isXeroConnected && !user.isQuickBooksConnected ? 'View in Xero' : 'View in QB (Sandbox)'}
                  </button>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{txn.type}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <button
                  onClick={() => onResolveKeepOne(txn.id)}
                  className="w-full py-3 bg-white border border-slate-300 hover:border-green-500 hover:text-green-600 hover:bg-green-50 text-slate-700 font-bold rounded-lg transition-all shadow-sm flex items-center justify-center"
                >
                  <Check size={18} className="mr-2" /> Keep This One
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
        <button
          onClick={onResolveKeepBoth}
          className="px-6 py-2 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-all font-medium flex items-center"
          title="Dismiss this group and keep both transactions"
        >
          <Ban size={16} className="mr-2" />
          Dismiss (Keep Both)
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default ReviewModal;
