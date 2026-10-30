import { CourseEntry } from '../types';

/**
 * Utilitaires pour le calcul d'horaires, la détection des chevauchements/conflits
 * et la disposition en sous-colonnes (style Google Agenda / Apple Calendar)
 */

export const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Vérifie si deux cours se chevauchent dans le temps
 */
export const doCoursesOverlap = (c1: CourseEntry, c2: CourseEntry): boolean => {
  if (c1.dayIndex !== c2.dayIndex) return false;
  const start1 = timeToMinutes(c1.startTime);
  const end1 = timeToMinutes(c1.endTime);
  const start2 = timeToMinutes(c2.startTime);
  const end2 = timeToMinutes(c2.endTime);

  return start1 < end2 && start2 < end1;
};

export interface CoursePositioning {
  colIndex: number;
  totalCols: number;
  hasConflict: boolean;
}

/**
 * Calcule pour chaque cours d'un jour donné sa sous-colonne et la largeur relative
 * pour éviter que des cours superposés ne se masquent mutuellement.
 */
export const computeDayCourseLayouts = (
  dayCourses: CourseEntry[]
): Map<string, CoursePositioning> => {
  const result = new Map<string, CoursePositioning>();
  if (dayCourses.length === 0) return result;

  // Tri par heure de début, puis durée décroissante
  const sorted = [...dayCourses].sort((a, b) => {
    const diff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    if (diff !== 0) return diff;
    return (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)) - 
           (timeToMinutes(a.endTime) - timeToMinutes(a.startTime));
  });

  // Détection des composantes connexes (groupes de cours qui se chevauchent)
  const clusters: CourseEntry[][] = [];
  let currentCluster: CourseEntry[] = [];
  let clusterEnd = -1;

  for (const course of sorted) {
    const start = timeToMinutes(course.startTime);
    const end = timeToMinutes(course.endTime);

    if (currentCluster.length === 0 || start < clusterEnd) {
      currentCluster.push(course);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      clusters.push(currentCluster);
      currentCluster = [course];
      clusterEnd = end;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Attribution des sous-colonnes dans chaque cluster
  for (const cluster of clusters) {
    const hasConflict = cluster.length > 1;
    // Pistes de colonnes (stocke l'heure de fin de la dernière réservation de cette colonne)
    const columnEnds: number[] = [];
    const clusterPositions = new Map<string, number>();

    for (const course of cluster) {
      const start = timeToMinutes(course.startTime);
      const end = timeToMinutes(course.endTime);

      let placedCol = -1;
      for (let col = 0; col < columnEnds.length; col++) {
        if (columnEnds[col] <= start) {
          placedCol = col;
          columnEnds[col] = end;
          break;
        }
      }

      if (placedCol === -1) {
        placedCol = columnEnds.length;
        columnEnds.push(end);
      }

      clusterPositions.set(course.id, placedCol);
    }

    const totalCols = columnEnds.length;
    for (const course of cluster) {
      result.set(course.id, {
        colIndex: clusterPositions.get(course.id) || 0,
        totalCols,
        hasConflict
      });
    }
  }

  return result;
};

export interface SubjectStat {
  title: string;
  color: string;
  totalMinutes: number;
  formattedDuration: string;
  percentage: number;
  sessionsCount: number;
}

export interface WeeklyStats {
  totalMinutes: number;
  formattedTotal: string;
  totalCoursesCount: number;
  busiestDayIndex: number;
  busiestDayLabel: string;
  averageMinutesPerDay: number;
  subjects: SubjectStat[];
  tasksTotal: number;
  tasksCompleted: number;
  tasksPending: number;
}

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/**
 * Calcule l'ensemble des métriques d'apprentissage et de volume horaire
 */
export const calculateWeeklyStats = (courses: CourseEntry[] = []): WeeklyStats => {
  let totalMinutes = 0;
  const dayMinutes = [0, 0, 0, 0, 0, 0];
  const subjectMap = new Map<string, { color: string; minutes: number; count: number }>();
  let tasksTotal = 0;
  let tasksCompleted = 0;

  courses.forEach((course) => {
    const start = timeToMinutes(course.startTime);
    const end = timeToMinutes(course.endTime);
    const duration = Math.max(0, end - start);

    totalMinutes += duration;
    if (course.dayIndex >= 0 && course.dayIndex < 6) {
      dayMinutes[course.dayIndex] += duration;
    }

    const key = (course.title || 'Sans titre').trim().toLowerCase();
    const existing = subjectMap.get(key);
    if (existing) {
      existing.minutes += duration;
      existing.count += 1;
    } else {
      subjectMap.set(key, {
        color: course.color || '#4A90E2',
        minutes: duration,
        count: 1
      });
    }

    if (course.tasks) {
      tasksTotal += course.tasks.length;
      tasksCompleted += course.tasks.filter(t => t.isCompleted).length;
    }
  });

  // Trouver le jour le plus chargé
  let maxDayMin = -1;
  let busiestIdx = 0;
  dayMinutes.forEach((min, idx) => {
    if (min > maxDayMin) {
      maxDayMin = min;
      busiestIdx = idx;
    }
  });

  const subjects: SubjectStat[] = Array.from(subjectMap.entries()).map(([_, data]) => {
    const h = Math.floor(data.minutes / 60);
    const m = data.minutes % 60;
    const formatted = m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h00`;
    const percentage = totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0;

    return {
      title: _,
      color: data.color,
      totalMinutes: data.minutes,
      formattedDuration: formatted,
      percentage,
      sessionsCount: data.count
    };
  }).sort((a, b) => b.totalMinutes - a.totalMinutes);

  const totH = Math.floor(totalMinutes / 60);
  const totM = totalMinutes % 60;
  const formattedTotal = totM > 0 ? `${totH}h${totM.toString().padStart(2, '0')}` : `${totH}h00`;

  return {
    totalMinutes,
    formattedTotal,
    totalCoursesCount: courses.length,
    busiestDayIndex: busiestIdx,
    busiestDayLabel: DAY_LABELS[busiestIdx] || 'Lundi',
    averageMinutesPerDay: Math.round(totalMinutes / 5),
    subjects,
    tasksTotal,
    tasksCompleted,
    tasksPending: tasksTotal - tasksCompleted
  };
};
