import React from 'react';
import { 
  Clock, 
  LayoutGrid, 
  Grid, 
  FolderArchive, 
  Sparkles, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { TemplateType } from '../types';
import { PlaniluxLogo } from './ui/PlaniluxLogo';

interface SidebarProps {
  activeView: 'list' | 'editor';
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpenAccount: () => void;
  onCreateFromTemplate: (type: TemplateType) => void;
  counts: {
    total: number;
    timetable: number;
    planner: number;
    free: number;
    trash: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeCategory,
  onSelectCategory,
  isOpen,
  onToggle,
  onOpenAccount,
  onCreateFromTemplate,
  counts
}) => {
  return (
    <>
      {/* Overlay sur mobile quand la sidebar est ouverte */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onToggle}
        aria-hidden="true"
      />

      <aside className={`glass-sidebar ${isOpen ? 'open' : 'collapsed'}`} role="navigation" aria-label="Menu principal">
        {/* En-tête de la Sidebar */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <PlaniluxLogo size={30} />
            {isOpen && (
              <div className="sidebar-logo-text">
                <span className="logo-title">Planilux</span>
                <span className="logo-badge-pill">Planning Studio</span>
              </div>
            )}
          </div>

          <button 
            type="button" 
            className="sidebar-toggle-btn"
            onClick={onToggle}
            title={isOpen ? "Réduire le menu" : "Agrandir le menu"}
            aria-label={isOpen ? "Réduire le menu" : "Agrandir le menu"}
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Bouton d'action rapide style noir 3D Glass */}
        {isOpen && (
          <div className="sidebar-action-box">
            <button 
              type="button" 
              className="btn-glass-black w-full"
              onClick={() => onCreateFromTemplate('timetable')}
              title="Créer un nouvel emploi du temps"
            >
              <Sparkles size={16} />
              <span>+ Nouveau Planning</span>
            </button>
          </div>
        )}

        {/* Navigation des classeurs et catégories */}
        <div className="sidebar-menu">
          <div className="sidebar-section-title">
            {isOpen ? 'Classeurs & Modèles' : '•••'}
          </div>

          <button
            type="button"
            className={`sidebar-nav-item ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => onSelectCategory('all')}
            title="Tous mes classeurs"
          >
            <FolderOpen size={18} />
            {isOpen && (
              <>
                <span className="nav-label">Tous les classeurs</span>
                <span className="nav-badge">{counts.total}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeCategory === 'timetable' ? 'active' : ''}`}
            onClick={() => onSelectCategory('timetable')}
            title="Emplois du temps"
          >
            <Clock size={18} />
            {isOpen && (
              <>
                <span className="nav-label">Emplois du temps</span>
                <span className="nav-badge">{counts.timetable}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeCategory === 'planners' ? 'active' : ''}`}
            onClick={() => onSelectCategory('planners')}
            title="Plannings & Agendas"
          >
            <LayoutGrid size={18} />
            {isOpen && (
              <>
                <span className="nav-label">Plannings & Agendas</span>
                <span className="nav-badge">{counts.planner}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeCategory === 'free' ? 'active' : ''}`}
            onClick={() => onSelectCategory('free')}
            title="Tableaux Libres"
          >
            <Grid size={18} />
            {isOpen && (
              <>
                <span className="nav-label">Tableaux Libres</span>
                <span className="nav-badge">{counts.free}</span>
              </>
            )}
          </button>

          <div className="sidebar-separator" />

          {/* Section Organisation & Archivage */}
          <div className="sidebar-section-title">
            {isOpen ? 'Organisation' : '•••'}
          </div>

          <button
            type="button"
            className={`sidebar-nav-item ${activeCategory === 'trash' ? 'active' : ''}`}
            onClick={() => onSelectCategory('trash')}
            title="Corbeille (tableaux archivés)"
          >
            <FolderArchive size={18} />
            {isOpen && (
              <>
                <span className="nav-label">Corbeille</span>
                {counts.trash > 0 && <span className="nav-badge danger">{counts.trash}</span>}
              </>
            )}
          </button>

          <button
            type="button"
            className="sidebar-nav-item"
            onClick={onOpenAccount}
            title="Préférences et Sauvegardes"
          >
            <Settings size={18} />
            {isOpen && <span className="nav-label">Paramètres & Compte</span>}
          </button>
        </div>

        {/* Pied de sidebar épuré */}
        {isOpen && (
          <div className="sidebar-footer">
            <div className="sidebar-footer-card">
              <span className="footer-card-tag">Format Libre</span>
              <p className="footer-card-text">Export adapté aux écrans et à l'impression papier.</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
