-- Migration: Boutique IMPALA BOUTIQUE
-- Articles ménagers et pièces automobiles

CREATE TABLE IF NOT EXISTS boutique_produits (
  id            SERIAL PRIMARY KEY,
  nom           VARCHAR(255) NOT NULL,
  description   TEXT,
  prix_cdf      INTEGER NOT NULL,
  prix_usd      NUMERIC(10,2),
  image         TEXT,
  images        TEXT[],
  categorie     VARCHAR(50) NOT NULL CHECK (categorie IN ('menager','automobile')),
  sous_categorie VARCHAR(100),
  marque        VARCHAR(100),
  specifications JSONB DEFAULT '{}',
  stock         INTEGER NOT NULL DEFAULT 0,
  disponible    BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boutique_commandes (
  id              SERIAL PRIMARY KEY,
  ref             VARCHAR(50) UNIQUE NOT NULL DEFAULT ('IB-' || to_char(NOW(),'YYYYMMDD') || '-' || floor(random()*9000+1000)::TEXT),
  statut          VARCHAR(50) NOT NULL DEFAULT 'en_attente'
                    CHECK (statut IN ('en_attente','paiement_confirme','en_preparation','expedie','livre','annule')),

  -- Client
  client_nom      VARCHAR(255) NOT NULL,
  client_telephone VARCHAR(50) NOT NULL,
  client_ville    VARCHAR(100),
  client_adresse  TEXT,

  -- Livraison
  livraison_type  VARCHAR(20) NOT NULL DEFAULT 'domicile' CHECK (livraison_type IN ('domicile','retrait')),
  frais_livraison INTEGER NOT NULL DEFAULT 0,

  -- Paiement
  paiement_methode VARCHAR(50),
  paiement_numero  VARCHAR(50),
  code_transaction VARCHAR(100),

  -- Totaux
  total_cdf       INTEGER NOT NULL,

  -- Articles (snapshot JSON)
  articles        JSONB NOT NULL DEFAULT '[]',

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boutique_commandes_ref ON boutique_commandes(ref);
CREATE INDEX IF NOT EXISTS idx_boutique_commandes_statut ON boutique_commandes(statut);
CREATE INDEX IF NOT EXISTS idx_boutique_commandes_telephone ON boutique_commandes(client_telephone);
CREATE INDEX IF NOT EXISTS idx_boutique_produits_categorie ON boutique_produits(categorie);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_boutique_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_boutique_produits_updated ON boutique_produits;
CREATE TRIGGER trg_boutique_produits_updated
  BEFORE UPDATE ON boutique_produits
  FOR EACH ROW EXECUTE FUNCTION update_boutique_updated_at();

DROP TRIGGER IF EXISTS trg_boutique_commandes_updated ON boutique_commandes;
CREATE TRIGGER trg_boutique_commandes_updated
  BEFORE UPDATE ON boutique_commandes
  FOR EACH ROW EXECUTE FUNCTION update_boutique_updated_at();
