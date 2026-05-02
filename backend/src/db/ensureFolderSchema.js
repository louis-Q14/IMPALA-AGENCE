const db = require("./index");

async function ensureFolderSchema() {
  // Migration: allow 'visiteur' role
  await db.query(`
    DO $$
    BEGIN
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('user', 'pro', 'visiteur', 'admin', 'trash_agent', 'super_admin', 'support_agent', 'finance_agent'));
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_folders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      folder_key VARCHAR(255) NOT NULL UNIQUE,
      folder_path TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS real_estate_ad_folders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ad_id UUID NOT NULL UNIQUE REFERENCES real_estate_ads(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      folder_key VARCHAR(255) NOT NULL UNIQUE,
      folder_path TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS auto_ad_folders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ad_id UUID NOT NULL UNIQUE REFERENCES auto_ads(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      folder_key VARCHAR(255) NOT NULL UNIQUE,
      folder_path TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION fn_create_user_folder()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO user_folders (user_id, folder_key, folder_path)
      VALUES (
        NEW.id,
        CONCAT('user_', NEW.id::text),
        CONCAT('/users/', NEW.id::text)
      )
      ON CONFLICT (user_id) DO UPDATE
      SET folder_key = EXCLUDED.folder_key,
          folder_path = EXCLUDED.folder_path,
          updated_at = NOW();

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_create_user_folder ON users;
    CREATE TRIGGER trg_create_user_folder
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION fn_create_user_folder();

    CREATE OR REPLACE FUNCTION fn_create_real_estate_ad_folder()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO real_estate_ad_folders (ad_id, user_id, folder_key, folder_path)
      VALUES (
        NEW.id,
        NEW.user_id,
        CONCAT('real_estate_', NEW.id::text),
        CONCAT('/users/', NEW.user_id::text, '/real_estate/', NEW.id::text)
      )
      ON CONFLICT (ad_id) DO UPDATE
      SET user_id = EXCLUDED.user_id,
          folder_key = EXCLUDED.folder_key,
          folder_path = EXCLUDED.folder_path,
          updated_at = NOW();

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_create_real_estate_ad_folder ON real_estate_ads;
    CREATE TRIGGER trg_create_real_estate_ad_folder
    AFTER INSERT ON real_estate_ads
    FOR EACH ROW
    EXECUTE FUNCTION fn_create_real_estate_ad_folder();

    CREATE OR REPLACE FUNCTION fn_create_auto_ad_folder()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO auto_ad_folders (ad_id, user_id, folder_key, folder_path)
      VALUES (
        NEW.id,
        NEW.user_id,
        CONCAT('auto_', NEW.id::text),
        CONCAT('/users/', NEW.user_id::text, '/auto/', NEW.id::text)
      )
      ON CONFLICT (ad_id) DO UPDATE
      SET user_id = EXCLUDED.user_id,
          folder_key = EXCLUDED.folder_key,
          folder_path = EXCLUDED.folder_path,
          updated_at = NOW();

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_create_auto_ad_folder ON auto_ads;
    CREATE TRIGGER trg_create_auto_ad_folder
    AFTER INSERT ON auto_ads
    FOR EACH ROW
    EXECUTE FUNCTION fn_create_auto_ad_folder();

    INSERT INTO user_folders (user_id, folder_key, folder_path)
    SELECT u.id, CONCAT('user_', u.id::text), CONCAT('/users/', u.id::text)
    FROM users u
    LEFT JOIN user_folders uf ON uf.user_id = u.id
    WHERE uf.user_id IS NULL;

    INSERT INTO real_estate_ad_folders (ad_id, user_id, folder_key, folder_path)
    SELECT r.id, r.user_id, CONCAT('real_estate_', r.id::text), CONCAT('/users/', r.user_id::text, '/real_estate/', r.id::text)
    FROM real_estate_ads r
    LEFT JOIN real_estate_ad_folders rf ON rf.ad_id = r.id
    WHERE rf.ad_id IS NULL;

    INSERT INTO auto_ad_folders (ad_id, user_id, folder_key, folder_path)
    SELECT a.id, a.user_id, CONCAT('auto_', a.id::text), CONCAT('/users/', a.user_id::text, '/auto/', a.id::text)
    FROM auto_ads a
    LEFT JOIN auto_ad_folders af ON af.ad_id = a.id
    WHERE af.ad_id IS NULL;
  `);

  // ── Colonnes manquantes sur la table users ──────────────────────────────
  await db.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS nom_etablissement VARCHAR(255);
  `);

  // ── Colonnes manquantes sur la table subscriptions ──────────────────────
  await db.query(`
    ALTER TABLE subscriptions
      ADD COLUMN IF NOT EXISTS billing_period VARCHAR(20),
      ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
  `);

  // ── Correction de la contrainte plan_type sur subscriptions ─────────────
  await db.query(`
    DO $$
    BEGIN
      ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
      ALTER TABLE subscriptions
        ADD CONSTRAINT subscriptions_plan_type_check
        CHECK (plan_type IN (
          'real_estate_pro', 'auto_pro', 'trash_basic', 'complete',
          'immobilier', 'automobile', 'complet', 'poubelles',
          'immo_auto_pro'
        ));
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;
  `);

  // ── Table subscription_requests ─────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS subscription_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      service_type VARCHAR(30) NOT NULL,
      plan_type VARCHAR(50) NOT NULL,
      formula VARCHAR(50) DEFAULT 'standard',
      payment_method VARCHAR(30) DEFAULT 'mobile',
      amount NUMERIC(10,2) DEFAULT 0,
      annual BOOLEAN DEFAULT FALSE,
      status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
      admin_note TEXT,
      reviewed_at TIMESTAMPTZ,
      reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // ── Colonnes manquantes sur trash_subscriptions ──────────────────────────
  await db.query(`
    ALTER TABLE trash_subscriptions
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10),
      ADD COLUMN IF NOT EXISTS bins_count INT DEFAULT 1,
      ADD COLUMN IF NOT EXISTS monthly_price NUMERIC(10,2);
  `);

  // ── Vérification téléphonique par OTP ────────────────────────────────────
  await db.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS phone_otp VARCHAR(6),
      ADD COLUMN IF NOT EXISTS phone_otp_expires TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS phone_otp_sent_at TIMESTAMP WITH TIME ZONE;
  `);

  // Comptes existants approuvés → phone_verified = true (rétrocompatibilité)
  await db.query(`
    UPDATE users SET phone_verified = TRUE
    WHERE status = 'approved' AND phone_verified = FALSE;
  `);
}

module.exports = { ensureFolderSchema };
