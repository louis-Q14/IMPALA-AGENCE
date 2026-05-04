-- Corriger nettoyage : service='general' -> 'nettoyage'
UPDATE tarifs_frais SET service = 'nettoyage' WHERE nom ILIKE '%nettoyage%' AND service = 'general';

-- Vérification
SELECT id, nom, service, type, montant, unite, actif FROM tarifs_frais ORDER BY service, type;
