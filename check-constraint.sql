SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'tarifs_frais_service_check';
