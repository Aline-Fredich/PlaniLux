import { Board, BoardShare, UserProfile, TemplateType, BoardAxis, BoardCell } from '../types';
import { TEMPLATES_CATALOG } from '../templates/defaultTemplates';
import { getCurrentUser } from './authService';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export type SaveStatus = 'saved' | 'saving' | 'offline' | 'error';

// Cache en mémoire volatile de session (aucune persistance métier en localStorage)
let memoryBoardsCache: Board[] = [];

/**
 * Récupère le profil de l'utilisateur actif
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
};

/**
 * SOURCE DE VÉRITÉ MÉTIER UNIQUE : SUPABASE
 * Charge les tableaux directement depuis la base de données PostgreSQL Supabase
 */
export const syncBoardsFromCloud = async (userId: string, includeDeleted = false): Promise<Board[]> => {
  if (!isSupabaseConfigured || !userId || userId === 'anonymous') {
    return includeDeleted ? memoryBoardsCache : memoryBoardsCache.filter(b => !b.deleted_at);
  }

  try {
    const query = supabase
      .from('planilux_boards')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lecture Supabase boards:', error.message);
      throw error;
    }

    if (data) {
      const cloudBoards: Board[] = data.map((row: any) => {
        const boardData = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
        return {
          ...boardData,
          id: row.id,
          owner_id: row.user_id,
          title: row.title,
          updated_at: row.updated_at
        };
      });

      // Mettre à jour le cache en mémoire vive
      memoryBoardsCache = cloudBoards;
      return includeDeleted ? cloudBoards : cloudBoards.filter(b => !b.deleted_at);
    }
  } catch (e) {
    console.error('Erreur de communication Supabase:', e);
    throw e;
  }

  return [];
};

/**
 * Récupère les tableaux actuellement chargés en mémoire
 */
export const getStoredBoards = (includeDeleted = false, _userId?: string): Board[] => {
  return includeDeleted ? memoryBoardsCache : memoryBoardsCache.filter(b => !b.deleted_at);
};

export const getBoardById = (id: string): Board | null => {
  return memoryBoardsCache.find(b => b.id === id) || null;
};

/**
 * Sauvegarde un tableau directement sur Supabase
 */
export const saveBoard = async (board: Board, userId?: string): Promise<Board> => {
  const uid = userId || board.owner_id || getCurrentUser()?.id || 'anonymous';
  const now = new Date().toISOString();

  const updated: Board = {
    ...board,
    owner_id: uid,
    version: (board.version || 1) + 1,
    updated_at: now
  };

  // Mise à jour immédiate du cache mémoire
  const existingIdx = memoryBoardsCache.findIndex(b => b.id === board.id);
  if (existingIdx >= 0) {
    memoryBoardsCache[existingIdx] = updated;
  } else {
    memoryBoardsCache.unshift(updated);
  }

  // Persistance obligatoire et confirmée sur Supabase
  if (!isSupabaseConfigured) {
    throw new Error('Supabase n\'est pas configuré.');
  }

  const { error } = await supabase.from('planilux_boards').upsert({
    id: updated.id,
    user_id: uid,
    title: updated.title,
    subtitle: updated.settings?.notes || '',
    orientation: 'portrait',
    theme: updated.settings?.themeColor || 'indigo',
    layout_type: updated.template_type || 'weekly-5d',
    data: updated,
    updated_at: updated.updated_at
  });

  if (error) {
    console.error('Erreur confirmation sauvegarde Supabase:', error.message);
    throw new Error(`Échec d'enregistrement Supabase: ${error.message}`);
  }

  return updated;
};

/**
 * Duplique un tableau sur Supabase
 */
export const duplicateBoard = async (sourceId: string, userId?: string): Promise<Board | null> => {
  const uid = userId || getCurrentUser()?.id || 'anonymous';
  const source = getBoardById(sourceId);
  if (!source) return null;

  const now = new Date().toISOString();
  const newBoardId = 'board_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

  // Nouveaux IDs pour les axes
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

  // Nouvelles cellules associées
  const newCells: BoardCell[] = source.cells.map(cell => ({
    ...cell,
    id: 'cell_' + Math.random().toString(36).substring(2, 9),
    board_id: newBoardId,
    row_axis_id: axisIdMap.get(cell.row_axis_id) || cell.row_axis_id,
    column_axis_id: axisIdMap.get(cell.column_axis_id) || cell.column_axis_id
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

  return await saveBoard(copy, uid);
};

/**
 * Suppression douce (marquage corbeille sur Supabase)
 */
export const softDeleteBoard = async (id: string, userId?: string): Promise<void> => {
  const target = getBoardById(id);
  if (!target) return;

  const uid = userId || target.owner_id || getCurrentUser()?.id || 'anonymous';
  const updated: Board = {
    ...target,
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await saveBoard(updated, uid);
};

/**
 * Restauration depuis la corbeille sur Supabase
 */
export const restoreBoard = async (id: string, userId?: string): Promise<void> => {
  const target = getBoardById(id);
  if (!target) return;

  const uid = userId || target.owner_id || getCurrentUser()?.id || 'anonymous';
  const updated: Board = {
    ...target,
    deleted_at: null,
    updated_at: new Date().toISOString()
  };

  await saveBoard(updated, uid);
};

/**
 * Suppression définitive irréversible sur Supabase
 */
export const permanentlyDeleteBoard = async (id: string, userId?: string): Promise<void> => {
  const uid = userId || getCurrentUser()?.id || 'anonymous';
  memoryBoardsCache = memoryBoardsCache.filter(b => b.id !== id);

  if (isSupabaseConfigured && uid !== 'anonymous') {
    const { error } = await supabase.from('planilux_boards').delete().eq('id', id);
    if (error) {
      console.error('Erreur suppression définitive Supabase:', error.message);
      throw error;
    }
  }
};

/**
 * Création à partir d'un modèle prédéfini sur Supabase
 */
export const createBoardFromTemplate = async (type: TemplateType, userId?: string): Promise<Board> => {
  const uid = userId || getCurrentUser()?.id || 'anonymous';
  const template = TEMPLATES_CATALOG.find(t => t.type === type) || TEMPLATES_CATALOG[0];
  const newBoard = template.createDefault(uid);
  return await saveBoard(newBoard, uid);
};

// Partages & Exportations
export const getBoardShares = (_boardId: string): BoardShare[] => {
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

  return {
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
};

export const revokeBoardShare = (_shareId: string): void => {};

export const exportAllDataAsJSON = (): string => {
  const current = getCurrentUser();
  const data = {
    user: current,
    profile: getStoredProfile(),
    boards: memoryBoardsCache,
    exported_at: new Date().toISOString(),
    version: '2.0.0-supabase'
  };
  return JSON.stringify(data, null, 2);
};

export const importDataFromJSON = async (jsonString: string): Promise<boolean> => {
  try {
    const parsed = JSON.parse(jsonString);
    const uid = getCurrentUser()?.id;
    if (parsed.boards && Array.isArray(parsed.boards) && uid) {
      for (const b of parsed.boards) {
        await saveBoard(b, uid);
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('Erreur import JSON:', e);
    return false;
  }
};
