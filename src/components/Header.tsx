import React from 'react';
import { Moon, Sun, User, CheckCircle2, CloudOff, RefreshCw, AlertCircle, Menu } from 'lucide-react';
import { PlaniluxLogo } from './ui/PlaniluxLogo';
import { SaveStatus } from '../services/storageService';

interface HeaderProps {
  currentView: 'list' | 'editor';
  onNavigateHome: () => void;
  onOpenAccount: () => void;
  onToggleSidebar: () => void;
  saveStatus: SaveStatus;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView: _currentView,
  onNavigateHome,
  onOpenAccount,
  onToggleSidebar,
  saveStatus,
  theme,
  onToggleTheme
}) => {
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

        <div className="logo-group" onClick={onNavigateHome} title="Retour à l'accueil Planilux" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <PlaniluxLogo size={30} />
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Planilux</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

        {/* Bascule Dark / Light */}
        <button
          className="btn-glass-secondary btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          aria-label="Basculer le thème"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Bouton Compte */}
        <button
          className="btn-glass-secondary"
          onClick={onOpenAccount}
          title="Préférences et données de compte"
        >
          <User size={15} />
          <span className="hidden md:inline">Compte</span>
        </button>
      </div>
    </header>
  );
};
