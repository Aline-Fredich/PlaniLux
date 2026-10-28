import React from 'react';

interface PlaniluxLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: 'badge' | 'full';
}

export const PlaniluxLogo: React.FC<PlaniluxLogoProps> = ({
  size = 36,
  showText = false,
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} style={{ verticalAlign: 'middle' }}>
      <img
        src="/icons/logo.png"
        alt="Logo Officiel Planilux"
        width={size}
        height={size}
        className="transition-transform duration-200 hover:scale-105"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${Math.max(8, Math.round(size * 0.22))}px`,
          objectFit: 'cover',
          flexShrink: 0,
          boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35), 0 1px 3px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          background: '#040b19'
        }}
      />

      {showText && (
        <span 
          style={{
            fontFamily: 'var(--font-display, "Outfit", sans-serif)',
            fontWeight: 800,
            fontSize: `${Math.max(16, Math.round(size * 0.62))}px`,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary, #111827)'
          }}
        >
          Plani<span style={{ color: '#0284c7' }}>Lux</span>
        </span>
      )}
    </div>
  );
};
