import React, { useState } from 'react';
import planiluxLogoSrc from '../../assets/logo.png';

interface PlaniluxLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: 'badge' | 'full';
}

/**
 * Logo officiel vectoriel infaillible pour Planilux
 * Combine le rendu de l'asset raster avec un SVG haute définition natif en fallback immédiat
 */
export const PlaniluxLogo: React.FC<PlaniluxLogoProps> = ({
  size = 36,
  showText = false,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const radius = Math.max(8, Math.round(size * 0.22));

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} style={{ verticalAlign: 'middle' }}>
      {!imageError ? (
        <img
          src={planiluxLogoSrc}
          alt="Logo Officiel Planilux"
          width={size}
          height={size}
          onError={() => setImageError(true)}
          className="transition-transform duration-200 hover:scale-105"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: `${radius}px`,
            objectFit: 'cover',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35), 0 1px 3px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            background: '#040b19'
          }}
        />
      ) : (
        /* Fallback SVG vectoriel moderne autonome - Ne peut jamais échouer */
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="transition-transform duration-200 hover:scale-105"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: `${radius}px`,
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35), 0 1px 3px rgba(0, 0, 0, 0.2)'
          }}
        >
          <defs>
            <linearGradient id="planiluxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx={radius * 2} fill="url(#planiluxGrad)" />
          {/* Grille de planning stylisée */}
          <rect x="18" y="22" width="64" height="58" rx="8" fill="#ffffff" fillOpacity="0.16" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
          <line x1="18" y1="40" x2="82" y2="40" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
          <line x1="39" y1="40" x2="39" y2="80" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <line x1="61" y1="40" x2="61" y2="80" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          {/* Étoile de brillance 'Lux' */}
          <circle cx="72" cy="28" r="4" fill="#38bdf8" />
          <path d="M72 20 L73.5 26 L79.5 27.5 L73.5 29 L72 35 L70.5 29 L64.5 27.5 L70.5 26 Z" fill="#ffffff" />
          {/* Cartouches de cours stylisés */}
          <rect x="23" y="46" width="12" height="10" rx="3" fill="#38bdf8" />
          <rect x="44" y="46" width="12" height="26" rx="3" fill="url(#gridGrad)" />
          <rect x="66" y="62" width="12" height="10" rx="3" fill="#a78bfa" />
        </svg>
      )}

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
