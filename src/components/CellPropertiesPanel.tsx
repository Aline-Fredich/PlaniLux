import React from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, X, Trash2 } from 'lucide-react';
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
  { name: 'Langues', bg: '#dcfce7', text: '#166534' },
  { name: 'Sciences / SVT', bg: '#e0e7ff', text: '#3730a3' },
  { name: 'Sport / EPS', bg: '#fef3c7', text: '#92400e' },
  { name: 'Réunion / Travail', bg: '#fee2e2', text: '#991b1b' },
  { name: 'Pause / Déjeuner', bg: '#f1f5f9', text: '#475569' }
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
      background_color: '#ffffff',
      text_color: '#1f2937',
      text_style: { align: 'left', bold: false, italic: false, underline: false }
    });
  };

  return (
    <div className="properties-panel" role="region" aria-label="Propriétés de la cellule">
      <div className="panel-header">
        <div>
          <span className="panel-title">Éditer la case</span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {rowLabel} • {colLabel}
          </p>
        </div>
        <button className="btn-ghost btn-icon" onClick={onClose} aria-label="Fermer le panneau">
          <X size={16} />
        </button>
      </div>

      {/* Contenu Texte */}
      <div className="form-group">
        <label className="form-label" htmlFor="cell-content-input">Contenu</label>
        <textarea
          id="cell-content-input"
          value={cell.content}
          onChange={(e) => onUpdateCell({ content: e.target.value })}
          rows={4}
          placeholder="Entrez votre texte, cours, note..."
          style={{
            width: '100%',
            padding: '0.6rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            resize: 'vertical'
          }}
        />
        {/* Remplissage rapide par matière / activité */}
        <div style={{ marginTop: '0.6rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            Raccourcis matières & activités :
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
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
                style={{
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '999px',
                  border: '1px solid var(--border-medium)',
                  background: qs.bg,
                  color: qs.text,
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'transform 0.15s ease'
                }}
                className="hover:scale-105"
              >
                {qs.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Style Typographique */}
      <div className="form-group">
        <label className="form-label">Style & Alignement</label>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn-secondary btn-icon ${style.bold ? 'btn-primary' : ''}`}
            onClick={toggleBold}
            title="Gras"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            className={`btn-secondary btn-icon ${style.italic ? 'btn-primary' : ''}`}
            onClick={toggleItalic}
            title="Italique"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            className={`btn-secondary btn-icon ${style.underline ? 'btn-primary' : ''}`}
            onClick={toggleUnderline}
            title="Souligné"
          >
            <Underline size={16} />
          </button>

          <span style={{ width: '1px', background: 'var(--border-light)', margin: '0 0.3rem' }} />

          <button
            type="button"
            className={`btn-secondary btn-icon ${style.align === 'left' || !style.align ? 'btn-primary' : ''}`}
            onClick={() => setAlign('left')}
            title="Aligner à gauche"
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            className={`btn-secondary btn-icon ${style.align === 'center' ? 'btn-primary' : ''}`}
            onClick={() => setAlign('center')}
            title="Centrer"
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            className={`btn-secondary btn-icon ${style.align === 'right' ? 'btn-primary' : ''}`}
            onClick={() => setAlign('right')}
            title="Aligner à droite"
          >
            <AlignRight size={16} />
          </button>
        </div>
      </div>

      {/* Palette Couleurs */}
      <div className="form-group">
        <label className="form-label">Couleur de fond & Nuance</label>
        <div className="color-swatches">
          {PRESET_COLORS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className={`color-swatch ${cell.background_color === preset.bg ? 'active' : ''}`}
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

      {/* Couleur personnalisée */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Fond personnalisé</label>
          <input
            type="color"
            value={cell.background_color || '#ffffff'}
            onChange={(e) => onUpdateCell({ background_color: e.target.value })}
            style={{ width: '100%', height: '34px', cursor: 'pointer', borderRadius: '4px', border: 'none' }}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Texte personnalisé</label>
          <input
            type="color"
            value={cell.text_color || '#1f2937'}
            onChange={(e) => onUpdateCell({ text_color: e.target.value })}
            style={{ width: '100%', height: '34px', cursor: 'pointer', borderRadius: '4px', border: 'none' }}
          />
        </div>
      </div>

      {/* Actions de remise à zéro */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%', color: 'var(--text-muted)' }}
          onClick={clearFormatting}
        >
          <Trash2 size={15} />
          <span>Réinitialiser le style</span>
        </button>
      </div>
    </div>
  );
};
