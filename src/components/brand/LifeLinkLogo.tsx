import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const LifeLinkLogo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Unique SVG Emblem: Blood Drop + Connected Pulse Link Node */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#E63950] via-[#C62845] to-[#511727] p-1.5 shadow-md shadow-[#C62845]/20 border border-white/20 flex-shrink-0`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          {/* Blood Drop Silhouette */}
          <path
            d="M16 3C16 3 8 13.2 8 19C8 23.4 11.6 27 16 27C20.4 27 24 23.4 24 19C24 13.2 16 3 16 3Z"
            fill="currentColor"
            fillOpacity="0.95"
          />
          {/* Inner Connecting Pulse Line & Network Hub Nodes */}
          <path
            d="M10.5 19H13.2L14.6 15.5L17.4 22.5L18.8 19H21.5"
            stroke="#101827"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Linked Pulse Dot */}
          <circle cx="16" cy="19" r="1.3" fill="#E63950" />
        </svg>
      </div>

      <div>
        <div className="flex items-center space-x-1.5">
          <span className={`font-black tracking-tight text-white ${textSizes[size]}`}>
            Life<span className="text-[#E63950]">Link</span>
          </span>
          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#C62845]/20 text-[#E63950] border border-[#C62845]/30">
            RESCUE
          </span>
        </div>
        {showTagline && (
          <p className="text-[10px] text-slate-400 font-medium tracking-wide leading-none mt-0.5">
            Connecting Donors. Supporting Hospitals. Coordinating Hope.
          </p>
        )}
      </div>
    </div>
  );
};
