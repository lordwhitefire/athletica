-- =====================================================================
-- FR4-C — Navigation stale-save guard must detect CONTENT changes
--
-- Defect (tester blocker B4): replace_navigation_tree compared only the
-- row-ID SET against what the editor loaded. Renames and reorders upsert
-- the SAME ids, so a second tab could silently overwrite the first tab's
-- saved labels — exactly what the two-tab probe demonstrated.
--
-- Fix: a deterministic content fingerprint over every row
-- (id | parent_id | label | route | order), computed at load time and
-- again inside the guarded publish; any drift rejects with stale_editor.
-- The fingerprint is an OPTIONAL trailing parameter so existing callers
-- keep working until they opt in.
-- =====================================================================

-- Deterministic fingerprint of the current navigation content.
create or replace function public.navigation_content_fingerprint()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select md5(coalesce(string_agg(
        n.id::text || '|' || coalesce(n.parent_id::text, '') || '|' ||
        coalesce(n.label, '') || '|' || coalesce(n.route, '') || '|' ||
        (n."order")::text,
        E'\n'
        order by n.id
    ), ''))
    from navigation n;
$$;

create or replace function public.replace_navigation_tree(
    p_rows jsonb,
    p_loaded_ids jsonb,
    p_allow_wipe boolean default false,
    p_loaded_fingerprint text default ''
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

    -- Stale-editor guard (identity: rows added/removed elsewhere).
    if v_current_ids is distinct from v_loaded_ids then
        return jsonb_build_object(
            'ok', false,
            'code', 'stale_editor',
            'message', 'The navigation tree changed since you loaded it (another tab or user saved). Reload and apply your change again.'
        );
    end if;

    -- Stale-editor guard (content: renames/reorders keep row ids, so the
    -- id set alone cannot detect concurrent edits — tester blocker B4).
    if coalesce(p_loaded_fingerprint, '') <> ''
       and p_loaded_fingerprint is distinct from public.navigation_content_fingerprint() then
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
