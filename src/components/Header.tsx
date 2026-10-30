import { Moon, Sun, User, CheckCircle2, CloudOff, RefreshCw, AlertCircle, Menu, LogOut, Download, SlidersHorizontal } from 'lucide-react';
import { PlaniluxLogo } from './ui/PlaniluxLogo';
import { SaveStatus } from '../services/storageService';
import { UserAccount, DensityLevel } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  currentView: 'list' | 'editor';
  onNavigateHome: () => void;
  onOpenAccount: () => void;
  onToggleSidebar: () => void;
  saveStatus: SaveStatus;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  density?: DensityLevel;
  onDensityChange?: (d: DensityLevel) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView: _currentView,
  onNavigateHome,
  onOpenAccount,
  onToggleSidebar,
  saveStatus,
  theme,
  onToggleTheme,
  currentUser,
  onLogout,
  density = 'normal',
  onDensityChange
}) => {
  const { isInstalled, installApp } = usePWAInstall();

  const densityOptions: { level: DensityLevel; label: string; icon: string }[] = [
    { level: 'normal', label: '100%', icon: '🖥' },
    { level: 'compact', label: '88%', icon: '📐' },
    { level: 'ultra-compact', label: '75%', icon: '⚡' },
    { level: 'micro', label: '65%', icon: '🔬' }
  ];

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Bouton Toggle Sidebar */}
        <button
          type="button"
          className="btn-glass-secondary btn-icon"
          onClick={onToggleSidebar}
          title="Ouvrir / Fermer le menu latéral"
          aria-label="Menu"
        >
          <Menu size={18} />
        </button>

        <div className="logo-group" onClick={onNavigateHome} title="Retour à l'accueil Planilux" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <PlaniluxLogo size={36} />
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
              Plani<span style={{ color: '#0284c7' }}>Lux</span>
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Bouton Installer l'application (PWA) */}
        {!isInstalled && (
          <button
            type="button"
            className="btn-glass-secondary"
            onClick={installApp}
            title="Installer l'application sur le téléphone ou le bureau"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem',
              color: 'var(--primary)',
              borderColor: 'rgba(99, 102, 241, 0.4)',
              background: 'rgba(99, 102, 241, 0.08)'
            }}
          >
            <Download size={15} />
            <span className="hidden sm:inline" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Installer l'App
            </span>
          </button>
        )}

        {/* Indicateur d'état de sauvegarde réactif */}
        <div className="header-status-badge">
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 size={13} color="#10b981" />
              <span className="hidden sm:inline">Enregistré</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <RefreshCw size={13} color="#f59e0b" className="animate-spin" />
              <span className="hidden sm:inline">Sauvegarde...</span>
            </>
          )}
          {saveStatus === 'offline' && (
            <>
              <CloudOff size={13} color="#94a3b8" />
              <span className="hidden sm:inline">Local</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle size={13} color="#ef4444" />
              <span className="hidden sm:inline">Erreur</span>
            </>
          )}
        </div>

        {/* Sélecteur Moteur d'Ultra-Densité (4 paliers) */}
        {onDensityChange && (
          <div className="hidden sm:flex items-center bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] p-0.5 border border-[var(--glass-border-subtle)]" title="Niveau de densité & micro-échelle">
            {densityOptions.map(opt => (
              <button
                key={opt.level}
                type="button"
                onClick={() => onDensityChange(opt.level)}
                style={{
                  padding: '0.2rem 0.45rem',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: density === opt.level ? 'var(--primary)' : 'transparent',
                  color: density === opt.level ? '#ffffff' : 'var(--text-secondary)'
                }}
                title={`Densité ${opt.level} (${opt.label})`}
              >
                <span>{opt.icon}</span> <span className="hidden md:inline">{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Bascule Dark / Light */}
        <button
          className="btn-glass-secondary btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          aria-label="Basculer le thème"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Bouton Compte avec nom d'utilisateur réel */}
        <button
          className="btn-glass-secondary"
          onClick={onOpenAccount}
          title="Mon profil et coordonnées"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <User size={15} />
          <span className="hidden md:inline" style={{ fontWeight: 600 }}>
            {currentUser?.username || 'Mon Compte'}
          </span>
        </button>

        {/* Bouton Déconnexion */}
        {onLogout && (
          <button
            className="btn-ghost btn-icon"
            onClick={onLogout}
            title="Se déconnecter de cette session"
            aria-label="Se déconnecter"
            style={{ color: 'var(--danger)' }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
};
