import React from 'react';
import { FileText, Search } from 'lucide-react';

interface LogoProps {
  variant?: 'light' | 'dark';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ variant = 'dark', className = '' }) => {
  const isLight = variant === 'light';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon: Blue rounded square with Document + Search overlay */}
      <div className="relative w-10 h-10 shrink-0">
        <div className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center">
          <FileText className="text-white ml-0.5" size={22} strokeWidth={2.5} />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 bg-white p-0.5 rounded-full shadow-sm ring-1 ring-slate-100">
             <div className="bg-blue-50 rounded-full p-1">
                <Search className="text-blue-600" size={14} strokeWidth={3} />
             </div>
        </div>
      </div>
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight leading-none">
          <span className={isLight ? 'text-white' : 'text-slate-900'}>Dup</span>
          <span className={isLight ? 'text-slate-300' : 'text-slate-800'}>-</span>
          <span className="text-blue-600">Detect</span>
        </h1>
        <p className={`text-[10px] font-bold tracking-widest uppercase ${isLight ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
          Accounting Security
        </p>
      </div>
    </div>
  );
};

export default Logo;