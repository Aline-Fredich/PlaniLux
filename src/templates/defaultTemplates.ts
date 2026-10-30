import { Board, TemplateType, BoardAxis, BoardCell } from '../types';

export interface TemplateDefinition {
  type: TemplateType;
  title: string;
  badge: string;
  description: string;
  iconName: string;
  createDefault: (ownerId: string) => Board;
}

const generateId = (): string => {
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

export const TEMPLATES_CATALOG: TemplateDefinition[] = [
  {
    type: 'timetable',
    title: 'Emploi du temps',
    badge: 'Classique & Universitaire',
    description: 'Planning par plages horaires et jours de la semaine. Idéal pour cours, révisions et ateliers avec gestion des pauses.',
    iconName: 'Clock',
    createDefault: (ownerId: string): Board => {
      const boardId = generateId();
      const days = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
      const slots = [
        { label: '08H00 - 09H30', start: '08:00', end: '09:30' },
        { label: '09H30 - 11H00', start: '09:30', end: '11:00' },
        { label: '11H15 - 12H45', start: '11:15', end: '12:45' },
        { label: '12H45 - 14H00', start: '12:45', end: '14:00' },
        { label: '14H00 - 15H30', start: '14:00', end: '15:30' },
        { label: '15H45 - 17H15', start: '15:45', end: '17:15' },
        { label: '17H15 - 18H45', start: '17:15', end: '18:45' }
      ];

      const axes: BoardAxis[] = [];
      const colAxes: BoardAxis[] = days.map((day, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'column',
        position: idx,
        label: day,
        kind: 'weekday',
        size_px: 125
      }));
      axes.push(...colAxes);

      const rowAxes: BoardAxis[] = slots.map((s, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'row',
        position: idx,
        label: s.label,
        kind: 'time_slot',
        start_time: s.start,
        end_time: s.end,
        size_px: 55
      }));
      axes.push(...rowAxes);

      const cells: BoardCell[] = [];
      
      // Configuration claire, moderne et équilibrée
      const getCellData = (rowIdx: number, colIdx: number) => {
        // Pause Déjeuner (ligne 3 : 12H45 - 14H00)
        if (rowIdx === 3) {
          return { text: 'PAUSE DÉJEUNER', bg: '#f1f5f9', color: '#475569', bold: false };
        }
        
        // Samedi après-midi libre
        if (colIdx === 5 && rowIdx >= 4) {
          return { text: '', bg: '#ffffff', color: '#64748b', bold: false };
        }

        // Cours types
        const scheduleGrid: Record<string, { text: string; bg: string; color: string; bold: boolean }> = {
          '0-0': { text: 'MATHÉMATIQUES\nAmphi A', bg: '#dbeafe', color: '#1e40af', bold: true },
          '0-1': { text: 'FRANÇAIS\nSalle 102', bg: '#fce7f3', color: '#9d174d', bold: true },
          '0-2': { text: 'PHYSIQUE-CHIMIE\nLabo B', bg: '#e0e7ff', color: '#3730a3', bold: true },
          '0-3': { text: 'HISTOIRE-GÉO\nSalle 204', bg: '#ffedd5', color: '#9a3412', bold: true },
          '0-4': { text: 'ANGLAIS LV1\nSalle 108', bg: '#dcfce7', color: '#166534', bold: true },
          '0-5': { text: 'INFORMATIQUE\nSalle Machine', bg: '#cffafe', color: '#155e75', bold: true },

          '1-0': { text: 'ALGORITHMIQUE\nAmphi B', bg: '#cffafe', color: '#155e75', bold: true },
          '1-1': { text: 'MATHÉMATIQUES\nTD 3', bg: '#dbeafe', color: '#1e40af', bold: true },
          '1-2': { text: 'ANGLAIS LV1\nLabo Langues', bg: '#dcfce7', color: '#166534', bold: true },
          '1-3': { text: 'PHYSIQUE-CHIMIE\nAmphi A', bg: '#e0e7ff', color: '#3730a3', bold: true },
          '1-4': { text: 'FRANÇAIS\nSalle 102', bg: '#fce7f3', color: '#9d174d', bold: true },
          '1-5': { text: 'PROJET TUTORÉ\nAtelier', bg: '#fef3c7', color: '#92400e', bold: true },

          '2-0': { text: 'DROIT & ÉTHIQUE\nSalle 205', bg: '#f3e8ff', color: '#6b21a8', bold: true },
          '2-1': { text: 'SPORT / EPS\nGymnase', bg: '#fef3c7', color: '#92400e', bold: true },
          '2-2': { text: 'HISTOIRE-GÉO\nSalle 204', bg: '#ffedd5', color: '#9a3412', bold: true },
          '2-3': { text: 'MATHÉMATIQUES\nAmphi A', bg: '#dbeafe', color: '#1e40af', bold: true },
          '2-4': { text: 'INFORMATIQUE\nSalle Machine', bg: '#cffafe', color: '#155e75', bold: true },
          '2-5': { text: 'CONFÉRENCE\nAuditorium', bg: '#f1f5f9', color: '#334155', bold: true },

          '4-0': { text: 'ÉCONOMIE\nSalle 110', bg: '#f3e8ff', color: '#6b21a8', bold: true },
          '4-1': { text: 'PHYSIQUE TP\nLabo B', bg: '#e0e7ff', color: '#3730a3', bold: true },
          '4-2': { text: 'ATELIER CODAGE\nSalle Mac', bg: '#cffafe', color: '#155e75', bold: true },
          '4-3': { text: 'SPORT / EPS\nStade', bg: '#fef3c7', color: '#92400e', bold: true },
          '4-4': { text: 'COMMUNICATION\nSalle 105', bg: '#dcfce7', color: '#166534', bold: true },

          '5-0': { text: 'RÉVISIONS\nBibliothèque', bg: '#f1f5f9', color: '#475569', bold: true },
          '5-1': { text: 'ANGLAIS LV2\nSalle 108', bg: '#dcfce7', color: '#166534', bold: true },
          '5-2': { text: 'TUTORAT\nSalle B12', bg: '#fef3c7', color: '#92400e', bold: true },
          '5-3': { text: 'MATHS SOUTIEN\nSalle 102', bg: '#dbeafe', color: '#1e40af', bold: true },
          '5-4': { text: 'BILAN SEMAINE\nAmphi C', bg: '#fee2e2', color: '#991b1b', bold: true },

          '6-0': { text: 'ÉVÉNEMENT\nBureau Étudiants', bg: '#fefce8', color: '#854d0e', bold: true },
          '6-1': { text: 'SPORT LIBRE', bg: '#fef3c7', color: '#92400e', bold: true },
          '6-2': { text: 'CONFÉRENCE PRO', bg: '#f3e8ff', color: '#6b21a8', bold: true },
          '6-3': { text: 'PROJET PERSO', bg: '#ecfdf5', color: '#065f46', bold: true },
          '6-4': { text: 'WEEK-END !', bg: '#dcfce7', color: '#166534', bold: true }
        };

        const key = `${rowIdx}-${colIdx}`;
        return scheduleGrid[key] || { text: '', bg: '#ffffff', color: '#1f2937', bold: false };
      };

      for (const r of rowAxes) {
        for (const c of colAxes) {
          const item = getCellData(r.position, c.position);
          cells.push({
            id: generateId(),
            board_id: boardId,
            row_axis_id: r.id,
            column_axis_id: c.id,
            content: item.text,
            background_color: item.bg,
            text_color: item.color,
            text_style: { align: 'center', bold: item.bold }
          });
        }
      }

      return {
        id: boardId,
        owner_id: ownerId,
        title: 'Emploi du temps Hebdomadaire',
        template_type: 'timetable',
        settings: {
          showGridLines: true,
          firstDayOfWeek: 1,
          slotDurationMinutes: 60,
          themeColor: '#0284c7',
          notes: 'Planning intensif Cyber & Ingénierie logicielle — Présence obligatoire.'
        },
        timezone: 'Europe/Paris',
        week_starts_on: 1,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        axes,
        cells
      };
    }
  },
  {
    type: 'monthly',
    title: 'Planificateur mensuel',
    badge: 'Vue d’ensemble',
    description: 'Calendrier de 4 à 5 semaines pour jalonner vos échéances, livrables et événements du mois.',
    iconName: 'Calendar',
    createDefault: (ownerId: string): Board => {
      const boardId = generateId();
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      const weeks = ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4', 'Semaine 5'];

      const colAxes: BoardAxis[] = days.map((day, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'column',
        position: idx,
        label: day,
        kind: 'weekday',
        size_px: 130
      }));

      const rowAxes: BoardAxis[] = weeks.map((w, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'row',
        position: idx,
        label: w,
        kind: 'custom',
        size_px: 90
      }));

      const cells: BoardCell[] = [];
      let dayCounter = 1;

      for (const r of rowAxes) {
        for (const c of colAxes) {
          const currentDayNum = dayCounter <= 31 ? dayCounter : null;
          let content = currentDayNum ? `${currentDayNum}\n` : '';
          let bg = '#ffffff';
          let textColor = '#1f2937';

          if (currentDayNum === 5) {
            content += '🎯 Lancement Sprint';
            bg = '#e0f2fe';
            textColor = '#0369a1';
          } else if (currentDayNum === 15) {
            content += '📝 Rapport d’étape';
            bg = '#fef3c7';
            textColor = '#92400e';
          } else if (currentDayNum === 28) {
            content += '🚀 Soutenance finale';
            bg = '#dcfce7';
            textColor = '#166534';
          }

          cells.push({
            id: generateId(),
            board_id: boardId,
            row_axis_id: r.id,
            column_axis_id: c.id,
            content: content.trim(),
            background_color: bg,
            text_color: textColor,
            text_style: { align: 'left' }
          });

          if (currentDayNum) dayCounter++;
        }
      }

      return {
        id: boardId,
        owner_id: ownerId,
        title: 'Planification Mensuelle — Novembre',
        template_type: 'monthly',
        settings: {
          showGridLines: true,
          firstDayOfWeek: 1,
          themeColor: '#8b5cf6',
          notes: 'Objectif du mois : Clôturer la première phase et finaliser les spécifications.'
        },
        timezone: 'Europe/Paris',
        week_starts_on: 1,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        axes: [...colAxes, ...rowAxes],
        cells
      };
    }
  },
  {
    type: 'weekly',
    title: 'Planificateur hebdomadaire',
    badge: 'Organisation continue',
    description: 'Semainier articulé par moments clés de la journée pour équilibrer travail et priorités.',
    iconName: 'LayoutGrid',
    createDefault: (ownerId: string): Board => {
      const boardId = generateId();
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Weekend'];
      const periods = [
        '🎯 Priorités du jour',
        '☀️ Matinée (Focus & Deep Work)',
        '⛅ Après-midi (Réunions & Action)',
        '🌙 Soirée & Bilan'
      ];

      const colAxes: BoardAxis[] = days.map((day, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'column',
        position: idx,
        label: day,
        kind: 'weekday',
        size_px: 160
      }));

      const rowAxes: BoardAxis[] = periods.map((p, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'row',
        position: idx,
        label: p,
        kind: 'custom',
        size_px: 90
      }));

      const cells: BoardCell[] = [];
      for (const r of rowAxes) {
        for (const c of colAxes) {
          let content = '';
          let bg = '#ffffff';

          if (r.position === 0) {
            content = c.position < 5 ? `• Objectif N°${c.position + 1}` : '• Repos & Sport';
            bg = '#f0fdf4';
          }

          cells.push({
            id: generateId(),
            board_id: boardId,
            row_axis_id: r.id,
            column_axis_id: c.id,
            content,
            background_color: bg,
            text_color: '#1f2937',
            text_style: { align: 'left' }
          });
        }
      }

      return {
        id: boardId,
        owner_id: ownerId,
        title: 'Semainier — Productivité & Focus',
        template_type: 'weekly',
        settings: {
          showGridLines: true,
          firstDayOfWeek: 1,
          themeColor: '#10b981',
          notes: 'Règle d’or : Pas plus de 3 priorités majeures par journée.'
        },
        timezone: 'Europe/Paris',
        week_starts_on: 1,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        axes: [...colAxes, ...rowAxes],
        cells
      };
    }
  },
  {
    type: 'daily',
    title: 'Planificateur quotidien',
    badge: 'Haute concentration',
    description: 'Une vue détaillée de la journée : créneaux précis, liste des tâches à accomplir et notes.',
    iconName: 'Sun',
    createDefault: (ownerId: string): Board => {
      const boardId = generateId();
      const columns = ['Matinée (08h - 12h)', 'Après-midi (13h - 17h)', 'Fin de journée (17h - 20h)'];
      const rows = [
        '1. Top Priorité (Must do)',
        '2. Tâches secondaires',
        '3. Appels & Rendez-vous',
        '4. Suivi & Notes du jour'
      ];

      const colAxes: BoardAxis[] = columns.map((col, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'column',
        position: idx,
        label: col,
        kind: 'custom',
        size_px: 220
      }));

      const rowAxes: BoardAxis[] = rows.map((r, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'row',
        position: idx,
        label: r,
        kind: 'custom',
        size_px: 95
      }));

      const cells: BoardCell[] = [];
      for (const r of rowAxes) {
        for (const c of colAxes) {
          let content = '';
          let bg = '#ffffff';

          if (r.position === 0 && c.position === 0) {
            content = '✅ Valider l’architecture & base de données';
            bg = '#fef2f2';
          } else if (r.position === 1 && c.position === 1) {
            content = '⚡ Révision de code avec l’équipe';
            bg = '#fefce8';
          }

          cells.push({
            id: generateId(),
            board_id: boardId,
            row_axis_id: r.id,
            column_axis_id: c.id,
            content,
            background_color: bg,
            text_color: '#1f2937',
            text_style: { align: 'left' }
          });
        }
      }

      return {
        id: boardId,
        owner_id: ownerId,
        title: 'Planning Quotidien — Journée Type',
        template_type: 'daily',
        settings: {
          showGridLines: true,
          themeColor: '#f59e0b',
          notes: 'Penser à boire 1.5L d’eau et s’accorder une pause toutes les 90 minutes.'
        },
        timezone: 'Europe/Paris',
        week_starts_on: 1,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        axes: [...colAxes, ...rowAxes],
        cells
      };
    }
  },
  {
    type: 'free',
    title: 'Tableau libre',
    badge: '100% Modulable',
    description: 'Une grille vierge sans contrainte horaire ni calendaire. Ajoutez lignes et colonnes selon vos besoins.',
    iconName: 'Grid',
    createDefault: (ownerId: string): Board => {
      const boardId = generateId();
      const colLabels = ['Colonne A', 'Colonne B', 'Colonne C', 'Colonne D'];
      const rowLabels = ['Ligne 1', 'Ligne 2', 'Ligne 3', 'Ligne 4', 'Ligne 5'];

      const colAxes: BoardAxis[] = colLabels.map((label, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'column',
        position: idx,
        label,
        kind: 'custom',
        size_px: 150
      }));

      const rowAxes: BoardAxis[] = rowLabels.map((label, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'row',
        position: idx,
        label,
        kind: 'custom',
        size_px: 60
      }));

      const cells: BoardCell[] = [];
      for (const r of rowAxes) {
        for (const c of colAxes) {
          cells.push({
            id: generateId(),
            board_id: boardId,
            row_axis_id: r.id,
            column_axis_id: c.id,
            content: '',
            background_color: '#ffffff',
            text_color: '#1f2937',
            text_style: { align: 'center' }
          });
        }
      }

      return {
        id: boardId,
        owner_id: ownerId,
        title: 'Tableau Libre Personnalisé',
        template_type: 'free',
        settings: {
          showGridLines: true,
          themeColor: '#6366f1',
          notes: 'Grille entièrement personnalisable.'
        },
        timezone: 'Europe/Paris',
        week_starts_on: 1,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        axes: [...colAxes, ...rowAxes],
        cells
      };
    }
  }
];
