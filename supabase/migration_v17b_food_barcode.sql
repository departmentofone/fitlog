-- FitLog schema v17b: cache barcode lookups on foods so repeat scans of the same
-- product skip the Open Food Facts network round-trip.
-- Paste into the Supabase SQL editor and run once.

alter table foods add column if not exists barcode text;
create index if not exists foods_barcode_idx on foods (barcode) where barcode is not null;
