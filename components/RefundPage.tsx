import React from 'react';
import { ArrowLeft, CreditCard, RefreshCcw, ShieldCheck, HelpCircle } from 'lucide-react';
import Logo from './Logo';

interface RefundPageProps {
  onBack: () => void;
}

const RefundPage: React.FC<RefundPageProps> = ({ onBack }) => {
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
        <div className="border-b border-slate-100 pb-8 mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Refund Policy</h1>
            <p className="text-slate-500">How we handle billing and cancellation.</p>
        </div>

        <div className="space-y-12">
            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <CreditCard size={24} className="mr-3 text-blue-600" /> Merchant of Record
                </h2>
                <p className="mb-4">
                    Our order process is conducted by our online reseller <strong>Paddle.com</strong>. Paddle is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns.
                </p>
                <div className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <ShieldCheck size={20} className="text-green-600 mr-3" />
                    <span className="text-sm">Secure transactions via Paddle.com Marketplace.</span>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <RefreshCcw size={24} className="mr-3 text-blue-600" /> Subscription Cancellations
                </h2>
                <p>
                    You can cancel your subscription at any time via your account settings. Upon cancellation, your account will remain active until the end of the current paid billing cycle, after which no further charges will be made.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <HelpCircle size={24} className="mr-3 text-blue-600" /> Refund Eligibility
                </h2>
                <p className="mb-4">
                    As a software-as-a-service (SaaS) provider, we generally do not offer refunds once a billing cycle has begun, except in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Technical Faults:</strong> If a documented bug prevented you from using the Service for more than 72 consecutive hours.</li>
                    <li><strong>EU Statutory Rights:</strong> Consumers within the European Union have a 14-day "cooling off" period, provided the service has not been fully performed.</li>
                </ul>
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

export default RefundPage;