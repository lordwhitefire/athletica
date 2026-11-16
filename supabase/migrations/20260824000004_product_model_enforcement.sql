-- =====================================================================
-- Migration: ARCH-11 Part 2 (WP-C) — Enforce the hierarchy invariant on
-- EVERY write path, at the database layer.
--
-- Doctrine: a model node holds AT MOST ONE direct product.
--   0 direct products -> branch; exactly 1 -> product model (terminal);
--   2+ SHALL NOT persist: the write RESTRUCTURES the node into a submodel
--   branch and gives each variant its own product-model child
--   ("<node> <color>").
--
-- Mechanism:
--   * arch11_enforce_product_model(): AFTER INSERT / UPDATE OF leaf_model_id
--     on products (top-level writes only — internal re-entrant DML from this
--     very logic is skipped via pg_trigger_depth()).
--       - validates the target node exists, is within a chain anchored to
--         the product's category;
--       - if the target is TERMINAL AND FREE  -> plain attachment;
--       - if TERMINAL AND OCCUPIED            -> automatic restructure:
--         the node becomes a submodel branch and each variant gets its own
--         product-model child ("<node> <color>");
--       - if the target ALREADY HAS CHILDREN  -> the product descends into
--         the existing child named "<node> <color>" (created when absent),
--         so bulk imports carrying several variants of one model all land
--         correctly instead of failing.
--   * arch11_cleanup_empty_product_model(): AFTER DELETE / after moving away
--     — removes a product model that just became an empty terminal node, so
--     no empty terminals linger.
--
-- Every code path (admin editor, quick-create, full editor, bulk import,
-- future tools) inherits these guarantees automatically.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Recursive placement — puts a product at/below a node following the
--    doctrine. Called from the trigger; safe to call repeatedly.
-- ---------------------------------------------------------------------

create or replace function arch11_place_product(
    p_product_id text,
    p_node_id uuid
)
returns void
language plpgsql
as $$
declare
    v_node        models%rowtype;
    v_occupant    products%rowtype;
    v_color_slug  text;
    v_child_name  text;
    v_child_slug  text;
    v_candidate   text;
    v_suffix      integer;
    v_child_a     uuid;
    v_child_b     uuid;
begin
    select * into v_node from models where id = p_node_id;
    if not found then
        raise exception 'Cannot attach product: model % does not exist.', p_node_id
            using errcode = 'foreign_key_violation';
    end if;

    if not exists (select 1 from models c where c.parent_id = v_node.id) then
        -- Terminal node -------------------------------------------------
        select * into v_occupant
        from products
        where leaf_model_id = v_node.id
          and id <> p_product_id
        limit 1;

        if not found then
            -- free: make sure the pointer lands EXACTLY here — descend may
            -- have routed us below the node the write originally addressed
            update products set leaf_model_id = v_node.id
            where id = p_product_id and leaf_model_id is distinct from v_node.id;
            return;
        end if;

        -- occupied: restructure into branch + one product-model per variant
        v_color_slug := coalesce(
            nullif(regexp_replace(lower(coalesce(v_occupant.color, '')), '[^a-z0-9]+', '-', 'g'), ''),
            'variant');
        v_candidate := regexp_replace(regexp_replace(v_node.slug || '-' || v_color_slug, '-+', '-', 'g'), '^-|-$', '', 'g');
        v_child_slug := v_candidate;
        v_suffix := 0;
        while exists (
                select 1 from models m
                where m.slug = v_child_slug
                  and coalesce(m.category_id::text, '') = coalesce(v_node.category_id::text, '')
                  and coalesce(m.brand_id::text, '') = coalesce(v_node.brand_id::text, '')
            ) loop
            v_suffix := v_suffix + 1;
            v_child_slug := v_candidate || '-' || v_suffix::text;
        end loop;
        insert into models (slug, name, brand_id, parent_id, level)
        values (
            v_child_slug,
            v_node.name || ' ' || coalesce(nullif(trim(v_occupant.color), ''), 'Variant'),
            v_node.brand_id,
            v_node.id,
            v_node.level + 1
        )
        returning id into v_child_a;

        v_color_slug := coalesce(
            nullif(regexp_replace(lower(coalesce((select color from products where id = p_product_id), '')), '[^a-z0-9]+', '-', 'g'), ''),
            'variant');
        v_candidate := regexp_replace(regexp_replace(v_node.slug || '-' || v_color_slug, '-+', '-', 'g'), '^-|-$', '', 'g');
        v_child_slug := v_candidate;
        v_suffix := 0;
        while exists (
                select 1 from models m
                where m.slug = v_child_slug
                  and coalesce(m.category_id::text, '') = coalesce(v_node.category_id::text, '')
                  and coalesce(m.brand_id::text, '') = coalesce(v_node.brand_id::text, '')
            ) loop
            v_suffix := v_suffix + 1;
            v_child_slug := v_candidate || '-' || v_suffix::text;
        end loop;
        insert into models (slug, name, brand_id, parent_id, level)
        values (
            v_child_slug,
            v_node.name || ' ' || coalesce(nullif(trim((select color from products where id = p_product_id)), ''), 'Variant'),
            v_node.brand_id,
            v_node.id,
            v_node.level + 1
        )
        returning id into v_child_b;

        update products set leaf_model_id = v_child_a where id = v_occupant.id;
        update products set leaf_model_id = v_child_b where id = p_product_id;
        return;
    end if;

    -- Branch node: descend into "<node> <color>" child (create when absent)
    v_child_name := v_node.name || ' ' ||
        coalesce(nullif(trim((select color from products where id = p_product_id)), ''), 'Variant');
    select id into v_child_a
    from models
    where parent_id = v_node.id
      and lower(name) = lower(v_child_name)
    order by created_at
    limit 1;

    if found then
        perform arch11_place_product(p_product_id, v_child_a);
        return;
    end if;

    -- create the missing variant branch, then descend into it
    v_color_slug := coalesce(
        nullif(regexp_replace(lower(coalesce((select color from products where id = p_product_id), '')), '[^a-z0-9]+', '-', 'g'), ''),
        'variant');
    v_candidate := regexp_replace(regexp_replace(v_node.slug || '-' || v_color_slug, '-+', '-', 'g'), '^-|-$', '', 'g');
    v_child_slug := v_candidate;
    v_suffix := 0;
    while exists (select 1 from models m where m.slug = v_child_slug and m.parent_id = v_node.id) loop
        v_suffix := v_suffix + 1;
        v_child_slug := v_candidate || '-' || v_suffix::text;
    end loop;
    insert into models (slug, name, brand_id, parent_id, level)
    values (v_child_slug, v_child_name, v_node.brand_id, v_node.id, v_node.level + 1)
    returning id into v_child_a;

    perform arch11_place_product(p_product_id, v_child_a);
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Enforcement trigger (top-level writes only)
-- ---------------------------------------------------------------------

create or replace function arch11_enforce_product_model()
returns trigger
language plpgsql
as $$
declare
    target_exists   boolean;
    anchor_category uuid;
    cursor_cat      uuid;
    walker          uuid;
begin
    -- ignore no-op updates and any DML issued by our own placement logic
    if tg_op = 'UPDATE' and new.leaf_model_id is not distinct from old.leaf_model_id then
        return new;
    end if;
    if pg_trigger_depth() > 1 then
        return new;
    end if;
    if new.leaf_model_id is null then
        return new;
    end if;

    select exists(select 1 from models where id = new.leaf_model_id) into target_exists;
    if not target_exists then
        raise exception 'Cannot attach product "%": the selected model does not exist.',
            coalesce(new.name, new.id::text)
            using errcode = 'foreign_key_violation';
    end if;

    -- Category anchoring: walking up from the target must reach the product's category
    if new.category_id is not null then
        select category_id, parent_id into anchor_category, walker
        from models where id = new.leaf_model_id;
        while anchor_category is null and walker is not null loop
            select category_id, parent_id into cursor_cat, walker from models where id = walker;
            anchor_category := cursor_cat;
        end loop;
        if anchor_category is not null and anchor_category <> new.category_id then
            raise exception 'Cannot attach product "%": its category does not match the category the model chain is anchored to.',
                coalesce(new.name, new.id::text)
                using errcode = 'check_violation';
        end if;
    end if;

    perform arch11_place_product(new.id, new.leaf_model_id);
    return new;
end;
$$;

drop trigger if exists arch11_enforce_product_model_trigger on products;
create trigger arch11_enforce_product_model_trigger
    after insert or update of leaf_model_id on products
    for each row
    execute function arch11_enforce_product_model();

-- ---------------------------------------------------------------------
-- 3. Empty-terminal cleanup trigger
-- ---------------------------------------------------------------------

create or replace function arch11_cleanup_empty_product_model()
returns trigger
language plpgsql
as $$
declare
    released uuid;
begin
    released := old.leaf_model_id;
    if released is null then
        return coalesce(old, new);
    end if;

    -- remove the model iff it became an empty terminal (no products, no children)
    if exists (select 1 from models m where m.id = released)
       and not exists (select 1 from products p where p.leaf_model_id = released)
       and not exists (select 1 from models c where c.parent_id = released) then
        delete from models where id = released;
    end if;

    return coalesce(old, new);
end;
$$;

drop trigger if exists arch11_cleanup_on_delete_trigger on products;
create trigger arch11_cleanup_on_delete_trigger
    after delete on products
    for each row
    execute function arch11_cleanup_empty_product_model();

drop trigger if exists arch11_cleanup_on_move_trigger on products;
create trigger arch11_cleanup_on_move_trigger
    after update of leaf_model_id on products
    for each row
    execute function arch11_cleanup_empty_product_model();

commit;
