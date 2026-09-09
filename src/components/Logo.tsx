import React from 'react';

interface LogoProps {
  className?: string;
  showSlogan?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showSlogan = true, size = 'md' }) => {
  const sizeMap = {
    sm: { circle: 'w-9 h-9', title: 'text-base', sub: 'text-[9px]' },
    md: { circle: 'w-12 h-12', title: 'text-xl', sub: 'text-[10px]' },
    lg: { circle: 'w-16 h-16', title: 'text-2xl', sub: 'text-xs' },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Golden Feather Emblem */}
      <div className={`relative ${current.circle} rounded-full bg-gradient-to-br from-[#2a2415] via-[#151515] to-[#0b0b0b] border border-[#d4af37]/60 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.2)] shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stylized Luxury Feather */}
          <path
            d="M20 75 Q40 55 75 25 C65 40 50 65 30 80 Z"
            fill="url(#goldGradient)"
            opacity="0.9"
          />
          <path
            d="M30 80 Q55 50 82 20 C70 38 52 68 28 85 Z"
            fill="url(#goldGradientLight)"
          />
          <path
            d="M25 82 Q55 52 82 20"
            stroke="#fffdf8"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#997a15" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#f7e599" />
            </linearGradient>
            <linearGradient id="goldGradientLight" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#fff2ba" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span className={`font-serif tracking-wider font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f1d477] via-[#d4af37] to-[#e6be44] ${current.title}`}>
            Mrs. B
          </span>
        </div>
        {showSlogan && (
          <p className={`text-[#a7a7a7] uppercase tracking-[0.2em] font-light leading-tight mt-0.5 ${current.sub}`}>
            Soyez votre standard de beauté
          </p>
        )}
      </div>
    </div>
  );
};
