-- Superset / circuit grouping: sets sharing the same non-null superset_group value (scoped to
-- their session) are logged together as one superset/circuit. Nullable so all existing sets
-- (superset_group = null) are entirely unaffected - this is fully backward compatible.
alter table workout_sets add column if not exists superset_group integer;
