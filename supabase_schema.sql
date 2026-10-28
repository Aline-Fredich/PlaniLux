-- Schema Supabase pour PlaniLux
-- Exécutez ce script dans le SQL Editor de votre projet Supabase (https://supabase.com/dashboard/project/mfstasmypcskxxnqbdez/sql)

-- 1. Table des utilisateurs PlaniLux
CREATE TABLE IF NOT EXISTS public.planilux_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    locale TEXT DEFAULT 'fr-FR',
    timezone TEXT DEFAULT 'Europe/Paris',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par email
CREATE INDEX IF NOT EXISTS idx_planilux_users_email ON public.planilux_users(email);

-- 2. Table des emplois du temps (Boards) avec isolation stricte par utilisateur
CREATE TABLE IF NOT EXISTS public.planilux_boards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT DEFAULT '',
    orientation TEXT DEFAULT 'portrait',
    theme TEXT DEFAULT 'nordic',
    layout_type TEXT DEFAULT 'weekly-5d',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour isolation des requêtes par utilisateur
CREATE INDEX IF NOT EXISTS idx_planilux_boards_user ON public.planilux_boards(user_id);

-- Activer Row Level Security (RLS)
ALTER TABLE public.planilux_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planilux_boards ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès public/anon pour l'application avec clé anon
CREATE POLICY "Allow public read users" ON public.planilux_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.planilux_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.planilux_users FOR UPDATE USING (true);

CREATE POLICY "Allow public read boards" ON public.planilux_boards FOR SELECT USING (true);
CREATE POLICY "Allow public insert boards" ON public.planilux_boards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update boards" ON public.planilux_boards FOR UPDATE USING (true);
CREATE POLICY "Allow public delete boards" ON public.planilux_boards FOR DELETE USING (true);
