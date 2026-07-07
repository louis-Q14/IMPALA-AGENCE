-- Add accuracy_rating and checkin_rating columns to reservation_reviews
ALTER TABLE reservation_reviews
  ADD COLUMN IF NOT EXISTS accuracy_rating  INTEGER CHECK (accuracy_rating  BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS checkin_rating   INTEGER CHECK (checkin_rating   BETWEEN 1 AND 5);
