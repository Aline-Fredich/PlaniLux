import React from 'react';

interface PlaniluxLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const PlaniluxLogo: React.FC<PlaniluxLogoProps> = ({
  size = 34,
  showText = false,
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} style={{ verticalAlign: 'middle' }}>
      <img
        src="/logo.png"
        alt="Planilux Logo"
        width={size}
        height={size}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${Math.max(6, Math.round(size * 0.22))}px`,
          objectFit: 'cover',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.4)'
        }}
      />

      {showText && (
        <span 
          style={{
            fontFamily: 'var(--font-display, "Outfit", sans-serif)',
            fontWeight: 700,
            fontSize: `${Math.round(size * 0.65)}px`,
            letterSpacing: '-0.025em',
            color: 'var(--text-primary, #111827)'
          }}
        >
          Planilux
        </span>
      )}
    </div>
  );
};
