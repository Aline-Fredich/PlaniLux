export type TemplateType = 'timetable' | 'monthly' | 'weekly' | 'daily' | 'free';

export type AxisDirection = 'row' | 'column';

export type AxisKind = 'time_slot' | 'weekday' | 'date' | 'custom';

export type ItemStatus = 'todo' | 'in_progress' | 'done';

export type TextAlign = 'left' | 'center' | 'right';

export interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: TextAlign;
  fontSize?: number;
}

export interface BoardAxis {
  id: string;
  board_id: string;
  axis: AxisDirection;
  position: number;
  label: string;
  kind: AxisKind;
  start_time?: string; // Format 'HH:mm'
  end_time?: string;   // Format 'HH:mm' (support des créneaux traversant minuit)
  date_value?: string; // Format 'YYYY-MM-DD'
  size_px?: number;
  metadata?: Record<string, unknown>;
}

export interface CellItem {
  id: string;
  board_id: string;
  row_axis_id: string;
  column_axis_id: string;
  title: string;
  details?: string;
  starts_at?: string;
  ends_at?: string;
  status: ItemStatus;
  background_color?: string;
  text_color?: string;
  position: number;
}

export interface BoardCell {
  id: string;
  board_id: string;
  row_axis_id: string;
  column_axis_id: string;
  content: string;
  background_color?: string;
  text_color?: string;
  text_style?: TextStyle;
  items?: CellItem[];
}

export interface CourseTask {
  id: string;
  title: string;
  dueDate?: string;
  isCompleted: boolean;
}

export interface CourseEntry {
  id: string;
  board_id: string;
  dayIndex: number; // 0 = Lundi, 1 = Mardi, 2 = Mercredi, 3 = Jeudi, 4 = Vendredi, 5 = Samedi
  title: string;
  room?: string;
  professor?: string;
  startTime: string; // "08:00"
  endTime: string;   // "10:00"
  color: string;     // "#4A90E2"
  notes?: string;
  tasks?: CourseTask[]; // Tâches, devoirs & examens associés au cours
}

export type DensityLevel = 'normal' | 'compact' | 'ultra-compact' | 'micro';

export interface BoardSettings {
  showGridLines?: boolean;
  firstDayOfWeek?: number; // 0 = Dimanche, 1 = Lundi
  slotDurationMinutes?: number;
  dayStartTime?: string;
  dayEndTime?: string;
  themeColor?: string;
  notes?: string;
  density?: DensityLevel;
  tableScaleOnly?: number;
  folderWidth?: number;
}

export interface Board {
  id: string;
  owner_id: string;
  title: string;
  template_type: TemplateType;
  settings: BoardSettings;
  timezone: string;
  week_starts_on: number;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  axes: BoardAxis[];
  cells: BoardCell[];
  courses?: CourseEntry[];
}

export interface BoardShare {
  id: string;
  board_id: string;
  token_hash: string;
  share_token: string;
  permission: 'view';
  expires_at?: string | null;
  revoked_at?: string | null;
  allow_export: boolean;
  created_at: string;
}

export type ExportTargetFormat = 'A4' | 'Letter' | 'phone_wallpaper' | 'desktop_wallpaper' | 'tablet';
export type GridDensity = 'compact' | 'normal' | 'spacious';
export type WallpaperTheme = 'dark' | 'light' | 'midnight' | 'emerald' | 'slate';

export type DocumentFont = 'sans' | 'serif' | 'mono' | 'condensed';

export interface PrintSettings {
  format: ExportTargetFormat;
  orientation: 'portrait' | 'landscape';
  margins: 'normal' | 'compact' | 'none';
  fitMode: 'fit_width' | 'fit_page' | 'actual';
  repeatHeaders: boolean;
  showBorders: boolean;
  printColors: boolean;
  includeNotes: boolean;
  density: GridDensity;
  cellScale: number; // 30 à 150 (%)
  wallpaperTheme?: WallpaperTheme;

  // Personnalisation intégrale du document (titres, tables, polices, couleurs)
  customTitle?: string;
  customSubtitle?: string;
  fontFamily?: DocumentFont;
  fontSizeScale?: number; // 50 à 150 (%)
  headerBgColor?: string;
  headerTextColor?: string;
  borderColor?: string;
  tableScaleOnly?: number; // Réduction ciblée de la table seule (30 à 150 %)
  forcePureWhiteBg?: boolean; // Garantie fond blanc pur d'impression

  // Interrupteurs pour TOUT masquer ou afficher
  showLogo?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showDate?: boolean;
  showTimeCol?: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
  locale?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  display_name: string;
  email?: string;
  phone?: string;
  address?: string;
  locale: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}
