-- Add cancellation_requested column to reservation_bookings
ALTER TABLE reservation_bookings
  ADD COLUMN IF NOT EXISTS cancellation_requested BOOLEAN DEFAULT FALSE;
