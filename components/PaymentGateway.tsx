import React, { useState, useEffect } from 'react';
import { X, Lock, CreditCard, CheckCircle, ShieldCheck, Globe } from 'lucide-react';
import Logo from './Logo';

interface PaymentGatewayProps {
  planName: string;
  price: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ planName, price, onClose, onSuccess }) => {
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [country, setCountry] = useState('US');
  
  // Tax logic mock
  const basePrice = parseFloat(price);
  const [taxRate, setTaxRate] = useState(0);
  
  useEffect(() => {
    // Simple mock logic for VAT based on country
    if (country === 'HU') setTaxRate(0.27); // 27% Hungary
    else if (['DE', 'FR', 'IT', 'ES'].includes(country)) setTaxRate(0.19); // Approx EU average
    else setTaxRate(0); // RoW (Rest of World) often 0% or handled differently
  }, [country]);

  const taxAmount = basePrice * taxRate;
  const totalPrice = basePrice + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    
    // Simulate API delay
    setTimeout(() => {
      setStep('success');
      // Close after showing success
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }, 2000);
  };

  // Format card number with spaces
  const handleCardInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.substring(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(val);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center space-x-2 opacity-80">
             <ShieldCheck size={16} className="text-green-600"/>
             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Secure Checkout</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <Logo variant="dark" className="justify-center scale-90 mb-2" />
                <h3 className="text-xl font-bold text-slate-900 mt-2">Subscribe to {planName}</h3>
              </div>

              {/* Order Summary */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2 mb-6 text-sm">
                  <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>${basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                      <span>Tax / VAT ({taxRate * 100}%)</span>
                      <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-lg">
                      <span>Total</span>
                      <span>${totalPrice.toFixed(2)}</span>
                  </div>
              </div>

              <div className="space-y-4">
                 {/* Country Selector for VAT Simulation */}
                <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Billing Country</label>
                   <div className="relative">
                      <Globe className="absolute top-2.5 left-3 text-slate-400" size={16} />
                      <select 
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none"
                      >
                          <option value="US">United States (0% VAT)</option>
                          <option value="HU">Hungary (27% ÁFA)</option>
                          <option value="DE">Germany (19% VAT)</option>
                          <option value="GB">United Kingdom (20% VAT)</option>
                      </select>
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute top-2.5 left-3 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={cardNumber}
                      onChange={handleCardInput}
                      placeholder="0000 0000 0000 0000" 
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Expiry</label>
                    <input 
                      type="text" 
                      placeholder="MM / YY" 
                      maxLength={5}
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">CVC</label>
                    <div className="relative">
                      <Lock className="absolute top-2.5 left-3 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="123" 
                        maxLength={3}
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center mt-6"
              >
                Pay ${totalPrice.toFixed(2)}
              </button>
              
              <div className="flex justify-center items-center space-x-2 text-[10px] text-slate-400 mt-4">
                <span>Transactions are secured and encrypted.</span>
              </div>
            </form>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
              <h3 className="text-lg font-semibold text-slate-800">Processing Payment...</h3>
              <p className="text-slate-500 text-sm mt-2">Connecting to payment provider.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Subscription Active!</h3>
              <p className="text-slate-500 text-center mt-2">
                Thank you for subscribing to the <span className="font-bold text-slate-800">{planName}</span> plan.<br/>
                An invoice has been sent to your email.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;