-- Migration: create trash_client_subs table for admin-managed subscriptions
CREATE TABLE IF NOT EXISTS trash_client_subs (
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
