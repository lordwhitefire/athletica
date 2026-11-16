-- Migration: Homepage sections drift backfill & constraint
-- Description: Adds attributes jsonb column if missing and adds unique constraint on (type, order, title)

alter table homepage_sections add column if not exists attributes jsonb;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'homepage_sections_type_order_title_key'
    ) then
        alter table homepage_sections add constraint homepage_sections_type_order_title_key unique (type, "order", title);
    end if;
end $$;
