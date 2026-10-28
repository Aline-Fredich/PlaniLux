import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Printer, 
  Trash2, 
  Columns, 
  Rows, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sliders, 
  X, 
  FileText,
  ChevronRight
} from 'lucide-react';
import { Board, BoardCell, BoardAxis } from '../types';
import { CellPropertiesPanel } from './CellPropertiesPanel';
import { ShareModal } from './ShareModal';
import { PrintPreviewModal } from './PrintPreviewModal';

interface BoardEditorProps {
  board: Board;
  onUpdateBoard: (updated: Board) => void;
  onBack: () => void;
}

export type DensityMode = 'compact' | 'normal' | 'relaxed';

export const BoardEditor: React.FC<BoardEditorProps> = ({ board, onUpdateBoard, onBack }) => {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingAxisId, setEditingAxisId] = useState<string | null>(null);
  const [axisLabelInput, setAxisLabelInput] = useState('');
  
  // États de présentation & ergonomie responsive
  const [zoom, setZoom] = useState<number>(100);
  const [density, setDensity] = useState<DensityMode>('normal');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tri des axes par position
  const colAxes = board.axes
    .filter(a => a.axis === 'column')
    .sort((a, b) => a.position - b.position);

  const rowAxes = board.axes
    .filter(a => a.axis === 'row')
    .sort((a, b) => a.position - b.position);

  // Cellule sélectionnée
  const selectedCell = board.cells.find(c => c.id === selectedCellId) || null;
  const selectedRowAxis = selectedCell ? rowAxes.find(r => r.id === selectedCell.row_axis_id) : null;
  const selectedColAxis = selectedCell ? colAxes.find(c => c.id === selectedCell.column_axis_id) : null;

  // Mise à jour du titre du tableau
  const handleTitleChange = (newTitle: string) => {
    onUpdateBoard({
      ...board,
      title: newTitle.trim() || 'Sans titre'
    });
  };

  // Mise à jour des notes du tableau
  const handleNotesChange = (notes: string) => {
    onUpdateBoard({
      ...board,
      settings: {
        ...board.settings,
        notes
      }
    });
  };

  // Mise à jour de la cellule active
  const handleUpdateCell = (partial: Partial<BoardCell>) => {
    if (!selectedCellId) return;
    const updatedCells = board.cells.map(cell => {
      if (cell.id === selectedCellId) {
        return { ...cell, ...partial };
      }
      return cell;
    });
    onUpdateBoard({ ...board, cells: updatedCells });
  };

  // Ajouter une colonne (ex: jour supplémentaire ou plage)
  const handleAddColumn = () => {
    const newColId = 'axis_col_' + Math.random().toString(36).substring(2, 9);
    const newPos = colAxes.length;
    const newColAxis: BoardAxis = {
      id: newColId,
      board_id: board.id,
      axis: 'column',
      position: newPos,
      label: `Jour ${newPos + 1}`,
      kind: 'custom',
      size_px: 140
    };

    const newCells: BoardCell[] = rowAxes.map(row => ({
      id: 'cell_' + Math.random().toString(36).substring(2, 9),
      board_id: board.id,
      row_axis_id: row.id,
      column_axis_id: newColId,
      content: '',
      background_color: '#ffffff',
      text_color: '#1f2937',
      text_style: { align: 'center' }
    }));

    onUpdateBoard({
      ...board,
      axes: [...board.axes, newColAxis],
      cells: [...board.cells, ...newCells]
    });
  };

  // Supprimer une colonne
  const handleDeleteColumn = (axisId: string) => {
    if (colAxes.length <= 1) {
      alert('Un planning doit comporter au moins une colonne.');
      return;
    }
    if (confirm('Voulez-vous supprimer cette colonne et son contenu ?')) {
      const remainingCols = colAxes.filter(c => c.id !== axisId).map((c, idx) => ({ ...c, position: idx }));
      const remainingRowAxes = board.axes.filter(a => a.axis === 'row');
      const filteredCells = board.cells.filter(cell => cell.column_axis_id !== axisId);

      onUpdateBoard({
        ...board,
        axes: [...remainingRowAxes, ...remainingCols],
        cells: filteredCells
      });
      if (selectedCell && selectedCell.column_axis_id === axisId) {
        setSelectedCellId(null);
      }
    }
  };

  // Ajouter une ligne (créneau horaire)
  const handleAddRow = () => {
    const newRowId = 'axis_row_' + Math.random().toString(36).substring(2, 9);
    const newPos = rowAxes.length;
    const newRowAxis: BoardAxis = {
      id: newRowId,
      board_id: board.id,
      axis: 'row',
      position: newPos,
      label: `Plage ${newPos + 1}`,
      kind: 'custom',
      size_px: 60
    };

    const newCells: BoardCell[] = colAxes.map(col => ({
      id: 'cell_' + Math.random().toString(36).substring(2, 9),
      board_id: board.id,
      row_axis_id: newRowId,
      column_axis_id: col.id,
      content: '',
      background_color: '#ffffff',
      text_color: '#1f2937',
      text_style: { align: 'center' }
    }));

    onUpdateBoard({
      ...board,
      axes: [...board.axes, newRowAxis],
      cells: [...board.cells, ...newCells]
    });
  };

  // Supprimer une ligne
  const handleDeleteRow = (axisId: string) => {
    if (rowAxes.length <= 1) {
      alert('Un planning doit comporter au moins une ligne.');
      return;
    }
    if (confirm('Voulez-vous supprimer cette plage horaire ?')) {
      const remainingRows = rowAxes.filter(r => r.id !== axisId).map((r, idx) => ({ ...r, position: idx }));
      const remainingColAxes = board.axes.filter(a => a.axis === 'column');
      const filteredCells = board.cells.filter(cell => cell.row_axis_id !== axisId);

      onUpdateBoard({
        ...board,
        axes: [...remainingColAxes, ...remainingRows],
        cells: filteredCells
      });
      if (selectedCell && selectedCell.row_axis_id === axisId) {
        setSelectedCellId(null);
      }
    }
  };

  // Édition d'un libellé d'axe
  const startEditAxis = (axis: BoardAxis) => {
    setEditingAxisId(axis.id);
    setAxisLabelInput(axis.label);
  };

  const saveEditAxis = (axisId: string) => {
    if (!axisLabelInput.trim()) {
      setEditingAxisId(null);
      return;
    }
    const updatedAxes = board.axes.map(a => {
      if (a.id === axisId) {
        return { ...a, label: axisLabelInput.trim() };
      }
      return a;
    });
    onUpdateBoard({ ...board, axes: updatedAxes });
    setEditingAxisId(null);
  };

  // Configuration dynamique selon la densité choisie
  const getDensitySettings = () => {
    switch (density) {
      case 'compact':
        return {
          cellPadding: '0.35rem 0.45rem',
          cellMinHeight: '44px',
          cellMinWidth: '105px',
          fontSize: '0.76rem',
          headerPadding: '0.45rem 0.4rem',
          headerMinWidth: '115px'
        };
      case 'relaxed':
        return {
          cellPadding: '0.85rem 0.8rem',
          cellMinHeight: '75px',
          cellMinWidth: '155px',
          fontSize: '0.92rem',
          headerPadding: '0.85rem 0.6rem',
          headerMinWidth: '160px'
        };
      case 'normal':
      default:
        return {
          cellPadding: '0.6rem',
          cellMinHeight: '58px',
          cellMinWidth: '130px',
          fontSize: '0.84rem',
          headerPadding: '0.65rem 0.5rem',
          headerMinWidth: '135px'
        };
    }
  };

  const dStyle = getDensitySettings();

  return (
    <div className="editor-container">
      {/* 1. Barre d'outils responsive en Verre Dépoli */}
      <header className="editor-toolbar">
        {/* Partie gauche : Retour et Titre */}
        <div className="editor-toolbar-left">
          <button 
            type="button"
            className="btn-glass-secondary btn-icon" 
            onClick={onBack} 
            title="Retourner à mes classeurs"
            aria-label="Retour aux classeurs"
          >
            <ArrowLeft size={17} />
          </button>

          <input
            type="text"
            className="editor-title-input"
            value={board.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            title="Cliquer pour modifier le titre"
            placeholder="Titre du planning"
          />
        </div>

        {/* Partie centrale / Contrôles de Zoom & Densité (Desktop & Tablette) */}
        <div className="editor-toolbar-center hidden md:flex">
          {/* Zoom */}
          <div className="toolbar-pill-group">
            <button
              type="button"
              className="btn-glass-pill btn-icon"
              onClick={() => setZoom(z => Math.max(70, z - 10))}
              title="Réduire l'affichage (-10%)"
              aria-label="Zoom arrière"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              className="btn-glass-pill text-xs font-semibold px-2"
              onClick={() => setZoom(100)}
              title="Réinitialiser l'affichage à 100%"
            >
              {zoom}%
            </button>
            <button
              type="button"
              className="btn-glass-pill btn-icon"
              onClick={() => setZoom(z => Math.min(140, z + 10))}
              title="Agrandir l'affichage (+10%)"
              aria-label="Zoom avant"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Densité */}
          <div className="toolbar-pill-group">
            <button
              type="button"
              className={`btn-glass-pill ${density === 'compact' ? 'active' : ''}`}
              onClick={() => setDensity('compact')}
              title="Affichage compact"
            >
              Compact
            </button>
            <button
              type="button"
              className={`btn-glass-pill ${density === 'normal' ? 'active' : ''}`}
              onClick={() => setDensity('normal')}
              title="Affichage normal"
            >
              Standard
            </button>
            <button
              type="button"
              className={`btn-glass-pill ${density === 'relaxed' ? 'active' : ''}`}
              onClick={() => setDensity('relaxed')}
              title="Affichage aéré"
            >
              Aéré
            </button>
          </div>
        </div>

        {/* Partie droite : Actions principales & Menu d'options mobile */}
        <div className="editor-toolbar-right">
          {/* Boutons d'ajout de structure */}
          <button 
            type="button"
            className="btn-glass-secondary btn-compact-mobile" 
            onClick={handleAddColumn} 
            title="Ajouter une colonne (Jour/Axe)"
          >
            <Columns size={15} />
            <span className="hidden sm:inline">+ Colonne</span>
          </button>

          <button 
            type="button"
            className="btn-glass-secondary btn-compact-mobile" 
            onClick={handleAddRow} 
            title="Ajouter une ligne (Horaire)"
          >
            <Rows size={15} />
            <span className="hidden sm:inline">+ Ligne</span>
          </button>

          {/* Bouton Partager (Desktop) */}
          <button 
            type="button"
            className="btn-glass-secondary hidden lg:inline-flex" 
            onClick={() => setIsShareModalOpen(true)} 
            title="Partager ce planning"
          >
            <Share2 size={15} />
            <span>Partager</span>
          </button>

          {/* Bouton Imprimer / Exporter (Toujours visible et prioritaire) */}
          <button 
            type="button"
            className="btn-glass-black" 
            onClick={() => setIsPrintModalOpen(true)} 
            title="Aperçu d'impression et export PDF/DOCX"
          >
            <Printer size={15} />
            <span className="hidden xs:inline">Imprimer / Exporter</span>
          </button>

          {/* Bouton Menu Options pour mobile */}
          <button
            type="button"
            className="btn-glass-secondary btn-icon md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Options d'affichage et actions"
            aria-label="Options avancées"
          >
            <Sliders size={16} />
          </button>
        </div>
      </header>

      {/* Volet déroulant d'options Mobile */}
      {isMobileMenuOpen && (
        <div className="mobile-options-drawer md:hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--glass-border-subtle)]">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Réglages d'affichage & Outils
            </span>
            <button 
              type="button"
              className="btn-ghost btn-icon p-1" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={15} />
            </button>
          </div>

          {/* Densité sur mobile */}
          <div className="mb-3">
            <label className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">
              Densité de la grille :
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                className={`btn-glass-pill flex-1 ${density === 'compact' ? 'active' : ''}`}
                onClick={() => setDensity('compact')}
              >
                Compact
              </button>
              <button
                type="button"
                className={`btn-glass-pill flex-1 ${density === 'normal' ? 'active' : ''}`}
                onClick={() => setDensity('normal')}
              >
                Standard
              </button>
              <button
                type="button"
                className={`btn-glass-pill flex-1 ${density === 'relaxed' ? 'active' : ''}`}
                onClick={() => setDensity('relaxed')}
              >
                Aéré
              </button>
            </div>
          </div>

          {/* Zoom sur mobile */}
          <div className="mb-3">
            <label className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">
              Échelle visuelle :
            </label>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="btn-glass-secondary btn-icon flex-1"
                onClick={() => setZoom(z => Math.max(70, z - 10))}
              >
                <ZoomOut size={15} />
              </button>
              <button
                type="button"
                className="btn-glass-secondary flex-1 text-xs font-bold"
                onClick={() => setZoom(100)}
              >
                {zoom}% (Réinit)
              </button>
              <button
                type="button"
                className="btn-glass-secondary btn-icon flex-1"
                onClick={() => setZoom(z => Math.min(140, z + 10))}
              >
                <ZoomIn size={15} />
              </button>
            </div>
          </div>

          {/* Action Partager sur mobile */}
          <div className="pt-2 border-t border-[var(--glass-border-subtle)] flex gap-2">
            <button
              type="button"
              className="btn-glass-secondary flex-1 text-xs"
              onClick={() => {
                setIsShareModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <Share2 size={14} />
              <span>Partager ce planning</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Zone Principale : Grille scrollable + Panneau latéral / tiroir */}
      <div className="editor-main">
        {/* Zone de visualisation de la grille */}
        <div className="grid-viewport">
          {/* Astuce de navigation tactile sur smartphone */}
          <div className="mobile-scroll-hint sm:hidden">
            <span>↔️ Faites glisser horizontalement pour voir toute la semaine</span>
          </div>

          {/* Conteneur avec transformation d'échelle Zoom */}
          <div 
            className="planner-table-container"
            style={{
              transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease'
            }}
          >
            <table className="planner-table-glass" role="grid" aria-label="Grille d'emploi du temps">
              <thead>
                <tr>
                  {/* Coin supérieur gauche fixe */}
                  <th 
                    className="corner-header"
                    style={{ 
                      minWidth: dStyle.headerMinWidth,
                      padding: dStyle.headerPadding 
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Heures / Jours
                    </div>
                  </th>

                  {/* En-têtes de colonnes (Jours de la semaine) */}
                  {colAxes.map((col) => (
                    <th 
                      key={col.id} 
                      style={{ 
                        minWidth: `${Math.max(parseInt(dStyle.cellMinWidth), col.size_px || 120)}px`,
                        padding: dStyle.headerPadding 
                      }}
                    >
                      <div className="flex items-center justify-center gap-1.5 relative">
                        {editingAxisId === col.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={axisLabelInput}
                              onChange={(e) => setAxisLabelInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEditAxis(col.id)}
                              autoFocus
                              className="text-xs p-1 rounded border border-[var(--primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] w-20 text-center"
                            />
                            <button 
                              type="button"
                              className="btn-ghost btn-icon p-0.5 text-emerald-500" 
                              onClick={() => saveEditAxis(col.id)}
                            >
                              <Check size={13} />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => startEditAxis(col)}
                            title="Cliquer pour renommer ce jour"
                            className="cursor-pointer font-bold text-[0.84rem] hover:text-[var(--primary)] transition-colors select-none"
                          >
                            {col.label}
                          </span>
                        )}

                        {colAxes.length > 1 && (
                          <button
                            type="button"
                            className="btn-ghost btn-icon p-0.5 opacity-40 hover:opacity-100 hover:text-red-500 transition-opacity"
                            onClick={() => handleDeleteColumn(col.id)}
                            title="Supprimer cette colonne"
                            aria-label={`Supprimer ${col.label}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rowAxes.map((row) => (
                  <tr key={row.id}>
                    {/* En-tête de ligne (Créneau horaire) */}
                    <td 
                      className="row-header"
                      style={{ 
                        minWidth: dStyle.headerMinWidth,
                        padding: dStyle.headerPadding 
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        {editingAxisId === row.id ? (
                          <div className="flex items-center gap-1 w-full">
                            <input
                              type="text"
                              value={axisLabelInput}
                              onChange={(e) => setAxisLabelInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEditAxis(row.id)}
                              autoFocus
                              className="text-xs p-1 rounded border border-[var(--primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] w-full"
                            />
                            <button 
                              type="button"
                              className="btn-ghost btn-icon p-0.5 text-emerald-500" 
                              onClick={() => saveEditAxis(row.id)}
                            >
                              <Check size={13} />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => startEditAxis(row)}
                            title="Cliquer pour modifier l'horaire"
                            className="cursor-pointer font-medium text-xs hover:text-[var(--primary)] transition-colors select-none"
                          >
                            {row.label}
                          </span>
                        )}

                        {rowAxes.length > 1 && (
                          <button
                            type="button"
                            className="btn-ghost btn-icon p-0.5 opacity-35 hover:opacity-100 hover:text-red-500 transition-opacity"
                            onClick={() => handleDeleteRow(row.id)}
                            title="Supprimer ce créneau"
                            aria-label={`Supprimer ${row.label}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Cellules du planning */}
                    {colAxes.map((col) => {
                      const cell = board.cells.find(c => c.row_axis_id === row.id && c.column_axis_id === col.id);
                      const isSelected = selectedCellId === cell?.id;
                      const style = cell?.text_style || {};

                      return (
                        <td
                          key={col.id}
                          className={`planner-cell ${isSelected ? 'selected' : ''}`}
                          onClick={() => cell && setSelectedCellId(cell.id)}
                          style={{
                            padding: dStyle.cellPadding,
                            minHeight: dStyle.cellMinHeight,
                            minWidth: dStyle.cellMinWidth,
                            fontSize: dStyle.fontSize,
                            backgroundColor: cell?.background_color && cell.background_color !== '#ffffff' ? cell.background_color : undefined,
                            color: cell?.text_color || 'var(--text-primary)',
                            fontWeight: style.bold ? 700 : 400,
                            fontStyle: style.italic ? 'italic' : 'normal',
                            textDecoration: style.underline ? 'underline' : 'none',
                            textAlign: style.align || 'left'
                          }}
                        >
                          {cell?.content ? (
                            <div className="cell-content-wrapper">
                              {cell.content}
                            </div>
                          ) : (
                            <div className="cell-empty-placeholder">
                              +
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bloc de notes au bas du tableau */}
          <div className="board-notes-card">
            <div className="flex items-center gap-1.5 mb-2">
              <FileText size={15} color="var(--primary)" />
              <label 
                htmlFor="board-notes-input" 
                className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider"
              >
                Notes & consignes du planning (exportées avec le tableau) :
              </label>
            </div>
            <textarea
              id="board-notes-input"
              value={board.settings.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={2}
              placeholder="Ex : Présence obligatoire en amphi, salle de secours B12, dates des contrôles continus..."
              className="board-notes-textarea"
            />
          </div>
        </div>

        {/* Panneau latéral / Bottom Sheet de modification de cellule */}
        {selectedCell && (
          <CellPropertiesPanel
            cell={selectedCell}
            rowLabel={selectedRowAxis?.label || 'Horaire'}
            colLabel={selectedColAxis?.label || 'Jour'}
            onUpdateCell={handleUpdateCell}
            onClose={() => setSelectedCellId(null)}
          />
        )}
      </div>

      {/* Modale de partage */}
      {isShareModalOpen && (
        <ShareModal board={board} onClose={() => setIsShareModalOpen(false)} />
      )}

      {/* Modale d'aperçu d'impression & export */}
      {isPrintModalOpen && (
        <PrintPreviewModal board={board} onClose={() => setIsPrintModalOpen(false)} />
      )}
    </div>
  );
};
