-- Corriger l'entrée "frais d' annonce immobilier" qui avait service='automobile' par erreur
UPDATE tarifs_frais
SET service = 'immobilier', nom = 'frais d''annonce immobilier'
WHERE nom ILIKE '%immobilier%' AND service = 'automobile';

-- Vérification
SELECT id, nom, service, type, montant, unite FROM tarifs_frais ORDER BY id;
