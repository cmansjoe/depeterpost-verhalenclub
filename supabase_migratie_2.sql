-- ══════════════════════════════════════════════════════
-- VerhalenPost — Migratie 2: ouder-toestemming kolommen
-- Uitvoeren in: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════

ALTER TABLE public.gebruikers
    ADD COLUMN IF NOT EXISTS ouder_email TEXT,
    ADD COLUMN IF NOT EXISTS ouder_token TEXT UNIQUE;
