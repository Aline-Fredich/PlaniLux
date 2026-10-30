import { Board, CourseEntry } from '../types';

/**
 * Service pour l'import et l'export au format iCalendar (.ics) standard universel
 * Compatible Google Calendar, Apple Calendar, Microsoft Outlook, ENT / ADE Campus
 */

// Service pour l'import et l'export au format iCalendar (.ics) standard universel
// Compatible Google Calendar, Apple Calendar, Microsoft Outlook, ENT / ADE Campus

/**
 * Formate une date en chaîne UTC iCalendar : YYYYMMDDTHHMMSSZ
 */
const formatIcsDateTime = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Trouve la prochaine date pour un index de jour donné (0 = Lundi)
 */
const getNextDateForDay = (dayIndex: number): Date => {
  const now = new Date();
  const currentDay = (now.getDay() + 6) % 7; // Convertir Dimanche=0 en Lundi=0... Dimanche=6
  let diff = dayIndex - currentDay;
  if (diff < 0) {
    diff += 7;
  }
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);
  return targetDate;
};

/**
 * Exporte l'ensemble des cours d'un tableau au format standard RFC 5545 iCalendar (.ics)
 */
export const generateIcsContent = (board: Board): string => {
  const courses = board.courses || [];
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planilux//Emploi du Temps Scolaire//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${board.title || 'Emploi du Temps'}`,
    'X-WR-TIMEZONE:Europe/Paris'
  ];

  const nowStr = formatIcsDateTime(new Date());

  courses.forEach((course) => {
    const baseDate = getNextDateForDay(course.dayIndex);
    const [startH, startM] = course.startTime.split(':').map(Number);
    const [endH, endM] = course.endTime.split(':').map(Number);

    const startDate = new Date(baseDate);
    startDate.setHours(startH || 8, startM || 0, 0, 0);

    const endDate = new Date(baseDate);
    endDate.setHours(endH || 10, endM || 0, 0, 0);

    const uid = `${course.id || Math.random().toString(36).substring(2)}@planilux.app`;

    let description = '';
    if (course.professor) {
      description += `Professeur: ${course.professor}\\n`;
    }
    if (course.notes) {
      description += `Notes: ${course.notes}\\n`;
    }
    if (course.tasks && course.tasks.length > 0) {
      description += `Devoirs/Tâches:\\n`;
      course.tasks.forEach(t => {
        description += ` - [${t.isCompleted ? 'X' : ' '}] ${t.title}${t.dueDate ? ` (échéance: ${t.dueDate})` : ''}\\n`;
      });
    }

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowStr}`);
    lines.push(`DTSTART:${formatIcsDateTime(startDate)}`);
    lines.push(`DTEND:${formatIcsDateTime(endDate)}`);
    lines.push('RRULE:FREQ=WEEKLY');
    lines.push(`SUMMARY:${course.title || 'Cours'}`);
    if (course.room) {
      lines.push(`LOCATION:${course.room}`);
    }
    if (description) {
      lines.push(`DESCRIPTION:${description}`);
    }
    lines.push(`STATUS:CONFIRMED`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

/**
 * Télécharge directement le fichier .ics dans le navigateur
 */
export const downloadIcsFile = (board: Board): void => {
  const icsText = generateIcsContent(board);
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(board.title || 'emploi_du_temps').replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Couleurs par défaut à distribuer lors de l'import
const PALETTE_COLORS = [
  '#4A90E2', '#50E3C2', '#F5A623', '#E91E63', '#9B51E0',
  '#7ED321', '#F8E71C', '#D0021B', '#607D8B'
];

/**
 * Parse le contenu d'un fichier .ics (ADE Campus, Google Calendar, Outlook)
 * et le convertit en liste de CourseEntry pour PlaniLux
 */
export const parseIcsToCourses = (icsText: string, boardId: string): CourseEntry[] => {
  const courses: CourseEntry[] = [];
  const events = icsText.split(/BEGIN:VEVENT/i);

  // Pour donner la même couleur aux matières portant le même nom
  const subjectColorMap = new Map<string, string>();
  let colorIdx = 0;

  for (let i = 1; i < events.length; i++) {
    const block = events[i].split(/END:VEVENT/i)[0];
    if (!block) continue;

    // Extraction des champs
    const summaryMatch = block.match(/SUMMARY(?:;[^:]*)?:(.*?)(\r?\n[A-Z]|$)/s);
    const locationMatch = block.match(/LOCATION(?:;[^:]*)?:(.*?)(\r?\n[A-Z]|$)/s);
    const descriptionMatch = block.match(/DESCRIPTION(?:;[^:]*)?:(.*?)(\r?\n[A-Z]|$)/s);
    const dtstartMatch = block.match(/DTSTART(?:;[^:]*)?:([0-9TZ]+)/i);
    const dtendMatch = block.match(/DTEND(?:;[^:]*)?:([0-9TZ]+)/i);

    const title = summaryMatch ? summaryMatch[1].replace(/\\n/g, ' ').replace(/\\,/g, ',').trim() : 'Cours importé';
    const room = locationMatch ? locationMatch[1].replace(/\\n/g, ' ').replace(/\\,/g, ',').trim() : undefined;
    const description = descriptionMatch ? descriptionMatch[1].replace(/\\n/g, '\n').replace(/\\,/g, ',').trim() : undefined;

    let dayIndex = 0;
    let startTime = '08:00';
    let endTime = '10:00';

    if (dtstartMatch) {
      const val = dtstartMatch[1];
      // Format YYYYMMDDTHHMMSS ou YYYYMMDDTHHMMSSZ
      if (val.length >= 13) {
        const year = parseInt(val.substring(0, 4), 10);
        const month = parseInt(val.substring(4, 6), 10) - 1;
        const day = parseInt(val.substring(6, 8), 10);
        const hours = parseInt(val.substring(9, 11), 10);
        const mins = parseInt(val.substring(11, 13), 10);

        const date = new Date(Date.UTC(year, month, day, hours, mins));
        // Lundi = 0, Mardi = 1, ... Samedi = 5, Dimanche = 6
        const jsDay = date.getDay();
        dayIndex = (jsDay + 6) % 7;
        if (dayIndex > 5) dayIndex = 0; // Si dimanche, ramener sur lundi par précaution

        startTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      }
    }

    if (dtendMatch) {
      const val = dtendMatch[1];
      if (val.length >= 13) {
        const hours = parseInt(val.substring(9, 11), 10);
        const mins = parseInt(val.substring(11, 13), 10);
        endTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      }
    }

    // Assigner une couleur persistante par matière
    const normTitle = title.toLowerCase();
    if (!subjectColorMap.has(normTitle)) {
      subjectColorMap.set(normTitle, PALETTE_COLORS[colorIdx % PALETTE_COLORS.length]);
      colorIdx++;
    }
    const color = subjectColorMap.get(normTitle)!;

    courses.push({
      id: 'ics_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      board_id: boardId,
      dayIndex,
      title,
      room,
      professor: description ? description.split('\n')[0].substring(0, 50) : undefined,
      startTime,
      endTime,
      color,
      notes: description
    });
  }

  return courses;
};
