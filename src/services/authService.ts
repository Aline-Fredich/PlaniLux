import { UserAccount } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const USERS_DB_KEY = 'planilux_users_db_v1';
const SESSION_KEY = 'planilux_current_session_v1';

/**
 * Récupère tous les utilisateurs enregistrés
 */
export const getAllUsers = (): UserAccount[] => {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erreur lecture base utilisateurs', e);
  }
  return [];
};

/**
 * Sauvegarde la liste des utilisateurs
 */
const saveUsers = (users: UserAccount[]): void => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

/**
 * Récupère l'utilisateur actuellement connecté
 */
export const getCurrentUser = (): UserAccount | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erreur session utilisateur', e);
  }
  return null;
};

/**
 * Définit la session active
 */
export const setSession = (user: UserAccount | null): void => {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

/**
 * Inscription d'un nouvel utilisateur
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export const registerUser = (data: RegisterData): { success: boolean; user?: UserAccount; error?: string } => {
  const users = getAllUsers();
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanUsername = data.username.trim();

  if (!cleanUsername) return { success: false, error: "Veuillez renseigner votre nom d'utilisateur." };
  if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, error: "Veuillez renseigner une adresse e-mail valide." };
  if (!data.password || data.password.length < 4) return { success: false, error: "Le mot de passe doit comporter au moins 4 caractères." };
  if (!data.phone.trim()) return { success: false, error: "Veuillez renseigner votre numéro de téléphone." };
  if (!data.address.trim()) return { success: false, error: "Veuillez renseigner votre adresse." };

  const now = new Date().toISOString();
  const newUser: UserAccount = {
    id: 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
    username: cleanUsername,
    email: cleanEmail,
    password: data.password,
    phone: data.phone.trim(),
    address: data.address.trim(),
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    created_at: now,
    updated_at: now
  };

  users.push(newUser);
  saveUsers(users);
  setSession(newUser);
  return { success: true, user: newUser };
};

/**
 * Inscription asynchrone DIRECTE dans la base de données Supabase
 */
export const registerUserAsync = async (data: RegisterData): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanUsername = data.username.trim();

  if (!cleanUsername) return { success: false, error: "Veuillez renseigner votre nom d'utilisateur." };
  if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, error: "Veuillez renseigner une adresse e-mail valide." };
  if (!data.password || data.password.length < 4) return { success: false, error: "Le mot de passe doit comporter au moins 4 caractères." };
  if (!data.phone.trim()) return { success: false, error: "Veuillez renseigner votre numéro de téléphone." };
  if (!data.address.trim()) return { success: false, error: "Veuillez renseigner votre adresse." };

  const now = new Date().toISOString();
  const newUser: UserAccount = {
    id: 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
    username: cleanUsername,
    email: cleanEmail,
    password: data.password,
    phone: data.phone.trim(),
    address: data.address.trim(),
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    created_at: now,
    updated_at: now
  };

  // Enregistrement direct dans Supabase
  if (isSupabaseConfigured) {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('planilux_users')
        .select('id, email, username')
        .or(`email.ilike.${cleanEmail},username.ilike.${cleanUsername}`);

      if (checkError) {
        console.warn('Supabase check error:', checkError.message);
      } else if (existing && existing.length > 0) {
        if (existing.some(u => u.email.toLowerCase() === cleanEmail)) {
          return { success: false, error: "Cette adresse e-mail est déjà associée à un compte dans la base Supabase." };
        }
        return { success: false, error: "Ce nom d'utilisateur est déjà utilisé." };
      }

      const { error: insertError } = await supabase
        .from('planilux_users')
        .insert({
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          password_hash: newUser.password,
          phone: newUser.phone,
          address: newUser.address,
          locale: newUser.locale,
          timezone: newUser.timezone,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at
        });

      if (insertError) {
        console.error('Erreur insertion Supabase:', insertError);
        return { success: false, error: "Erreur Supabase : " + insertError.message };
      }
    } catch (err: any) {
      console.warn('Connexion Supabase instable lors de l\'inscription:', err.message);
    }
  }

  // Mettre à jour la session active
  setSession(newUser);
  return { success: true, user: newUser };
};

/**
 * Connexion d'un utilisateur existant (fallback synchrone)
 */
export const loginUser = (identifier: string, password: string): { success: boolean; user?: UserAccount; error?: string } => {
  const users = getAllUsers();
  const cleanId = identifier.trim().toLowerCase();

  const found = users.find(
    u => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId
  );

  if (!found) {
    return { success: false, error: "Aucun compte trouvé avec cet identifiant ou adresse e-mail." };
  }

  if (found.password !== password) {
    return { success: false, error: "Mot de passe incorrect." };
  }

  setSession(found);
  return { success: true, user: found };
};

/**
 * Connexion asynchrone DIRECTE depuis la base de données Supabase
 */
export const loginUserAsync = async (identifier: string, password: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
  const cleanId = identifier.trim().toLowerCase();

  // 1. Requête DIRECTE dans Supabase en priorité absolue
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('planilux_users')
        .select('*')
        .or(`email.ilike.${cleanId},username.ilike.${cleanId}`)
        .limit(1);

      if (error) {
        console.warn('Erreur Supabase lors de la connexion:', error.message);
      } else if (data && data.length > 0) {
        const u = data[0];
        if (u.password_hash === password) {
          const userAccount: UserAccount = {
            id: u.id,
            username: u.username,
            email: u.email,
            password: u.password_hash,
            phone: u.phone || '',
            address: u.address || '',
            locale: u.locale || 'fr-FR',
            timezone: u.timezone || 'Europe/Paris',
            created_at: u.created_at,
            updated_at: u.updated_at
          };
          setSession(userAccount);
          return { success: true, user: userAccount };
        } else {
          return { success: false, error: "Mot de passe incorrect." };
        }
      } else {
        return { success: false, error: "Aucun compte trouvé avec cet identifiant ou adresse e-mail dans la base Supabase." };
      }
    } catch (e: any) {
      console.warn('Supabase indisponible, vérification locale:', e.message);
    }
  }

  return loginUser(identifier, password);
};



/**
 * Déconnexion
 */
export const logoutUser = (): void => {
  setSession(null);
};

/**
 * Mise à jour des informations de profil de l'utilisateur connecté
 */
export const updateCurrentUser = (partial: Partial<UserAccount>): UserAccount | null => {
  const current = getCurrentUser();
  if (!current) return null;

  const users = getAllUsers();
  const updatedUser: UserAccount = {
    ...current,
    ...partial,
    updated_at: new Date().toISOString()
  };

  const nextUsers = users.map(u => u.id === current.id ? updatedUser : u);
  saveUsers(nextUsers);
  setSession(updatedUser);

  return updatedUser;
};
