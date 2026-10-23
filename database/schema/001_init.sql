-- Content tables share one shape: indexed slug + jsonb document. Editors can change fields without migrations.
CREATE TABLE IF NOT EXISTS tours (
  id         SERIAL PRIMARY KEY,
  slug       TEXT UNIQUE NOT NULL,
  tier       TEXT NOT NULL CHECK (tier IN ('luxury', 'midrange', 'budget')),
  tags       TEXT[] NOT NULL DEFAULT '{}',
  sort       INT  NOT NULL DEFAULT 0,
  published  BOOLEAN NOT NULL DEFAULT TRUE,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tours_tier_idx ON tours (tier);
CREATE INDEX IF NOT EXISTS tours_tags_idx ON tours USING GIN (tags);

CREATE TABLE IF NOT EXISTS destinations (
  id         SERIAL PRIMARY KEY,
  slug       TEXT UNIQUE NOT NULL,
  sort       INT NOT NULL DEFAULT 0,
  published  BOOLEAN NOT NULL DEFAULT TRUE,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id         SERIAL PRIMARY KEY,
  slug       TEXT UNIQUE NOT NULL,
  sort       INT NOT NULL DEFAULT 0,
  published  BOOLEAN NOT NULL DEFAULT TRUE,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
  id         SERIAL PRIMARY KEY,
  slug       TEXT UNIQUE NOT NULL,
  sort       INT NOT NULL DEFAULT 0,
  published  BOOLEAN NOT NULL DEFAULT TRUE,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inquiries (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  tour         TEXT,
  tier         TEXT,
  travel_month TEXT,
  travellers   INT,
  message      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
