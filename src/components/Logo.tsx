import React from 'react';

interface LogoProps {
  className?: string;
  showSlogan?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showSlogan = true, size = 'md' }) => {
  const sizeMap = {
    sm: 'w-24 h-10',
    md: 'w-32 h-14',
    lg: 'w-56 h-24',
  };

  return (
    <div
      className={`relative inline-flex overflow-hidden rounded-lg border border-[#d4af37]/30 bg-black shadow-[0_6px_18px_rgba(0,0,0,0.28)] ${sizeMap[size]} ${className}`}
    >
      <img
        src="/assets/logo.jpg"
        alt={showSlogan ? 'Mrs. B - Soyez votre standard de beauté' : 'Mrs. B'}
        className="absolute w-[150%] max-w-none -translate-x-[18%] -translate-y-[33%]"
      />
    </div>
  );
};
