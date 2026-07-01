-- ================================================
-- IMPALA-RESERVATION — Migration
-- ================================================

-- Add 'reservation' to user_services service_type
DO $$ BEGIN
  ALTER TABLE user_services DROP CONSTRAINT IF EXISTS user_services_service_type_check;
  ALTER TABLE user_services ADD CONSTRAINT user_services_service_type_check
    CHECK (service_type IN ('real_estate','auto','trash','poubelles','nettoyage','repassage','demenagement','reservation'));
EXCEPTION WHEN others THEN NULL; END $$;

-- Properties
CREATE TABLE IF NOT EXISTS reservation_properties (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               VARCHAR(200) NOT NULL,
  description         TEXT,
  property_type       VARCHAR(30) NOT NULL DEFAULT 'appartement'
                        CHECK (property_type IN ('appartement','maison','villa','hotel','chambre','bureau','salle','autre')),
  listing_type        VARCHAR(20) NOT NULL DEFAULT 'nuit'
                        CHECK (listing_type IN ('nuit','semaine','mois')),
  price_per_night     DECIMAL(12,2),
  price_per_week      DECIMAL(12,2),
  price_per_month     DECIMAL(12,2),
  currency            VARCHAR(5)  DEFAULT 'USD',
  city                VARCHAR(100) NOT NULL,
  address             TEXT,
  country             VARCHAR(100) DEFAULT 'République Démocratique du Congo',
  latitude            DECIMAL(10,7),
  longitude           DECIMAL(11,7),
  bedrooms            INTEGER DEFAULT 1,
  bathrooms           INTEGER DEFAULT 1,
  max_guests          INTEGER DEFAULT 2,
  surface             DECIMAL(10,2),
  status              VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('active','pending','inactive','rejected')),
  is_featured         BOOLEAN DEFAULT FALSE,
  cancellation_policy VARCHAR(20) DEFAULT 'flexible'
                        CHECK (cancellation_policy IN ('flexible','moderate','strict')),
  check_in_time       VARCHAR(10) DEFAULT '14:00',
  check_out_time      VARCHAR(10) DEFAULT '11:00',
  min_stay            INTEGER DEFAULT 1,
  max_stay            INTEGER,
  instant_booking     BOOLEAN DEFAULT FALSE,
  rating_avg          DECIMAL(3,2) DEFAULT 0,
  review_count        INTEGER DEFAULT 0,
  view_count          INTEGER DEFAULT 0,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Images
CREATE TABLE IF NOT EXISTS reservation_property_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES reservation_properties(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  is_cover    BOOLEAN DEFAULT FALSE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Amenities
CREATE TABLE IF NOT EXISTS reservation_property_amenities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES reservation_properties(id) ON DELETE CASCADE,
  amenity     VARCHAR(60) NOT NULL
);

-- Bookings
CREATE TABLE IF NOT EXISTS reservation_bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      UUID NOT NULL REFERENCES reservation_properties(id) ON DELETE CASCADE,
  guest_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in         DATE NOT NULL,
  check_out        DATE NOT NULL,
  guests_count     INTEGER DEFAULT 1,
  nights_count     INTEGER DEFAULT 1,
  total_price      DECIMAL(12,2) NOT NULL,
  currency         VARCHAR(5) DEFAULT 'USD',
  status           VARCHAR(20) DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','cancelled','completed','rejected')),
  payment_method   VARCHAR(30) CHECK (payment_method IN ('stripe','paypal','orange_money','airtel_money','visa','cash','other')),
  payment_status   VARCHAR(20) DEFAULT 'pending'
                     CHECK (payment_status IN ('pending','paid','refunded','failed')),
  payment_ref      VARCHAR(255),
  guest_message    TEXT,
  owner_message    TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reservation_reviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id          UUID NOT NULL REFERENCES reservation_properties(id) ON DELETE CASCADE,
  booking_id           UUID NOT NULL REFERENCES reservation_bookings(id) ON DELETE CASCADE,
  reviewer_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating               INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment              TEXT,
  cleanliness_rating   INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  location_rating      INTEGER CHECK (location_rating BETWEEN 1 AND 5),
  value_rating         INTEGER CHECK (value_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id)
);

-- Blocked dates (availability calendar)
CREATE TABLE IF NOT EXISTS reservation_availability (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES reservation_properties(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason      VARCHAR(20) DEFAULT 'owner_block'
                CHECK (reason IN ('booking','owner_block','maintenance')),
  booking_id  UUID REFERENCES reservation_bookings(id),
  UNIQUE(property_id, blocked_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_res_properties_user     ON reservation_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_res_properties_city     ON reservation_properties(city);
CREATE INDEX IF NOT EXISTS idx_res_properties_status   ON reservation_properties(status);
CREATE INDEX IF NOT EXISTS idx_res_properties_type     ON reservation_properties(property_type);
CREATE INDEX IF NOT EXISTS idx_res_bookings_property   ON reservation_bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_res_bookings_guest      ON reservation_bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_res_avail_property      ON reservation_availability(property_id);
CREATE INDEX IF NOT EXISTS idx_res_avail_date          ON reservation_availability(blocked_date);
