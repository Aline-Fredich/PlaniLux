import React, { useState } from 'react';
import { Search, Plus, Copy, Trash2, RotateCcw, Calendar, Clock, LayoutGrid, Sun, Grid, FileText, Sparkles, Layers } from 'lucide-react';
import { Board, TemplateType } from '../types';
import { TEMPLATES_CATALOG } from '../templates/defaultTemplates';
import GlassFolder, { FolderFile } from '@/components/ui/glass-folder-cards';

interface BoardListProps {
  boards: Board[];
  selectedCategory: string;
  onSelectBoard: (boardId: string) => void;
  onCreateFromTemplate: (type: TemplateType) => void;
  onDuplicateBoard: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onRestoreBoard: (boardId: string) => void;
  onPermanentDeleteBoard: (boardId: string) => void;
}

export const BoardList: React.FC<BoardListProps> = ({
  boards,
  selectedCategory,
  onSelectBoard,
  onCreateFromTemplate,
  onDuplicateBoard,
  onDeleteBoard,
  onRestoreBoard,
  onPermanentDeleteBoard
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'glass' | 'grid'>('glass');

  const showTrash = selectedCategory === 'trash';

  // Filtrage selon corbeille ou actifs
  const currentList = boards.filter(b => showTrash ? !!b.deleted_at : !b.deleted_at);

  const filteredBoards = currentList.filter(b => {
    const matchQuery = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    let matchCat = true;
    if (selectedCategory === 'timetable') {
      matchCat = b.template_type === 'timetable';
    } else if (selectedCategory === 'planners') {
      matchCat = ['monthly', 'weekly', 'daily'].includes(b.template_type);
    } else if (selectedCategory === 'free') {
      matchCat = b.template_type === 'free';
    }
    return matchQuery && matchCat;
  });

  // Groupement des tableaux pour les Glass Folders 3D
  const timetableBoards = currentList.filter(b => b.template_type === 'timetable');
  const plannerBoards = currentList.filter(b => ['monthly', 'weekly', 'daily'].includes(b.template_type));
  const freeAndOtherBoards = currentList.filter(b => b.template_type === 'free' || !['timetable', 'monthly', 'weekly', 'daily'].includes(b.template_type));

  const mapBoardsToFolderFiles = (boardList: Board[]): { files: FolderFile[]; boardIds: string[] } => {
    const boardIds = boardList.map(b => b.id);
    const files: FolderFile[] = boardList.map((b, idx) => ({
      name: b.title,
      meta: `v${b.version} • ${new Date(b.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`,
      art: idx % 3 === 0 ? 'ember' : idx % 3 === 1 ? 'dusk' : 'glacier'
    }));

    if (files.length === 0) {
      files.push({
        name: 'Dossier vide',
        meta: 'Cliquez sur + pour créer'
      });
    }

    return { files, boardIds };
  };

  const timetableFolder = mapBoardsToFolderFiles(timetableBoards);
  const plannerFolder = mapBoardsToFolderFiles(plannerBoards);
  const freeFolder = mapBoardsToFolderFiles(freeAndOtherBoards);

  const getTemplateIcon = (type: TemplateType) => {
    switch (type) {
      case 'timetable': return <Clock size={20} color="#3b82f6" />;
      case 'monthly': return <Calendar size={20} color="#8b5cf6" />;
      case 'weekly': return <LayoutGrid size={20} color="#10b981" />;
      case 'daily': return <Sun size={20} color="#f59e0b" />;
      case 'free': return <Grid size={20} color="#6366f1" />;
      default: return <FileText size={20} color="#6b7280" />;
    }
  };

  const getTemplateName = (type: TemplateType) => {
    switch (type) {
      case 'timetable': return 'Emploi du temps';
      case 'monthly': return 'Mensuel';
      case 'weekly': return 'Hebdomadaire';
      case 'daily': return 'Quotidien';
      case 'free': return 'Tableau libre';
      default: return type;
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Hero Header Glassmorphism */}
      <div 
        style={{
          background: 'var(--bg-glass-card)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-glass)',
          padding: '2rem 1.75rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Sparkles size={14} />
            <span>Studio de Planification & Impression</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Bienvenue sur Planilux
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)', maxWidth: '720px', lineHeight: 1.5 }}>
            Concevez, organisez et exportez vos emplois du temps et calendriers au format idéal : papier (A4/Letter), fond d'écran smartphone (9:16) ou bureau PC.
          </p>
        </div>
      </div>

      {/* Section 1 : Créer à partir d'un modèle (Les 5 catégories) */}
      {!showTrash && selectedCategory === 'all' && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="section-heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--primary)" />
              <span>Modèles de démarrage rapide</span>
            </h2>
          </div>

          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
              gap: '1rem' 
            }}
          >
            {TEMPLATES_CATALOG.map((tpl) => (
              <div
                key={tpl.type}
                onClick={() => onCreateFromTemplate(tpl.type)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onCreateFromTemplate(tpl.type)}
                title={`Créer un tableau de type ${tpl.title}`}
                className="template-card-motion"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
                    {getTemplateIcon(tpl.type)}
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {tpl.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tpl.title}</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4, flexGrow: 1 }}>{tpl.description}</p>
                <button
                  type="button"
                  className="btn-glass-black"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFromTemplate(tpl.type);
                  }}
                >
                  <Plus size={14} />
                  <span>Utiliser ce modèle</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 2 : Mes classeurs 3D & Tableaux */}
      <section>
        <div className="section-heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>
              {showTrash ? 'Corbeille (Tableaux archivés)' : 'Mes classeurs & plannings'}
            </h2>

            {/* Sélecteur de vue Glass 3D vs Grille */}
            {!showTrash && (
              <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--glass-border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('glass')}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 550,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: viewMode === 'glass' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'glass' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                  title="Affichage dossiers de classement"
                >
                  <Layers size={13} />
                  <span>Classeurs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 550,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'grid' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                  title="Affichage grille classique"
                >
                  <Grid size={13} />
                  <span>Grille</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CLASSEURS 3D EN VERRE DÉPOLI (21st.dev) */}
        {!showTrash && viewMode === 'glass' && (
          <div
            className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl p-6 sm:p-10 shadow-inner"
            style={{
              marginBottom: '2rem',
              background: 'var(--bg-glass-card)',
              backdropFilter: 'var(--glass-blur)',
              backgroundImage: 'radial-gradient(currentColor 1.1px, transparent 1.4px)',
              backgroundSize: '24px 24px',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-glass-elevated)'
            }}
          >
            <div className="relative grid max-w-[1180px] grid-cols-1 items-end justify-items-center gap-x-12 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
              {/* Dossier 1 : Emplois du temps */}
              <GlassFolder
                label="Emplois du temps"
                art="aurora"
                seed={3}
                action="add"
                onAdd={() => onCreateFromTemplate('timetable')}
                files={timetableFolder.files}
                onFileSelect={(_file, index) => {
                  const targetId = timetableFolder.boardIds[index];
                  if (targetId) onSelectBoard(targetId);
                }}
              />

              {/* Dossier 2 : Plannings & Agendas */}
              <GlassFolder
                label="Plannings & Agendas"
                tone="dark"
                art="ember"
                seed={11}
                action="add"
                labelPlacement="top-right"
                onAdd={() => onCreateFromTemplate('weekly')}
                files={plannerFolder.files}
                onFileSelect={(_file, index) => {
                  const targetId = plannerFolder.boardIds[index];
                  if (targetId) onSelectBoard(targetId);
                }}
              />

              {/* Dossier 3 : Tableaux libres & Utilitaires */}
              <GlassFolder
                label="Tableaux Libres"
                art="verdant"
                seed={7}
                action="more"
                labelPlacement="top-left"
                files={freeFolder.files}
                menu={[
                  { label: "Nouveau tableau libre", onSelect: () => onCreateFromTemplate('free') },
                  { label: "Ouvrir le premier", onSelect: () => freeFolder.boardIds[0] && onSelectBoard(freeFolder.boardIds[0]) }
                ]}
                onFileSelect={(_file, index) => {
                  const targetId = freeFolder.boardIds[index];
                  if (targetId) onSelectBoard(targetId);
                }}
              />
            </div>

            <p className="relative mt-8 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase opacity-75 text-center">
              Survoler pour incliner • Cliquer sur un classeur pour le déplier • Cliquer sur une fiche pour éditer
            </p>
          </div>
        )}

        {/* Barre d'outils (Recherche) */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '420px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Rechercher par titre de planning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-glass-card)',
                backdropFilter: 'var(--glass-blur)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-glass)'
              }}
            />
          </div>
        </div>

        {/* Grille de cartes individuelles */}
        {filteredBoards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--bg-glass-card)', backdropFilter: 'var(--glass-blur)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-medium)', boxShadow: 'var(--shadow-glass)' }}>
            <FileText size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              {showTrash ? 'La corbeille est vide' : 'Aucun tableau trouvé'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1rem auto' }}>
              {showTrash
                ? 'Les tableaux supprimés apparaîtront ici pour une restauration éventuelle.'
                : 'Commencez dès maintenant en sélectionnant l’un des modèles ci-dessus.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
            {filteredBoards.map((b) => (
              <div
                key={b.id}
                onClick={() => !showTrash && onSelectBoard(b.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && !showTrash && onSelectBoard(b.id)}
                className="template-card-motion"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getTemplateIcon(b.template_type)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {getTemplateName(b.template_type)}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>v{b.version}</span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{b.title}</h3>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Modifié le {new Date(b.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border-subtle)' }} onClick={(e) => e.stopPropagation()}>
                  {!showTrash ? (
                    <>
                      <button
                        type="button"
                        className="btn-glass-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                        onClick={() => onDuplicateBoard(b.id)}
                        title="Dupliquer ce tableau"
                      >
                        <Copy size={13} />
                        <span>Dupliquer</span>
                      </button>

                      <button
                        type="button"
                        className="btn-ghost btn-icon"
                        onClick={() => onDeleteBoard(b.id)}
                        title="Déplacer vers la corbeille"
                      >
                        <Trash2 size={15} color="var(--danger)" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-glass-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                        onClick={() => onRestoreBoard(b.id)}
                        title="Restaurer le tableau"
                      >
                        <RotateCcw size={13} color="var(--success)" />
                        <span>Restaurer</span>
                      </button>

                      <button
                        type="button"
                        className="btn-danger btn-icon"
                        onClick={() => onPermanentDeleteBoard(b.id)}
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
