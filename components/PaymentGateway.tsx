import React, { useState, useEffect } from 'react';
import { X, Lock, CreditCard, CheckCircle, ShieldCheck, Globe, Mail, MapPin } from 'lucide-react';

interface PaymentGatewayProps {
  planName: string;
  price: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ planName, price, onClose, onSuccess }) => {
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success'>('details');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('US');
  const [zipCode, setZipCode] = useState('');
  
  // Tax logic mock
  const basePrice = parseFloat(price);
  const [taxRate, setTaxRate] = useState(0);

  // Reset state when the modal opens or plan changes
  useEffect(() => {
    setStep('details');
    setEmail('');
    setCountry('US');
    setZipCode('');
  }, [planName]);
  
  useEffect(() => {
    // Simulate Paddle's automatic tax calculation based on IP/Location
    switch (country) {
        case 'US': setTaxRate(0.00); break; // Sales tax varies by zip, 0 for demo
        case 'GB': setTaxRate(0.20); break; // UK VAT
        case 'HU': setTaxRate(0.27); break; // Hungary VAT
        case 'DE': setTaxRate(0.19); break; // Germany VAT
        case 'FR': setTaxRate(0.20); break; // France VAT
        case 'ES': setTaxRate(0.21); break; // Spain VAT
        case 'IT': setTaxRate(0.22); break; // Italy VAT
        case 'CA': setTaxRate(0.05); break; // Canada GST (simplified)
        case 'AU': setTaxRate(0.10); break; // Australia GST
        default: setTaxRate(0.00);
    }
  }, [country]);

  const taxAmount = basePrice * taxRate;
  const totalPrice = basePrice + taxAmount;

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePayment = () => {
    setStep('processing');
    // Simulate API delay
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-[#fcfcfc] w-full max-w-[900px] h-auto md:h-[600px] rounded-lg shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-50">
           <X size={20} />
        </button>

        {/* Left Side: Order Summary (Paddle Style) */}
        <div className="bg-slate-50 md:w-5/12 p-8 border-r border-slate-200 flex flex-col">
            <div className="mb-6">
                 <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">D</div>
                    <span className="font-bold text-slate-700">Dup-Detect Inc.</span>
                 </div>
                 <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-2">Order Summary</div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-1">{planName} Plan</h2>
                 <p className="text-slate-500 text-sm mb-4">Monthly subscription, cancel anytime.</p>
                 
                 <div className="border-t border-b border-slate-200 py-4 space-y-2">
                     <div className="flex justify-between text-sm text-slate-600">
                         <span>{planName}</span>
                         <span>${basePrice.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-sm text-slate-500">
                         <span>VAT / Tax ({taxRate * 100}%)</span>
                         <span>${taxAmount.toFixed(2)}</span>
                     </div>
                 </div>
                 
                 <div className="flex justify-between items-center mt-4">
                     <span className="text-sm font-bold text-slate-700">Total</span>
                     <span className="text-2xl font-bold text-slate-900">${totalPrice.toFixed(2)}</span>
                 </div>
            </div>
            
            <div className="mt-auto pt-6 text-[10px] text-slate-400 leading-relaxed border-t border-slate-100">
                <p className="flex items-center gap-1 mb-1">
                    <ShieldCheck size={12}/> 
                    Powered by <strong>Paddle</strong>
                </p>
                Paddle.com is the Merchant of Record for this order. 
            </div>
        </div>

        {/* Right Side: Checkout Form */}
        <div className="bg-white md:w-7/12 p-8 relative overflow-y-auto">
            
            {step === 'details' && (
                <div className="animate-in slide-in-from-right duration-300">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Customer Information</h3>
                    <form onSubmit={handleDetailsSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute top-2.5 left-3 text-slate-400" size={16} />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="alex@company.com" 
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Country</label>
                                <div className="relative">
                                    <Globe className="absolute top-2.5 left-3 text-slate-400" size={16} />
                                    <select 
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="US">United States</option>
                                        <option value="GB">United Kingdom</option>
                                        <option value="HU">Hungary</option>
                                        <option value="DE">Germany</option>
                                        <option value="FR">France</option>
                                        <option value="ES">Spain</option>
                                        <option value="IT">Italy</option>
                                        <option value="CA">Canada</option>
                                        <option value="AU">Australia</option>
                                        <option value="JP">Japan</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zip / Postal Code</label>
                                <div className="relative">
                                    <MapPin className="absolute top-2.5 left-3 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        required
                                        value={zipCode}
                                        onChange={e => setZipCode(e.target.value)}
                                        placeholder="Zip Code" 
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded shadow-sm transition-colors mt-4 flex justify-center items-center"
                        >
                            Continue
                        </button>
                    </form>
                </div>
            )}

            {step === 'payment' && (
                <div className="animate-in slide-in-from-right duration-300">
                    <button 
                        onClick={() => setStep('details')}
                        className="text-xs text-slate-500 hover:text-slate-800 mb-6 flex items-center"
                    >
                        ← Back to details
                    </button>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Payment Method</h3>
                    
                    <div className="space-y-3">
                        {/* Mock Payment Options */}
                        <button onClick={handlePayment} className="w-full border border-slate-300 hover:border-green-500 hover:bg-green-50 p-4 rounded flex items-center justify-between group transition-all">
                            <div className="flex items-center space-x-3">
                                <CreditCard className="text-slate-400 group-hover:text-green-600" />
                                <span className="font-medium text-slate-700">Credit / Debit Card</span>
                            </div>
                            <div className="flex space-x-1">
                                <div className="w-8 h-5 bg-slate-200 rounded"></div>
                                <div className="w-8 h-5 bg-slate-200 rounded"></div>
                            </div>
                        </button>
                        
                        <button onClick={handlePayment} className="w-full border border-slate-300 hover:border-blue-500 hover:bg-blue-50 p-4 rounded flex items-center justify-between group transition-all">
                            <div className="flex items-center space-x-3">
                                <span className="font-bold text-blue-800 italic">PayPal</span>
                            </div>
                        </button>

                         <button onClick={handlePayment} className="w-full border border-slate-300 hover:border-gray-800 hover:bg-gray-50 p-4 rounded flex items-center justify-between group transition-all">
                            <div className="flex items-center space-x-3">
                                <span className="font-bold text-slate-900">Apple Pay</span>
                            </div>
                        </button>
                    </div>

                    <p className="text-xs text-slate-400 mt-6 text-center">
                        Secure 256-bit SSL encrypted payment.
                    </p>
                </div>
            )}

            {step === 'processing' && (
                <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-green-100 border-t-green-500 rounded-full animate-spin mb-4"></div>
                    <h3 className="font-bold text-slate-800">Processing Payment...</h3>
                    <p className="text-sm text-slate-500">Communicating with bank</p>
                </div>
            )}

            {step === 'success' && (
                <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Success!</h3>
                    <p className="text-slate-600 mt-2 text-sm max-w-xs mx-auto">
                        Your subscription has been activated. A receipt from Paddle.com has been sent to {email}.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;