import React, { useState } from 'react';
import { ArrowLeft, Share2, Printer, Trash2, Columns, Rows, Check } from 'lucide-react';
import { Board, BoardCell, BoardAxis } from '../types';
import { CellPropertiesPanel } from './CellPropertiesPanel';
import { ShareModal } from './ShareModal';
import { PrintPreviewModal } from './PrintPreviewModal';

interface BoardEditorProps {
  board: Board;
  onUpdateBoard: (updated: Board) => void;
  onBack: () => void;
}

export const BoardEditor: React.FC<BoardEditorProps> = ({ board, onUpdateBoard, onBack }) => {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingAxisId, setEditingAxisId] = useState<string | null>(null);
  const [axisLabelInput, setAxisLabelInput] = useState('');

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

  // Ajouter une colonne
  const handleAddColumn = () => {
    const newColId = 'axis_col_' + Math.random().toString(36).substring(2, 9);
    const newPos = colAxes.length;
    const newColAxis: BoardAxis = {
      id: newColId,
      board_id: board.id,
      axis: 'column',
      position: newPos,
      label: `Colonne ${newPos + 1}`,
      kind: 'custom',
      size_px: 150
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
      alert('Un tableau doit comporter au moins une colonne.');
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

  // Ajouter une ligne
  const handleAddRow = () => {
    const newRowId = 'axis_row_' + Math.random().toString(36).substring(2, 9);
    const newPos = rowAxes.length;
    const newRowAxis: BoardAxis = {
      id: newRowId,
      board_id: board.id,
      axis: 'row',
      position: newPos,
      label: `Ligne ${newPos + 1}`,
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
      alert('Un tableau doit comporter au moins une ligne.');
      return;
    }
    if (confirm('Voulez-vous supprimer cette ligne et son contenu ?')) {
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
    if (!axisLabelInput.trim()) return;
    const updatedAxes = board.axes.map(a => {
      if (a.id === axisId) {
        return { ...a, label: axisLabelInput.trim() };
      }
      return a;
    });
    onUpdateBoard({ ...board, axes: updatedAxes });
    setEditingAxisId(null);
  };

  return (
    <div className="editor-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Barre d'outils supérieure de l'éditeur en Verre Dépoli */}
      <div 
        className="editor-toolbar"
        style={{
          background: 'var(--bg-secondary)',
          backdropFilter: 'var(--glass-blur)',
          borderBottom: '1px solid var(--glass-border)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          zIndex: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-glass-secondary" onClick={onBack} title="Retourner à mes classeurs">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Mes classeurs</span>
          </button>

          <input
            type="text"
            className="editor-title-input"
            value={board.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            title="Cliquer pour modifier le titre"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '1.2rem',
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: '8px',
              padding: '0.2rem 0.5rem',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Actions d'ajout de ligne/colonne */}
          <button className="btn-glass-secondary" onClick={handleAddColumn} title="Ajouter une colonne">
            <Columns size={15} />
            <span>+ Colonne</span>
          </button>

          <button className="btn-glass-secondary" onClick={handleAddRow} title="Ajouter une ligne">
            <Rows size={15} />
            <span>+ Ligne</span>
          </button>

          {/* Partage */}
          <button className="btn-glass-secondary" onClick={() => setIsShareModalOpen(true)} title="Partager ce planning">
            <Share2 size={16} />
            <span className="hidden md:inline">Partager</span>
          </button>

          {/* Export & Impression */}
          <button className="btn-glass-black" onClick={() => setIsPrintModalOpen(true)} title="Aperçu d'impression et export PDF/Word">
            <Printer size={16} />
            <span>Imprimer / Exporter</span>
          </button>
        </div>
      </div>

      {/* Zone Principale : Grille en Verre + Panneau latéral */}
      <div className="editor-main" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div className="grid-viewport" style={{ flex: 1, overflow: 'auto', padding: '1.5rem', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="planner-table-container">
            <table className="planner-table-glass" role="grid" aria-label="Grille de planification en verre dépoli">
            <thead>
              <tr>
                {/* Coin supérieur gauche */}
                <th className="corner-header">
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Horaires / Jours
                  </div>
                </th>

                {/* En-têtes de colonnes */}
                {colAxes.map((col) => (
                  <th key={col.id} style={{ minWidth: `${col.size_px || 140}px` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', position: 'relative' }}>
                      {editingAxisId === col.id ? (
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <input
                            type="text"
                            value={axisLabelInput}
                            onChange={(e) => setAxisLabelInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditAxis(col.id)}
                            autoFocus
                            style={{ width: '90px', padding: '2px 4px', fontSize: '0.75rem', borderRadius: '4px' }}
                          />
                          <button className="btn-ghost btn-icon" onClick={() => saveEditAxis(col.id)} style={{ padding: '2px' }}>
                            <Check size={12} color="#10b981" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => startEditAxis(col)}
                          title="Cliquer pour renommer la colonne"
                          style={{ cursor: 'pointer', fontWeight: 600 }}
                        >
                          {col.label}
                        </span>
                      )}

                      {colAxes.length > 1 && (
                        <button
                          className="btn-ghost btn-icon"
                          onClick={() => handleDeleteColumn(col.id)}
                          title="Supprimer cette colonne"
                          style={{ padding: '2px', opacity: 0.5 }}
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
                  {/* En-tête de ligne */}
                  <td className="row-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                      {editingAxisId === row.id ? (
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <input
                            type="text"
                            value={axisLabelInput}
                            onChange={(e) => setAxisLabelInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditAxis(row.id)}
                            autoFocus
                            style={{ width: '90px', padding: '2px 4px', fontSize: '0.75rem', borderRadius: '4px' }}
                          />
                          <button className="btn-ghost btn-icon" onClick={() => saveEditAxis(row.id)} style={{ padding: '2px' }}>
                            <Check size={12} color="#10b981" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => startEditAxis(row)}
                          title="Cliquer pour renommer la plage"
                          style={{ cursor: 'pointer' }}
                        >
                          {row.label}
                        </span>
                      )}

                      {rowAxes.length > 1 && (
                        <button
                          className="btn-ghost btn-icon"
                          onClick={() => handleDeleteRow(row.id)}
                          title="Supprimer cette ligne"
                          style={{ padding: '2px', opacity: 0.5 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Cellules de la ligne */}
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
                          backgroundColor: cell?.background_color && cell.background_color !== '#ffffff' ? cell.background_color : undefined,
                          color: cell?.text_color || 'var(--text-primary)',
                          fontWeight: style.bold ? 'bold' : 'normal',
                          fontStyle: style.italic ? 'italic' : 'normal',
                          textDecoration: style.underline ? 'underline' : 'none',
                          textAlign: style.align || 'left'
                        }}
                      >
                        {cell?.content || ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          {/* Bloc de notes au bas du tableau */}
          <div 
            style={{ 
              maxWidth: '850px', 
              width: '100%',
              margin: '2rem auto 0 auto', 
              background: 'var(--bg-glass-card)', 
              backdropFilter: 'var(--glass-blur)',
              padding: '1rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-glass)'
            }}
          >
            <label htmlFor="board-notes-input" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              Notes & consignes du tableau (incluses lors de l'impression) :
            </label>
            <textarea
              id="board-notes-input"
              value={board.settings.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={2}
              placeholder="Ex : Présence obligatoire, coordonnées du responsable, salle de secours..."
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
          </div>
        </div>

        {/* Panneau latéral de modification de cellule */}
        {selectedCell && (
          <CellPropertiesPanel
            cell={selectedCell}
            rowLabel={selectedRowAxis?.label || 'Ligne'}
            colLabel={selectedColAxis?.label || 'Colonne'}
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
