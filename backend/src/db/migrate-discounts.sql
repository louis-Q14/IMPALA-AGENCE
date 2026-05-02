-- Migration: Add discount config tables

CREATE TABLE IF NOT EXISTS trash_discount_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    discount_type VARCHAR(100) NOT NULL,
    percent INT NOT NULL CHECK (percent BETWEEN 0 AND 100),
    starts_at DATE NOT NULL,
    ends_at DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trash_global_config (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    plan_config JSONB NOT NULL DEFAULT '{}',
    global_promo JSONB DEFAULT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO trash_global_config (plan_config) VALUES (
  '{"basic":{"label":"Basic","price":"15","frequency":"1x/semaine","bins":1,"color":"from-gray-400 to-gray-500"},"standard":{"label":"Standard","price":"29","frequency":"2x/semaine","bins":3,"color":"from-blue-400 to-blue-600"},"premium":{"label":"Premium","price":"49","frequency":"3x/semaine","bins":5,"color":"from-purple-400 to-purple-600"},"freqAdjust":{"2x/semaine":"25","3x/semaine":"50","Spéciale collecte":"75"}}'
) ON CONFLICT (id) DO NOTHING;
