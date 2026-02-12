import React, { useState } from 'react';
import { X, FileText, Shield, Scale, Lock, Building } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-slate-800 rounded-lg">
                <Scale size={20} className="text-slate-200"/>
             </div>
             <div>
                <h2 className="text-lg font-bold">Legal & Compliance</h2>
                <p className="text-xs text-slate-400">Dat-assist Kft.</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
            <button 
                onClick={() => setActiveTab('terms')}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide flex items-center justify-center space-x-2 transition-colors border-b-2 ${activeTab === 'terms' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <FileText size={16}/>
                <span>Terms of Service</span>
            </button>
            <button 
                onClick={() => setActiveTab('privacy')}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide flex items-center justify-center space-x-2 transition-colors border-b-2 ${activeTab === 'privacy' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Shield size={16}/>
                <span>Privacy Policy</span>
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-700 leading-relaxed">
            {activeTab === 'terms' ? (
                <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Terms of Service</h3>
                        <p className="text-sm text-slate-500">Last updated: October 26, 2023</p>
                    </div>

                    <section>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">1. Introduction</h4>
                        <p className="text-sm">
                            Welcome to Dup-Detect. These Terms of Service govern your use of the application operated by <strong>Dat-assist Kft.</strong> ("we", "us", or "our"), registered in Hungary. By accessing or using our Service, you agree to be bound by these Terms.
                        </p>
                    </section>

                    <section>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">2. Description of Service</h4>
                        <p className="text-sm">
                            Dup-Detect is a SaaS application designed to identify duplicate transactions in QuickBooks Online. While we utilize advanced AI algorithms (powered by Google Gemini) to detect anomalies, <strong>Dat-assist Kft. does not guarantee 100% accuracy</strong>. Users are solely responsible for reviewing and confirming any deletions or modifications to their financial data.
                        </p>
                    </section>

                    <section>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">3. Subscription & Payments</h4>
                        <p className="text-sm">
                            Our order process is conducted by our online reseller <strong>Paddle.com</strong>. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns. Prices are exclusive of VAT/Sales Tax, which will be calculated at checkout based on your location.
                        </p>
                    </section>

                    <section>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">4. User Responsibilities</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                            <li>You must maintain the confidentiality of your account credentials.</li>
                            <li>You agree not to use the Service for any illegal activities.</li>
                            <li>You acknowledge that you retain full ownership and liability for your QuickBooks data.</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">5. Limitation of Liability</h4>
                        <p className="text-sm">
                            To the maximum extent permitted by applicable law, Dat-assist Kft. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
                        </p>
                    </section>

                    <section>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">6. Governing Law</h4>
                        <p className="text-sm">
                            These Terms shall be governed and construed in accordance with the laws of <strong>Hungary</strong>, without regard to its conflict of law provisions.
                        </p>
                    </section>
                </div>
            ) : (
                <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Privacy Policy</h3>
                        <p className="text-sm text-slate-500">Effective Date: October 26, 2023</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start space-x-3">
                        <Building className="text-blue-600 shrink-0 mt-1" size={20}/>
                        <div className="text-sm text-blue-800">
                            <strong>Data Controller:</strong> Dat-assist Kft.<br/>
                            <strong>Location:</strong> Budapest, Hungary (EU)<br/>
                            <strong>Contact:</strong> privacy@dat-assist.hu
                        </div>
                    </div>

                    <section>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">1. Data We Collect</h4>
                        <p className="text-sm mb-2">We collect the following types of information:</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-2 text-slate-600">
                            <li><strong>Account Information:</strong> Name, email address, company name.</li>
                            <li><strong>Financial Data:</strong> Transaction metadata (amount, date, vendor, memo) fetched via QuickBooks Online API.</li>
                            <li><strong>Usage Data:</strong> Logs of scans performed and actions taken.</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">2. How We Use Your Data</h4>
                        <p className="text-sm">
                            We use your financial data <strong>solely for the purpose of identifying duplicates</strong>. We do not sell, trade, or rent your financial transaction data to third parties. Data is processed transiently during scans and stored securely for audit logs and undo functionality.
                        </p>
                    </section>

                    <section>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">3. Third-Party Processors</h4>
                        <p className="text-sm mb-2">We engage trusted third-party service providers:</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-2 text-slate-600">
                            <li><strong>Google Gemini (Vertex AI):</strong> Used for analyzing transaction patterns. Data is anonymized where possible.</li>
                            <li><strong>Paddle:</strong> For payment processing. We do not store credit card details.</li>
                            <li><strong>Intuit QuickBooks:</strong> As the data source provider.</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">4. Data Retention & Deletion</h4>
                        <p className="text-sm">
                            We retain audit logs for 1 year to comply with security standards. You may request the deletion of your account and all associated data at any time by contacting support. Upon termination, connection tokens to QuickBooks are immediately revoked.
                        </p>
                    </section>

                    <section>
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">5. GDPR Rights</h4>
                        <p className="text-sm">
                            If you are a resident of the European Economic Area (EEA), you have certain data protection rights, including the right to access, correct, update, or delete your personal information.
                        </p>
                    </section>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;