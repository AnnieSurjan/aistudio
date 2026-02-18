import React from 'react';
import { FileText, Shield, Scale, Lock, Building, Cookie, Globe, ArrowLeft, RotateCcw } from 'lucide-react';
import Logo from './Logo';

interface LegalPageProps {
  page: 'terms' | 'privacy' | 'refund';
}

const LegalPage: React.FC<LegalPageProps> = ({ page }) => {

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={goHome} className="hover:opacity-80 transition-opacity">
            <Logo variant="light" />
          </button>
          <button
            onClick={goHome}
            className="flex items-center text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Back to Home
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[64px] z-40">
        <div className="max-w-4xl mx-auto px-6 flex">
          <a
            href="/terms"
            className={`py-4 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              page === 'terms'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={15} />
            <span>Terms of Service</span>
          </a>
          <a
            href="/privacy"
            className={`py-4 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              page === 'privacy'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Shield size={15} />
            <span>Privacy & GDPR</span>
          </a>
          <a
            href="/refund"
            className={`py-4 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              page === 'refund'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <RotateCcw size={15} />
            <span>Refund Policy</span>
          </a>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {page === 'terms' && <TermsContent />}
        {page === 'privacy' && <PrivacyContent />}
        {page === 'refund' && <RefundContent />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm space-y-2">
          <p>&copy; {new Date().getFullYear()} Dat-assist Kft. All rights reserved.</p>
          <div className="flex justify-center space-x-6">
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/refund" className="hover:text-white transition-colors">Refund</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ─── Terms of Service ─── */
const TermsContent: React.FC = () => (
  <div className="space-y-8">
    <div className="border-b border-slate-200 pb-4">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-500">Last updated: October 26, 2023</p>
    </div>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center">
        <FileText size={18} className="mr-2 text-blue-600" /> 1. Introduction
      </h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Welcome to Dup-Detect. These Terms of Service govern your use of the SaaS application operated by{' '}
        <strong>Dat-assist Kft.</strong> ("we", "us", or "our"), registered in Budapest, Hungary. By accessing
        or using our Service, you agree to be bound by these Terms.
      </p>
    </section>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center">
        <Shield size={18} className="mr-2 text-blue-600" /> 2. Nature of Service & Liability
      </h2>
      <p className="text-sm text-slate-600 leading-relaxed mb-2">
        Dup-Detect utilizes artificial intelligence (Google Gemini models) to identify potential duplicate
        transactions. You acknowledge and agree that:
      </p>
      <ul className="list-disc list-inside text-sm space-y-1 ml-4 text-slate-600">
        <li>
          <strong>AI Limitations:</strong> The AI suggestions are probabilistic. We do not guarantee 100%
          accuracy.
        </li>
        <li>
          <strong>User Responsibility:</strong> You are solely responsible for reviewing and confirming any
          deletions, merges, or modifications to your financial data.
        </li>
        <li>
          <strong>No Financial Advice:</strong> The Service does not provide accounting, tax, or legal advice.
        </li>
      </ul>
    </section>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center">
        <Lock size={18} className="mr-2 text-blue-600" /> 3. Data Processing Agreement (DPA)
      </h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        For users in the EU/EEA: You act as the <strong>Data Controller</strong> of the financial data you
        input, and Dat-assist Kft. acts as the <strong>Data Processor</strong>. We process data solely on your
        instructions (via the App interface) to provide the duplicate detection service.
      </p>
    </section>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">4. Subscription & Cancellation</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Payments are processed by our Merchant of Record, <strong>Paddle.com</strong>. Subscription fees are
        billed in advance. You may cancel your subscription at any time; access remains active until the end of
        the billing period. Refunds are handled according to our{' '}
        <a href="/refund" className="text-blue-600 hover:underline">
          Refund Policy
        </a>{' '}
        and EU consumer laws.
      </p>
    </section>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">5. Governing Law</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        These Terms shall be governed by the laws of <strong>Hungary</strong>. Any disputes arising from these
        Terms shall be subject to the exclusive jurisdiction of the courts in Budapest.
      </p>
    </section>
  </div>
);

/* ─── Privacy & GDPR ─── */
const PrivacyContent: React.FC = () => (
  <div className="space-y-8">
    <div className="border-b border-slate-200 pb-4">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy & GDPR Compliance</h1>
      <p className="text-sm text-slate-500">Effective Date: October 26, 2023</p>
      <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
        <Globe size={12} className="mr-1" /> GDPR Compliant
      </div>
    </div>

    <div className="bg-slate-100 p-5 rounded-xl border border-slate-200 flex items-start space-x-4">
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <Building className="text-blue-600" size={24} />
      </div>
      <div className="text-sm text-slate-700">
        <strong>Data Controller:</strong> Dat-assist Kft.
        <br />
        <strong>Registered Office:</strong> 1051 Budapest, Example Street 12.
        <br />
        <strong>Data Protection Officer (DPO):</strong> dpo@dupdetect.com
      </div>
    </div>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">1. Legal Basis for Processing</h2>
      <p className="text-sm text-slate-600 leading-relaxed mb-2">
        Under GDPR Article 6, we process your data based on:
      </p>
      <ul className="list-disc list-inside text-sm space-y-1 ml-4 text-slate-600">
        <li>
          <strong>Contractual Necessity:</strong> To provide the software service you signed up for.
        </li>
        <li>
          <strong>Legitimate Interest:</strong> To improve our fraud detection algorithms and system security.
        </li>
        <li>
          <strong>Legal Obligation:</strong> To comply with Hungarian tax and accounting laws regarding invoice
          retention.
        </li>
      </ul>
    </section>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">2. Sub-processors (Third Parties)</h2>
      <p className="text-sm text-slate-600 leading-relaxed mb-2">
        We share data only with the following strictly necessary providers:
      </p>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-50 font-semibold text-slate-700">
            <tr>
              <th className="px-4 py-2">Provider</th>
              <th className="px-4 py-2">Purpose</th>
              <th className="px-4 py-2">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-4 py-2">Google Cloud (Vertex AI)</td>
              <td className="px-4 py-2">AI Processing</td>
              <td className="px-4 py-2">EU (Belgium)</td>
            </tr>
            <tr>
              <td className="px-4 py-2">Intuit / Xero</td>
              <td className="px-4 py-2">Data Source API</td>
              <td className="px-4 py-2">US / Global</td>
            </tr>
            <tr>
              <td className="px-4 py-2">Paddle.com</td>
              <td className="px-4 py-2">Payments</td>
              <td className="px-4 py-2">UK</td>
            </tr>
            <tr>
              <td className="px-4 py-2">Render.com</td>
              <td className="px-4 py-2">Hosting</td>
              <td className="px-4 py-2">EU (Frankfurt)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">3. Your Rights (GDPR)</h2>
      <p className="text-sm text-slate-600 leading-relaxed mb-2">
        You have the following rights regarding your personal data:
      </p>
      <ul className="space-y-2 text-sm text-slate-600">
        <li className="flex items-start">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 shrink-0"></div>
          <span>
            <strong>Right to Access:</strong> Request a copy of all data we hold about you.
          </span>
        </li>
        <li className="flex items-start">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 shrink-0"></div>
          <span>
            <strong>Right to Erasure ("Right to be Forgotten"):</strong> Request deletion of your account and
            data (subject to legal retention periods).
          </span>
        </li>
        <li className="flex items-start">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 shrink-0"></div>
          <span>
            <strong>Right to Portability:</strong> Request your audit logs and data in a machine-readable format
            (CSV/JSON).
          </span>
        </li>
      </ul>
    </section>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center">
        <Cookie size={18} className="mr-2 text-orange-500" /> 4. Cookie Policy
      </h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        We use only <strong>essential cookies</strong> required for authentication and session security. We do
        not use third-party tracking cookies for advertising purposes within the application dashboard.
      </p>
    </section>
  </div>
);

/* ─── Refund Policy ─── */
const RefundContent: React.FC = () => (
  <div className="space-y-8">
    <div className="border-b border-slate-200 pb-4">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Refund Policy</h1>
      <p className="text-sm text-slate-500">Effective Date: October 26, 2023</p>
    </div>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">1. Overview</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Dup-Detect subscriptions are billed by our Merchant of Record, <strong>Paddle.com</strong>. This policy
        describes our approach to refunds in compliance with EU consumer protection regulations, including
        Directive 2011/83/EU and Hungarian Act CLV of 1997 on Consumer Protection.
      </p>
    </section>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">2. 14-Day Right of Withdrawal (EU Consumers)</h2>
      <p className="text-sm text-slate-600 leading-relaxed mb-2">
        Under EU consumer law, you have the right to withdraw from any online purchase within{' '}
        <strong>14 calendar days</strong> of the date of purchase without giving any reason.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>How to exercise this right:</strong> Send an email to{' '}
        <a href="mailto:support@dupdetect.com" className="underline">
          support@dupdetect.com
        </a>{' '}
        with the subject "Withdrawal Request" including your account email and the date of purchase.
      </div>
    </section>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">3. Refund After the 14-Day Period</h2>
      <p className="text-sm text-slate-600 leading-relaxed mb-2">
        After the 14-day withdrawal period, refunds may still be issued at our discretion in the following cases:
      </p>
      <ul className="list-disc list-inside text-sm space-y-1 ml-4 text-slate-600">
        <li>
          <strong>Service Unavailability:</strong> Prolonged outage (more than 72 consecutive hours) during your billing period.
        </li>
        <li>
          <strong>Billing Error:</strong> Incorrect charge amount or duplicate billing.
        </li>
        <li>
          <strong>Material Defect:</strong> The service fundamentally fails to perform its advertised core function.
        </li>
      </ul>
    </section>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">4. Processing</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Approved refunds are processed within <strong>5-10 business days</strong> via Paddle.com to the original
        payment method. You will receive a confirmation email once the refund has been initiated.
      </p>
    </section>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">5. Cancellation vs. Refund</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        Cancelling your subscription stops future billing but does <strong>not</strong> automatically trigger a
        refund for the current billing period. Your access continues until the end of the paid period. If you
        wish to request a refund as well, please contact us separately.
      </p>
    </section>

    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3">6. Contact</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        For any refund-related questions, contact us at{' '}
        <a href="mailto:support@dupdetect.com" className="text-blue-600 hover:underline">
          support@dupdetect.com
        </a>
        .
        <br />
        <br />
        <strong>Dat-assist Kft.</strong>
        <br />
        1051 Budapest, Example Street 12.
        <br />
        Hungary
      </p>
    </section>
  </div>
);

export default LegalPage;
