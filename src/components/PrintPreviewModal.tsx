import React, { useState, useRef } from 'react';
import { 
  X, 
  Printer, 
  FileDown, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Smartphone, 
  Monitor, 
  Tablet, 
  FileSpreadsheet,
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  Palette
} from 'lucide-react';
import { Board, PrintSettings, ExportTargetFormat, GridDensity, WallpaperTheme } from '../types';
import { exportBoardToDocx, exportBoardToPdf, exportElementToPng, downloadFile } from '../services/exportService';
import { PlaniluxLogo } from './ui/PlaniluxLogo';

interface PrintPreviewModalProps {
  board: Board;
  onClose: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ board, onClose }) => {
  const [settings, setSettings] = useState<PrintSettings>({
    format: 'A4',
    orientation: 'landscape',
    margins: 'compact',
    fitMode: 'fit_width',
    repeatHeaders: true,
    showBorders: true,
    printColors: true,
    includeNotes: true,
    density: 'normal',
    cellScale: 100,
    wallpaperTheme: 'midnight'
  });

  const [isExporting, setIsExporting] = useState<'pdf' | 'docx' | 'png' | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const colAxes = board.axes.filter(a => a.axis === 'column').sort((a, b) => a.position - b.position);
  const rowAxes = board.axes.filter(a => a.axis === 'row').sort((a, b) => a.position - b.position);

  const isPhoneWallpaper = settings.format === 'phone_wallpaper';
  const isDesktopWallpaper = settings.format === 'desktop_wallpaper';
  const isWallpaperMode = isPhoneWallpaper || isDesktopWallpaper;

  // Détection avertissement débordement
  const isTooWideForPortrait = colAxes.length > 5 && settings.orientation === 'portrait' && !isPhoneWallpaper;

  // Ajustement automatique de l'orientation lors du changement de format
  const handleFormatChange = (newFormat: ExportTargetFormat) => {
    let newOrientation = settings.orientation;
    if (newFormat === 'phone_wallpaper') {
      newOrientation = 'portrait';
    } else if (newFormat === 'desktop_wallpaper') {
      newOrientation = 'landscape';
    }
    setSettings(prev => ({
      ...prev,
      format: newFormat,
      orientation: newOrientation
    }));
  };

  // Zoom / Taille des cases
  const handleScaleChange = (newScale: number) => {
    const clamped = Math.max(70, Math.min(150, newScale));
    setSettings(prev => ({ ...prev, cellScale: clamped }));
  };

  const handleExportPng = async () => {
    if (!previewRef.current) return;
    setIsExporting('png');
    try {
      const safeTitle = board.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const suffix = isPhoneWallpaper ? 'fond_ecran_smartphone' : isDesktopWallpaper ? 'fond_ecran_bureau' : 'capture_planning';
      await exportElementToPng(previewRef.current, `${safeTitle}_${suffix}.png`);
      setExportSuccess('Image HD générée et téléchargée avec succès !');
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (e) {
      console.error('PNG export error', e);
      alert("Erreur lors de la création de l'image. Veuillez réessayer.");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = () => {
    setIsExporting('pdf');
    try {
      const blob = exportBoardToPdf(board, settings);
      const safeTitle = board.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      downloadFile(blob, `${safeTitle}_${settings.format.toLowerCase()}.pdf`);
      setExportSuccess('Fichier PDF généré avec succès !');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (e) {
      console.error('PDF export error', e);
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportDocx = async () => {
    setIsExporting('docx');
    try {
      const blob = await exportBoardToDocx(board, settings);
      const safeTitle = board.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      downloadFile(blob, `${safeTitle}_word.docx`);
      setExportSuccess('Fichier Word DOCX généré avec succès !');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (e) {
      console.error('DOCX export error', e);
      alert('Erreur lors de la génération du fichier Word.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  // Thèmes graphiques pour le fond d'écran
  const getWallpaperStyles = (theme?: WallpaperTheme): { background: string; color: string; cardBg: string; border: string; headerBg: string; cellBorder: string } => {
    switch (theme) {
      case 'midnight':
        return {
          background: 'linear-gradient(135deg, #090d16 0%, #111a2e 50%, #0a0f1d 100%)',
          color: '#f8fafc',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.16)',
          headerBg: 'rgba(30, 41, 59, 0.7)',
          cellBorder: 'rgba(255, 255, 255, 0.1)'
        };
      case 'emerald':
        return {
          background: 'linear-gradient(135deg, #051b14 0%, #0d382c 50%, #072218 100%)',
          color: '#ecfdf5',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(52, 211, 153, 0.25)',
          headerBg: 'rgba(6, 78, 59, 0.6)',
          cellBorder: 'rgba(52, 211, 153, 0.15)'
        };
      case 'slate':
        return {
          background: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #09090b 100%)',
          color: '#f4f4f5',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(255, 255, 255, 0.14)',
          headerBg: 'rgba(39, 39, 42, 0.8)',
          cellBorder: 'rgba(255, 255, 255, 0.1)'
        };
      case 'light':
      default:
        return {
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          color: '#0f172a',
          cardBg: 'rgba(255, 255, 255, 0.85)',
          border: 'rgba(203, 213, 225, 0.8)',
          headerBg: '#f1f5f9',
          cellBorder: '#e2e8f0'
        };
    }
  };

  const wpStyle = getWallpaperStyles(isWallpaperMode ? settings.wallpaperTheme : 'light');

  // Multiplicateurs de taille selon densité et échelle
  const scaleRatio = (settings.cellScale || 100) / 100;
  const densityPadding = settings.density === 'compact' ? '3px 4px' : settings.density === 'spacious' ? '10px 8px' : '6px 6px';
  const cellFontSize = `${Math.max(0.55, 0.72 * scaleRatio)}rem`;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="print-modal-title">
      <div className="modal-card print-modal">
        {/* En-tête de modale */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Printer size={20} color="var(--primary)" />
            <h2 id="print-modal-title" className="modal-title">Impression & Export Multi-Formats</h2>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose} aria-label="Fermer la modale">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* SÉLECTEUR DE FORMAT CIBLE (Appareils & Papier) */}
          <div>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
              Format d'adaptation & Appareil :
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.5rem' }}>
              
              <button
                type="button"
                onClick={() => handleFormatChange('A4')}
                style={{
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.format === 'A4' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: settings.format === 'A4' ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                  color: settings.format === 'A4' ? 'var(--primary)' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.78rem'
                }}
              >
                <FileSpreadsheet size={18} />
                <span>Feuille A4</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.75, fontWeight: 400 }}>210 × 297 mm</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('phone_wallpaper')}
                style={{
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.format === 'phone_wallpaper' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: settings.format === 'phone_wallpaper' ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                  color: settings.format === 'phone_wallpaper' ? 'var(--primary)' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.78rem'
                }}
              >
                <Smartphone size={18} />
                <span>Fond d'écran Mobile</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.75, fontWeight: 400 }}>9:16 Vertical</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('desktop_wallpaper')}
                style={{
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.format === 'desktop_wallpaper' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: settings.format === 'desktop_wallpaper' ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                  color: settings.format === 'desktop_wallpaper' ? 'var(--primary)' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.78rem'
                }}
              >
                <Monitor size={18} />
                <span>Fond d'écran PC</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.75, fontWeight: 400 }}>16:9 Panoramique</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('tablet')}
                style={{
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.format === 'tablet' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: settings.format === 'tablet' ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                  color: settings.format === 'tablet' ? 'var(--primary)' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.78rem'
                }}
              >
                <Tablet size={18} />
                <span>Format Tablette</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.75, fontWeight: 400 }}>iPad / Android</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('Letter')}
                style={{
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.format === 'Letter' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: settings.format === 'Letter' ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                  color: settings.format === 'Letter' ? 'var(--primary)' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.78rem'
                }}
              >
                <FileSpreadsheet size={18} />
                <span>US Letter</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.75, fontWeight: 400 }}>216 × 279 mm</span>
              </button>

            </div>
          </div>

          {/* Panneau de réglages fins (Orientation, Taille des cases, Zoom, Thème) */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border-subtle)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
              
              {/* Orientation (Portrait vs Paysage) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Orientation</label>
                <select
                  value={settings.orientation}
                  onChange={(e) => setSettings({ ...settings, orientation: e.target.value as 'portrait' | 'landscape' })}
                  disabled={isPhoneWallpaper || isDesktopWallpaper}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="landscape">Paysage (Horizontal — Recommandé)</option>
                  <option value="portrait">Portrait (Vertical)</option>
                </select>
                {isPhoneWallpaper && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fixé en vertical (9:16)</span>}
                {isDesktopWallpaper && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fixé en paysage (16:9)</span>}
              </div>

              {/* Densité des cases (Compact / Standard / Spacieux) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Densité des cases</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['compact', 'normal', 'spacious'] as GridDensity[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSettings({ ...settings, density: d })}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0.2rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: settings.density === d ? 'var(--primary)' : 'var(--border-medium)',
                        background: settings.density === d ? 'var(--primary)' : 'var(--bg-primary)',
                        color: settings.density === d ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {d === 'compact' ? 'Compact' : d === 'normal' ? 'Standard' : 'Spacieux'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Curseur de Zoom / Taille des cases (70% à 150%) */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>
                    Taille des cases : {settings.cellScale}%
                  </label>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <button 
                      type="button" 
                      onClick={() => handleScaleChange(settings.cellScale - 10)}
                      className="btn-ghost btn-icon"
                      title="Réduire les cases"
                      style={{ padding: '2px' }}
                    >
                      <ZoomOut size={14} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleScaleChange(settings.cellScale + 10)}
                      className="btn-ghost btn-icon"
                      title="Agrandir les cases"
                      style={{ padding: '2px' }}
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="70"
                  max="150"
                  step="5"
                  value={settings.cellScale}
                  onChange={(e) => handleScaleChange(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>Réduit (70%)</span>
                  <span>100%</span>
                  <span>Agrandie (150%)</span>
                </div>
              </div>

              {/* Thème visuel (pour fond d'écran ou impression colorée) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Palette size={14} />
                  <span>Ambiance / Thème</span>
                </label>
                <select
                  value={settings.wallpaperTheme}
                  onChange={(e) => setSettings({ ...settings, wallpaperTheme: e.target.value as WallpaperTheme })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="midnight">Nuit Sombre (Midnight Blue)</option>
                  <option value="emerald">Émeraude & Forêt</option>
                  <option value="slate">Ardoise & Carbone</option>
                  <option value="light">Clair (Papier & Bureau)</option>
                </select>
              </div>

            </div>

            {/* Options secondaires (Quadrillage, Couleurs, Notes) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-light)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.printColors}
                  onChange={(e) => setSettings({ ...settings, printColors: e.target.checked })}
                />
                Couleurs de fond des cours
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.showBorders}
                  onChange={(e) => setSettings({ ...settings, showBorders: e.target.checked })}
                />
                Quadrillage visible
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.includeNotes}
                  onChange={(e) => setSettings({ ...settings, includeNotes: e.target.checked })}
                />
                Notes de bas de tableau
              </label>
            </div>
          </div>

          {/* Avertissement lisibilité portrait si trop de colonnes */}
          {isTooWideForPortrait && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Conseil de mise en page :</strong> Avec {colAxes.length} colonnes, l'orientation Paysage offrira une lecture plus aérée de vos cours.
              </div>
            </div>
          )}

          {/* BOÎTE D'APERÇU RÉALISTE EN DIRECT */}
          <div className="print-preview-box" style={{ background: isWallpaperMode ? 'rgba(0, 0, 0, 0.4)' : 'var(--bg-tertiary)' }}>
            <div
              ref={previewRef}
              className={`print-page-sheet ${isPhoneWallpaper ? 'wallpaper-phone-frame' : isDesktopWallpaper ? 'wallpaper-desktop-frame' : ''}`}
              style={{
                aspectRatio: isPhoneWallpaper ? '9 / 16' : isDesktopWallpaper ? '16 / 9' : settings.orientation === 'landscape' ? '1.414' : '0.707',
                background: wpStyle.background,
                color: wpStyle.color,
                transition: 'all 0.25s ease'
              }}
            >
              {/* Titre & Signature (Feuille pure d'emploi du temps) */}
              <div style={{ borderBottom: `2px solid ${isWallpaperMode ? wpStyle.border : '#2563eb'}`, paddingBottom: '0.6rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PlaniluxLogo size={Math.round(22 * scaleRatio)} />
                    <div>
                      <h3 style={{ fontSize: `${Math.max(0.85, 1.15 * scaleRatio)}rem`, color: isWallpaperMode ? wpStyle.color : '#1e40af', margin: 0, fontWeight: 700, lineHeight: 1.2 }}>
                        {board.title}
                      </h3>
                      <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>
                        {board.template_type.toUpperCase()} • Planilux
                      </span>
                    </div>
                  </div>
                  {isWallpaperMode && (
                    <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>
                      {isPhoneWallpaper ? 'Format 9:16' : 'Format 16:9'}
                    </span>
                  )}
                </div>
              </div>

              {/* Grille dynamique avec échelle et couleurs */}
              <div style={{ overflow: 'hidden', flex: 1, border: settings.showBorders ? `1px solid ${wpStyle.cellBorder}` : 'none', borderRadius: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: cellFontSize }}>
                  <thead>
                    <tr style={{ background: wpStyle.headerBg }}>
                      <th style={{ padding: densityPadding, border: `1px solid ${wpStyle.cellBorder}`, textAlign: 'center', fontWeight: 800, letterSpacing: '0.04em' }}>
                        HORAIRE
                      </th>
                      {colAxes.map(c => (
                        <th key={c.id} style={{ padding: densityPadding, border: `1px solid ${wpStyle.cellBorder}`, textAlign: 'center', fontWeight: 600 }}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rowAxes.map(r => (
                      <tr key={r.id}>
                        <td style={{ padding: densityPadding, border: `1px solid ${wpStyle.cellBorder}`, background: wpStyle.headerBg, fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {r.label}
                        </td>
                        {colAxes.map(c => {
                          const cell = board.cells.find(cell => cell.row_axis_id === r.id && cell.column_axis_id === c.id);
                          const cellBg = settings.printColors && cell?.background_color && cell.background_color !== '#ffffff' 
                            ? cell.background_color 
                            : isWallpaperMode ? 'transparent' : 'white';
                          
                          const cellTxt = settings.printColors && cell?.text_color ? cell.text_color : wpStyle.color;
                          const cellStyle = cell?.text_style || {};

                          return (
                            <td
                              key={c.id}
                              style={{
                                padding: densityPadding,
                                border: `1px solid ${wpStyle.cellBorder}`,
                                background: cellBg,
                                color: cellTxt,
                                fontWeight: cellStyle.bold ? 'bold' : 'normal',
                                fontStyle: cellStyle.italic ? 'italic' : 'normal',
                                textDecoration: cellStyle.underline ? 'underline' : 'none',
                                textAlign: cellStyle.align || 'center'
                              }}
                            >
                              {cell?.content ? cell.content : ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes si cochées */}
              {settings.includeNotes && board.settings.notes && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.68rem', opacity: 0.85, borderTop: `1px solid ${wpStyle.cellBorder}`, paddingTop: '0.4rem' }}>
                  <strong>Notes :</strong> {board.settings.notes}
                </div>
              )}
            </div>
          </div>

          {/* Message de succès d'export */}
          {exportSuccess && (
            <div style={{ background: 'var(--success-bg)', color: 'var(--success-text)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
              <CheckCircle size={18} />
              <span>{exportSuccess}</span>
            </div>
          )}
        </div>

        {/* PIED DE MODALE — ACTIONS D'EXPORTATION MULTI-SUPPORTS */}
        <div className="modal-footer" style={{ flexWrap: 'wrap' }}>
          
          <button type="button" className="btn-glass-secondary" onClick={handleBrowserPrint} title="Imprimer directement avec le navigateur">
            <Printer size={16} />
            <span>Imprimer</span>
          </button>

          <button
            type="button"
            className="btn-glass-secondary"
            onClick={handleExportDocx}
            disabled={isExporting !== null}
            title="Exporter en document Microsoft Word (.docx)"
          >
            <FileText size={16} />
            <span>{isExporting === 'docx' ? 'Création DOCX...' : 'Word (.docx)'}</span>
          </button>

          <button
            type="button"
            className="btn-glass-secondary"
            onClick={handleExportPdf}
            disabled={isExporting !== null}
            title="Télécharger le fichier PDF vectoriel de haute qualité"
          >
            <FileDown size={16} />
            <span>{isExporting === 'pdf' ? 'Création PDF...' : 'Télécharger PDF'}</span>
          </button>

          {/* Bouton clé : Image HD Fond d'écran Smartphone & Ordinateur */}
          <button
            type="button"
            className="btn-glass-black"
            onClick={handleExportPng}
            disabled={isExporting !== null}
            title="Télécharger l'image PNG haute résolution adaptée en fond d'écran"
          >
            <Sparkles size={16} />
            <span>
              {isExporting === 'png' 
                ? 'Génération HD...' 
                : isPhoneWallpaper 
                  ? "Télécharger Fond d'écran Mobile (PNG)" 
                  : isDesktopWallpaper 
                    ? "Télécharger Fond d'écran PC (PNG)" 
                    : "Télécharger en Image HD (PNG)"}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
};
