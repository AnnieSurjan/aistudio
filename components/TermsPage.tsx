import React from 'react';
import { ArrowLeft, FileText, Shield, Lock, Scale, AlertTriangle } from 'lucide-react';
import Logo from './Logo';

interface TermsPageProps {
  onBack: () => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  // Dinamikusan generált mai dátum magyar formátumban
  const today = new Date().toLocaleDateString('hu-HU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* Navigation Header */}
      <nav className="border-b border-slate-100 py-4 sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
            <button 
                onClick={onBack}
                className="flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium"
            >
                <ArrowLeft size={18} className="mr-2" /> Back to Home
            </button>
            <Logo variant="dark" className="scale-75" />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="border-b border-slate-100 pb-8 mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Terms of Service</h1>
            <p className="text-slate-500">Effective Date: {today}</p>
        </div>

        <div className="space-y-12 leading-relaxed">
            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <FileText size={24} className="mr-3 text-blue-600" /> 1. Acceptance of Terms
                </h2>
                <p>
                    By accessing or using the Dup-Detect application (the "Service"), provided by <strong>Dat-assist Kft.</strong>, located at 1051 Budapest, Hungary, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <Shield size={24} className="mr-3 text-blue-600" /> 2. Nature of the Service
                </h2>
                <p className="mb-4">
                    Dup-Detect is a software-as-a-service tool that uses advanced algorithms and artificial intelligence to identify potential duplicate financial transactions in QuickBooks Online and Xero accounts.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <p className="text-sm text-blue-800">
                        <strong>User Review Required:</strong> You acknowledge that the Service provides suggestions based on probabilistic models. You are solely responsible for reviewing and confirming any actions (e.g., merging, deleting) performed on your data.
                    </p>
                </div>
            </section>

            <section className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <AlertTriangle size={24} className="mr-3 text-amber-600" /> 3. Limitation of Liability
                </h2>
                <p className="font-semibold text-slate-900 mb-4">
                    PLEASE READ THIS SECTION CAREFULLY AS IT LIMITS OUR LIABILITY TO THE MAXIMUM EXTENT PERMITTED BY LAW.
                </p>
                <p className="mb-4">
                    In no event shall <strong>Dat-assist Kft.’s</strong> total liability to you for all damages, losses, and causes of action (whether in contract, tort including negligence, or otherwise) exceed the <strong>total amount paid by you for the Service during the 12 months immediately preceding the date of the claim</strong>.
                </p>
                <p>
                    If you have used the Service for less than 12 months, the liability cap shall be equal to the total fees actually paid by you during your actual term of use.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Exclusion of Indirect Damages</h2>
                <p>
                    To the maximum extent permitted by applicable law, Dat-assist Kft. shall not be liable for any <strong>indirect, incidental, special, consequential, or punitive damages</strong>, or any loss of <strong>profits or revenues</strong>, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service.
                </p>
            </section>

            <section className="border-2 border-slate-900 p-8 rounded-2xl">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center uppercase tracking-tighter">
                    <Lock size={24} className="mr-3" /> 5. Disclaimer of Warranties ("AS-IS")
                </h2>
                <p className="uppercase text-sm font-bold tracking-wide">
                    THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. DAT-ASSIST KFT. MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE SERVICE, OR THE INFORMATION, CONTENT, MATERIALS, OR PRODUCTS INCLUDED ON THE SERVICE. YOU EXPRESSLY AGREE THAT YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <Scale size={24} className="mr-3 text-blue-600" /> 6. Governing Law & Jurisdiction
                </h2>
                <p>
                    These Terms shall be governed by and construed in accordance with the laws of <strong>Hungary (European Union)</strong>. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts of Budapest, Hungary.
                </p>
            </section>
        </div>

        <footer className="mt-20 pt-8 border-t border-slate-100 flex justify-center">
            <button 
                onClick={onBack}
                className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 transition-all shadow-lg"
            >
                Back to Landing Page
            </button>
        </footer>
      </main>
    </div>
  );
};

export default TermsPage;