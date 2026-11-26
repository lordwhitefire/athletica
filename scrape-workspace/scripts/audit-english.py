#!/usr/bin/env python3
"""Audit store-facing fields for remaining Spanish. Read-only."""
import glob
import json
import os
import re

ROOT = "/home/lordwhitefire/current-project/athletica"
DIR = f"{ROOT}/scrape-workspace/deliverables/products"
CACHE_PATH = f"{ROOT}/scrape-workspace/structures/translation-cache.json"
OUT = f"{ROOT}/scrape-workspace/deliverables/translation/english-audit.json"

SPANISH = re.compile(
    r"[áéíóúñ¿¡]|\b(botas?|fútbol|futbol|césped|cesped|blanc[oa]s?|negr[oa]s?|"
    r"roj[oa]s?|azul(?:es)?|verdes?|amarill[oa]s?|naranjas?|rosas?|morad[oa]s?|"
    r"grises?|marron(?:es)?|jugadores?|unidad|espuma|tejido|suela|ajuste|"
    r"colección|coleccion|medias?|calcetines?|camiseta|camisetas|equipación|"
    r"equipacion|pantalón|pantalon|sudadera|chaqueta|gorra|guantes|portero|"
    r"balón|balon|espinilleras|niño|niña|mujer|hombre|entrenamiento|manga larga)\b",
    re.IGNORECASE,
)

FIELDS = ("name", "color", "description.subtitle", "description.tagline",
          "description.intro", "description.collection", "key_benefits",
          "classification.root_model", "classification.submodel",
          "classification.product_model")


def check(s):
    return isinstance(s, str) and bool(SPANISH.search(s))


def main():
    cache = {}
    if os.path.exists(CACHE_PATH):
        try:
            cache = json.load(open(CACHE_PATH, encoding="utf-8"))
        except Exception:
            pass
    real = {k: v for k, v in cache.items() if k != v}

    files = glob.glob(os.path.join(DIR, "*.json"))
    bad_files = 0
    field_counts = {}
    missing = set()
    examples = []
    for path in files:
        try:
            p = json.load(open(path, encoding="utf-8"))
        except Exception:
            continue
        hits = []
        d = p.get("description") or {}
        c = p.get("classification") or {}
        candidates = [
            ("name", p.get("name")),
            ("color", p.get("color")),
            ("description.subtitle", d.get("subtitle")),
            ("description.tagline", d.get("tagline")),
            ("description.intro", d.get("intro")),
            ("description.collection", d.get("collection")),
            ("classification.root_model", c.get("root_model")),
            ("classification.submodel", c.get("submodel")),
            ("classification.product_model", c.get("product_model")),
        ]
        for b in d.get("key_benefits") or []:
            candidates.append(("key_benefits", b))
        for name, val in candidates:
            if check(val):
                hits.append(name)
                field_counts[name] = field_counts.get(name, 0) + 1
                if val not in real:
                    missing.add(val)
        if hits:
            bad_files += 1
            if len(examples) < 10:
                examples.append({"file": os.path.basename(path), "fields": hits[:4]})

    report = {
        "product_files": len(files),
        "files_with_spanish": bad_files,
        "field_counts": dict(sorted(field_counts.items(), key=lambda x: -x[1])),
        "unique_missing_strings": len(missing),
        "cache_real_translations": len(real),
        "examples": examples,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(json.dumps({k: v for k, v in report.items() if k != "examples"}, indent=2))
    print("examples:")
    for e in examples:
        print(" ", e)


if __name__ == "__main__":
    main()