import React, { useState, useEffect } from 'react';
import { X, Trash2, Check } from 'lucide-react';
import { CourseEntry } from '../types';

export interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: CourseEntry) => void;
  onDelete?: (courseId: string) => void;
  initialCourse?: Partial<CourseEntry> | null;
  boardId: string;
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

// Génère les créneaux par pas de 15 min de 08:00 à 19:00
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
  initialCourse,
  boardId
}) => {
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [professor, setProfessor] = useState('');
  const [dayIndex, setDayIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState('#4A90E2');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen, initialCourse]);

  if (!isOpen) return null;

  // Calcul minutes pour vérification
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Veuillez renseigner l'intitulé de la matière.");
      return;
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-[480px] bg-white text-gray-900 rounded-[20px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        style={{ 
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {isEditMode ? 'Modifier le cours' : 'Nouveau cours'}
          </h2>
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
            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
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

          {/* 6. REMARQUES / NOTES */}
          <div>
            <label className="block text-[11px] font-semibold text-[#49454f] uppercase tracking-[0.5px] mb-1.5">
              REMARQUES / NOTES
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Chapitre 3 : Intégrales, Devoir à rendre, etc."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl transition-all duration-150 outline-none focus:border-[#6200ee] focus:ring-2 focus:ring-[#6200ee]/15 text-gray-900 placeholder-gray-400 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              {isEditMode && onDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl text-[#d32f2f] bg-[#ffebee] hover:bg-red-100 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Supprimer</span>
                </button>
              ) : <div />}
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
