import { Board, BoardShare, UserProfile, TemplateType, BoardAxis, BoardCell } from '../types';
import { TEMPLATES_CATALOG } from '../templates/defaultTemplates';
import { getCurrentUser } from './authService';

const SHARES_STORAGE_KEY = 'planilux_shares_v1';

export type SaveStatus = 'saved' | 'saving' | 'offline' | 'error';

/**
 * Clé de stockage cloisonnée et strictement étanche pour chaque utilisateur
 */
const getBoardsKey = (userId?: string): string => {
  const uid = userId || getCurrentUser()?.id || 'anonymous';
  return `planilux_boards_user_${uid}`;
};

/**
 * Récupère le profil de l'utilisateur actuellement connecté
 */
export const getStoredProfile = (): UserProfile => {
  const current = getCurrentUser();
  if (current) {
    return {
      id: current.id,
      display_name: current.username,
      email: current.email,
      phone: current.phone,
      address: current.address,
      locale: current.locale || 'fr-FR',
      timezone: current.timezone || 'Europe/Paris',
      created_at: current.created_at,
      updated_at: current.updated_at
    };
  }
  return {
    id: 'guest',
    display_name: 'Utilisateur',
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

export const saveProfile = (profile: UserProfile): void => {
  profile.updated_at = new Date().toISOString();
  // Les modifications sont gérées par authService pour l'utilisateur actif
};

/**
 * Récupère les tableaux de l'utilisateur actif
 * L'espace de travail est 100% VIERGE à la création du compte (aucune fausse démo codée en dur)
 */
export const getStoredBoards = (includeDeleted = false, userId?: string): Board[] => {
  const key = getBoardsKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const all: Board[] = JSON.parse(raw);
      return includeDeleted ? all : all.filter(b => !b.deleted_at);
    }
  } catch (e) {
    console.error('Erreur lecture tableaux utilisateur', e);
  }

  // Nouvel utilisateur : espace vierge garanti
  return [];
};

export const getBoardById = (id: string, userId?: string): Board | null => {
  const boards = getStoredBoards(true, userId);
  return boards.find(b => b.id === id) || null;
};

export const saveBoard = (board: Board, userId?: string): Board => {
  const uid = userId || board.owner_id || getCurrentUser()?.id || 'anonymous';
  const key = getBoardsKey(uid);
  const all = getStoredBoards(true, uid);
  const now = new Date().toISOString();
  const existingIdx = all.findIndex(b => b.id === board.id);

  const updated: Board = {
    ...board,
    owner_id: uid,
    version: (board.version || 1) + 1,
    updated_at: now
  };

  if (existingIdx >= 0) {
    all[existingIdx] = updated;
  } else {
    all.unshift(updated);
  }

  localStorage.setItem(key, JSON.stringify(all));
  return updated;
};

export const duplicateBoard = (sourceId: string, userId?: string): Board | null => {
  const uid = userId || getCurrentUser()?.id || 'anonymous';
  const source = getBoardById(sourceId, uid);
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
    owner_id: uid,
    title: `${source.title} (Copie)`,
    version: 1,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    axes: newAxes,
    cells: newCells
  };

  const key = getBoardsKey(uid);
  const all = getStoredBoards(true, uid);
  all.unshift(copy);
  localStorage.setItem(key, JSON.stringify(all));
  return copy;
};

export const softDeleteBoard = (id: string, userId?: string): void => {
  const uid = userId || getCurrentUser()?.id || 'anonymous';
  const key = getBoardsKey(uid);
  const all = getStoredBoards(true, uid);
  const target = all.find(b => b.id === id);
  if (target) {
    target.deleted_at = new Date().toISOString();
    target.updated_at = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(all));
  }
};

export const restoreBoard = (id: string, userId?: string): void => {
  const uid = userId || getCurrentUser()?.id || 'anonymous';
  const key = getBoardsKey(uid);
  const all = getStoredBoards(true, uid);
  const target = all.find(b => b.id === id);
  if (target) {
    target.deleted_at = null;
    target.updated_at = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(all));
  }
};

export const permanentlyDeleteBoard = (id: string, userId?: string): void => {
  const uid = userId || getCurrentUser()?.id || 'anonymous';
  const key = getBoardsKey(uid);
  const all = getStoredBoards(true, uid);
  const remaining = all.filter(b => b.id !== id);
  localStorage.setItem(key, JSON.stringify(remaining));
};

export const createBoardFromTemplate = (type: TemplateType, userId?: string): Board => {
  const uid = userId || getCurrentUser()?.id || 'anonymous';
  const template = TEMPLATES_CATALOG.find(t => t.type === type) || TEMPLATES_CATALOG[0];
  const newBoard = template.createDefault(uid);
  return saveBoard(newBoard, uid);
};

export const getBoardShares = (boardId: string): BoardShare[] => {
  try {
    const raw = localStorage.getItem(SHARES_STORAGE_KEY);
    if (raw) {
      const shares: BoardShare[] = JSON.parse(raw);
      return shares.filter(s => s.board_id === boardId && !s.revoked_at);
    }
  } catch (e) {
    console.error('Error reading shares', e);
  }
  return [];
};

export const createBoardShare = (boardId: string, allowExport = true, expirationDays?: number): BoardShare => {
  const shareToken = 'shr_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
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

// Export et Import JSON de l'ensemble des données de l'utilisateur actif
export const exportAllDataAsJSON = (): string => {
  const current = getCurrentUser();
  const uid = current?.id || 'anonymous';
  const data = {
    user: current,
    profile: getStoredProfile(),
    boards: getStoredBoards(true, uid),
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
    const uid = getCurrentUser()?.id || 'anonymous';
    const key = getBoardsKey(uid);
    if (parsed.boards && Array.isArray(parsed.boards)) {
      localStorage.setItem(key, JSON.stringify(parsed.boards));
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
