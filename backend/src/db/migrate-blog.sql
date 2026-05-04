-- Migration: Blog / Avis table
CREATE TABLE IF NOT EXISTS blog_avis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    auteur_nom VARCHAR(100) NOT NULL,
    auteur_email VARCHAR(255),
    note SMALLINT CHECK (note >= 1 AND note <= 5),
    titre VARCHAR(150),
    contenu TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_avis_status ON blog_avis(status);
CREATE INDEX IF NOT EXISTS idx_blog_avis_created ON blog_avis(created_at DESC);
