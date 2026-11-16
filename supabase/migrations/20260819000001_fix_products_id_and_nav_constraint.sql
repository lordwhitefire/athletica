-- Single combined migration - run this as ONE query
-- =====================================================================

-- 1. Fix products.id to TEXT
alter table products add column if not exists id_text text;
update products set id_text = id::text where id_text is null;
alter table products alter column id drop default;
alter table products drop constraint if exists products_pkey;
alter table products drop column if exists id;
alter table products rename column id_text to id;
alter table products add primary key (id);

-- 2. Add unique constraint for navigation upsert
alter table navigation add constraint if not exists navigation_label_route_parent_unique unique (label, route, parent_id);

-- 3. Recreate updated_at trigger
drop trigger if exists products_updated_at on products;
create trigger products_updated_at
    before update on products
    for each row execute procedure public.handle_updated_at();