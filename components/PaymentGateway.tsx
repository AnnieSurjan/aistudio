import React, { useState, useEffect } from 'react';
import { X, Lock, CreditCard, CheckCircle, ShieldCheck, Globe, Mail, MapPin } from 'lucide-react';

interface PaymentGatewayProps {
  planName: string;
  price: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ALL_COUNTRIES = [
  { code: "AF", name: "Afghanistan" },
  { code: "AX", name: "Åland Islands" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AS", name: "American Samoa" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AI", name: "Anguilla" },
  { code: "AQ", name: "Antarctica" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AW", name: "Aruba" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BM", name: "Bermuda" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BV", name: "Bouvet Island" },
  { code: "BR", name: "Brazil" },
  { code: "IO", name: "British Indian Ocean Territory" },
  { code: "BN", name: "Brunei Darussalam" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CV", name: "Cape Verde" },
  { code: "KY", name: "Cayman Islands" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CX", name: "Christmas Island" },
  { code: "CC", name: "Cocos (Keeling) Islands" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo, The Democratic Republic of the" },
  { code: "CK", name: "Cook Islands" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Cote D'Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "ET", name: "Ethiopia" },
  { code: "FK", name: "Falkland Islands (Malvinas)" },
  { code: "FO", name: "Faroe Islands" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GF", name: "French Guiana" },
  { code: "PF", name: "French Polynesia" },
  { code: "TF", name: "French Southern Territories" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GI", name: "Gibraltar" },
  { code: "GR", name: "Greece" },
  { code: "GL", name: "Greenland" },
  { code: "GD", name: "Grenada" },
  { code: "GP", name: "Guadeloupe" },
  { code: "GU", name: "Guam" },
  { code: "GT", name: "Guatemala" },
  { code: "GG", name: "Guernsey" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HM", name: "Heard Island and Mcdonald Islands" },
  { code: "VA", name: "Holy See (Vatican City State)" },
  { code: "HN", name: "Honduras" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran, Islamic Republic Of" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IM", name: "Isle of Man" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JE", name: "Jersey" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KP", name: "Korea, Democratic People's Republic of" },
  { code: "KR", name: "Korea, Republic of" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Lao People's Democratic Republic" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libyan Arab Jamahiriya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MO", name: "Macao" },
  { code: "MK", name: "Macedonia, The Former Yugoslav Republic of" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MQ", name: "Martinique" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "YT", name: "Mayotte" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia, Federated States of" },
  { code: "MD", name: "Moldova, Republic of" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MS", name: "Montserrat" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "AN", name: "Netherlands Antilles" },
  { code: "NC", name: "New Caledonia" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "NU", name: "Niue" },
  { code: "NF", name: "Norfolk Island" },
  { code: "MP", name: "Northern Mariana Islands" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestinian Territory, Occupied" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PN", name: "Pitcairn" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "PR", name: "Puerto Rico" },
  { code: "QA", name: "Qatar" },
  { code: "RE", name: "Reunion" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russian Federation" },
  { code: "RW", name: "Rwanda" },
  { code: "SH", name: "Saint Helena" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "PM", name: "Saint Pierre and Miquelon" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "Sao Tome and Principe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "GS", name: "South Georgia and the South Sandwich Islands" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SJ", name: "Svalbard and Jan Mayen" },
  { code: "SZ", name: "Swaziland" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syrian Arab Republic" },
  { code: "TW", name: "Taiwan, Province of China" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania, United Republic of" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TK", name: "Tokelau" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TC", name: "Turks and Caicos Islands" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UM", name: "United States Minor Outlying Islands" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Viet Nam" },
  { code: "VG", name: "Virgin Islands, British" },
  { code: "VI", name: "Virgin Islands, U.S." },
  { code: "WF", name: "Wallis and Futuna" },
  { code: "EH", name: "Western Sahara" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" }
];

// Expanded VAT/Tax Rates Map (Standard Rates as of ~2024/2025)
// This makes the demo more realistic for EU and Global customers.
const VAT_RATES: Record<string, number> = {
  // --- European Union ---
  AT: 0.20, // Austria
  BE: 0.21, // Belgium
  BG: 0.20, // Bulgaria
  HR: 0.25, // Croatia
  CY: 0.19, // Cyprus
  CZ: 0.21, // Czech Republic
  DK: 0.25, // Denmark
  EE: 0.22, // Estonia (updated to 22% in 2024)
  FI: 0.255, // Finland (updated to 25.5% in Sept 2024)
  FR: 0.20, // France
  DE: 0.19, // Germany
  GR: 0.24, // Greece
  HU: 0.27, // Hungary (Highest in EU)
  IE: 0.23, // Ireland
  IT: 0.22, // Italy
  LV: 0.21, // Latvia
  LT: 0.21, // Lithuania
  LU: 0.17, // Luxembourg
  MT: 0.18, // Malta
  NL: 0.21, // Netherlands
  PL: 0.23, // Poland
  PT: 0.23, // Portugal
  RO: 0.19, // Romania
  SK: 0.20, // Slovakia
  SI: 0.22, // Slovenia
  ES: 0.21, // Spain
  SE: 0.25, // Sweden

  // --- Non-EU / Rest of World ---
  GB: 0.20, // United Kingdom (VAT)
  NO: 0.25, // Norway (MVA)
  CH: 0.081, // Switzerland (VAT 8.1% from 2024)
  IS: 0.24, // Iceland
  AU: 0.10, // Australia (GST)
  NZ: 0.15, // New Zealand (GST)
  JP: 0.10, // Japan (Consumption Tax)
  CA: 0.05, // Canada (Federal GST only for simplicity, varies by province 5-15%)
  SG: 0.09, // Singapore (GST 9% from 2024)
  ZA: 0.15, // South Africa (VAT)
  AE: 0.05, // UAE (VAT)
  SA: 0.15, // Saudi Arabia (VAT)
  
  // US usually calculates sales tax by zip code. 
  // For this demo, we assume 0 at country level or handle separately.
  US: 0.00, 
};

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ planName, price, onClose, onSuccess }) => {
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success'>('details');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('HU'); // Default to Hungary
  const [zipCode, setZipCode] = useState('');
  
  // Tax logic mock
  const basePrice = parseFloat(price);
  const [taxRate, setTaxRate] = useState(0.27); // Default HU VAT

  // Reset state when the modal opens or plan changes
  useEffect(() => {
    setStep('details');
    setEmail('');
    setCountry('HU');
    setZipCode('');
  }, [planName]);
  
  useEffect(() => {
    // Look up tax rate from map, default to 0 if not found (e.g. US or non-VAT countries in this list)
    // In a real app, Paddle/Stripe handles this automatically.
    const rate = VAT_RATES[country] !== undefined ? VAT_RATES[country] : 0.00;
    setTaxRate(rate);
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
                    <span className="font-bold text-slate-700">DupDetect</span>
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
                         <span>VAT / Tax ({(taxRate * 100).toFixed(1)}%)</span>
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
                                        {ALL_COUNTRIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.name}</option>
                                        ))}
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