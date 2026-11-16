# INV-01: Rainforest single-ASIN pull — field inventory (probe before architecture)

## What and why

Run **one** Rainforest API product call for a real ASIN the owner wants to sell, capture the full response, and make a field inventory: which fields come back populated, what the values look like, and which are empty or missing. This is a probe **before** we write any architecture. The ingestion design and the research-agent spec must be based on what an ASIN actually gives us — not on guesses.

## Who does what

- A tiny standalone script is written (not inside `rollout/` or `frontend/`).
- The **owner runs it** with their own Rainforest API key (never committed) and reviews the output.
- **No testing.md.** The owner supervises this experiment directly and reads the findings with their own eyes.

## What success looks like

- Exactly **1 Rainforest request** is spent.
- The raw JSON response for one ASIN is saved to a file so we can re-read it.
- A **field inventory** exists: for each field Rainforest returned, is it populated or empty, what type is it, what does a sample value look like.
- A **two-column list** exists (the whole point of this probe):
  - "Rainforest gives us — " (fields we can trust and display)
  - "The research agent must supply — " (fields that are empty/missing and need research)
- No code lands in `rollout/` or `frontend/`. No schema changes. No database writes. No architecture documents yet.

## Context

- Rainforest product endpoint (lookup by ASIN):
  ```
  GET https://api.rainforestapi.com/request?type=product&asin=<ASIN>&amazon_domain=amazon.com&api_key=<KEY>
  ```
- We have ~100 requests available. This probe spends 1.
- The owner picks the ASIN (a product they actually intend to sell).
- The rollout schema we already have expects these fields — map the inventory against them so we see exactly what is covered and what is missing:
  `name`, `slug`, `price`, `asin`, `gender`, `color`, `collection`, `tagline`, `subtitle`, `intro`, `key_benefits`, `technical_details`, `adjustment`, `range`, `sole_type`, `upper_material`, `traction`, `main_image`, `images[]`, `meta`, `tags[]`, `box_contents`, `sizes`, `sizes_detail`, plus `availability`/`stock status` (not in the schema yet — the inventory should show what Rainforest offers for it).

## Steps (in order)

1. **Owner picks one ASIN** for a product they want to sell.
2. **Write a tiny Node script** (`inv01.mjs`, standalone, outside the apps):
   - ASIN + API key come from args/env vars — **never hardcode or commit the key**.
   - Calls the Rainforest product endpoint once.
   - Saves the full JSON response to a file (e.g. `inv-01-<asin>.json`).
   - Prints a compact field inventory: field name, type, populated/empty, truncated sample value.
3. **Owner runs it** (their key, their machine):
   ```
   node inv01.mjs <ASIN>
   ```
   AGENTS.md: the owner runs this command — the script writer must not run it autonomously.
4. **Owner reviews the printed inventory + raw JSON**, and together with the Architect writes the two-column list (gives us vs agent must supply).

## Boundaries

- **1 request only.** No retry loops, no pagination, no additional endpoints.
- API key read from environment — never committed to any file, never pasted into tasks docs.
- Do not modify `rollout/`, `frontend/`, `studio-athletica/`, the Supabase schema, or the database.
- Do not design the ingestion pipeline or the research agent yet — that happens after this output is reviewed.
- Do not write architecture documents based on assumptions; only on this finding.

## Benchmarks (what must be true after this)

- The raw Rainforest JSON for one chosen ASIN exists in a file.
- A field inventory exists, mapped against the rollout schema fields above, marking populated vs empty.
- A two-column list exists: "Rainforest gives us" / "the research agent must supply".
- Exactly one request consumed.
- Nothing in the apps, schema, or database changed.