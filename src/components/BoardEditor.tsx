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
  Sliders, 
  X, 
  FileText,
  Calendar,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minimize2,
  Wand2,
  Sparkles,
  Clock
} from 'lucide-react';
import { Board, BoardCell, BoardAxis, CourseEntry } from '../types';
import { CellPropertiesPanel } from './CellPropertiesPanel';
import { ShareModal } from './ShareModal';
import { PrintPreviewModal } from './PrintPreviewModal';
import { CourseModal } from './CourseModal';

interface BoardEditorProps {
  board: Board;
  onUpdateBoard: (updated: Board) => void;
  onBack: () => void;
}

export type DensityMode = 'micro' | 'ultra-compact' | 'compact' | 'normal' | 'relaxed';
export type MobileEditorView = 'week' | 'day';

export const BoardEditor: React.FC<BoardEditorProps> = ({ board, onUpdateBoard, onBack }) => {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<CourseEntry> | null>(null);
  const [timetableDisplayMode, setTimetableDisplayMode] = useState<'proportional' | 'matrix'>(
    board.template_type === 'timetable' ? 'proportional' : 'matrix'
  );
  const [editingAxisId, setEditingAxisId] = useState<string | null>(null);
  const [axisLabelInput, setAxisLabelInput] = useState('');
  
  // États de présentation & réduction extrême
  const [zoom, setZoom] = useState<number>(100);
  const [tableScaleOnly, setTableScaleOnly] = useState<number>(board.settings?.tableScaleOnly || 100);
  const [density, setDensity] = useState<DensityMode>(
    (board.settings?.density as DensityMode) || (localStorage.getItem('planilux_density') as DensityMode) || 'normal'
  );
  const [isMicroUI, setIsMicroUI] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Vue Mobile-First : "Semaine Complète" ou "Jour par Jour" (optimisé smartphone)
  const [mobileView, setMobileView] = useState<MobileEditorView>('week');
  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);

  // Tri des axes par position
  const colAxes = board.axes
    .filter(a => a.axis === 'column')
    .sort((a, b) => a.position - b.position);

  const rowAxes = board.axes
    .filter(a => a.axis === 'row')
    .sort((a, b) => a.position - b.position);

  // Jour actif pour la vue quotidienne mobile
  const activeCol = colAxes[activeDayIdx] || colAxes[0] || null;

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

  // Gestion des cours du planning proportionnel (08h00 - 19h00)
  const handleSaveCourse = (savedCourse: CourseEntry) => {
    const existingIdx = (board.courses || []).findIndex(c => c.id === savedCourse.id);
    let nextCourses: CourseEntry[];
    if (existingIdx >= 0) {
      nextCourses = [...(board.courses || [])];
      nextCourses[existingIdx] = savedCourse;
    } else {
      nextCourses = [...(board.courses || []), savedCourse];
    }
    onUpdateBoard({
      ...board,
      courses: nextCourses
    });
  };

  const handleDeleteCourse = (courseId: string) => {
    const nextCourses = (board.courses || []).filter(c => c.id !== courseId);
    onUpdateBoard({
      ...board,
      courses: nextCourses
    });
  };

  const handleOpenCreateCourse = (dayIndex = 0, defaultTime = '08:00') => {
    const [h, m] = defaultTime.split(':').map(Number);
    const endH = Math.min(19, (h || 8) + 2).toString().padStart(2, '0');
    const mm = (m || 0).toString().padStart(2, '0');
    setEditingCourse({
      dayIndex,
      startTime: defaultTime,
      endTime: `${endH}:${mm}`,
      color: '#4A90E2'
    });
    setIsCourseModalOpen(true);
  };

  // Ajouter une colonne (ex: jour supplémentaire)
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
      size_px: 130
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
      if (activeDayIdx >= remainingCols.length) {
        setActiveDayIdx(Math.max(0, remainingCols.length - 1));
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
      size_px: 55
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
    if (confirm('Voulez-vous supprimer ce créneau horaire ?')) {
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

  // Assistant Mobile de Création Rapide (Générateur rapide au téléphone)
  const applyQuickMobilePreset = (type: 'school_standard' | 'university' | 'work_shifts') => {
    let days: string[] = [];
    let hours: string[] = [];

    if (type === 'school_standard') {
      days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
      hours = ['08h00 - 09h00', '09h00 - 10h00', '10h15 - 11h15', '11h15 - 12h15', '13h30 - 14h30', '14h30 - 15h30', '15h45 - 16h45', '16h45 - 17h45'];
    } else if (type === 'university') {
      days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      hours = ['08h30 - 10h30', '10h45 - 12h45', '14h00 - 16h00', '16h15 - 18h15'];
    } else {
      days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      hours = ['Matin (07h-12h)', 'Après-midi (13h-18h)', 'Soir (19h-23h)'];
    }

    const newAxes: BoardAxis[] = [];
    const newColAxes: BoardAxis[] = days.map((day, idx) => ({
      id: 'axis_col_' + Math.random().toString(36).substring(2, 9),
      board_id: board.id,
      axis: 'column',
      position: idx,
      label: day,
      kind: 'weekday',
      size_px: 120
    }));

    const newRowAxes: BoardAxis[] = hours.map((hour, idx) => ({
      id: 'axis_row_' + Math.random().toString(36).substring(2, 9),
      board_id: board.id,
      axis: 'row',
      position: idx,
      label: hour,
      kind: 'time_slot',
      size_px: 55
    }));

    newAxes.push(...newColAxes, ...newRowAxes);

    const newCells: BoardCell[] = [];
    newRowAxes.forEach(row => {
      newColAxes.forEach(col => {
        newCells.push({
          id: 'cell_' + Math.random().toString(36).substring(2, 9),
          board_id: board.id,
          row_axis_id: row.id,
          column_axis_id: col.id,
          content: '',
          background_color: '#ffffff',
          text_color: '#1f2937',
          text_style: { align: 'center' }
        });
      });
    });

    onUpdateBoard({
      ...board,
      axes: newAxes,
      cells: newCells
    });
    setIsWizardOpen(false);
    setActiveDayIdx(0);
  };

  // Configuration dynamique selon la densité choisie (avec support du mode MICRO)
  const getDensitySettings = () => {
    const tableRatio = (tableScaleOnly || 100) / 100;

    switch (density) {
      case 'micro':
        return {
          cellPadding: '2px 3px',
          cellMinHeight: `${Math.round(28 * tableRatio)}px`,
          cellMinWidth: `${Math.round(60 * tableRatio)}px`,
          fontSize: `${Math.max(0.55, 0.65 * tableRatio)}rem`,
          headerPadding: '3px 2px',
          headerMinWidth: `${Math.round(65 * tableRatio)}px`
        };
      case 'ultra-compact':
        return {
          cellPadding: '3px 4px',
          cellMinHeight: `${Math.round(34 * tableRatio)}px`,
          cellMinWidth: `${Math.round(75 * tableRatio)}px`,
          fontSize: `${Math.max(0.60, 0.70 * tableRatio)}rem`,
          headerPadding: '3px 3px',
          headerMinWidth: `${Math.round(80 * tableRatio)}px`
        };
      case 'compact':
        return {
          cellPadding: '0.3rem 0.35rem',
          cellMinHeight: `${Math.round(40 * tableRatio)}px`,
          cellMinWidth: `${Math.round(90 * tableRatio)}px`,
          fontSize: `${Math.max(0.65, 0.76 * tableRatio)}rem`,
          headerPadding: '0.4rem 0.35rem',
          headerMinWidth: `${Math.round(95 * tableRatio)}px`
        };
      case 'relaxed':
        return {
          cellPadding: '0.8rem 0.75rem',
          cellMinHeight: `${Math.round(70 * tableRatio)}px`,
          cellMinWidth: `${Math.round(150 * tableRatio)}px`,
          fontSize: `${Math.max(0.75, 0.92 * tableRatio)}rem`,
          headerPadding: '0.8rem 0.6rem',
          headerMinWidth: `${Math.round(155 * tableRatio)}px`
        };
      case 'normal':
      default:
        return {
          cellPadding: '0.5rem',
          cellMinHeight: `${Math.round(52 * tableRatio)}px`,
          cellMinWidth: `${Math.round(115 * tableRatio)}px`,
          fontSize: `${Math.max(0.70, 0.83 * tableRatio)}rem`,
          headerPadding: '0.55rem 0.45rem',
          headerMinWidth: `${Math.round(120 * tableRatio)}px`
        };
    }
  };

  const dStyle = getDensitySettings();

  // Configuration pour la Grille Continue (08h00 - 19h00)
  const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // 11 heures (08:00 à 19:00)

  const timeToMin = (t?: string): number => {
    if (!t) return 480;
    const [h, m] = t.split(':').map(Number);
    return (h || 8) * 60 + (m || 0);
  };

  const getCourseTopAndHeight = (start: string, end: string, totalH: number) => {
    const sMin = Math.max(480, Math.min(1140, timeToMin(start)));
    const eMin = Math.max(sMin + 15, Math.min(1140, timeToMin(end)));
    const top = ((sMin - 480) / 660) * totalH;
    const height = Math.max(34, ((eMin - sMin) / 660) * totalH);
    return { top, height };
  };

  const baseHourHeight = density === 'micro' ? 38 : density === 'ultra-compact' ? 46 : density === 'compact' ? 52 : 64;
  const hourHeight = Math.round(baseHourHeight * (tableScaleOnly / 100));
  const totalHeight = 11 * hourHeight;

  return (
    <div className={`editor-container ${isMicroUI ? 'micro-ui-mode' : ''}`}>
      
      {/* 1. Barre d'outils responsive en Verre Dépoli */}
      <header className="editor-toolbar" style={{ padding: isMicroUI ? '0.25rem 0.5rem' : '0.45rem 0.85rem' }}>
        
        {/* Partie gauche : Retour et Titre */}
        <div className="editor-toolbar-left">
          <button 
            type="button"
            className={`btn-glass-secondary btn-icon ${isMicroUI ? 'micro-btn' : ''}`}
            onClick={onBack} 
            title="Retourner à mes classeurs"
            aria-label="Retour aux classeurs"
          >
            <ArrowLeft size={isMicroUI ? 14 : 17} />
          </button>

          <input
            type="text"
            className="editor-title-input"
            value={board.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            title="Cliquer pour modifier le titre"
            placeholder="Titre du planning"
            style={{ fontSize: isMicroUI ? '0.9rem' : undefined }}
          />
        </div>

        {/* Partie centrale / Contrôles de Zoom & Densité (Desktop & Tablette) */}
        <div className="editor-toolbar-center hidden md:flex">
          
          {/* Zoom Global (30% à 150%) */}
          <div className="toolbar-pill-group">
            <button
              type="button"
              className="btn-glass-pill btn-icon"
              onClick={() => setZoom(z => Math.max(30, z - 10))}
              title="Réduire l'affichage global (-10%)"
              aria-label="Zoom arrière"
            >
              <ZoomOut size={13} />
            </button>
            <button
              type="button"
              className="btn-glass-pill text-xs font-semibold px-2"
              onClick={() => setZoom(100)}
              title="Réinitialiser le zoom à 100%"
            >
              {zoom}%
            </button>
            <button
              type="button"
              className="btn-glass-pill btn-icon"
              onClick={() => setZoom(z => Math.min(150, z + 10))}
              title="Agrandir l'affichage global (+10%)"
              aria-label="Zoom avant"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Moteur d'Ultra-Densité 4 paliers */}
          <div className="toolbar-pill-group">
            <button
              type="button"
              className={`btn-glass-pill ${density === 'micro' ? 'active' : ''}`}
              onClick={() => {
                setDensity('micro');
                document.documentElement.setAttribute('data-density', 'micro');
              }}
              title="Densité Micro (65%)"
            >
              🔬 Micro
            </button>
            <button
              type="button"
              className={`btn-glass-pill ${density === 'ultra-compact' ? 'active' : ''}`}
              onClick={() => {
                setDensity('ultra-compact');
                document.documentElement.setAttribute('data-density', 'ultra-compact');
              }}
              title="Densité Ultra-Compact (75%)"
            >
              ⚡ Ultra
            </button>
            <button
              type="button"
              className={`btn-glass-pill ${density === 'compact' ? 'active' : ''}`}
              onClick={() => {
                setDensity('compact');
                document.documentElement.setAttribute('data-density', 'compact');
              }}
              title="Densité Compact (88%)"
            >
              📐 Compact
            </button>
            <button
              type="button"
              className={`btn-glass-pill ${density === 'normal' ? 'active' : ''}`}
              onClick={() => {
                setDensity('normal');
                document.documentElement.setAttribute('data-density', 'normal');
              }}
              title="Densité Standard (100%)"
            >
              🖥 Normal
            </button>
          </div>

          {/* Bascule Vue Grille Horaire vs Matrice (pour emplois du temps) */}
          <div className="toolbar-pill-group hidden md:flex" style={{ background: 'rgba(98, 0, 238, 0.08)', border: '1px solid rgba(98, 0, 238, 0.25)' }}>
            <button
              type="button"
              className={`btn-glass-pill ${timetableDisplayMode === 'proportional' ? 'active' : ''}`}
              onClick={() => setTimetableDisplayMode('proportional')}
              title="Vue grille horaire continue (08h00 - 19h00 avec cartes de cours)"
            >
              <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
              <span>Grille 08h-19h</span>
            </button>
            <button
              type="button"
              className={`btn-glass-pill ${timetableDisplayMode === 'matrix' ? 'active' : ''}`}
              onClick={() => setTimetableDisplayMode('matrix')}
              title="Vue matrice de cases tabulaires classique"
            >
              <LayoutGrid size={12} style={{ display: 'inline', marginRight: '3px' }} />
              <span>Matrice</span>
            </button>
          </div>

          {/* Toggle Découplage Réduction Table Seule */}
          <button
            type="button"
            className={`btn-glass-pill ${tableScaleOnly < 100 ? 'active' : ''}`}
            onClick={() => setTableScaleOnly(s => (s === 100 ? 75 : 100))}
            title="Réduire la taille des tables sans rétrécir l'écriture"
            style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            <Minimize2 size={12} />
            <span>Table {tableScaleOnly}%</span>
          </button>
        </div>

        {/* Partie droite : Bascule de Vue Mobile (Semaine vs Jour) & Actions */}
        <div className="editor-toolbar-right">
          
          {/* SÉLECTEUR DE VUE MOBILE CLÉ : Semaine vs Jour par Jour */}
          <div className="toolbar-pill-group md:hidden" style={{ background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.3)' }}>
            <button
              type="button"
              onClick={() => setMobileView('week')}
              className={`btn-glass-pill ${mobileView === 'week' ? 'active' : ''}`}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
              title="Vue grille semaine complète"
            >
              <LayoutGrid size={13} style={{ display: 'inline', marginRight: '3px' }} />
              <span>Semaine</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileView('day')}
              className={`btn-glass-pill ${mobileView === 'day' ? 'active' : ''}`}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
              title="Vue quotidienne optimisée smartphone"
            >
              <Calendar size={13} style={{ display: 'inline', marginRight: '3px' }} />
              <span>Jour</span>
            </button>
          </div>

          {/* Boutons d'ajout de structure */}
          <button 
            type="button"
            className="btn-glass-secondary btn-compact-mobile" 
            onClick={handleAddColumn} 
            title="Ajouter un jour / colonne"
          >
            <Columns size={14} />
            <span className="hidden sm:inline">+ Jour</span>
          </button>

          <button 
            type="button"
            className="btn-glass-secondary btn-compact-mobile" 
            onClick={handleAddRow} 
            title="Ajouter une plage horaire"
          >
            <Rows size={14} />
            <span className="hidden sm:inline">+ Heure</span>
          </button>

          {/* Assistant Mobile rapide */}
          <button
            type="button"
            className="btn-glass-secondary hidden lg:inline-flex"
            onClick={() => setIsWizardOpen(true)}
            title="Assistant de création rapide"
          >
            <Wand2 size={14} color="var(--primary)" />
            <span>Assistant</span>
          </button>

          {/* Bouton Partager (Desktop) */}
          <button 
            type="button"
            className="btn-glass-secondary hidden lg:inline-flex" 
            onClick={() => setIsShareModalOpen(true)} 
            title="Partager ce planning"
          >
            <Share2 size={14} />
            <span>Partager</span>
          </button>

          {/* Bouton Imprimer / Exporter (Prioritaire) */}
          <button 
            type="button"
            className="btn-glass-black" 
            onClick={() => setIsPrintModalOpen(true)} 
            title="Aperçu d'impression, personnalisation et export"
          >
            <Printer size={14} />
            <span className="hidden xs:inline">Imprimer</span>
          </button>

          {/* Bouton Options avancées pour mobile */}
          <button
            type="button"
            className="btn-glass-secondary btn-icon md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Options d'affichage et réduction extrême"
            aria-label="Options"
          >
            <Sliders size={15} />
          </button>
        </div>
      </header>

      {/* Volet déroulant d'options Mobile (Contrôles fins au pouce) */}
      {isMobileMenuOpen && (
        <div className="mobile-options-drawer md:hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--glass-border-subtle)]">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Réglages Fins & Réduction Extrême
            </span>
            <button 
              type="button"
              className="btn-ghost btn-icon p-1" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={15} />
            </button>
          </div>

          {/* Densité sur mobile avec Micro */}
          <div className="mb-2.5">
            <label className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">
              Densité des cases :
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                className={`btn-glass-pill flex-1 text-center ${density === 'micro' ? 'active' : ''}`}
                onClick={() => setDensity('micro')}
              >
                Micro
              </button>
              <button
                type="button"
                className={`btn-glass-pill flex-1 text-center ${density === 'compact' ? 'active' : ''}`}
                onClick={() => setDensity('compact')}
              >
                Compact
              </button>
              <button
                type="button"
                className={`btn-glass-pill flex-1 text-center ${density === 'normal' ? 'active' : ''}`}
                onClick={() => setDensity('normal')}
              >
                Standard
              </button>
              <button
                type="button"
                className={`btn-glass-pill flex-1 text-center ${density === 'relaxed' ? 'active' : ''}`}
                onClick={() => setDensity('relaxed')}
              >
                Aéré
              </button>
            </div>
          </div>

          {/* Zoom global sur mobile (30% à 150%) */}
          <div className="mb-2.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium mb-1">
              <span>Échelle globale : {zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="text-xs text-[var(--primary)] font-semibold"
              >
                100%
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-glass-secondary btn-icon p-1.5"
                onClick={() => setZoom(z => Math.max(30, z - 10))}
              >
                <ZoomOut size={13} />
              </button>
              <input
                type="range"
                min="30"
                max="150"
                step="5"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
              <button
                type="button"
                className="btn-glass-secondary btn-icon p-1.5"
                onClick={() => setZoom(z => Math.min(150, z + 10))}
              >
                <ZoomIn size={13} />
              </button>
            </div>
          </div>

          {/* Réduire la table seule sur mobile */}
          <div className="mb-2.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium mb-1">
              <span>Réduire la table seulement : {tableScaleOnly}%</span>
              <button
                type="button"
                onClick={() => setTableScaleOnly(s => (s === 100 ? 60 : 100))}
                className="text-xs text-[var(--primary)] font-semibold"
              >
                {tableScaleOnly < 100 ? 'Rétablir' : 'Ultra-Petit'}
              </button>
            </div>
            <input
              type="range"
              min="30"
              max="130"
              step="5"
              value={tableScaleOnly}
              onChange={(e) => setTableScaleOnly(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Boutons & Interface Ultra-Compacte */}
          <div className="pt-2 border-t border-[var(--glass-border-subtle)] flex gap-2">
            <button
              type="button"
              className={`btn-glass-secondary flex-1 text-xs ${isMicroUI ? 'active' : ''}`}
              onClick={() => setIsMicroUI(!isMicroUI)}
            >
              <Minimize2 size={13} />
              <span>{isMicroUI ? 'Interface normale' : 'Interface Micro-UI'}</span>
            </button>

            <button
              type="button"
              className="btn-glass-secondary flex-1 text-xs"
              onClick={() => {
                setIsWizardOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <Wand2 size={13} color="var(--primary)" />
              <span>Assistant Rapide</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Zone Principale de Travail */}
      <div className="editor-main">
        
        {/* =====================================================================
            A. MODE VUE QUOTIDIENNE (JOUR PAR JOUR) — OPTIMISÉ POUR SMARTPHONE
            ===================================================================== */}
        {mobileView === 'day' ? (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col items-center w-full max-w-xl mx-auto">
            
            {/* Barre de navigation entre les jours au pouce */}
            <div className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl p-2.5 shadow-md mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                className="btn-glass-secondary btn-icon p-2"
                onClick={() => setActiveDayIdx(i => Math.max(0, i - 1))}
                disabled={activeDayIdx === 0}
                title="Jour précédent"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="text-center">
                <div className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">
                  Jour {activeDayIdx + 1} sur {colAxes.length}
                </div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                  {activeCol?.label || 'Jour'}
                </h3>
              </div>

              <button
                type="button"
                className="btn-glass-secondary btn-icon p-2"
                onClick={() => setActiveDayIdx(i => Math.min(colAxes.length - 1, i + 1))}
                disabled={activeDayIdx === colAxes.length - 1}
                title="Jour suivant"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Sélecteur de pastilles des jours */}
            <div className="w-full flex gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
              {colAxes.map((col, idx) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setActiveDayIdx(idx)}
                  className={`btn-glass-pill flex-1 min-w-[50px] py-2 text-center text-xs font-bold transition-transform ${activeDayIdx === idx ? 'active scale-105' : ''}`}
                >
                  {col.label.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Liste verticale des créneaux pour le jour actif */}
            <div className="w-full flex flex-col gap-2.5">
              {rowAxes.map(row => {
                const cell = activeCol ? board.cells.find(c => c.row_axis_id === row.id && c.column_axis_id === activeCol.id) : null;
                const isSelected = selectedCellId === cell?.id;
                const hasContent = Boolean(cell?.content);
                const style = cell?.text_style || {};

                return (
                  <div
                    key={row.id}
                    onClick={() => cell && setSelectedCellId(cell.id)}
                    className={`rounded-xl p-3 border transition-all cursor-pointer shadow-sm flex items-center justify-between gap-3 ${
                      isSelected 
                        ? 'border-[var(--primary)] ring-2 ring-[var(--primary)] shadow-md' 
                        : 'border-[var(--glass-border-subtle)] bg-[var(--bg-glass-card)]'
                    }`}
                    style={{
                      backgroundColor: cell?.background_color && cell.background_color !== '#ffffff' ? cell.background_color : undefined,
                      color: cell?.text_color || 'var(--text-primary)'
                    }}
                  >
                    {/* Badge horaire fixe */}
                    <div className="flex flex-col items-start min-w-[75px] border-r border-[var(--border-light)] pr-2.5">
                      <span className="text-[0.72rem] font-bold text-[var(--text-secondary)] uppercase">
                        Plage
                      </span>
                      <span className="text-xs font-extrabold text-[var(--primary)]">
                        {row.label}
                      </span>
                    </div>

                    {/* Contenu du cours / créneau */}
                    <div className="flex-1 min-w-0">
                      {hasContent ? (
                        <p 
                          className="text-sm font-semibold truncate leading-snug"
                          style={{
                            fontWeight: style.bold ? 700 : 500,
                            fontStyle: style.italic ? 'italic' : 'normal',
                            textDecoration: style.underline ? 'underline' : 'none'
                          }}
                        >
                          {cell?.content}
                        </p>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic flex items-center gap-1">
                          <Plus size={12} />
                          <span>Appuyez pour ajouter un cours</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn-ghost btn-icon p-1.5 opacity-60 hover:opacity-100"
                      title="Modifier ce créneau"
                    >
                      <Sliders size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Action d'ajout rapide au bas de la vue quotidienne */}
            <div className="w-full mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="btn-glass-secondary flex-1 py-2.5 text-xs font-semibold justify-center"
              >
                <Plus size={14} />
                <span>Ajouter une heure à {activeCol?.label}</span>
              </button>
            </div>

          </div>
        ) : timetableDisplayMode === 'proportional' ? (
          /* =====================================================================
             B1. MODE GRILLE HORAIRE PROPORTIONNELLE CONTINUE (08H00 - 19H00)
             ===================================================================== */
          <div className="grid-viewport touch-scroll-container">
            <div 
              className="planner-table-container"
              style={{
                transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease'
              }}
            >
              <div 
                className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-glass-card)] overflow-hidden shadow-lg backdrop-blur-md"
                style={{ minWidth: `${Math.max(760, colAxes.length * 150 + 80)}px` }}
              >
                {/* En-tête des jours */}
                <div 
                  className="flex border-b border-[var(--glass-border)] bg-[var(--bg-tertiary)]"
                  style={{ height: '48px' }}
                >
                  <div 
                    className="w-[80px] flex-shrink-0 flex items-center justify-center border-r border-[var(--glass-border-subtle)] font-bold text-xs text-[var(--text-secondary)] uppercase tracking-wider"
                  >
                    HORAIRE
                  </div>

                  {colAxes.map((col, idx) => {
                    const dayCoursesCount = (board.courses || []).filter(c => c.dayIndex === idx).length;
                    return (
                      <div 
                        key={col.id} 
                        className="flex-1 flex items-center justify-between px-3 border-r border-[var(--glass-border-subtle)] last:border-r-0"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-[var(--text-primary)]">
                            {col.label}
                          </span>
                          {dayCoursesCount > 0 && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
                              {dayCoursesCount}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenCreateCourse(idx, '08:00')}
                          className="btn-ghost btn-icon p-1 text-[var(--primary)] opacity-70 hover:opacity-100"
                          title={`Ajouter un cours le ${col.label}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Corps de la grille avec timeline de 08:00 à 19:00 */}
                <div className="flex relative" style={{ height: `${totalHeight}px` }}>
                  {/* Axe horaire à gauche */}
                  <div 
                    className="w-[80px] flex-shrink-0 border-r border-[var(--glass-border-subtle)] bg-[var(--bg-secondary)] relative select-none"
                    style={{ height: `${totalHeight}px` }}
                  >
                    {HOURS.map((h, i) => (
                      <div
                        key={h}
                        className="absolute w-full border-b border-[var(--border-light)] flex items-start justify-center pt-1"
                        style={{
                          top: `${i * hourHeight}px`,
                          height: `${hourHeight}px`
                        }}
                      >
                        <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                          {h.toString().padStart(2, '0')}:00
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Colonnes des jours avec créneaux et cartes */}
                  {colAxes.map((col, dayIdx) => {
                    const dayCourses = (board.courses || []).filter(c => c.dayIndex === dayIdx);

                    return (
                      <div
                        key={col.id}
                        className="flex-1 relative border-r border-[var(--glass-border-subtle)] last:border-r-0"
                        style={{ height: `${totalHeight}px` }}
                      >
                        {/* Lignes horaires en arrière-plan (cliquables pour ajouter un cours) */}
                        {HOURS.map((h, i) => {
                          const timeStr = `${h.toString().padStart(2, '0')}:00`;
                          return (
                            <div
                              key={h}
                              onClick={() => handleOpenCreateCourse(dayIdx, timeStr)}
                              title={`Cliquer pour ajouter un cours à ${timeStr} le ${col.label}`}
                              className="absolute w-full border-b border-[var(--glass-border-subtle)]/60 hover:bg-[var(--primary-light)]/20 cursor-pointer transition-colors group flex items-start justify-end pr-2 pt-1"
                              style={{
                                top: `${i * hourHeight}px`,
                                height: `${hourHeight}px`
                              }}
                            >
                              <span className="text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-75 transition-opacity font-mono">
                                + {timeStr}
                              </span>
                            </div>
                          );
                        })}

                        {/* Cartes de cours proportionnelles */}
                        {dayCourses.map((course) => {
                          const { top, height } = getCourseTopAndHeight(course.startTime, course.endTime, totalHeight);

                          return (
                            <div
                              key={course.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCourse(course);
                                setIsCourseModalOpen(true);
                              }}
                              className="absolute left-1.5 right-1.5 rounded-[8px] p-2.5 shadow-md cursor-pointer transition-all duration-150 hover:scale-[1.02] hover:shadow-lg active:scale-95 flex flex-col justify-between overflow-hidden group"
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                backgroundColor: course.color,
                                color: '#ffffff',
                                zIndex: 15,
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.18)'
                              }}
                              title={`${course.title} (${course.startTime} - ${course.endTime})\nCliquer pour modifier`}
                            >
                              <div>
                                <div className="font-extrabold text-xs sm:text-sm leading-snug drop-shadow-sm truncate">
                                  {course.title}
                                </div>
                                {course.professor && (
                                  <div className="text-[11px] font-medium opacity-90 truncate mt-0.5">
                                    👨‍🏫 {course.professor}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold opacity-95 pt-1 mt-1 border-t border-white/20">
                                <span className="truncate max-w-[60%]">
                                  📍 {course.room || 'Salle non déf.'}
                                </span>
                                <span className="font-mono flex-shrink-0">
                                  {course.startTime} - {course.endTime}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bloc de notes au bas du tableau */}
            <div className="board-notes-card mt-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText size={14} color="var(--primary)" />
                <label 
                  htmlFor="board-notes-input" 
                  className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider"
                >
                  Notes & consignes du planning :
                </label>
              </div>
              <textarea
                id="board-notes-input"
                value={board.settings.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={2}
                placeholder="Ex : Salle de secours, dates des examens..."
                className="board-notes-textarea"
              />
            </div>
          </div>
        ) : (
          /* =====================================================================
             B2. MODE VUE MATRICE CLASSIQUE
             ===================================================================== */
          <div className="grid-viewport">
            
            {/* Astuce de navigation tactile sur smartphone */}
            <div className="mobile-scroll-hint sm:hidden">
              <span>💡 Conseil : Basculez sur <strong>"Jour"</strong> ci-dessus pour modifier confortablement sur mobile !</span>
            </div>

            {/* Conteneur avec transformation d'échelle Zoom */}
            <div 
              className="planner-table-container"
              style={{
                transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease'
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
                      <div style={{ fontSize: dStyle.fontSize, color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '0.04em' }}>
                        HORAIRE
                      </div>
                    </th>

                    {/* En-têtes de colonnes (Jours de la semaine) */}
                    {colAxes.map((col) => (
                      <th 
                        key={col.id} 
                        style={{ 
                          minWidth: `${Math.max(parseInt(dStyle.cellMinWidth), col.size_px || 100)}px`,
                          padding: dStyle.headerPadding 
                        }}
                      >
                        <div className="flex items-center justify-center gap-1 relative">
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
                                <Check size={12} />
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => startEditAxis(col)}
                              title="Cliquer pour renommer ce jour"
                              className="cursor-pointer font-bold hover:text-[var(--primary)] transition-colors select-none"
                              style={{ fontSize: dStyle.fontSize }}
                            >
                              {col.label}
                            </span>
                          )}

                          {colAxes.length > 1 && (
                            <button
                              type="button"
                              className="btn-ghost btn-icon p-0.5 opacity-35 hover:opacity-100 hover:text-red-500 transition-opacity"
                              onClick={() => handleDeleteColumn(col.id)}
                              title="Supprimer cette colonne"
                              aria-label={`Supprimer ${col.label}`}
                            >
                              <Trash2 size={11} />
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
                                <Check size={12} />
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => startEditAxis(row)}
                              title="Cliquer pour modifier l'horaire"
                              className="cursor-pointer font-semibold hover:text-[var(--primary)] transition-colors select-none"
                              style={{ fontSize: dStyle.fontSize }}
                            >
                              {row.label}
                            </span>
                          )}

                          {rowAxes.length > 1 && (
                            <button
                              type="button"
                              className="btn-ghost btn-icon p-0.5 opacity-30 hover:opacity-100 hover:text-red-500 transition-opacity"
                              onClick={() => handleDeleteRow(row.id)}
                              title="Supprimer ce créneau"
                              aria-label={`Supprimer ${row.label}`}
                            >
                              <Trash2 size={11} />
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
                              textAlign: style.align || 'center'
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
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText size={14} color="var(--primary)" />
                <label 
                  htmlFor="board-notes-input" 
                  className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider"
                >
                  Notes & consignes du planning :
                </label>
              </div>
              <textarea
                id="board-notes-input"
                value={board.settings.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={2}
                placeholder="Ex : Salle de secours, dates des examens..."
                className="board-notes-textarea"
              />
            </div>
          </div>
        )}

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

      {/* ASSISTANT RAPIDE SMARTPHONE (WIZARD MODAL) */}
      {isWizardOpen && (
        <div className="modal-overlay" role="dialog">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Sparkles size={18} color="var(--primary)" />
                <h3 className="modal-title text-base font-bold">Assistant Création Téléphone</h3>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => setIsWizardOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body gap-3">
              <p className="text-xs text-[var(--text-secondary)]">
                Sélectionnez un modèle pré-formaté pour configurer instantanément votre emploi du temps sans réglages manuels :
              </p>

              <button
                type="button"
                onClick={() => applyQuickMobilePreset('school_standard')}
                className="btn-glass-secondary p-3 text-left flex items-start gap-3 w-full"
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Scolaire / Collège & Lycée</h4>
                  <p className="text-xs text-[var(--text-muted)]">5 Jours (Lun - Ven) • 08h00 à 17h45</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyQuickMobilePreset('university')}
                className="btn-glass-secondary p-3 text-left flex items-start gap-3 w-full"
              >
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Université & Enseignement Supérieur</h4>
                  <p className="text-xs text-[var(--text-muted)]">6 Jours (Lun - Sam) • Blocs de cours 2h</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyQuickMobilePreset('work_shifts')}
                className="btn-glass-secondary p-3 text-left flex items-start gap-3 w-full"
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <Wand2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Travail / Shifts & Gardes</h4>
                  <p className="text-xs text-[var(--text-muted)]">7 Jours • Matin, Après-midi, Soir</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de partage */}
      {isShareModalOpen && (
        <ShareModal board={board} onClose={() => setIsShareModalOpen(false)} />
      )}

      {/* Modale d'aperçu d'impression & export */}
      {isPrintModalOpen && (
        <PrintPreviewModal board={board} onClose={() => setIsPrintModalOpen(false)} />
      )}

      {/* Bouton d'Action Flottant (FAB +) Squircle violet #6200ee */}
      <button
        type="button"
        onClick={() => handleOpenCreateCourse(0, '08:00')}
        className="btn-fab-course"
        title="Ajouter un nouveau cours (+)"
        aria-label="Ajouter un cours"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Modale de cours haute fidélité */}
      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          setEditingCourse(null);
        }}
        onSave={handleSaveCourse}
        onDelete={handleDeleteCourse}
        initialCourse={editingCourse}
        boardId={board.id}
      />
    </div>
  );
};
