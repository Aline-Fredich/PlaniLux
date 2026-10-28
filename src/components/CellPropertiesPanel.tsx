import React from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, X, Trash2, Check, Sparkles } from 'lucide-react';
import { BoardCell, TextAlign } from '../types';

interface CellPropertiesPanelProps {
  cell: BoardCell | null;
  rowLabel: string;
  colLabel: string;
  onUpdateCell: (updated: Partial<BoardCell>) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  { bg: '#ffffff', text: '#1f2937', label: 'Blanc' },
  { bg: '#dbeafe', text: '#1e40af', label: 'Bleu pastel' },
  { bg: '#dcfce7', text: '#166534', label: 'Vert menthe' },
  { bg: '#fef3c7', text: '#92400e', label: 'Jaune ambré' },
  { bg: '#fee2e2', text: '#991b1b', label: 'Rouge corail' },
  { bg: '#f3e8ff', text: '#6b21a8', label: 'Violet lavande' },
  { bg: '#ffedd5', text: '#9a3412', label: 'Pêche' },
  { bg: '#f1f5f9', text: '#475569', label: 'Gris neutre' },
  { bg: '#ecfdf5', text: '#065f46', label: 'Émeraude' },
  { bg: '#fefce8', text: '#854d0e', label: 'Crème' },
];

const QUICK_SUBJECTS = [
  { name: 'Mathématiques', bg: '#dbeafe', text: '#1e40af' },
  { name: 'Français', bg: '#fce7f3', text: '#9d174d' },
  { name: 'Histoire-Géo', bg: '#ffedd5', text: '#9a3412' },
  { name: 'Anglais', bg: '#dcfce7', text: '#166534' },
  { name: 'Physique-Chimie', bg: '#e0e7ff', text: '#3730a3' },
  { name: 'Sport / EPS', bg: '#fef3c7', text: '#92400e' },
  { name: 'Réunion / Travail', bg: '#fee2e2', text: '#991b1b' },
  { name: 'Pause Déjeuner', bg: '#f1f5f9', text: '#475569' }
];

export const CellPropertiesPanel: React.FC<CellPropertiesPanelProps> = ({
  cell,
  rowLabel,
  colLabel,
  onUpdateCell,
  onClose
}) => {
  if (!cell) return null;

  const style = cell.text_style || {};

  const toggleBold = () => {
    onUpdateCell({ text_style: { ...style, bold: !style.bold } });
  };

  const toggleItalic = () => {
    onUpdateCell({ text_style: { ...style, italic: !style.italic } });
  };

  const toggleUnderline = () => {
    onUpdateCell({ text_style: { ...style, underline: !style.underline } });
  };

  const setAlign = (align: TextAlign) => {
    onUpdateCell({ text_style: { ...style, align } });
  };

  const clearFormatting = () => {
    onUpdateCell({
      content: '',
      background_color: '#ffffff',
      text_color: '#1f2937',
      text_style: { align: 'left', bold: false, italic: false, underline: false }
    });
  };

  return (
    <div className="properties-panel" role="region" aria-label="Propriétés de la cellule sélectionnée">
      {/* Poignée de tiroir tactile pour Smartphone */}
      <div className="sheet-drag-handle sm:hidden" onClick={onClose} />

      {/* En-tête du panneau avec titre et validation */}
      <div className="panel-header">
        <div>
          <span className="panel-title">Modifier le cours / créneau</span>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
            📅 {colLabel} &nbsp;•&nbsp; ⏰ {rowLabel}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            className="btn-glass-black btn-icon sm:hidden"
            onClick={onClose} 
            title="Appliquer et fermer"
            aria-label="Valider"
          >
            <Check size={16} />
          </button>
          <button 
            type="button"
            className="btn-ghost btn-icon" 
            onClick={onClose} 
            title="Fermer le panneau"
            aria-label="Fermer"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Raccourcis Matières & Activités pré-configurés */}
      <div className="form-group mb-3">
        <label className="form-label flex items-center gap-1">
          <Sparkles size={13} color="var(--primary)" />
          <span>Raccourcis rapides :</span>
        </label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {QUICK_SUBJECTS.map((qs, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onUpdateCell({
                content: qs.name,
                background_color: qs.bg,
                text_color: qs.text,
                text_style: { ...style, align: 'center', bold: true }
              })}
              className="quick-subject-chip"
              style={{
                backgroundColor: qs.bg,
                color: qs.text
              }}
            >
              {qs.name}
            </button>
          ))}
        </div>
      </div>

      {/* Saisie du texte & Description */}
      <div className="form-group mb-3">
        <label className="form-label" htmlFor="cell-content-input">
          Contenu du créneau (Matière, Salle, Professeur) :
        </label>
        <textarea
          id="cell-content-input"
          value={cell.content}
          onChange={(e) => onUpdateCell({ content: e.target.value })}
          rows={3}
          placeholder="Ex : Mathématiques&#10;Amphi B - M. Martin"
          className="cell-textarea"
          autoFocus
        />
      </div>

      {/* Style Typographique & Alignement */}
      <div className="form-group mb-3">
        <label className="form-label">Formatage du texte</label>
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            className={`btn-secondary btn-icon ${style.bold ? 'btn-primary' : ''}`}
            onClick={toggleBold}
            title="Gras"
            aria-label="Texte en gras"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            className={`btn-secondary btn-icon ${style.italic ? 'btn-primary' : ''}`}
            onClick={toggleItalic}
            title="Italique"
            aria-label="Texte en italique"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            className={`btn-secondary btn-icon ${style.underline ? 'btn-primary' : ''}`}
            onClick={toggleUnderline}
            title="Souligné"
            aria-label="Texte souligné"
          >
            <Underline size={16} />
          </button>

          <span className="w-px bg-[var(--border-light)] my-1 mx-1" />

          <button
            type="button"
            className={`btn-secondary btn-icon ${style.align === 'left' || !style.align ? 'btn-primary' : ''}`}
            onClick={() => setAlign('left')}
            title="Aligner à gauche"
            aria-label="Aligner à gauche"
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            className={`btn-secondary btn-icon ${style.align === 'center' ? 'btn-primary' : ''}`}
            onClick={() => setAlign('center')}
            title="Centrer"
            aria-label="Centrer"
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            className={`btn-secondary btn-icon ${style.align === 'right' ? 'btn-primary' : ''}`}
            onClick={() => setAlign('right')}
            title="Aligner à droite"
            aria-label="Aligner à droite"
          >
            <AlignRight size={16} />
          </button>
        </div>
      </div>

      {/* Palette Couleurs Visuelles */}
      <div className="form-group mb-3">
        <label className="form-label">Couleur de fond de la case</label>
        <div className="color-swatches-grid">
          {PRESET_COLORS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className={`color-swatch-item ${cell.background_color === preset.bg ? 'active' : ''}`}
              style={{ backgroundColor: preset.bg }}
              onClick={() => onUpdateCell({
                background_color: preset.bg,
                text_color: preset.text
              })}
              title={preset.label}
              aria-label={preset.label}
            />
          ))}
        </div>
      </div>

      {/* Boutons d'action inférieurs */}
      <div className="panel-footer-actions">
        <button
          type="button"
          className="btn-glass-black w-full"
          onClick={onClose}
        >
          <Check size={16} />
          <span>Terminer & Enregistrer</span>
        </button>

        <button
          type="button"
          className="btn-ghost w-full text-xs text-[var(--text-muted)] hover:text-red-500 mt-1"
          onClick={clearFormatting}
        >
          <Trash2 size={13} />
          <span>Vider cette case</span>
        </button>
      </div>
    </div>
  );
};
