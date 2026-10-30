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
  Palette,
  Type,
  Sliders,
  Eye,
  Minimize2
} from 'lucide-react';
import { Board, PrintSettings, ExportTargetFormat, GridDensity, WallpaperTheme, DocumentFont } from '../types';
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
    tableScaleOnly: 100,
    wallpaperTheme: 'light',
    // Nouveaux réglages de personnalisation intégrale
    customTitle: board.title,
    customSubtitle: board.settings?.notes || '',
    fontFamily: 'sans',
    fontSizeScale: 100,
    headerBgColor: '#f1f5f9',
    headerTextColor: '#0f172a',
    borderColor: '#cbd5e1',
    forcePureWhiteBg: true,
    showLogo: true,
    showTitle: true,
    showSubtitle: true,
    showDate: true,
    showTimeCol: true
  });

  const [activeTab, setActiveTab] = useState<'layout' | 'typography' | 'colors' | 'visibility'>('layout');
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
    let newForceWhite = settings.forcePureWhiteBg;
    if (newFormat === 'phone_wallpaper') {
      newOrientation = 'portrait';
      newForceWhite = false;
    } else if (newFormat === 'desktop_wallpaper') {
      newOrientation = 'landscape';
      newForceWhite = false;
    } else {
      newForceWhite = true;
    }
    setSettings(prev => ({
      ...prev,
      format: newFormat,
      orientation: newOrientation,
      forcePureWhiteBg: newForceWhite
    }));
  };

  // Zoom / Taille des cases globale (30% à 150%)
  const handleScaleChange = (newScale: number) => {
    const clamped = Math.max(30, Math.min(150, newScale));
    setSettings(prev => ({ ...prev, cellScale: clamped }));
  };

  // Réduire la table seulement (30% à 150%)
  const handleTableScaleOnlyChange = (newScale: number) => {
    const clamped = Math.max(30, Math.min(150, newScale));
    setSettings(prev => ({ ...prev, tableScaleOnly: clamped }));
  };

  const handleExportPng = async () => {
    if (!previewRef.current) return;
    setIsExporting('png');
    try {
      const safeTitle = (settings.customTitle || board.title).toLowerCase().replace(/[^a-z0-9]/g, '_');
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
      const safeTitle = (settings.customTitle || board.title).toLowerCase().replace(/[^a-z0-9]/g, '_');
      downloadFile(blob, `${safeTitle}_${settings.format.toLowerCase()}.pdf`);
      setExportSuccess('Fichier PDF vectoriel généré avec succès !');
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
      const safeTitle = (settings.customTitle || board.title).toLowerCase().replace(/[^a-z0-9]/g, '_');
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

  // Thèmes graphiques pour le fond d'écran ou fond d'impression
  const getWallpaperStyles = () => {
    if (!isWallpaperMode || settings.forcePureWhiteBg) {
      return {
        background: '#ffffff',
        color: '#0f172a',
        cardBg: '#ffffff',
        border: settings.borderColor || '#cbd5e1',
        headerBg: settings.headerBgColor || '#f1f5f9',
        headerText: settings.headerTextColor || '#0f172a',
        cellBorder: settings.borderColor || '#cbd5e1'
      };
    }

    switch (settings.wallpaperTheme) {
      case 'midnight':
        return {
          background: 'linear-gradient(135deg, #090d16 0%, #111a2e 50%, #0a0f1d 100%)',
          color: '#f8fafc',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.16)',
          headerBg: 'rgba(30, 41, 59, 0.7)',
          headerText: '#f8fafc',
          cellBorder: 'rgba(255, 255, 255, 0.1)'
        };
      case 'emerald':
        return {
          background: 'linear-gradient(135deg, #051b14 0%, #0d382c 50%, #072218 100%)',
          color: '#ecfdf5',
          cardBg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(52, 211, 153, 0.25)',
          headerBg: 'rgba(6, 78, 59, 0.6)',
          headerText: '#ecfdf5',
          cellBorder: 'rgba(52, 211, 153, 0.15)'
        };
      case 'slate':
        return {
          background: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #09090b 100%)',
          color: '#f4f4f5',
          cardBg: 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(255, 255, 255, 0.14)',
          headerBg: 'rgba(39, 39, 42, 0.8)',
          headerText: '#f4f4f5',
          cellBorder: 'rgba(255, 255, 255, 0.1)'
        };
      case 'light':
      default:
        return {
          background: '#ffffff',
          color: '#0f172a',
          cardBg: '#ffffff',
          border: settings.borderColor || '#cbd5e1',
          headerBg: settings.headerBgColor || '#f1f5f9',
          headerText: settings.headerTextColor || '#0f172a',
          cellBorder: settings.borderColor || '#cbd5e1'
        };
    }
  };

  const wpStyle = getWallpaperStyles();

  // Multiplicateurs de taille selon densité, échelle globale et échelle spécifique table
  const globalScale = (settings.cellScale || 100) / 100;
  const tableScale = (settings.tableScaleOnly || 100) / 100;
  const fontMultiplier = ((settings.fontSizeScale || 100) / 100) * globalScale * tableScale;

  // Calcul du padding fin
  let densityPadding = '5px 5px';
  if (settings.density === 'compact') densityPadding = '2px 3px';
  else if (settings.density === 'spacious') densityPadding = '8px 7px';

  // Police de caractères dynamique
  const getFontFamily = (font?: DocumentFont) => {
    switch (font) {
      case 'serif':
        return '"Georgia", "Times New Roman", serif';
      case 'mono':
        return '"Courier New", "Fira Code", monospace';
      case 'condensed':
        return '"Arial Narrow", "Helvetica Condensed", sans-serif';
      case 'sans':
      default:
        return 'var(--font-sans, "Inter", sans-serif)';
    }
  };

  const currentFontFamily = getFontFamily(settings.fontFamily);
  const cellFontSize = `${Math.max(0.42, 0.75 * fontMultiplier)}rem`;
  const headerFontSize = `${Math.max(0.48, 0.80 * fontMultiplier)}rem`;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="print-modal-title">
      <div className="modal-card print-modal" style={{ maxWidth: '1040px' }}>
        
        {/* En-tête de modale */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Printer size={20} color="var(--primary)" />
            <h2 id="print-modal-title" className="modal-title">Studio d'Impression & Personnalisation Complète</h2>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose} aria-label="Fermer la modale">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* SÉLECTEUR DE FORMAT CIBLE (Appareils & Papier) */}
          <div>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>
              Format de destination :
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.45rem' }}>
              
              <button
                type="button"
                onClick={() => handleFormatChange('A4')}
                style={{
                  padding: '0.55rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.format === 'A4' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: settings.format === 'A4' ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                  color: settings.format === 'A4' ? 'var(--primary)' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.76rem'
                }}
              >
                <FileSpreadsheet size={16} />
                <span>Feuille A4</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.75, fontWeight: 400 }}>210 × 297 mm</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('phone_wallpaper')}
                style={{
                  padding: '0.55rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.format === 'phone_wallpaper' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: settings.format === 'phone_wallpaper' ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                  color: settings.format === 'phone_wallpaper' ? 'var(--primary)' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.76rem'
                }}
              >
                <Smartphone size={16} />
                <span>Fond Mobile</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.75, fontWeight: 400 }}>9:16 Vertical</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('desktop_wallpaper')}
                style={{
                  padding: '0.55rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.format === 'desktop_wallpaper' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: settings.format === 'desktop_wallpaper' ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                  color: settings.format === 'desktop_wallpaper' ? 'var(--primary)' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.76rem'
                }}
              >
                <Monitor size={16} />
                <span>Fond PC</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.75, fontWeight: 400 }}>16:9 Panoramique</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('tablet')}
                style={{
                  padding: '0.55rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.format === 'tablet' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: settings.format === 'tablet' ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                  color: settings.format === 'tablet' ? 'var(--primary)' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.76rem'
                }}
              >
                <Tablet size={16} />
                <span>Tablette</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.75, fontWeight: 400 }}>iPad / Android</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('Letter')}
                style={{
                  padding: '0.55rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: settings.format === 'Letter' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  background: settings.format === 'Letter' ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                  color: settings.format === 'Letter' ? 'var(--primary)' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.76rem'
                }}
              >
                <FileSpreadsheet size={16} />
                <span>US Letter</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.75, fontWeight: 400 }}>216 × 279 mm</span>
              </button>
            </div>
          </div>

          {/* ONGLET DE PERSONNALISATION INTÉGRALE */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border-subtle)' }}>
            
            {/* Barre d'onglets de réglages */}
            <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.6rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveTab('layout')}
                className={`btn-glass-pill ${activeTab === 'layout' ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              >
                <Sliders size={13} />
                <span>Mise en page & Réduction</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('typography')}
                className={`btn-glass-pill ${activeTab === 'typography' ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              >
                <Type size={13} />
                <span>Titres & Polices</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('colors')}
                className={`btn-glass-pill ${activeTab === 'colors' ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              >
                <Palette size={13} />
                <span>Couleurs & Arrière-plan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('visibility')}
                className={`btn-glass-pill ${activeTab === 'visibility' ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              >
                <Eye size={13} />
                <span>Masquer / Afficher tout</span>
              </button>
            </div>

            {/* CONTENU ONGLET 1 : MISE EN PAGE & RÉDUCTION EXTRÊME */}
            {activeTab === 'layout' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                
                {/* Orientation */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Orientation</label>
                  <select
                    value={settings.orientation}
                    onChange={(e) => setSettings({ ...settings, orientation: e.target.value as 'portrait' | 'landscape' })}
                    disabled={isPhoneWallpaper || isDesktopWallpaper}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                  >
                    <option value="landscape">Paysage (Horizontal — Recommandé)</option>
                    <option value="portrait">Portrait (Vertical)</option>
                  </select>
                </div>

                {/* Densité des cases */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Densité des cases</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['compact', 'normal', 'spacious'] as GridDensity[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSettings({ ...settings, density: d })}
                        style={{
                          flex: 1,
                          padding: '0.35rem 0.2rem',
                          fontSize: '0.73rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: settings.density === d ? 'var(--primary)' : 'var(--border-medium)',
                          background: settings.density === d ? 'var(--primary)' : 'var(--bg-primary)',
                          color: settings.density === d ? '#ffffff' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        {d === 'compact' ? 'Micro' : d === 'normal' ? 'Standard' : 'Aéré'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Curseur de Zoom Global (30% à 150%) */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', margin: 0 }}>
                      Échelle globale : {settings.cellScale}%
                    </label>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <button 
                        type="button" 
                        onClick={() => handleScaleChange(settings.cellScale - 10)}
                        className="btn-ghost btn-icon p-1"
                        title="Réduire (-10%)"
                      >
                        <ZoomOut size={13} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleScaleChange(settings.cellScale + 10)}
                        className="btn-ghost btn-icon p-1"
                        title="Agrandir (+10%)"
                      >
                        <ZoomIn size={13} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="150"
                    step="5"
                    value={settings.cellScale}
                    onChange={(e) => handleScaleChange(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    <span>Très Petit (30%)</span>
                    <span>100%</span>
                    <span>Grand (150%)</span>
                  </div>
                </div>

                {/* RÉDUIRE LA TABLE SEULEMENT (30% à 150%) */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Minimize2 size={13} />
                      <span>Réduire la table seulement : {settings.tableScaleOnly || 100}%</span>
                    </label>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="150"
                    step="5"
                    value={settings.tableScaleOnly || 100}
                    onChange={(e) => handleTableScaleOnlyChange(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    <span>Micro-Table (30%)</span>
                    <span>100%</span>
                    <span>Large (150%)</span>
                  </div>
                </div>

              </div>
            )}

            {/* CONTENU ONGLET 2 : TITRES & POLICES */}
            {activeTab === 'typography' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                
                {/* Titre du Document personnalisé */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Titre du document</label>
                  <input
                    type="text"
                    value={settings.customTitle || ''}
                    onChange={(e) => setSettings({ ...settings, customTitle: e.target.value })}
                    placeholder="Titre imprimé sur la feuille"
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                  />
                </div>

                {/* Sous-titre officiel */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Sous-titre / Établissement</label>
                  <input
                    type="text"
                    value={settings.customSubtitle || ''}
                    onChange={(e) => setSettings({ ...settings, customSubtitle: e.target.value })}
                    placeholder="Ex : Classe de Terminale, Semestre 1..."
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                  />
                </div>

                {/* Famille de Police */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Style de Police (Typographie)</label>
                  <select
                    value={settings.fontFamily || 'sans'}
                    onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value as DocumentFont })}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                  >
                    <option value="sans">Moderne Sans (Inter / Outfit)</option>
                    <option value="serif">Élégante Serif (Document Académique)</option>
                    <option value="condensed">Condensée Compacte (Gain d'espace)</option>
                    <option value="mono">Monospace Technique (Grille nette)</option>
                  </select>
                </div>

                {/* Échelle du texte */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', margin: 0 }}>
                      Taille de police : {settings.fontSizeScale || 100}%
                    </label>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={settings.fontSizeScale || 100}
                    onChange={(e) => setSettings({ ...settings, fontSizeScale: Number(e.target.value) })}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    <span>Micro (50%)</span>
                    <span>100%</span>
                    <span>Gros (150%)</span>
                  </div>
                </div>

              </div>
            )}

            {/* CONTENU ONGLET 3 : COULEURS & FOND BLANC PUR */}
            {activeTab === 'colors' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                
                {/* Forcer Fond Blanc Pur (Règle d'or de l'impression) */}
                <div className="form-group" style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.6)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.forcePureWhiteBg !== false}
                      onChange={(e) => setSettings({ ...settings, forcePureWhiteBg: e.target.checked })}
                    />
                    <span>📄 Forcer l'arrière-plan en Blanc Pur (Zéro encre gaspillée à l'impression)</span>
                  </label>
                </div>

                {/* Couleur d'en-tête du tableau */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Fond des en-têtes (Jours & Heures)</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={settings.headerBgColor || '#f1f5f9'}
                      onChange={(e) => setSettings({ ...settings, headerBgColor: e.target.value })}
                      style={{ width: '36px', height: '32px', borderRadius: '4px', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                    />
                    <select
                      value={settings.headerBgColor || '#f1f5f9'}
                      onChange={(e) => setSettings({ ...settings, headerBgColor: e.target.value })}
                      style={{ flex: 1, padding: '0.35rem', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.78rem' }}
                    >
                      <option value="#f1f5f9">Gris clair neutre</option>
                      <option value="#ffffff">Blanc épuré</option>
                      <option value="#dbeafe">Bleu institutionnel pastel</option>
                      <option value="#dcfce7">Vert menthe pastel</option>
                      <option value="#fef3c7">Ambré doux</option>
                      <option value="#0f172a">Noir profond (Contraste fort)</option>
                    </select>
                  </div>
                </div>

                {/* Couleur des bordures */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Couleur du quadrillage / bordures</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={settings.borderColor || '#cbd5e1'}
                      onChange={(e) => setSettings({ ...settings, borderColor: e.target.value })}
                      style={{ width: '36px', height: '32px', borderRadius: '4px', border: '1px solid var(--border-medium)', cursor: 'pointer' }}
                    />
                    <select
                      value={settings.borderColor || '#cbd5e1'}
                      onChange={(e) => setSettings({ ...settings, borderColor: e.target.value })}
                      style={{ flex: 1, padding: '0.35rem', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.78rem' }}
                    >
                      <option value="#cbd5e1">Gris doux discret</option>
                      <option value="#64748b">Gris ardoise net</option>
                      <option value="#000000">Noir imprimeur précis</option>
                      <option value="#3b82f6">Bleu Planilux</option>
                    </select>
                  </div>
                </div>

                {/* Thème Fond d'écran (si format wallpaper) */}
                {isWallpaperMode && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Thème d'ambiance Fond d'écran</label>
                    <select
                      value={settings.wallpaperTheme}
                      onChange={(e) => setSettings({ ...settings, wallpaperTheme: e.target.value as WallpaperTheme, forcePureWhiteBg: false })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                    >
                      <option value="midnight">Nuit Sombre (Midnight Blue)</option>
                      <option value="emerald">Émeraude & Forêt</option>
                      <option value="slate">Ardoise & Carbone</option>
                      <option value="light">Clair (Minimaliste)</option>
                    </select>
                  </div>
                )}

              </div>
            )}

            {/* CONTENU ONGLET 4 : VISIBILITÉ TOTALE (TOUT MASQUER OU AFFICHER) */}
            {activeTab === 'visibility' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.65rem' }}>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showLogo !== false}
                    onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                  />
                  <span>Logo Officiel Planilux</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showTitle !== false}
                    onChange={(e) => setSettings({ ...settings, showTitle: e.target.checked })}
                  />
                  <span>Titre du document</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showSubtitle !== false}
                    onChange={(e) => setSettings({ ...settings, showSubtitle: e.target.checked })}
                  />
                  <span>Sous-titre / Établissement</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showTimeCol !== false}
                    onChange={(e) => setSettings({ ...settings, showTimeCol: e.target.checked })}
                  />
                  <span>Colonne des Horaires</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showDate !== false}
                    onChange={(e) => setSettings({ ...settings, showDate: e.target.checked })}
                  />
                  <span>Date & Signature</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showBorders}
                    onChange={(e) => setSettings({ ...settings, showBorders: e.target.checked })}
                  />
                  <span>Quadrillage des cases</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.printColors}
                    onChange={(e) => setSettings({ ...settings, printColors: e.target.checked })}
                  />
                  <span>Couleurs de fond des cours</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.includeNotes}
                    onChange={(e) => setSettings({ ...settings, includeNotes: e.target.checked })}
                  />
                  <span>Notes de bas de tableau</span>
                </label>

              </div>
            )}

          </div>

          {/* Avertissement lisibilité portrait si trop de colonnes */}
          {isTooWideForPortrait && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <div>
                <strong>Conseil de mise en page :</strong> Avec {colAxes.length} colonnes, l'orientation Paysage offrira une lecture plus nette de vos cours.
              </div>
            </div>
          )}

          {/* BOÎTE D'APERÇU RÉALISTE EN DIRECT */}
          <div className="print-preview-box" style={{ background: isWallpaperMode && !settings.forcePureWhiteBg ? 'rgba(0, 0, 0, 0.4)' : '#e2e8f0' }}>
            <div
              ref={previewRef}
              className={`print-page-sheet doc-sheet-isolated ${isPhoneWallpaper && !settings.forcePureWhiteBg ? 'wallpaper-phone-frame' : isDesktopWallpaper && !settings.forcePureWhiteBg ? 'wallpaper-desktop-frame' : ''}`}
              style={{
                aspectRatio: isPhoneWallpaper ? '9 / 16' : isDesktopWallpaper ? '16 / 9' : settings.orientation === 'landscape' ? '1.414' : '0.707',
                background: wpStyle.background,
                backgroundColor: wpStyle.background,
                color: wpStyle.color,
                fontFamily: currentFontFamily,
                transition: 'all 0.2s ease'
              }}
            >
              {/* En-tête personnalisé du document */}
              {(settings.showTitle !== false || settings.showSubtitle !== false || settings.showLogo !== false) && (
                <div style={{ borderBottom: `2px solid ${wpStyle.border}`, paddingBottom: '0.5rem', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {settings.showLogo !== false && (
                        <PlaniluxLogo size={Math.round(26 * globalScale)} />
                      )}
                      <div>
                        {settings.showTitle !== false && (
                          <h3 style={{ fontSize: `${Math.max(0.85, 1.20 * fontMultiplier)}rem`, color: isWallpaperMode && !settings.forcePureWhiteBg ? wpStyle.color : '#1e3a8a', margin: 0, fontWeight: 800, lineHeight: 1.2 }}>
                            {settings.customTitle || board.title}
                          </h3>
                        )}
                        {settings.showSubtitle !== false && settings.customSubtitle && (
                          <div style={{ fontSize: `${Math.max(0.60, 0.75 * fontMultiplier)}rem`, opacity: 0.85, marginTop: '2px', fontWeight: 500 }}>
                            {settings.customSubtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    {settings.showDate !== false && (
                      <span style={{ fontSize: '0.65rem', opacity: 0.75, textAlign: 'right' }}>
                        {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Grille dynamique avec micro-échelle et personnalisation des styles */}
              <div style={{ overflow: 'hidden', flex: 1, border: settings.showBorders ? `1px solid ${wpStyle.cellBorder}` : 'none', borderRadius: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: cellFontSize }}>
                  <thead>
                    <tr style={{ background: wpStyle.headerBg, color: wpStyle.headerText }}>
                      {settings.showTimeCol !== false && (
                        <th style={{ padding: densityPadding, border: `1px solid ${wpStyle.cellBorder}`, textAlign: 'center', fontWeight: 800, letterSpacing: '0.04em', fontSize: headerFontSize }}>
                          HORAIRE
                        </th>
                      )}
                      {colAxes.map(c => (
                        <th key={c.id} style={{ padding: densityPadding, border: `1px solid ${wpStyle.cellBorder}`, textAlign: 'center', fontWeight: 700, fontSize: headerFontSize }}>
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rowAxes.map(r => (
                      <tr key={r.id}>
                        {settings.showTimeCol !== false && (
                          <td style={{ padding: densityPadding, border: `1px solid ${wpStyle.cellBorder}`, background: wpStyle.headerBg, color: wpStyle.headerText, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', fontSize: cellFontSize }}>
                            {r.label}
                          </td>
                        )}
                        {colAxes.map((c, colIdx) => {
                          const cell = board.cells.find(cell => cell.row_axis_id === r.id && cell.column_axis_id === c.id);
                          const slotStart = r.start_time || '08:00';
                          const slotEnd = r.end_time || '09:00';
                          const matchingCourses = (board.courses || []).filter(crs => {
                            if (crs.dayIndex !== colIdx) return false;
                            return (crs.startTime <= slotStart && crs.endTime > slotStart) ||
                                   (crs.startTime >= slotStart && crs.startTime < slotEnd);
                          });

                          const hasCourses = matchingCourses.length > 0;

                          const cellBg = settings.printColors && cell?.background_color && cell.background_color !== '#ffffff' 
                            ? cell.background_color 
                            : isWallpaperMode && !settings.forcePureWhiteBg ? 'transparent' : '#ffffff';
                          
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
                                textAlign: cellStyle.align || 'center',
                                verticalAlign: 'middle',
                                wordBreak: 'break-word'
                              }}
                            >
                              {hasCourses ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '1px' }}>
                                  {matchingCourses.map(mc => (
                                    <div 
                                      key={mc.id} 
                                      style={{ 
                                        borderRadius: '4px', 
                                        padding: '3px 5px', 
                                        background: settings.printColors ? mc.color : '#f1f5f9', 
                                        color: settings.printColors ? '#ffffff' : '#0f172a', 
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                        textAlign: 'left'
                                      }}
                                    >
                                      <div style={{ fontWeight: 700, fontSize: cellFontSize }}>{mc.title}</div>
                                      {(mc.room || mc.professor) && (
                                        <div style={{ fontSize: `calc(${cellFontSize} * 0.85)`, opacity: 0.9 }}>
                                          {[mc.room, mc.professor].filter(Boolean).join(' • ')}
                                        </div>
                                      )}
                                      <div style={{ fontSize: `calc(${cellFontSize} * 0.8)`, opacity: 0.85 }}>
                                        {mc.startTime} - {mc.endTime}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                cell?.content ? cell.content : ''
                              )}
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
                <div style={{ marginTop: '0.5rem', fontSize: '0.66rem', opacity: 0.85, borderTop: `1px solid ${wpStyle.cellBorder}`, paddingTop: '0.35rem' }}>
                  <strong>Notes :</strong> {board.settings.notes}
                </div>
              )}
            </div>
          </div>

          {/* Message de succès d'export */}
          {exportSuccess && (
            <div style={{ background: 'var(--success-bg)', color: 'var(--success-text)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 500 }}>
              <CheckCircle size={17} />
              <span>{exportSuccess}</span>
            </div>
          )}
        </div>

        {/* PIED DE MODALE — ACTIONS D'EXPORTATION MULTI-SUPPORTS */}
        <div className="modal-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          
          <button type="button" className="btn-glass-secondary" onClick={handleBrowserPrint} title="Imprimer directement avec le navigateur">
            <Printer size={15} />
            <span>Imprimer</span>
          </button>

          <button
            type="button"
            className="btn-glass-secondary"
            onClick={handleExportDocx}
            disabled={isExporting !== null}
            title="Exporter en document Microsoft Word (.docx)"
          >
            <FileText size={15} />
            <span>{isExporting === 'docx' ? 'Création DOCX...' : 'Word (.docx)'}</span>
          </button>

          <button
            type="button"
            className="btn-glass-secondary"
            onClick={handleExportPdf}
            disabled={isExporting !== null}
            title="Télécharger le fichier PDF vectoriel de haute qualité"
          >
            <FileDown size={15} />
            <span>{isExporting === 'pdf' ? 'Création PDF...' : 'Télécharger PDF'}</span>
          </button>

          {/* Bouton clé : Image HD Fond d'écran Smartphone & Ordinateur */}
          <button
            type="button"
            className="btn-glass-black"
            onClick={handleExportPng}
            disabled={isExporting !== null}
            title="Télécharger l'image PNG haute résolution adaptée"
          >
            <Sparkles size={15} />
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
