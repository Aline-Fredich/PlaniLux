import React, { useState, useRef } from 'react';
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
  Plus,
  Minimize2,
  Wand2,
  Sparkles,
  Clock,
  BarChart3,
  Download,
  Upload
} from 'lucide-react';
import { Board, BoardCell, BoardAxis, CourseEntry } from '../types';
import { CellPropertiesPanel } from './CellPropertiesPanel';
import { ShareModal } from './ShareModal';
import { PrintPreviewModal } from './PrintPreviewModal';
import { CourseModal } from './CourseModal';
import { StatsModal } from './StatsModal';
import { downloadIcsFile, parseIcsToCourses } from '../services/icalService';
import { computeDayCourseLayouts } from '../lib/courseLayout';

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
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<CourseEntry> | null>(null);
  const [timetableDisplayMode, setTimetableDisplayMode] = useState<'proportional' | 'matrix'>(
    board.template_type === 'timetable' ? 'proportional' : 'matrix'
  );
  const [editingAxisId, setEditingAxisId] = useState<string | null>(null);
  const [axisLabelInput, setAxisLabelInput] = useState('');
  
  // Input de fichier masqué pour l'import iCal .ics
  const icsFileInputRef = useRef<HTMLInputElement | null>(null);

  // États de présentation & réduction extrême
  const [zoom, setZoom] = useState<number>(100);
  const [tableScaleOnly, setTableScaleOnly] = useState<number>(board.settings?.tableScaleOnly || 100);
  const [density, setDensity] = useState<DensityMode>(
    (board.settings?.density as DensityMode) || (localStorage.getItem('planilux_density') as DensityMode) || 'normal'
  );
  const isMicroUI = density === 'micro';
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

  const handleDuplicateCourse = (courseToDuplicate: CourseEntry) => {
    const duplicated: CourseEntry = {
      ...courseToDuplicate,
      id: 'course_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      title: `${courseToDuplicate.title} (Copie)`
    };
    onUpdateBoard({
      ...board,
      courses: [...(board.courses || []), duplicated]
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

  // Import / Export iCalendar .ics
  const handleExportIcs = () => {
    downloadIcsFile(board);
  };

  const handleImportIcsClick = () => {
    if (icsFileInputRef.current) {
      icsFileInputRef.current.value = '';
      icsFileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      try {
        const imported = parseIcsToCourses(text, board.id);
        if (imported.length === 0) {
          alert("Aucun événement valide n'a été trouvé dans ce fichier .ics.");
          return;
        }

        const mode = confirm(
          `📅 ${imported.length} cours ont été identifiés !\n\nCliquez sur "OK" pour les FUSIONNER avec vos cours existants.\nCliquez sur "Annuler" pour REMPLACER votre planning par ces cours.`
        );

        const newCourses = mode 
          ? [...(board.courses || []), ...imported]
          : imported;

        onUpdateBoard({
          ...board,
          courses: newCourses
        });
        alert(`✅ Importation réussie : ${imported.length} cours chargés !`);
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la lecture du fichier .ics.");
      }
    };
    reader.readAsText(file);
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

  // Assistant Mobile de Création Rapide
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
      
      {/* Input de fichier caché pour l'import .ics */}
      <input 
        type="file" 
        ref={icsFileInputRef} 
        onChange={handleFileChange} 
        accept=".ics,text/calendar" 
        className="hidden" 
      />

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
              title="Densité Ultra-Compacte (75%)"
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
              title="Densité Compacte (88%)"
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
              title="Densité Normale (100%)"
            >
              🖥 Normal
            </button>
          </div>

          {/* Sélecteur de mode d'affichage pour Emploi du Temps */}
          <div className="toolbar-pill-group" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <button
              type="button"
              onClick={() => setTimetableDisplayMode('proportional')}
              className={`btn-glass-pill ${timetableDisplayMode === 'proportional' ? 'active' : ''}`}
              title="Grille continue 08h00 - 19h00 avec cartes horaires proportionnelles"
            >
              <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
              <span>Grille Pro</span>
            </button>
            <button
              type="button"
              onClick={() => setTimetableDisplayMode('matrix')}
              className={`btn-glass-pill ${timetableDisplayMode === 'matrix' ? 'active' : ''}`}
              title="Affichage sous forme de matrice / tableau classique"
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

        {/* Partie droite : Bascule de Vue Mobile & Actions Universelles */}
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

          {/* Bouton Statistiques & Volume Horaire */}
          <button
            type="button"
            className="btn-glass-secondary hidden sm:inline-flex"
            onClick={() => setIsStatsModalOpen(true)}
            title="Afficher les statistiques de volume horaire et devoirs"
          >
            <BarChart3 size={14} className="text-[var(--primary)]" />
            <span className="hidden lg:inline">Stats</span>
          </button>

          {/* Boutons Import / Export iCalendar .ics */}
          <button
            type="button"
            className="btn-glass-secondary hidden lg:inline-flex"
            onClick={handleImportIcsClick}
            title="Importer un fichier .ics (ADE Campus, Google Agenda, Outlook)"
          >
            <Upload size={13} />
            <span>Import .ics</span>
          </button>

          <button
            type="button"
            className="btn-glass-secondary hidden lg:inline-flex"
            onClick={handleExportIcs}
            title="Exporter l'emploi du temps au format universel .ics"
          >
            <Download size={13} />
            <span>Export .ics</span>
          </button>

          {/* Boutons d'ajout de structure */}
          <button 
            type="button"
            className="btn-glass-secondary hidden sm:inline-flex" 
            onClick={handleAddColumn} 
            title="Ajouter un jour / colonne"
          >
            <Columns size={14} />
            <span className="hidden md:inline">+ Jour</span>
          </button>

          <button 
            type="button"
            className="btn-glass-secondary hidden sm:inline-flex" 
            onClick={handleAddRow} 
            title="Ajouter une plage horaire"
          >
            <Rows size={14} />
            <span className="hidden md:inline">+ Heure</span>
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

          {/* Bouton Partager */}
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
            title="Aperçu d'impression, personnalisation et export PDF vectoriel"
          >
            <Printer size={14} />
            <span className="hidden xs:inline">Imprimer / PDF</span>
          </button>

          {/* Bouton Options avancées pour mobile */}
          <button
            type="button"
            className="btn-glass-secondary btn-icon md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Options d'affichage, stats et synchronisation"
            aria-label="Options"
          >
            <Sliders size={15} />
          </button>
        </div>
      </header>

      {/* Volet déroulant d'options Mobile */}
      {isMobileMenuOpen && (
        <div className="mobile-options-drawer md:hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--glass-border-subtle)]">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Réglages & Outils PlaniLux
            </span>
            <button 
              type="button"
              className="btn-ghost btn-icon p-1" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={15} />
            </button>
          </div>

          {/* Actions rapides Mobile : Stats, iCal, Partage */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              className="btn-glass-secondary py-2 text-xs font-semibold justify-center"
              onClick={() => {
                setIsStatsModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <BarChart3 size={14} className="text-[var(--primary)]" />
              <span>Statistiques</span>
            </button>

            <button
              type="button"
              className="btn-glass-secondary py-2 text-xs font-semibold justify-center"
              onClick={() => {
                handleExportIcs();
                setIsMobileMenuOpen(false);
              }}
            >
              <Download size={14} />
              <span>Export .ics</span>
            </button>

            <button
              type="button"
              className="btn-glass-secondary py-2 text-xs font-semibold justify-center"
              onClick={() => {
                handleImportIcsClick();
                setIsMobileMenuOpen(false);
              }}
            >
              <Upload size={14} />
              <span>Import .ics</span>
            </button>

            <button
              type="button"
              className="btn-glass-secondary py-2 text-xs font-semibold justify-center"
              onClick={() => {
                setIsShareModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <Share2 size={14} />
              <span>Partager</span>
            </button>
          </div>

          {/* Densité sur mobile */}
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

          {/* Zoom global sur mobile */}
          <div className="mb-2.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium mb-1">
              <span>Échelle globale : {zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="text-[var(--primary)] text-[11px] underline"
              >
                Reset
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-glass-secondary btn-icon p-1"
                onClick={() => setZoom(z => Math.max(30, z - 10))}
              >
                <ZoomOut size={14} />
              </button>
              <input 
                type="range" 
                min={30} 
                max={150} 
                step={5} 
                value={zoom} 
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-[var(--primary)] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                className="btn-glass-secondary btn-icon p-1"
                onClick={() => setZoom(z => Math.min(150, z + 10))}
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>

          {/* Mode d'affichage Emploi du Temps sur Mobile */}
          <div className="flex gap-2 pt-2 border-t border-[var(--glass-border-subtle)]">
            <button
              type="button"
              className={`btn-glass-pill flex-1 text-center ${timetableDisplayMode === 'proportional' ? 'active' : ''}`}
              onClick={() => setTimetableDisplayMode('proportional')}
            >
              Grille Pro 08h-19h
            </button>
            <button
              type="button"
              className={`btn-glass-pill flex-1 text-center ${timetableDisplayMode === 'matrix' ? 'active' : ''}`}
              onClick={() => setTimetableDisplayMode('matrix')}
            >
              Mode Tableau
            </button>
          </div>
        </div>
      )}

      {/* 2. Conteneur principal de l'éditeur */}
      <main className="editor-main">
        
        {/* =====================================================================
           VUE QUOTIDIENNE ("JOUR PAR JOUR") MOBILE (Smartphone portrait)
           ===================================================================== */}
        {mobileView === 'day' ? (
          <div className="mobile-daily-container">
            
            {/* Barre de navigation des jours avec badges de cours */}
            <div className="mobile-day-tabs">
              {colAxes.map((col, idx) => {
                const isActive = idx === activeDayIdx;
                const coursesCount = (board.courses || []).filter(c => c.dayIndex === idx).length;

                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setActiveDayIdx(idx)}
                    className={`mobile-day-tab ${isActive ? 'active' : ''}`}
                  >
                    <span className="mobile-day-tab-label">{col.label.substring(0, 3)}</span>
                    {coursesCount > 0 && (
                      <span className="mobile-day-tab-badge">{coursesCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* En-tête du jour sélectionné avec action d'ajout */}
            <div className="flex items-center justify-between px-1 py-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-[var(--text-primary)]">
                  {activeCol?.label}
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-medium">
                  {((board.courses || []).filter(c => c.dayIndex === activeDayIdx)).length} cours prévu(s)
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => handleOpenCreateCourse(activeDayIdx, '08:00')}
                className="btn-glass-primary text-xs py-1 px-2.5 flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Nouveau cours</span>
              </button>
            </div>

            {/* Liste verticale des cours du jour sélectionné */}
            <div className="space-y-3 pb-8">
              {((board.courses || []).filter(c => c.dayIndex === activeDayIdx)).length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[var(--glass-border-subtle)] rounded-2xl bg-[var(--bg-glass-card)]">
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">Aucun cours ce jour-là</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Appuyez sur le bouton ci-dessous pour ajouter un cours.</p>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateCourse(activeDayIdx, '08:00')}
                    className="btn-glass-primary mt-4 py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Ajouter un cours</span>
                  </button>
                </div>
              ) : (
                (board.courses || [])
                  .filter(c => c.dayIndex === activeDayIdx)
                  .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime))
                  .map((course) => {
                    const pendingTasks = (course.tasks || []).filter(t => !t.isCompleted).length;
                    return (
                      <div
                        key={course.id}
                        onClick={() => {
                          setEditingCourse(course);
                          setIsCourseModalOpen(true);
                        }}
                        className="rounded-2xl p-4 shadow-sm border border-[var(--glass-border-subtle)] bg-[var(--bg-glass-card)] cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between relative overflow-hidden"
                        style={{ borderLeft: `6px solid ${course.color}` }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-base text-[var(--text-primary)]">
                              {course.title}
                            </div>
                            {course.professor && (
                              <div className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
                                👨‍🏫 {course.professor}
                              </div>
                            )}
                          </div>
                          <span 
                            className="px-2.5 py-1 rounded-full text-xs font-bold font-mono text-white flex-shrink-0"
                            style={{ backgroundColor: course.color }}
                          >
                            {course.startTime} - {course.endTime}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-semibold mt-3 pt-2 border-t border-[var(--glass-border-subtle)]">
                          <span>📍 {course.room || 'Salle non précisée'}</span>
                          {pendingTasks > 0 ? (
                            <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              📝 {pendingTasks} devoir{pendingTasks > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)]">Cliquer pour modifier</span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

          </div>
        ) : timetableDisplayMode === 'proportional' ? (
          /* =====================================================================
             B1. MODE GRILLE HORAIRE PROPORTIONNELLE CONTINUE (08H00 - 19H00)
             AVEC GESTION INTELLIGENTE DES CHEVAUCHEMENTS & SOUS-COLONNES
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

                  {/* Colonnes des jours avec créneaux et cartes proportionnelles */}
                  {colAxes.map((col, dayIdx) => {
                    const dayCourses = (board.courses || []).filter(c => c.dayIndex === dayIdx);
                    // Calcul intelligent des sous-colonnes en cas de chevauchement d'horaires
                    const dayLayouts = computeDayCourseLayouts(dayCourses);

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

                        {/* Cartes de cours proportionnelles avec disposition en sous-colonnes */}
                        {dayCourses.map((course) => {
                          const { top, height } = getCourseTopAndHeight(course.startTime, course.endTime, totalHeight);
                          const layout = dayLayouts.get(course.id) || { colIndex: 0, totalCols: 1, hasConflict: false };
                          const isSplit = layout.totalCols > 1;

                          const cardWidth = isSplit ? `calc((100% - 10px) / ${layout.totalCols} - 2px)` : undefined;
                          const cardLeft = isSplit ? `calc(5px + (${layout.colIndex} * ((100% - 10px) / ${layout.totalCols})))` : '6px';
                          const cardRight = isSplit ? undefined : '6px';

                          const pendingTasks = (course.tasks || []).filter(t => !t.isCompleted).length;

                          return (
                            <div
                              key={course.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCourse(course);
                                setIsCourseModalOpen(true);
                              }}
                              className="absolute rounded-[10px] p-2.5 shadow-md cursor-pointer transition-all duration-150 hover:scale-[1.02] hover:shadow-xl active:scale-95 flex flex-col justify-between overflow-hidden group"
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                width: cardWidth,
                                left: cardLeft,
                                right: cardRight,
                                backgroundColor: course.color,
                                color: '#ffffff',
                                zIndex: 15,
                                border: layout.hasConflict ? '2px dashed #f59e0b' : '1px solid rgba(255, 255, 255, 0.35)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                              }}
                              title={`${course.title} (${course.startTime} - ${course.endTime})${layout.hasConflict ? '\n⚠️ Attention: chevauchement d\'horaire' : ''}\nCliquer pour modifier`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-1">
                                  <div className="font-extrabold text-xs sm:text-sm leading-snug drop-shadow-sm truncate">
                                    {course.title}
                                  </div>
                                  {layout.hasConflict && (
                                    <span 
                                      className="text-[9px] font-black px-1 py-0.5 rounded bg-amber-500 text-black flex-shrink-0 animate-pulse"
                                      title="Chevauchement détecté"
                                    >
                                      ⚠️ Conflit
                                    </span>
                                  )}
                                </div>
                                {course.professor && (
                                  <div className="text-[11px] font-medium opacity-90 truncate mt-0.5">
                                    👨‍🏫 {course.professor}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold opacity-95 pt-1 mt-1 border-t border-white/20">
                                <span className="truncate max-w-[60%]">
                                  📍 {course.room || 'Salle ?'}
                                </span>
                                <div className="flex items-center gap-1">
                                  {pendingTasks > 0 && (
                                    <span className="text-[10px] bg-white/25 px-1 rounded font-bold">
                                      📝 {pendingTasks}
                                    </span>
                                  )}
                                  <span className="font-mono flex-shrink-0">
                                    {course.startTime} - {course.endTime}
                                  </span>
                                </div>
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

                    {/* En-têtes de colonnes (Jours) */}
                    {colAxes.map((col) => (
                      <th 
                        key={col.id} 
                        className="col-header"
                        style={{ 
                          minWidth: dStyle.headerMinWidth,
                          padding: dStyle.headerPadding 
                        }}
                      >
                        <div className="axis-header-content">
                          {editingAxisId === col.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                className="axis-edit-input"
                                value={axisLabelInput}
                                onChange={(e) => setAxisLabelInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditAxis(col.id);
                                  if (e.key === 'Escape') setEditingAxisId(null);
                                }}
                                autoFocus
                              />
                              <button 
                                type="button"
                                className="btn-ghost btn-icon p-1 text-emerald-600"
                                onClick={() => saveEditAxis(col.id)}
                              >
                                <Check size={12} />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="axis-label cursor-pointer"
                              onClick={() => startEditAxis(col)}
                              title="Double-cliquer pour renommer"
                              style={{ fontSize: dStyle.fontSize }}
                            >
                              {col.label}
                            </div>
                          )}

                          <button 
                            type="button"
                            className="axis-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteColumn(col.id);
                            }}
                            title="Supprimer ce jour"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rowAxes.map((row) => (
                    <tr key={row.id}>
                      {/* En-tête de ligne (Plage horaire) */}
                      <th 
                        className="row-header"
                        style={{ 
                          minHeight: dStyle.cellMinHeight,
                          padding: dStyle.headerPadding 
                        }}
                      >
                        <div className="axis-header-content">
                          {editingAxisId === row.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                className="axis-edit-input"
                                value={axisLabelInput}
                                onChange={(e) => setAxisLabelInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditAxis(row.id);
                                  if (e.key === 'Escape') setEditingAxisId(null);
                                }}
                                autoFocus
                              />
                              <button 
                                type="button"
                                className="btn-ghost btn-icon p-1 text-emerald-600"
                                onClick={() => saveEditAxis(row.id)}
                              >
                                <Check size={12} />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="axis-label cursor-pointer"
                              onClick={() => startEditAxis(row)}
                              title="Double-cliquer pour renommer"
                              style={{ fontSize: dStyle.fontSize }}
                            >
                              {row.label}
                            </div>
                          )}

                          <button 
                            type="button"
                            className="axis-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRow(row.id);
                            }}
                            title="Supprimer cette plage"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </th>

                      {/* Cellules du tableau */}
                      {colAxes.map((col) => {
                        const cell = board.cells.find(
                          c => c.row_axis_id === row.id && c.column_axis_id === col.id
                        );
                        const isSelected = cell ? cell.id === selectedCellId : false;
                        const cellStyle = cell?.text_style || {};

                        return (
                          <td 
                            key={`${row.id}-${col.id}`}
                            className={`planner-cell ${isSelected ? 'selected' : ''}`}
                            onClick={() => cell && setSelectedCellId(cell.id)}
                            style={{
                              backgroundColor: cell?.background_color && cell.background_color !== '#ffffff' ? cell.background_color : undefined,
                              color: cell?.text_color || undefined,
                              padding: dStyle.cellPadding,
                              minHeight: dStyle.cellMinHeight,
                              minWidth: dStyle.cellMinWidth
                            }}
                          >
                            <div 
                              className="cell-text-container"
                              style={{
                                textAlign: cellStyle.align || 'center',
                                fontWeight: cellStyle.bold ? 700 : undefined,
                                fontStyle: cellStyle.italic ? 'italic' : undefined,
                                textDecoration: cellStyle.underline ? 'underline' : undefined,
                                fontSize: dStyle.fontSize
                              }}
                            >
                              {cell?.content || ''}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bloc de notes au bas du tableau */}
            <div className="board-notes-card mt-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText size={14} color="var(--primary)" />
                <label 
                  htmlFor="board-notes-input-2" 
                  className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider"
                >
                  Notes & consignes du planning :
                </label>
              </div>
              <textarea
                id="board-notes-input-2"
                value={board.settings.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={2}
                placeholder="Ex : Salle de secours, dates des examens..."
                className="board-notes-textarea"
              />
            </div>
          </div>
        )}

        {/* 3. Volet latéral de propriétés de la case sélectionnée */}
        {selectedCell && (
          <aside className="editor-sidebar-panel">
            <CellPropertiesPanel
              cell={selectedCell}
              rowLabel={selectedRowAxis?.label || ''}
              colLabel={selectedColAxis?.label || ''}
              onUpdateCell={handleUpdateCell}
              onClose={() => setSelectedCellId(null)}
            />
          </aside>
        )}
      </main>

      {/* Assistant Mobile de Création Rapide (Modale) */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-glass-card)] border border-[var(--glass-border)] rounded-2xl p-5 max-w-md w-full shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--glass-border-subtle)]">
              <div className="flex items-center gap-2">
                <Wand2 size={18} color="var(--primary)" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">Assistant Express</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsWizardOpen(false)}
                className="btn-ghost btn-icon p-1 text-[var(--text-secondary)]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Sélectionnez un modèle pré-rempli pour reconfigurer instantanément votre emploi du temps :
            </p>

            <div className="space-y-2.5">
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

      {/* Modale d'aperçu d'impression & export PDF vectoriel */}
      {isPrintModalOpen && (
        <PrintPreviewModal board={board} onClose={() => setIsPrintModalOpen(false)} />
      )}

      {/* Modale de statistiques et volume horaire */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        courses={board.courses || []}
        boardTitle={board.title}
      />

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
        onDuplicate={handleDuplicateCourse}
        initialCourse={editingCourse}
        boardId={board.id}
        existingCourses={board.courses || []}
      />
    </div>
  );
};
