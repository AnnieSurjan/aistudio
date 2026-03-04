import React from 'react';
import { ArrowLeft, Shield, Globe, Lock, Eye } from 'lucide-react';
import Logo from './Logo';

interface PrivacyPageProps {
  onBack: () => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  const today = new Date().toLocaleDateString('hu-HU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <nav className="border-b border-slate-100 py-4 sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
            <button onClick={onBack} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">
                <ArrowLeft size={18} className="mr-2" /> Back to Home
            </button>
            <Logo variant="dark" className="scale-75" />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="border-b border-slate-100 pb-8 mb-12 flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Privacy Policy</h1>
                <p className="text-slate-500">Effective: {today}. GDPR Compliant.</p>
            </div>
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-bold flex items-center mb-1">
                <Globe size={14} className="mr-2" /> Global Protection
            </div>
        </div>

        <div className="space-y-12">
            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <Shield size={24} className="mr-3 text-blue-600" /> Data Controller
                </h2>
                <p className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <strong>Dat-assist Kft.</strong><br />
                    Address: 1051 Budapest, Hungary.<br />
                    Email: privacy@dupdetect.com<br />
                    DPO: dpo@dupdetect.com
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <Eye size={24} className="mr-3 text-blue-600" /> Data We Collect
                </h2>
                <p className="mb-4">To provide our duplicate detection services, we process the following categories of data:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Account Information:</strong> Name, email address, and company details.</li>
                    <li><strong>Financial Metadata:</strong> Transaction dates, amounts, vendor names, and descriptions synced from QuickBooks/Xero.</li>
                    <li><strong>Technical Data:</strong> IP address, browser type, and usage logs for security purposes.</li>
                    <li><strong>Integration Tokens:</strong> Secure OAuth tokens for QuickBooks Online and Xero.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <Lock size={24} className="mr-3 text-blue-600" /> Your GDPR Rights
                </h2>
                <p className="mb-4">As an EU-based entity, we strictly follow GDPR. You have the right to:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg"><strong>Right to Access:</strong> Request all data we hold.</div>
                    <div className="p-4 bg-slate-50 rounded-lg"><strong>Right to Erasure:</strong> The "Right to be Forgotten".</div>
                    <div className="p-4 bg-slate-50 rounded-lg"><strong>Right to Portability:</strong> Export data in JSON/CSV.</div>
                    <div className="p-4 bg-slate-50 rounded-lg"><strong>Right to Object:</strong> Oppose specific data uses.</div>
                </div>
            </section>
        </div>

        <footer className="mt-20 pt-8 border-t border-slate-100 flex justify-center">
            <button onClick={onBack} className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 transition-all">
                Back to Home
            </button>
        </footer>
      </main>
    </div>
  );
};

export default PrivacyPage;