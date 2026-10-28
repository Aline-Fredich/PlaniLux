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
      const days = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
      const slots = [
        { label: '02H00 A 03H00', start: '02:00', end: '03:00' },
        { label: '03H00 A 04H00', start: '03:00', end: '04:00' },
        { label: '04H00 A 05H00', start: '04:00', end: '05:00' },
        { label: '05H00 A 06H00', start: '05:00', end: '06:00' },
        { label: '06H00 A 07H30', start: '06:00', end: '07:30' },
        { label: '07H30 A 09H30', start: '07:30', end: '09:30' },
        { label: '09H30 A 11H30', start: '09:30', end: '11:30' },
        { label: '11H30 A 14H30', start: '11:30', end: '14:30' },
        { label: '14H30 A 16H00', start: '14:30', end: '16:00' },
        { label: '16H00 A 18H00', start: '16:00', end: '18:00' },
        { label: '18H00 A 19H00', start: '18:00', end: '19:00' },
        { label: '19H30 A 21H30', start: '19:30', end: '21:30' },
        { label: '21H30 A 22H30', start: '21:30', end: '22:30' },
        { label: '22H30 A 23H00', start: '22:30', end: '23:00' },
        { label: '23H30 A 02H00', start: '23:30', end: '02:00' }
      ];

      const axes: BoardAxis[] = [];
      const colAxes: BoardAxis[] = days.map((day, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'column',
        position: idx,
        label: day,
        kind: 'weekday',
        size_px: 135
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
        size_px: 52
      }));
      axes.push(...rowAxes);

      const cells: BoardCell[] = [];
      
      // Configuration fidèle à l'emploi du temps de référence fourni
      const getCellData = (rowIdx: number, colIdx: number) => {
        // 02H00 A 03H00 -> JAVA SCRIPT sur les 7 jours (cyan)
        if (rowIdx === 0) {
          return { text: 'JAVA\nSCRIPT', bg: '#22d3ee', color: '#082f49', bold: true };
        }
        // 03H00 A 04H00 -> HACKING sur les 7 jours (jaune vif)
        if (rowIdx === 1) {
          return { text: 'HACKING', bg: '#facc15', color: '#713f12', bold: true };
        }
        // 04H00 A 05H00
        if (rowIdx === 2) {
          if (colIdx === 0 || colIdx === 1) return { text: 'SYSTÈME\nEXPLOITATION', bg: '#f8fafc', color: '#0f172a', bold: true };
          if (colIdx >= 2 && colIdx <= 4) return { text: 'AUDIT ET\nCONFORMITÉ\nSI', bg: '#f8fafc', color: '#0f172a', bold: true };
          return { text: 'SÉCURITÉ\nSYSTÈME\nINFO', bg: '#f8fafc', color: '#0f172a', bold: true };
        }
        // 05H00 A 06H00
        if (rowIdx === 3) {
          if (colIdx === 0 || colIdx === 1) return { text: 'WINDOWS\nSERVER', bg: '#f8fafc', color: '#0f172a', bold: true };
          return { text: 'MATHS', bg: '#f8fafc', color: '#0f172a', bold: true };
        }
        // 06H00 A 07H30 -> repos / pause
        if (rowIdx === 4) {
          return { text: '—//—', bg: '#ffffff', color: '#64748b', bold: false };
        }
        // 07H30 A 09H30
        if (rowIdx === 5) {
          if (colIdx <= 4) return { text: 'STAGE\nUBA BANK', bg: '#dc2626', color: '#ffffff', bold: true };
          if (colIdx === 5) return { text: 'ADMIN\nLINUX', bg: '#f8fafc', color: '#0f172a', bold: true };
          return { text: '—//—', bg: '#ffffff', color: '#64748b', bold: false };
        }
        // 09H30 A 11H30
        if (rowIdx === 6) {
          if (colIdx <= 4) return { text: 'STAGE\nUBA BANK', bg: '#dc2626', color: '#ffffff', bold: true };
          if (colIdx === 5) return { text: 'ADMIN\nLINUX', bg: '#f8fafc', color: '#0f172a', bold: true };
          return { text: '—//—', bg: '#ffffff', color: '#64748b', bold: false };
        }
        // 11H30 A 14H30
        if (rowIdx === 7) {
          if (colIdx <= 4) return { text: 'STAGE\nUBA BANK', bg: '#dc2626', color: '#ffffff', bold: true };
          if (colIdx === 5) return { text: 'CRYPTO', bg: '#f8fafc', color: '#0f172a', bold: true };
          return { text: '—//—', bg: '#ffffff', color: '#64748b', bold: false };
        }
        // 14H30 A 16H00
        if (rowIdx === 8) {
          if (colIdx <= 4) return { text: 'STAGE\nUBA BANK', bg: '#dc2626', color: '#ffffff', bold: true };
          if (colIdx === 5) return { text: 'CRYPTO', bg: '#f8fafc', color: '#0f172a', bold: true };
          return { text: '—//—', bg: '#ffffff', color: '#64748b', bold: false };
        }
        // 16H00 A 18H00 -> repos
        if (rowIdx === 9) {
          return { text: '—//—', bg: '#ffffff', color: '#64748b', bold: false };
        }
        // 18H00 A 19H00 -> SENTINELLE NUMERIQUE sur les 7 jours (cyan)
        if (rowIdx === 10) {
          return { text: 'SENTINELLE\nNUMÉRIQUE', bg: '#22d3ee', color: '#082f49', bold: true };
        }
        // 19H30 A 21H30
        if (rowIdx === 11) {
          if (colIdx <= 4) return { text: 'RÉSEAU', bg: '#f8fafc', color: '#0f172a', bold: true };
          return { text: 'SÉCURITÉ\nSYSTÈME\nINFO', bg: '#f8fafc', color: '#0f172a', bold: true };
        }
        // 21H30 A 22H30
        if (rowIdx === 12) {
          if (colIdx <= 4) return { text: 'CODEZ\nC++', bg: '#f8fafc', color: '#0f172a', bold: true };
          return { text: 'GESTION\nINCIDENT\nSÉCURITÉ', bg: '#f8fafc', color: '#0f172a', bold: true };
        }
        // 22H30 A 23H00 -> MEDITATION sur les 7 jours (vert émeraude)
        if (rowIdx === 13) {
          return { text: 'MÉDITATION', bg: '#4ade80', color: '#064e3b', bold: true };
        }
        // 23H30 A 02H00 -> repos
        return { text: '—//—', bg: '#ffffff', color: '#64748b', bold: false };
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
