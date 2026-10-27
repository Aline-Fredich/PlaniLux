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

  if (!cleanUsername) {
    return { success: false, error: "Veuillez renseigner votre nom d'utilisateur." };
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: "Veuillez renseigner une adresse e-mail valide." };
  }
  if (!data.password || data.password.length < 4) {
    return { success: false, error: "Le mot de passe doit comporter au moins 4 caractères." };
  }
  if (!data.phone.trim()) {
    return { success: false, error: "Veuillez renseigner votre numéro de téléphone." };
  }
  if (!data.address.trim()) {
    return { success: false, error: "Veuillez renseigner votre adresse." };
  }

  // Vérifier si l'email existe déjà
  const existingEmail = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existingEmail) {
    return { success: false, error: "Cette adresse e-mail est déjà associée à un compte." };
  }

  // Vérifier si le nom d'utilisateur existe déjà
  const existingUsername = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (existingUsername) {
    return { success: false, error: "Ce nom d'utilisateur est déjà utilisé." };
  }

  const now = new Date().toISOString();
  const newUser: UserAccount = {
    id: 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
    username: cleanUsername,
    email: cleanEmail,
    password: data.password, // Stockage pour validation de session
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

  // Synchronisation avec la base Supabase
  if (isSupabaseConfigured) {
    supabase.from('planilux_users').insert({
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
    }).then(({ error }) => {
      if (error) console.warn('Supabase users sync info:', error.message);
    });
  }

  return { success: true, user: newUser };
};

/**
 * Connexion d'un utilisateur existant
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
 * Connexion asynchrone avec fallback cloud Supabase
 */
export const loginUserAsync = async (identifier: string, password: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
  const localRes = loginUser(identifier, password);
  if (localRes.success) return localRes;

  if (isSupabaseConfigured) {
    try {
      const cleanId = identifier.trim().toLowerCase();
      const { data, error } = await supabase
        .from('planilux_users')
        .select('*')
        .or(`email.ilike.${cleanId},username.ilike.${cleanId}`)
        .limit(1);

      if (!error && data && data.length > 0) {
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
          const users = getAllUsers();
          if (!users.some(ex => ex.id === userAccount.id)) {
            users.push(userAccount);
            saveUsers(users);
          }
          setSession(userAccount);
          return { success: true, user: userAccount };
        } else {
          return { success: false, error: "Mot de passe incorrect." };
        }
      }
    } catch (e) {
      console.warn('Supabase cloud fallback error:', e);
    }
  }

  return localRes;
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
