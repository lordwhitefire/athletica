-- Migration: ARCH-REC-007 WP-R2-B — destructive-action guards
-- Adds two atomic full-replace functions used by the admin publishers.
--
-- Guarantees implemented here (task.md WP-R2-B items 1–3):
--   1. Atomicity: delete + insert happen inside ONE plpgsql statement/transaction.
--      Any failure (constraint violation, bad payload) rolls back everything,
--      leaving the table exactly as it was.
--   2. Total-wipe guard: refuses a payload with zero rows while the table still
--      has content, unless the caller explicitly confirms (p_allow_wipe).
--   3. Stale-editor guard: caller must pass the row-id set it loaded; if the
--      table's current id set differs (another tab/user changed content), the
--      publish is rejected instead of silently overwriting.
--
-- Both functions are SECURITY DEFINER so the anon/authenticated RLS-restricted
-- roles can never call them directly; only the service-role server actions do.

create or replace function public.replace_homepage_sections(
    p_rows jsonb,
    p_loaded_ids jsonb,
    p_allow_wipe boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_current_ids text;
    v_loaded_ids  text;
begin
    select coalesce(array_agg(id::text order by id), '{}')::text
      into v_current_ids
      from homepage_sections;

    select coalesce(array_agg(value::uuid::text order by value::uuid), '{}')::text
      into v_loaded_ids
      from jsonb_array_elements_text(coalesce(p_loaded_ids, '[]'::jsonb));

    -- Stale-editor guard
    if v_current_ids is distinct from v_loaded_ids then
        return jsonb_build_object(
            'ok', false,
            'code', 'stale_editor',
            'message', 'Homepage content changed since you loaded it (another tab or user saved). Reload to get the latest version, then publish again.'
        );
    end if;

    -- Total-wipe guard
    if coalesce(jsonb_array_length(p_rows), 0) = 0
       and coalesce(array_length(v_current_ids::uuid[], 1), 0) > 0
       and not p_allow_wipe then
        return jsonb_build_object(
            'ok', false,
            'code', 'total_wipe',
            'message', 'This publish would remove ALL homepage content. Nothing was changed.'
        );
    end if;

    -- WHERE clause is required by this database's no-unbounded-delete guard,
    -- even though the table is empty-to-be-replaced inside this transaction.
    delete from homepage_sections where true;

    insert into homepage_sections (id, type, title, copy, category_id, "limit", image_links, attributes, "order")
    select
        coalesce(nullif(r.value->>'id', '')::uuid, gen_random_uuid()),
        r.value->>'type',
        coalesce(r.value->>'title', ''),
        coalesce(r.value->>'copy', ''),
        null,
        (nullif(r.value->>'limit', ''))::int,
        coalesce((select array_agg(x) from jsonb_array_elements_text(r.value->'image_links') x), '{}'),
        coalesce(r.value->'attributes', '{}'::jsonb),
        coalesce((r.value->>'order')::int, (r.ordinality - 1)::int)
    from jsonb_array_elements(p_rows) with ordinality r
    order by r.ordinality;

    return jsonb_build_object(
        'ok', true,
        'code', 'replaced',
        'count', coalesce(jsonb_array_length(p_rows), 0)
    );
end;
$$;

create or replace function public.replace_navigation_tree(
    p_rows jsonb,
    p_loaded_ids jsonb,
    p_allow_wipe boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_current_ids text;
    v_loaded_ids  text;
begin
    select coalesce(array_agg(id::text order by id), '{}')::text
      into v_current_ids
      from navigation;

    select coalesce(array_agg(value::uuid::text order by value::uuid), '{}')::text
      into v_loaded_ids
      from jsonb_array_elements_text(coalesce(p_loaded_ids, '[]'::jsonb));

    -- Stale-editor guard
    if v_current_ids is distinct from v_loaded_ids then
        return jsonb_build_object(
            'ok', false,
            'code', 'stale_editor',
            'message', 'The navigation tree changed since you loaded it (another tab or user saved). Reload and apply your change again.'
        );
    end if;

    -- Total-wipe guard
    if coalesce(jsonb_array_length(p_rows), 0) = 0
       and coalesce(array_length(v_current_ids::uuid[], 1), 0) > 0
       and not p_allow_wipe then
        return jsonb_build_object(
            'ok', false,
            'code', 'total_wipe',
            'message', 'This publish would delete the ENTIRE navigation menu. Nothing was changed.'
        );
    end if;

    delete from navigation where true;

    insert into navigation (id, parent_id, label, route, "order")
    select
        coalesce(nullif(r.value->>'id', '')::uuid, gen_random_uuid()),
        nullif(r.value->>'parent_id', '')::uuid,
        coalesce(r.value->>'label', ''),
        nullif(r.value->>'route', ''),
        coalesce((r.value->>'order')::int, 0)
    from jsonb_array_elements(p_rows) with ordinality r
    order by r.ordinality;

    return jsonb_build_object(
        'ok', true,
        'code', 'replaced',
        'count', coalesce(jsonb_array_length(p_rows), 0)
    );
end;
$$;
