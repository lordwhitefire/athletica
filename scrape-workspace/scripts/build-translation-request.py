#!/usr/bin/env python3
"""Build a self-contained translation request for the remaining Spanish product text.

Outputs:
- deliverables/translation/translation-request.json  (strings + context + product index)
- deliverables/translation/translation-request.csv   (one row per unique string)
- deliverables/translation/README.md                 (instructions + return format)
"""
import csv
import hashlib
import json
import re
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path("/home/lordwhitefire/current-project/athletica")
PROD_DIR = ROOT / "scrape-workspace/deliverables/products"
OUT_DIR = ROOT / "scrape-workspace/deliverables/translation"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SPANISH = re.compile(
    r"[áéíóúñ¿¡]|\b(botas?|fútbol|futbol|césped|cesped|blanc[oa]s?|negr[oa]s?|roj[oa]s?|"
    r"azul(?:es)?|verdes?|amarill[oa]s?|naranjas?|rosas?|morad[oa]s?|grises?|marron(?:es)?|"
    r"jugadores?|unidad|espuma|tejido|suela|ajuste|colección|coleccion|medias?|calcetines?|"
    r"camiseta|camisetas|equipación|equipacion|pantalón|pantalon|sudadera|chaqueta|gorra|"
    r"guantes|portero|balón|balon|espinilleras|niño|niña|mujer|hombre|entrenamiento|"
    r"manga larga)\b",
    re.I,
)


def has_spanish(text: str) -> bool:
    return bool(text and SPANISH.search(text))


def collect_fields(p: dict):
    out = []
    name = p.get("name", "")
    if has_spanish(name):
        out.append(("name", name))
    desc = p.get("description", {}) or {}
    for key in ("subtitle", "tagline", "intro", "collection"):
        value = desc.get(key, "")
        if has_spanish(value):
            out.append((f"description.{key}", value))
    for i, benefit in enumerate(desc.get("key_benefits", []) or []):
        if has_spanish(benefit):
            out.append((f"description.key_benefits[{i}]", benefit))
    color = p.get("color", "")
    if has_spanish(color):
        out.append(("color", color))
    cls = p.get("classification", {}) or {}
    for key in ("root_model", "submodel", "product_model"):
        value = cls.get(key, "")
        if has_spanish(value):
            out.append((f"classification.{key}", value))
    return out


strings = {}
products = []
files = sorted(PROD_DIR.glob("*.json"))
for f in files:
    try:
        p = json.loads(f.read_text())
    except Exception:
        continue
    fields = collect_fields(p)
    if not fields:
        continue
    products.append(
        {
            "product_id": p.get("id", ""),
            "brand": p.get("brand", ""),
            "category": p.get("category", ""),
            "model": p.get("model", ""),
            "color": p.get("color", ""),
            "fields": [
                {"field": field, "text": text} for field, text in fields
            ],
        }
    )
    for field, text in fields:
        key = text.strip()
        if not key:
            continue
        sid = "s-" + hashlib.sha1(key.encode("utf-8")).hexdigest()[:12]
        entry = strings.setdefault(
            sid,
            {
                "id": sid,
                "text": key,
                "fields": set(),
                "products": [],
                "brands": set(),
                "categories": set(),
                "models": set(),
            },
        )
        entry["fields"].add(field)
        if len(entry["products"]) < 4 and p.get("id") not in entry["products"]:
            entry["products"].append(p.get("id", ""))
        if p.get("brand"):
            entry["brands"].add(p["brand"])
        if p.get("category"):
            entry["categories"].add(p["category"])
        if p.get("model"):
            entry["models"].add(p["model"])

string_list = []
for sid, entry in sorted(strings.items(), key=lambda kv: kv[1]["text"]):
    string_list.append(
        {
            "id": sid,
            "text": entry["text"],
            "fields": sorted(entry["fields"]),
            "context": {
                "brands": sorted(entry["brands"]),
                "categories": sorted(entry["categories"]),
                "models": sorted(entry["models"]),
                "example_products": entry["products"],
            },
        }
    )

meta = {
    "source": "Futbolmania product catalogue — Athletica",
    "language_from": "es",
    "language_to": "en",
    "generated": date.today().isoformat(),
    "products_with_spanish": len(products),
    "unique_strings": len(string_list),
    "instructions": (
        "Translate every `text` into English. Keep brand names, model names, SKUs, "
        "team/league names and other proper nouns unchanged. Preserve the product "
        "context and tone. Return a JSON object: "
        '{"translations":[{"id":"s-...","translation":"..."}]} or a CSV with columns id,translation.'
    ),
}

(OUT_DIR / "translation-request.json").write_text(
    json.dumps(
        {
            "meta": meta,
            "strings": string_list,
            "products": products,
        },
        indent=2,
        ensure_ascii=False,
    )
)

with (OUT_DIR / "translation-request.csv").open("w", newline="") as fh:
    writer = csv.writer(fh)
    writer.writerow(["id", "text", "fields", "brands", "categories", "models", "example_products"])
    for s in string_list:
        writer.writerow(
            [
                s["id"],
                s["text"],
                " | ".join(s["fields"]),
                " | ".join(s["context"]["brands"]),
                " | ".join(s["context"]["categories"]),
                " | ".join(s["context"]["models"]),
                " | ".join(s["context"]["example_products"]),
            ]
        )

readme = f"""# Translation request — Futbolmania → English

Generated: {meta['generated']}
Products with Spanish text: **{meta['products_with_spanish']}**
Unique strings: **{meta['unique_strings']}**

## Files

- `translation-request.json` — full request: `meta`, `strings` (unique text + context), `products`
  (the product context for each affected product).
- `translation-request.csv` — one row per unique string, for easy reading.

## What to translate

Every `text` in `strings` (or the `text` column in the CSV). Translate to English.

Rules:

- Keep brand names, model names, SKUs, team/league names and other proper nouns unchanged.
- Keep the meaning, tone and product context.
- Do not translate the `id` values.

## Return format

Return a JSON file:

```json
{{"translations": [
  {{"id": "s-...", "translation": "..."}}
]}}
```

or a CSV with columns `id,translation`.

## How it is merged back

The `id` is a stable hash of the source text. The returned translations are matched by `id`
and written into the product files; the Spanish original stays in `source`.
"""
(OUT_DIR / "README.md").write_text(readme)

print(f"products with Spanish: {len(products)}")
print(f"unique strings: {len(string_list)}")
print(f"wrote {OUT_DIR}")