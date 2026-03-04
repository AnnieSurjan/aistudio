import React from 'react';
import { X, Mail, Calendar, AlertCircle, Save } from 'lucide-react';

interface EmailReportingModalProps {
  emailRecipients: string;
  emailFrequency: string;
  isSavingEmail: boolean;
  onRecipientsChange: (value: string) => void;
  onFrequencyChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

const EmailReportingModal: React.FC<EmailReportingModalProps> = ({
  emailRecipients, emailFrequency, isSavingEmail,
  onRecipientsChange, onFrequencyChange, onSave, onClose
}) => (
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
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={20} />
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
            onChange={(e) => onRecipientsChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Report Frequency</label>
          <div className="relative">
            <Calendar className="absolute top-2.5 left-3 text-slate-400" size={16} />
            <select
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={emailFrequency}
              onChange={(e) => onFrequencyChange(e.target.value)}
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
          onClick={onClose}
          className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
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
);

export default EmailReportingModal;
