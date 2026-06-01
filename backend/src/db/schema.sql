-- ================================================
-- IMPALA-AGENCE - Database Schema (PostgreSQL + PostGIS)
-- ================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- PostGIS extension removed (not available in standard postgres)

-- ================================================
-- USERS & AUTH
-- ================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    nom VARCHAR(50),
    post_nom VARCHAR(50),
    prenom VARCHAR(50),
    date_naissance DATE,
    lieu_naissance VARCHAR(100),
    sexe VARCHAR(10) CHECK (sexe IN ('Masculin', 'Féminin')),
    nationalite VARCHAR(50),
    etat_civil VARCHAR(20) CHECK (etat_civil IN ('Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve')),
    profession VARCHAR(100),
    numero_piece VARCHAR(50),
    piece_identite_url TEXT,
    adresse TEXT,
    phone VARCHAR(20),
    phone_fixe VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'pro', 'visiteur', 'admin', 'trash_agent', 'super_admin', 'support_agent', 'finance_agent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    is_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    documents_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('real_estate', 'auto', 'trash', 'poubelles', 'nettoyage', 'repassage', 'demenagement')),
    subscription_status VARCHAR(20) DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired', 'pending')),
    subscription_start DATE,
    subscription_end DATE,
    stripe_subscription_id VARCHAR(255),
    UNIQUE(user_id, service_type)
);

-- Documents utilisateur (pièce d'identité, etc.)
CREATE TABLE user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('piece_identite', 'avatar', 'justificatif', 'autre')),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(50),
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_documents_user ON user_documents(user_id, document_type);

CREATE TABLE professional_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    siret VARCHAR(14),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- REAL ESTATE
-- ================================================
CREATE TABLE real_estate_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2),
    rent_price DECIMAL(10,2),
    charges DECIMAL(8,2),
    surface INT,
    rooms INT,
    bedrooms INT,
    address TEXT NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    location JSONB,
    ad_type VARCHAR(10) NOT NULL CHECK (ad_type IN ('sale', 'rent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'sold', 'rented', 'rejected')),
    views INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_real_estate_status ON real_estate_ads(status);
CREATE INDEX idx_real_estate_type ON real_estate_ads(ad_type);
CREATE INDEX idx_real_estate_location ON real_estate_ads USING GIST(location);
CREATE INDEX idx_real_estate_price ON real_estate_ads(price);
CREATE INDEX idx_real_estate_city ON real_estate_ads(city);

-- ================================================
-- AUTOMOBILE
-- ================================================
CREATE TABLE auto_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    mileage INT,
    fuel VARCHAR(20) CHECK (fuel IN ('essence', 'diesel', 'electrique', 'hybride')),
    transmission VARCHAR(20) CHECK (transmission IN ('manuelle', 'automatique')),
    price DECIMAL(12,2),
    rent_price_day DECIMAL(10,2),
    description TEXT,
    location_text VARCHAR(255),
    ad_type VARCHAR(10) NOT NULL CHECK (ad_type IN ('sale', 'rent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'sold', 'rented', 'rejected')),
    views INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auto_status ON auto_ads(status);
CREATE INDEX idx_auto_brand ON auto_ads(brand);

-- ================================================
-- DOSSIERS UTILISATEUR & PUBLICATIONS (DB)
-- ================================================
CREATE TABLE user_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    folder_key VARCHAR(255) NOT NULL UNIQUE,
    folder_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE real_estate_ad_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL UNIQUE REFERENCES real_estate_ads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_key VARCHAR(255) NOT NULL UNIQUE,
    folder_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE auto_ad_folders (
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

-- Backfill dossiers for existing records
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

CREATE TABLE auto_rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auto_ad_id UUID NOT NULL REFERENCES auto_ads(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES users(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    stripe_payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- PHOTOS (polymorphic)
-- ================================================
CREATE TABLE ad_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL,
    ad_type VARCHAR(20) NOT NULL CHECK (ad_type IN ('real_estate', 'auto')),
    photo_url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_photos_ad ON ad_photos(ad_id, ad_type);

-- ================================================
-- TRASH COLLECTION
-- ================================================
CREATE TABLE trash_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    location JSONB,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
    bin_count INT DEFAULT 1 CHECK (bin_count BETWEEN 1 AND 3),
    waste_types TEXT[] NOT NULL DEFAULT '{"general"}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TRASH DISCOUNT CONFIG (per-user individual discounts)
-- ================================================
CREATE TABLE trash_discount_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    discount_type VARCHAR(100) NOT NULL,
    percent INT NOT NULL CHECK (percent BETWEEN 0 AND 100),
    starts_at DATE NOT NULL,
    ends_at DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- TRASH GLOBAL CONFIG (plan config + global promo, single row)
-- ================================================
CREATE TABLE trash_global_config (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    plan_config JSONB NOT NULL DEFAULT '{}',
    global_promo JSONB DEFAULT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO trash_global_config (plan_config) VALUES (
  '{"basic":{"label":"Basic","price":"15","frequency":"1x/semaine","bins":1,"color":"from-gray-400 to-gray-500"},"standard":{"label":"Standard","price":"29","frequency":"2x/semaine","bins":3,"color":"from-blue-400 to-blue-600"},"premium":{"label":"Premium","price":"49","frequency":"3x/semaine","bins":5,"color":"from-purple-400 to-purple-600"},"freqAdjust":{"2x/semaine":"25","3x/semaine":"50","Spéciale collecte":"75"}}'
) ON CONFLICT (id) DO NOTHING;

CREATE TABLE trash_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES trash_subscriptions(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    agent_id UUID REFERENCES users(id),
    collected BOOLEAN DEFAULT FALSE,
    collected_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_collections_date ON trash_collections(scheduled_date);
CREATE INDEX idx_collections_agent ON trash_collections(agent_id);

-- ================================================
-- TRASH CLIENT SUBSCRIPTIONS (admin-managed)
-- ================================================
CREATE TABLE trash_client_subs (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    plan VARCHAR(20) NOT NULL DEFAULT 'basic',
    frequency VARCHAR(30) NOT NULL DEFAULT '1x/semaine',
    bins INT NOT NULL DEFAULT 1,
    amount VARCHAR(50) NOT NULL DEFAULT '15 $/mois',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    collect_days TEXT[] DEFAULT '{}',
    zone VARCHAR(255),
    address TEXT,
    start_date VARCHAR(20),
    next_pickup VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- SUBSCRIPTIONS & PAYMENTS
-- ================================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('real_estate_pro', 'auto_pro', 'trash_basic', 'complete')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    pdf_url TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- REVIEWS
-- ================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL,
    ad_type VARCHAR(20) NOT NULL CHECK (ad_type IN ('real_estate', 'auto')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ad_id, ad_type, user_id)
);

-- ================================================
-- FAVORITES
-- ================================================
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id UUID NOT NULL,
    ad_type VARCHAR(20) NOT NULL CHECK (ad_type IN ('real_estate', 'auto')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ad_id, ad_type)
);

-- ================================================
-- CONVERSATIONS & MESSAGES
-- ================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID,
    ad_type VARCHAR(20),
    participant_1 UUID NOT NULL REFERENCES users(id),
    participant_2 UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- NOTIFICATIONS
-- ================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read);

-- ================================================
-- NETTOYAGE DE BUREAU
-- ================================================
CREATE TABLE IF NOT EXISTS nettoyage_client_bookings (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    address TEXT,
    company VARCHAR(255),
    surface VARCHAR(20) NOT NULL DEFAULT 'small',
    duration INTEGER NOT NULL DEFAULT 2,
    date VARCHAR(50),
    time VARCHAR(20),
    amount VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    notes TEXT,
    start_date VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nettoyage_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    pricing_config JSONB DEFAULT '{}',
    global_promo JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nettoyage_discounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    discount_type VARCHAR(100),
    percent INTEGER,
    starts_at DATE,
    ends_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- REPASSAGE
-- ================================================
CREATE TABLE IF NOT EXISTS repassage_client_bookings (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    address TEXT,
    quantity VARCHAR(20) NOT NULL DEFAULT 'small',
    clothing_types JSONB DEFAULT '[]',
    duration INTEGER NOT NULL DEFAULT 1,
    date VARCHAR(50),
    time VARCHAR(20),
    amount VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    notes TEXT,
    start_date VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repassage_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    pricing_config JSONB DEFAULT '{}',
    global_promo JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repassage_discounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    discount_type VARCHAR(100),
    percent INTEGER,
    starts_at DATE,
    ends_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- DEMENAGEMENT
-- ================================================
CREATE TABLE IF NOT EXISTS demenagement_client_bookings (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    address_from TEXT,
    address_to TEXT,
    volume VARCHAR(30) NOT NULL DEFAULT 'studio',
    extras JSONB DEFAULT '[]',
    duration INTEGER NOT NULL DEFAULT 4,
    date VARCHAR(50),
    time VARCHAR(20),
    amount VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    notes TEXT,
    start_date VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demenagement_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    pricing_config JSONB DEFAULT '{}',
    global_promo JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demenagement_discounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    discount_type VARCHAR(100),
    percent INTEGER,
    starts_at DATE,
    ends_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
