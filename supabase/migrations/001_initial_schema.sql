-- ============================================================================
-- Migration initiale Planilux conforme au Plan Directeur (Section 7)
-- Schéma PostgreSQL avec RLS, Contraintes & Triggers pour Supabase
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Types ENUM
DO $$ BEGIN
  CREATE TYPE template_type AS ENUM ('timetable', 'monthly', 'weekly', 'daily', 'free');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE axis_direction AS ENUM ('row', 'column');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE axis_kind AS ENUM ('time_slot', 'weekday', 'date', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE item_status AS ENUM ('todo', 'in_progress', 'done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('viewer', 'editor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Fonction trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  locale TEXT NOT NULL DEFAULT 'fr',
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. Table des tableaux (Boards)
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL CHECK (char_length(trim(title)) > 0),
  template_type template_type NOT NULL DEFAULT 'timetable',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  week_starts_on SMALLINT NOT NULL DEFAULT 1 CHECK (week_starts_on BETWEEN 0 AND 6),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_boards_owner_updated ON boards(owner_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_boards_owner_template ON boards(owner_id, template_type) WHERE deleted_at IS NULL;

CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. Table des axes (Lignes et Colonnes)
CREATE TABLE IF NOT EXISTS board_axes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  axis axis_direction NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  label TEXT NOT NULL,
  kind axis_kind NOT NULL DEFAULT 'custom',
  start_time TIME NULL,
  end_time TIME NULL, -- Permet les horaires traversant minuit sans restriction start < end
  date_value DATE NULL,
  size_px INTEGER NULL CHECK (size_px IS NULL OR size_px BETWEEN 30 AND 1200),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_board_axis_position UNIQUE (board_id, axis, position)
);

CREATE INDEX IF NOT EXISTS idx_board_axes_board_axis ON board_axes(board_id, axis, position);

-- 6. Table des cellules (Intersection Ligne-Colonne)
CREATE TABLE IF NOT EXISTS board_cells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  row_axis_id UUID NOT NULL REFERENCES board_axes(id) ON DELETE CASCADE,
  column_axis_id UUID NOT NULL REFERENCES board_axes(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  background_color VARCHAR(9) NULL,
  text_color VARCHAR(9) NULL,
  text_style JSONB NOT NULL DEFAULT '{}'::jsonb,
  position_order INTEGER NOT NULL DEFAULT 0 CHECK (position_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_board_cell_intersection UNIQUE (board_id, row_axis_id, column_axis_id)
);

CREATE INDEX IF NOT EXISTS idx_board_cells_lookup ON board_cells(board_id, row_axis_id, column_axis_id);

-- 7. Table des items de cellule (Multi-tâches par créneau)
CREATE TABLE IF NOT EXISTS cell_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  row_axis_id UUID NOT NULL REFERENCES board_axes(id) ON DELETE CASCADE,
  column_axis_id UUID NOT NULL REFERENCES board_axes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT NULL,
  starts_at TIMESTAMPTZ NULL,
  ends_at TIMESTAMPTZ NULL,
  status item_status NOT NULL DEFAULT 'todo',
  background_color VARCHAR(9) NULL,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Table des membres / rôles
CREATE TABLE IF NOT EXISTS board_members (
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

-- 9. Table des partages par lien sécurisé
CREATE TABLE IF NOT EXISTS board_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view')),
  expires_at TIMESTAMPTZ NULL,
  revoked_at TIMESTAMPTZ NULL,
  allow_export BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Table des jobs d'export
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  format TEXT NOT NULL CHECK (format IN ('pdf', 'docx')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'failed', 'expired')),
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  storage_path TEXT NULL,
  error_code TEXT NULL,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SÉCURITÉ & POLITIQUES RLS (Row Level Security)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_axes ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Politiques profiles
CREATE POLICY "Les utilisateurs gèrent leur propre profil"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- Politiques boards
CREATE POLICY "Le propriétaire a un accès complet à ses tableaux"
  ON boards FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Les membres peuvent lire ou éditer selon leur rôle"
  ON boards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = boards.id AND board_members.user_id = auth.uid()
    )
  );

-- Politiques enfants (axes, cellules, items)
CREATE POLICY "Accès aux axes conditionné au tableau"
  ON board_axes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_axes.board_id
      AND (boards.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM board_members WHERE board_members.board_id = boards.id AND board_members.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Accès aux cellules conditionné au tableau"
  ON board_cells FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_cells.board_id
      AND (boards.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM board_members WHERE board_members.board_id = boards.id AND board_members.user_id = auth.uid()
      ))
    )
  );
