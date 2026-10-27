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
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const slots = [
        { label: '08:00 - 09:30', start: '08:00', end: '09:30' },
        { label: '09:45 - 11:15', start: '09:45', end: '11:15' },
        { label: '11:30 - 13:00', start: '11:30', end: '13:00' },
        { label: '13:00 - 14:00 (Pause)', start: '13:00', end: '14:00' },
        { label: '14:00 - 15:30', start: '14:00', end: '15:30' },
        { label: '15:45 - 17:15', start: '15:45', end: '17:15' },
        { label: '17:30 - 19:00', start: '17:30', end: '19:00' },
      ];

      const axes: BoardAxis[] = [];
      const colAxes: BoardAxis[] = days.map((day, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'column',
        position: idx,
        label: day,
        kind: 'weekday',
        size_px: 150
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
        size_px: 64
      }));
      axes.push(...rowAxes);

      const cells: BoardCell[] = [];
      
      // Exemples de cours pré-remplis
      const demoData: { row: number; col: number; text: string; bg: string; color: string }[] = [
        { row: 0, col: 0, text: 'Mathématiques Approfondies\nAmphi A', bg: '#dbeafe', color: '#1e40af' },
        { row: 1, col: 0, text: 'Physique Quantique\nSalle 204', bg: '#fef3c7', color: '#92400e' },
        { row: 3, col: 0, text: '— Pause Déjeuner —', bg: '#f3f4f6', color: '#6b7280' },
        { row: 4, col: 0, text: 'Informatique & Algorithmique\nLab 3', bg: '#dcfce7', color: '#166534' },
        { row: 0, col: 1, text: 'Anglais Professionnel\nSalle 102', bg: '#fce7f3', color: '#9d174d' },
        { row: 2, col: 1, text: 'Droit Numérique & Éthique\nAmphi B', bg: '#ede9fe', color: '#5b21b6' },
        { row: 3, col: 1, text: '— Pause Déjeuner —', bg: '#f3f4f6', color: '#6b7280' },
        { row: 4, col: 2, text: 'Projet de Groupe\nEspace Coworking', bg: '#ffedd5', color: '#9a3412' },
        { row: 0, col: 3, text: 'Gestion de Projet Agile\nSalle 301', bg: '#e0f2fe', color: '#0369a1' },
        { row: 1, col: 3, text: 'Base de Données relationnelles\nLab 1', bg: '#dcfce7', color: '#166534' },
        { row: 3, col: 3, text: '— Pause Déjeuner —', bg: '#f3f4f6', color: '#6b7280' },
        { row: 5, col: 4, text: 'Séance de Mentorat & Revue', bg: '#fef9c3', color: '#854d0e' },
      ];

      for (const r of rowAxes) {
        for (const c of colAxes) {
          const match = demoData.find(d => d.row === r.position && d.col === c.position);
          cells.push({
            id: generateId(),
            board_id: boardId,
            row_axis_id: r.id,
            column_axis_id: c.id,
            content: match ? match.text : '',
            background_color: match ? match.bg : '#ffffff',
            text_color: match ? match.color : '#1f2937',
            text_style: { align: 'center', bold: !!match }
          });
        }
      }

      return {
        id: boardId,
        owner_id: ownerId,
        title: 'Emploi du temps Universitaire S1',
        template_type: 'timetable',
        settings: {
          showGridLines: true,
          firstDayOfWeek: 1,
          slotDurationMinutes: 90,
          themeColor: '#3b82f6',
          notes: 'Important : Présence obligatoire aux TD. Rendu de projet le vendredi avant 18h.'
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
