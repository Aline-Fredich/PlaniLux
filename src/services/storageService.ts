import { Board, BoardShare, UserProfile, TemplateType, BoardAxis, BoardCell } from '../types';
import { TEMPLATES_CATALOG } from '../templates/defaultTemplates';

const BOARDS_STORAGE_KEY = 'planilux_boards_v1';
const SHARES_STORAGE_KEY = 'planilux_shares_v1';
const PROFILE_STORAGE_KEY = 'planilux_profile_v1';

export type SaveStatus = 'saved' | 'saving' | 'offline' | 'error';

export const getStoredProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse profile from localStorage', e);
  }
  const defaultProfile: UserProfile = {
    id: 'user_local_main',
    display_name: 'Alexandre Dupont',
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProfile));
  return defaultProfile;
};

export const saveProfile = (profile: UserProfile): void => {
  profile.updated_at = new Date().toISOString();
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
};

export const getStoredBoards = (includeDeleted = false): Board[] => {
  try {
    const raw = localStorage.getItem(BOARDS_STORAGE_KEY);
    if (raw) {
      const all: Board[] = JSON.parse(raw);
      return includeDeleted ? all : all.filter(b => !b.deleted_at);
    }
  } catch (e) {
    console.error('Error reading boards from storage', e);
  }

  // Si premier lancement, initialiser avec les modèles du catalogue
  const profile = getStoredProfile();
  const initialBoards: Board[] = TEMPLATES_CATALOG.map(t => t.createDefault(profile.id));
  localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(initialBoards));
  return includeDeleted ? initialBoards : initialBoards.filter(b => !b.deleted_at);
};

export const getBoardById = (id: string): Board | null => {
  const boards = getStoredBoards(true);
  return boards.find(b => b.id === id) || null;
};

export const saveBoard = (board: Board): Board => {
  const all = getStoredBoards(true);
  const now = new Date().toISOString();
  const existingIdx = all.findIndex(b => b.id === board.id);

  const updated: Board = {
    ...board,
    version: (board.version || 1) + 1,
    updated_at: now
  };

  if (existingIdx >= 0) {
    all[existingIdx] = updated;
  } else {
    all.unshift(updated);
  }

  localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(all));
  return updated;
};

export const duplicateBoard = (sourceId: string): Board | null => {
  const source = getBoardById(sourceId);
  if (!source) return null;

  const now = new Date().toISOString();
  const newBoardId = 'board_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

  // Mappage des anciens IDs d'axe vers les nouveaux
  const axisIdMap = new Map<string, string>();
  const newAxes: BoardAxis[] = source.axes.map(axis => {
    const newAxisId = 'axis_' + Math.random().toString(36).substring(2, 9);
    axisIdMap.set(axis.id, newAxisId);
    return {
      ...axis,
      id: newAxisId,
      board_id: newBoardId
    };
  });

  const newCells: BoardCell[] = source.cells.map(cell => ({
    ...cell,
    id: 'cell_' + Math.random().toString(36).substring(2, 9),
    board_id: newBoardId,
    row_axis_id: axisIdMap.get(cell.row_axis_id) || cell.row_axis_id,
    column_axis_id: axisIdMap.get(cell.column_axis_id) || cell.column_axis_id,
    items: cell.items?.map(it => ({
      ...it,
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      board_id: newBoardId,
      row_axis_id: axisIdMap.get(it.row_axis_id) || it.row_axis_id,
      column_axis_id: axisIdMap.get(it.column_axis_id) || it.column_axis_id
    }))
  }));

  const copy: Board = {
    ...source,
    id: newBoardId,
    title: `${source.title} (Copie)`,
    version: 1,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    axes: newAxes,
    cells: newCells
  };

  const all = getStoredBoards(true);
  all.unshift(copy);
  localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(all));
  return copy;
};

export const softDeleteBoard = (id: string): void => {
  const all = getStoredBoards(true);
  const target = all.find(b => b.id === id);
  if (target) {
    target.deleted_at = new Date().toISOString();
    target.updated_at = new Date().toISOString();
    localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(all));
  }
};

export const restoreBoard = (id: string): void => {
  const all = getStoredBoards(true);
  const target = all.find(b => b.id === id);
  if (target) {
    target.deleted_at = null;
    target.updated_at = new Date().toISOString();
    localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(all));
  }
};

export const permanentlyDeleteBoard = (id: string): void => {
  const all = getStoredBoards(true).filter(b => b.id !== id);
  localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(all));
};

export const createBoardFromTemplate = (templateType: TemplateType, customTitle?: string): Board => {
  const profile = getStoredProfile();
  const template = TEMPLATES_CATALOG.find(t => t.type === templateType) || TEMPLATES_CATALOG[0];
  const newBoard = template.createDefault(profile.id);
  if (customTitle && customTitle.trim()) {
    newBoard.title = customTitle.trim();
  }
  const all = getStoredBoards(true);
  all.unshift(newBoard);
  localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(all));
  return newBoard;
};

// Partage par lien (sécurité selon spécifications Section 7 et 8)
export const getBoardShares = (boardId: string): BoardShare[] => {
  try {
    const raw = localStorage.getItem(SHARES_STORAGE_KEY);
    if (!raw) return [];
    const shares: BoardShare[] = JSON.parse(raw);
    return shares.filter(s => s.board_id === boardId);
  } catch (e) {
    console.error('Error fetching shares', e);
    return [];
  }
};

export const createBoardShare = (boardId: string, allowExport = true, expirationDays?: number): BoardShare => {
  const shareToken = 'shr_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
  // Hash simulé pour la sécurité locale
  const tokenHash = btoa(shareToken).replace(/=/g, '');
  const now = new Date();
  
  let expiresAt: string | null = null;
  if (expirationDays && expirationDays > 0) {
    const exp = new Date(now.getTime() + expirationDays * 24 * 3600 * 1000);
    expiresAt = exp.toISOString();
  }

  const newShare: BoardShare = {
    id: 'sh_id_' + Math.random().toString(36).substring(2, 9),
    board_id: boardId,
    token_hash: tokenHash,
    share_token: shareToken,
    permission: 'view',
    allow_export: allowExport,
    created_at: now.toISOString(),
    expires_at: expiresAt,
    revoked_at: null
  };

  try {
    const raw = localStorage.getItem(SHARES_STORAGE_KEY);
    const shares: BoardShare[] = raw ? JSON.parse(raw) : [];
    shares.unshift(newShare);
    localStorage.setItem(SHARES_STORAGE_KEY, JSON.stringify(shares));
  } catch (e) {
    console.error('Error saving share', e);
  }

  return newShare;
};

export const revokeBoardShare = (shareId: string): void => {
  try {
    const raw = localStorage.getItem(SHARES_STORAGE_KEY);
    if (!raw) return;
    const shares: BoardShare[] = JSON.parse(raw);
    const target = shares.find(s => s.id === shareId);
    if (target) {
      target.revoked_at = new Date().toISOString();
      localStorage.setItem(SHARES_STORAGE_KEY, JSON.stringify(shares));
    }
  } catch (e) {
    console.error('Error revoking share', e);
  }
};

// Export et Import JSON de l'ensemble des données
export const exportAllDataAsJSON = (): string => {
  const data = {
    profile: getStoredProfile(),
    boards: getStoredBoards(true),
    shares: (() => {
      try {
        return JSON.parse(localStorage.getItem(SHARES_STORAGE_KEY) || '[]');
      } catch {
        return [];
      }
    })(),
    exported_at: new Date().toISOString(),
    version: '1.0.0'
  };
  return JSON.stringify(data, null, 2);
};

export const importDataFromJSON = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.boards && Array.isArray(parsed.boards)) {
      localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(parsed.boards));
    }
    if (parsed.profile) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(parsed.profile));
    }
    if (parsed.shares && Array.isArray(parsed.shares)) {
      localStorage.setItem(SHARES_STORAGE_KEY, JSON.stringify(parsed.shares));
    }
    return true;
  } catch (e) {
    console.error('Invalid backup file', e);
    return false;
  }
};
