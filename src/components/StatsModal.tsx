import React from 'react';
import { X, Clock, BookOpen } from 'lucide-react';
import { CourseEntry } from '../types';
import { calculateWeeklyStats } from '../lib/courseLayout';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseEntry[];
  boardTitle: string;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  courses,
  boardTitle
}) => {
  if (!isOpen) return null;

  const stats = calculateWeeklyStats(courses);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[var(--bg-glass-card)] border border-[var(--glass-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--glass-border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Statistiques & Volume Horaire
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {boardTitle} • {stats.totalCoursesCount} cours planifiés
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost btn-icon p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 space-y-6">
          {/* Cartes d'indicateurs clés */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--bg-secondary)]/50 flex flex-col">
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Volume Total
              </span>
              <span className="text-xl font-extrabold text-[var(--primary)] mt-1">
                {stats.formattedTotal}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5">sur la semaine</span>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--bg-secondary)]/50 flex flex-col">
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Moyenne / Jour
              </span>
              <span className="text-xl font-extrabold text-[var(--text-primary)] mt-1">
                {Math.floor(stats.averageMinutesPerDay / 60)}h{(stats.averageMinutesPerDay % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5">sur 5 jours ouvrés</span>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--bg-secondary)]/50 flex flex-col">
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Jour le + Chargé
              </span>
              <span className="text-lg font-extrabold text-[var(--text-primary)] mt-1 truncate">
                {stats.busiestDayLabel}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5">pic d'intensité</span>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--bg-secondary)]/50 flex flex-col">
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Devoirs & Tâches
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-extrabold text-emerald-500">
                  {stats.tasksCompleted}
                </span>
                <span className="text-xs text-[var(--text-muted)]">/ {stats.tasksTotal}</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {stats.tasksPending > 0 ? `${stats.tasksPending} en attente` : 'Tout est à jour !'}
              </span>
            </div>
          </div>

          {/* Répartition par matière */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <BookOpen size={16} className="text-[var(--primary)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Répartition par Matière
                </h3>
              </div>
              <span className="text-xs text-[var(--text-muted)] font-medium">
                {stats.subjects.length} disciplines
              </span>
            </div>

            {stats.subjects.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--glass-border-subtle)] rounded-xl">
                Aucun cours planifié pour le moment.
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.subjects.map((subj) => (
                  <div
                    key={subj.title}
                    className="p-3 rounded-xl border border-[var(--glass-border-subtle)] bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/60 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: subj.color }}
                        />
                        <span className="text-[var(--text-primary)] capitalize">
                          {subj.title}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-normal">
                          ({subj.sessionsCount} séance{subj.sessionsCount > 1 ? 's' : ''})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-primary)] font-mono">
                          {subj.formattedDuration}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                          {subj.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(4, subj.percentage)}%`,
                          backgroundColor: subj.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pied de page */}
        <div className="p-4 border-t border-[var(--glass-border-subtle)] bg-[var(--bg-secondary)]/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary px-5 py-2 text-xs font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
