-- Preserve reviews when a booking is deleted (SET NULL instead of CASCADE)
ALTER TABLE reservation_reviews ALTER COLUMN booking_id DROP NOT NULL;

ALTER TABLE reservation_reviews
  DROP CONSTRAINT IF EXISTS reservation_reviews_booking_id_fkey;

ALTER TABLE reservation_reviews
  ADD CONSTRAINT reservation_reviews_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES reservation_bookings(id) ON DELETE SET NULL;
