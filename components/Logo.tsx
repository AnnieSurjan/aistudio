import React from 'react';
import { FileText, Search } from 'lucide-react';

interface LogoProps {
  variant?: 'light' | 'dark';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ variant = 'dark', className = '' }) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  const subTextColor = variant === 'light' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30 overflow-hidden">
        {/* Paper Icon */}
        <FileText className="text-blue-100 opacity-90 absolute top-2 left-2" size={20} strokeWidth={2.5} />
        {/* Magnifying Glass Overlay */}
        <div className="absolute bottom-1.5 right-1.5 bg-white rounded-full p-0.5 shadow-sm">
            <Search className="text-blue-600" size={14} strokeWidth={3} />
        </div>
      </div>
      <div>
        <h1 className={`text-xl font-bold tracking-tight leading-none ${textColor}`}>
          Dup<span className="text-blue-600">Detect</span>
        </h1>
        <p className={`text-[10px] font-medium tracking-wide uppercase ${subTextColor}`}>
          QuickBooks Security
        </p>
      </div>
    </div>
  );
};

export default Logo;