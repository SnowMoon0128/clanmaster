CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager')),
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_reason TEXT,
  blocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS clans (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  invite_code TEXT UNIQUE,
  owner_user_id BIGINT NOT NULL REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clans ADD COLUMN IF NOT EXISTS invite_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_clans_invite_code ON clans(invite_code) WHERE invite_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS owner_signup_requests (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  clan_name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by TEXT,
  reject_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_admins (
  clan_id BIGINT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  added_by BIGINT REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (clan_id, user_id)
);

CREATE TABLE IF NOT EXISTS players (
  id BIGSERIAL PRIMARY KEY,
  game_uid TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_memberships (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  clan_id BIGINT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  CHECK (left_at IS NULL OR left_at > joined_at)
);

CREATE TABLE IF NOT EXISTS blacklist_entries (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  clan_id BIGINT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  reason TEXT,
  created_by BIGINT NOT NULL REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_actions (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id BIGINT REFERENCES app_users(id),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_identity_events (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id) ON DELETE SET NULL,
  game_uid TEXT NOT NULL,
  input_nickname TEXT NOT NULL,
  stored_nickname TEXT,
  event_type TEXT NOT NULL,
  actor_user_id BIGINT REFERENCES app_users(id),
  clan_id BIGINT REFERENCES clans(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memberships_player_id ON clan_memberships(player_id);
CREATE INDEX IF NOT EXISTS idx_memberships_clan_id ON clan_memberships(clan_id);
CREATE INDEX IF NOT EXISTS idx_memberships_active ON clan_memberships(player_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blacklist_player_clan ON blacklist_entries(player_id, clan_id);
CREATE INDEX IF NOT EXISTS idx_actions_actor_created_at ON admin_actions(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_users_blocked ON app_users(is_blocked);
CREATE INDEX IF NOT EXISTS idx_identity_events_game_uid ON player_identity_events(game_uid);
