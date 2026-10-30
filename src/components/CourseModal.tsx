import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, Copy, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { CourseEntry, CourseTask } from '../types';
import { timeToMinutes } from '../lib/courseLayout';

export interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: CourseEntry) => void;
  onDelete?: (courseId: string) => void;
  onDuplicate?: (course: CourseEntry) => void;
  initialCourse?: Partial<CourseEntry> | null;
  boardId: string;
  existingCourses?: CourseEntry[];
}

const BADGE_COLORS = [
  { hex: '#4A90E2', name: 'Bleu' },
  { hex: '#50E3C2', name: 'Turquoise' },
  { hex: '#F5A623', name: 'Orange' },
  { hex: '#E91E63', name: 'Rose' },
  { hex: '#9B51E0', name: 'Violet' },
  { hex: '#7ED321', name: 'Vert' },
  { hex: '#F8E71C', name: 'Jaune' },
  { hex: '#D0021B', name: 'Rouge' },
  { hex: '#607D8B', name: 'Ardoise' },
];

const DAYS = [
  { index: 0, label: 'Lundi' },
  { index: 1, label: 'Mardi' },
  { index: 2, label: 'Mercredi' },
  { index: 3, label: 'Jeudi' },
  { index: 4, label: 'Vendredi' },
  { index: 5, label: 'Samedi' },
];

const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let h = 8; h <= 19; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 19 && m > 0) break;
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  initialCourse,
  boardId,
  existingCourses = []
}) => {
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [professor, setProfessor] = useState('');
  const [dayIndex, setDayIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState('#4A90E2');
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState<CourseTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [showTasksSection, setShowTasksSection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!initialCourse?.id;

  useEffect(() => {
    if (isOpen) {
      setTitle(initialCourse?.title || '');
      setRoom(initialCourse?.room || '');
      setProfessor(initialCourse?.professor || '');
      setDayIndex(initialCourse?.dayIndex ?? 0);
      setStartTime(initialCourse?.startTime || '08:00');
      setEndTime(initialCourse?.endTime || '10:00');
      setColor(initialCourse?.color || '#4A90E2');
      setNotes(initialCourse?.notes || '');
      setTasks(initialCourse?.tasks ? [...initialCourse.tasks] : []);
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setShowTasksSection(Boolean(initialCourse?.tasks && initialCourse.tasks.length > 0));
      setError(null);
    }
  }, [isOpen, initialCourse]);

  if (!isOpen) return null;

  // Détection en direct des conflits de créneau
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  const overlappingCourse = existingCourses.find((c) => {
    if (c.id === initialCourse?.id) return false;
    if (c.dayIndex !== dayIndex) return false;
    const cStart = timeToMinutes(c.startTime);
    const cEnd = timeToMinutes(c.endTime);
    return startMin < cEnd && endMin > cStart;
  });

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: CourseTask = {
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate || undefined,
      isCompleted: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskDueDate('');
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Veuillez renseigner l'intitulé de la matière.");
      return;
    }

    if (endMin <= startMin) {
      setError("L'heure de fin doit être strictement supérieure à l'heure de début.");
      return;
    }

    const courseToSave: CourseEntry = {
      id: initialCourse?.id || 'course_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      board_id: boardId,
      dayIndex,
      title: title.trim(),
      room: room.trim() || undefined,
      professor: professor.trim() || undefined,
      startTime,
      endTime,
      color,
      notes: notes.trim() || undefined,
      tasks: tasks.length > 0 ? tasks : undefined
    };

    onSave(courseToSave);
    onClose();
  };

  const handleDelete = () => {
    if (initialCourse?.id && onDelete) {
      if (confirm('Voulez-vous vraiment supprimer ce cours ?')) {
        onDelete(initialCourse.id);
        onClose();
      }
    }
  };

  const handleDuplicate = () => {
    if (!title.trim()) return;
    const duplicated: CourseEntry = {
      id: 'course_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      board_id: boardId,
      dayIndex: (dayIndex + 1) % 6, // Propose le jour suivant
      title: title.trim(),
      room: room.trim() || undefined,
      professor: professor.trim() || undefined,
      startTime,
      endTime,
      color,
      notes: notes.trim() || undefined,
      tasks: tasks.length > 0 ? tasks.map(t => ({ ...t, id: 'task_' + Math.random().toString(36).substring(2, 9), isCompleted: false })) : undefined
    };

    if (onDuplicate) {
      onDuplicate(duplicated);
      onClose();
    } else {
      onSave(duplicated);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(5px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-[500px] bg-white text-gray-900 rounded-[22px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        style={{ 
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          maxHeight: '92vh'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
            <h2 className="text-lg font-bold text-gray-800">
              {isEditMode ? 'Modifier le cours' : 'Nouveau cours'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {overlappingCourse && (
            <div className="p-3 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Attention, chevauchement d'horaire :</strong>
                <p className="mt-0.5 text-[11px] text-amber-700">
                  Ce créneau chevauche le cours de <strong>{overlappingCourse.title}</strong> ({overlappingCourse.startTime} - {overlappingCourse.endTime}). Les cartes seront juxtaposées côte à côte.
                </p>
              </div>
            </div>
          )}

          {/* 1. MATIÈRE / INTITULÉ */}
          <div>
            <label className="block text-[11px] font-semibold text-[#49454f] uppercase tracking-[0.5px] mb-1.5">
              MATIÈRE / INTITULÉ *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex: Mathématiques, Algorithmique..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl transition-all duration-150 outline-none focus:border-[#6200ee] focus:ring-2 focus:ring-[#6200ee]/15 text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* 2. SALLE & PROFESSEUR */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#49454f] uppercase tracking-[0.5px] mb-1.5">
                SALLE
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ex: Amphi 1, Salle 102"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl transition-all duration-150 outline-none focus:border-[#6200ee] focus:ring-2 focus:ring-[#6200ee]/15 text-gray-900 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#49454f] uppercase tracking-[0.5px] mb-1.5">
                PROFESSEUR
              </label>
              <input
                type="text"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                placeholder="Ex: M. Martin, Mme. Dupont"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl transition-all duration-150 outline-none focus:border-[#6200ee] focus:ring-2 focus:ring-[#6200ee]/15 text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* 3. JOUR DE LA SEMAINE */}
          <div>
            <label className="block text-[11px] font-semibold text-[#49454f] uppercase tracking-[0.5px] mb-1.5">
              JOUR DE LA SEMAINE
            </label>
            <select
              value={dayIndex}
              onChange={(e) => setDayIndex(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl transition-all duration-150 outline-none focus:border-[#6200ee] focus:ring-2 focus:ring-[#6200ee]/15 text-gray-900"
            >
              {DAYS.map((d) => (
                <option key={d.index} value={d.index}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. HEURE DÉBUT & HEURE FIN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#49454f] uppercase tracking-[0.5px] mb-1.5">
                HEURE DÉBUT
              </label>
              <select
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl transition-all duration-150 outline-none focus:border-[#6200ee] focus:ring-2 focus:ring-[#6200ee]/15 text-gray-900"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#49454f] uppercase tracking-[0.5px] mb-1.5">
                HEURE FIN
              </label>
              <select
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl transition-all duration-150 outline-none focus:border-[#6200ee] focus:ring-2 focus:ring-[#6200ee]/15 text-gray-900"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. COULEUR DU BADGE (9 pastilles de 32px) */}
          <div>
            <label className="block text-[11px] font-semibold text-[#49454f] uppercase tracking-[0.5px] mb-2">
              COULEUR DU BADGE
            </label>
            <div className="flex items-center gap-2.5 flex-wrap py-1">
              {BADGE_COLORS.map((bc) => {
                const isSelected = color.toLowerCase() === bc.hex.toLowerCase();
                return (
                  <button
                    key={bc.hex}
                    type="button"
                    onClick={() => setColor(bc.hex)}
                    title={bc.name}
                    aria-label={bc.name}
                    style={{
                      backgroundColor: bc.hex,
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                      border: isSelected ? '2px solid #000000' : '2px solid transparent',
                      boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.25)' : 'none'
                    }}
                    className="w-8 h-8 rounded-full transition-transform duration-150 flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95"
                  >
                    {isSelected && <Check size={16} color="#ffffff" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. SECTION DEVOIRS & TÂCHES ASSOCIÉS */}
          <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#49454f] uppercase tracking-[0.5px]">
                📝 DEVOIRS & EXAMENS ({tasks.length})
              </span>
              <button
                type="button"
                onClick={() => setShowTasksSection(!showTasksSection)}
                className="text-xs font-semibold text-[#6200ee] hover:underline"
              >
                {showTasksSection ? 'Masquer' : '+ Gérer les devoirs'}
              </button>
            </div>

            {showTasksSection && (
              <div className="mt-3 space-y-2.5">
                {/* Formulaire ajout tâche */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Intitulé du devoir ou contrôle..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:border-[#6200ee]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTask();
                      }
                    }}
                  />
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:border-[#6200ee]"
                    title="Date limite"
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#6200ee] hover:bg-[#5300d6] rounded-lg"
                  >
                    Ajouter
                  </button>
                </div>

                {/* Liste des tâches */}
                {tasks.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 text-xs"
                      >
                        <div 
                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                          onClick={() => handleToggleTask(task.id)}
                        >
                          {task.isCompleted ? (
                            <CheckSquare size={16} className="text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Square size={16} className="text-gray-400 flex-shrink-0" />
                          )}
                          <span className={`truncate ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {task.title}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 flex-shrink-0">
                              📅 {task.dueDate}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 italic pt-1">
                    Aucun devoir associé à cette matière.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 7. REMARQUES / NOTES */}
          <div>
            <label className="block text-[11px] font-semibold text-[#49454f] uppercase tracking-[0.5px] mb-1.5">
              REMARQUES / NOTES
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Chapitre 3 : Intégrales, Devoir à rendre, etc."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl transition-all duration-150 outline-none focus:border-[#6200ee] focus:ring-2 focus:ring-[#6200ee]/15 text-gray-900 placeholder-gray-400 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {isEditMode && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-2 text-xs font-semibold rounded-xl text-[#d32f2f] bg-[#ffebee] hover:bg-red-100 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Supprimer</span>
                </button>
              )}
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="px-3 py-2 text-xs font-semibold rounded-xl text-[#6200ee] bg-[#f3e8ff] hover:bg-[#ebd5ff] transition-colors flex items-center gap-1.5"
                  title="Dupliquer vers le jour suivant"
                >
                  <Copy size={14} />
                  <span>Dupliquer</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-[#6200ee] hover:bg-[#5300d6] active:bg-[#4700b8] rounded-xl shadow-md transition-all duration-150 hover:shadow-lg"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
