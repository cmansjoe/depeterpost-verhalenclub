-- ══════════════════════════════════════════════════════
-- VerhalenPost / WoordSpeler — Supabase Schema
-- Uitvoeren in: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════

-- ── 1. GEBRUIKERS TABEL ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.gebruikers (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    gebruikersnaam  TEXT NOT NULL UNIQUE,
    leeftijdsgroep  TEXT NOT NULL CHECK (leeftijdsgroep IN ('A', 'B', 'C')),
    is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
    toestemming_gegeven  BOOLEAN NOT NULL DEFAULT FALSE,
    toestemming_type     TEXT CHECK (toestemming_type IN ('school', 'ouder')),
    aangemaakt_op   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. ROW LEVEL SECURITY INSCHAKELEN ────────────────
ALTER TABLE public.gebruikers ENABLE ROW LEVEL SECURITY;

-- ── 3. RLS POLICIES ──────────────────────────────────

-- Gebruiker mag alleen zijn eigen rij lezen
CREATE POLICY "gebruiker leest eigen profiel"
    ON public.gebruikers
    FOR SELECT
    USING (auth.uid() = id);

-- Gebruiker mag alleen zijn eigen rij bijwerken
CREATE POLICY "gebruiker bewerkt eigen profiel"
    ON public.gebruikers
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Nieuwe rij aanmaken mag alleen voor je eigen id
CREATE POLICY "gebruiker maakt eigen profiel aan"
    ON public.gebruikers
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Admin mag alle rijen lezen (via service role — omzeilt RLS automatisch)
-- De service role key op de server heeft altijd volledige toegang.
-- Geen extra policy nodig voor admin-server-operaties.

-- ── 4. GEBRUIKERSNAAM UNIEKHEID (extra index) ────────
CREATE UNIQUE INDEX IF NOT EXISTS gebruikers_gebruikersnaam_idx
    ON public.gebruikers (LOWER(gebruikersnaam));
