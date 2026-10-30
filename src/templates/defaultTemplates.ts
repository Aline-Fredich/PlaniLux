import { Board, TemplateType, BoardAxis, BoardCell, CourseEntry } from '../types';

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

export const DEFAULT_INITIAL_COURSES = (boardId: string): CourseEntry[] => [
  {
    id: 'course_maths_' + boardId,
    board_id: boardId,
    dayIndex: 0, // Lundi
    title: 'Mathématiques',
    room: 'Amphi 1',
    professor: 'M. Martin',
    startTime: '08:00',
    endTime: '10:00',
    color: '#4A90E2',
    notes: 'Chapitre 3 : Intégrales'
  },
  {
    id: 'course_algo_' + boardId,
    board_id: boardId,
    dayIndex: 0, // Lundi
    title: 'Algorithmique',
    room: 'Salle 302',
    startTime: '10:15',
    endTime: '12:15',
    color: '#50E3C2'
  },
  {
    id: 'course_phys_' + boardId,
    board_id: boardId,
    dayIndex: 1, // Mardi
    title: 'Physique',
    room: 'Labo 4',
    startTime: '09:00',
    endTime: '11:00',
    color: '#9B51E0'
  },
  {
    id: 'course_anglais_' + boardId,
    board_id: boardId,
    dayIndex: 1, // Mardi
    title: 'Anglais',
    room: 'Salle 105',
    startTime: '14:00',
    endTime: '16:00',
    color: '#F5A623'
  },
  {
    id: 'course_reseaux_' + boardId,
    board_id: boardId,
    dayIndex: 4, // Vendredi
    title: 'Réseaux & Sécurité',
    room: 'Salle 210',
    startTime: '10:00',
    endTime: '12:00',
    color: '#D0021B'
  }
];

export const TEMPLATES_CATALOG: TemplateDefinition[] = [
  {
    type: 'timetable',
    title: 'Emploi du temps Universitaire & Scolaire',
    badge: 'Grille 08h - 19h',
    description: 'Planning hebdomadaire par créneaux continus de 08:00 à 19:00 avec cartes de cours colorées et précision au quart d’heure.',
    iconName: 'Clock',
    createDefault: (ownerId: string): Board => {
      const boardId = generateId();
      const days = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
      const hours = [
        '08:00 - 09:00',
        '09:00 - 10:00',
        '10:00 - 11:00',
        '11:00 - 12:00',
        '12:00 - 13:00',
        '13:00 - 14:00',
        '14:00 - 15:00',
        '15:00 - 16:00',
        '16:00 - 17:00',
        '17:00 - 18:00',
        '18:00 - 19:00'
      ];

      const colAxes: BoardAxis[] = days.map((day, idx) => ({
        id: generateId(),
        board_id: boardId,
        axis: 'column',
        position: idx,
        label: day,
        kind: 'weekday',
        size_px: 130
      }));

      const rowAxes: BoardAxis[] = hours.map((h, idx) => {
        const start = (8 + idx).toString().padStart(2, '0') + ':00';
        const end = (9 + idx).toString().padStart(2, '0') + ':00';
        return {
          id: generateId(),
          board_id: boardId,
          axis: 'row',
          position: idx,
          label: h,
          kind: 'time_slot',
          start_time: start,
          end_time: end,
          size_px: 64
        };
      });

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
        title: 'Emploi du Temps Hebdomadaire',
        template_type: 'timetable',
        settings: {
          showGridLines: true,
          firstDayOfWeek: 1,
          slotDurationMinutes: 60,
          themeColor: '#6200ee',
          notes: ''
        },
        timezone: 'Europe/Paris',
        week_starts_on: 1,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        axes: [...colAxes, ...rowAxes],
        cells,
        courses: DEFAULT_INITIAL_COURSES(boardId)
      };
    }
  },
  {
    type: 'monthly',
    title: 'Planificateur mensuel',
    badge: 'Vue d’ensemble',
    description: 'Calendrier mensuel pour jalonner vos échéances, livrables et objectifs majeurs.',
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
          cells.push({
            id: generateId(),
            board_id: boardId,
            row_axis_id: r.id,
            column_axis_id: c.id,
            content: currentDayNum ? `${currentDayNum}` : '',
            background_color: '#ffffff',
            text_color: '#1f2937',
            text_style: { align: 'left' }
          });
          if (currentDayNum) dayCounter++;
        }
      }

      return {
        id: boardId,
        owner_id: ownerId,
        title: 'Planification Mensuelle',
        template_type: 'monthly',
        settings: {
          showGridLines: true,
          firstDayOfWeek: 1,
          themeColor: '#8b5cf6',
          notes: ''
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
        'Priorités du jour',
        'Matinée (Focus & Projets)',
        'Après-midi (Actions & Rendez-vous)',
        'Soirée & Bilan'
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
          cells.push({
            id: generateId(),
            board_id: boardId,
            row_axis_id: r.id,
            column_axis_id: c.id,
            content: '',
            background_color: '#ffffff',
            text_color: '#1f2937',
            text_style: { align: 'left' }
          });
        }
      }

      return {
        id: boardId,
        owner_id: ownerId,
        title: 'Semainier — Organisation & Objectifs',
        template_type: 'weekly',
        settings: {
          showGridLines: true,
          firstDayOfWeek: 1,
          themeColor: '#10b981',
          notes: ''
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
        'Top Priorités',
        'Tâches secondaires',
        'Rendez-vous',
        'Notes du jour'
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
          cells.push({
            id: generateId(),
            board_id: boardId,
            row_axis_id: r.id,
            column_axis_id: c.id,
            content: '',
            background_color: '#ffffff',
            text_color: '#1f2937',
            text_style: { align: 'left' }
          });
        }
      }

      return {
        id: boardId,
        owner_id: ownerId,
        title: 'Planning Quotidien',
        template_type: 'daily',
        settings: {
          showGridLines: true,
          themeColor: '#f59e0b',
          notes: ''
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
          notes: ''
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
