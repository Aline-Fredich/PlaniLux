import React from 'react';

interface PlaniluxLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const PlaniluxLogo: React.FC<PlaniluxLogoProps> = ({
  size = 32,
  showText = false,
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} style={{ verticalAlign: 'middle' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="planilux-primary-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="0.5" stopColor="#2563eb" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="planilux-accent-grad" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="0.6" stopColor="#6366f1" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="planilux-glow" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Fond de l'icône : Carré adouci avec effet de relief */}
        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="12"
          fill="url(#planilux-primary-grad)"
        />

        {/* Reflet spéculaire supérieur */}
        <path
          d="M6 16C6 10.4772 10.4772 6 16 6H32C37.5228 6 42 10.4772 42 16C42 16.5 35 22 24 22C13 22 6 16.5 6 16Z"
          fill="white"
          fillOpacity="0.22"
        />

        {/* Calendrier stylisé & Quadrillage temporel */}
        {/* Barre d'en-tête du calendrier */}
        <path
          d="M13 14H35"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Deux anneaux de reliure supérieurs */}
        <rect x="17" y="10" width="3" height="5" rx="1.5" fill="white" />
        <rect x="28" y="10" width="3" height="5" rx="1.5" fill="white" />

        {/* Bloc horaire dynamique actif (Légèreté & organisation) */}
        <rect
          x="13"
          y="19"
          width="9"
          height="8"
          rx="3"
          fill="white"
          fillOpacity="0.95"
        />
        <rect
          x="24"
          y="19"
          width="11"
          height="8"
          rx="3"
          fill="url(#planilux-accent-grad)"
          stroke="white"
          strokeWidth="1.2"
        />

        {/* Rangée inférieure des créneaux */}
        <rect
          x="13"
          y="29"
          width="13"
          height="8"
          rx="3"
          fill="url(#planilux-accent-grad)"
          stroke="white"
          strokeWidth="1.2"
        />
        <rect
          x="28"
          y="29"
          width="7"
          height="8"
          rx="3"
          fill="white"
          fillOpacity="0.95"
        />

        {/* Étoile étincelle Planilux (Précision) */}
        <path
          d="M38 10L39 12L41 13L39 14L38 16L37 14L35 13L37 12L38 10Z"
          fill="#fef08a"
        />
      </svg>

      {showText && (
        <span 
          style={{
            fontFamily: 'var(--font-display, "Outfit", sans-serif)',
            fontWeight: 700,
            fontSize: `${size * 0.65}px`,
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
