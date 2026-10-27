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

export interface BoardSettings {
  showGridLines?: boolean;
  firstDayOfWeek?: number; // 0 = Dimanche, 1 = Lundi
  slotDurationMinutes?: number;
  dayStartTime?: string;
  dayEndTime?: string;
  themeColor?: string;
  notes?: string;
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
  cellScale: number; // 70 à 150 (%)
  wallpaperTheme?: WallpaperTheme;
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
