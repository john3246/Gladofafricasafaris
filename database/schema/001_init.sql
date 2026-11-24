-- One generic document table backs every CMS collection (tours, destinations, posts, faqs, reviews,
-- pages, settings, users, inquiries, media metadata, audit log, revisions). Collections are seeded lazily.
CREATE TABLE IF NOT EXISTS cms_records (
  collection TEXT NOT NULL,
  key        TEXT NOT NULL,
  sort       BIGINT, -- BIGINT: the audit log sorts by negative millisecond timestamps
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, key)
);
CREATE INDEX IF NOT EXISTS cms_records_sort_idx ON cms_records (collection, sort);

-- Uploaded images (kept in the database so they survive ephemeral hosting disks).
CREATE TABLE IF NOT EXISTS cms_media (
  id         TEXT PRIMARY KEY,
  mime       TEXT NOT NULL,
  data       BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrade path for databases created before sort became BIGINT (no-op otherwise).
ALTER TABLE cms_records ALTER COLUMN sort TYPE BIGINT;
