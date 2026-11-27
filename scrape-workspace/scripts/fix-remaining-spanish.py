#!/usr/bin/env python3
"""Conservative cleanup for the Spanish strings the local translator left.

Only touches store-facing fields; `source` stays untouched.
"""
import glob
import json
import os
import re

ROOT = "/home/lordwhitefire/current-project/athletica"
DIR = f"{ROOT}/scrape-workspace/deliverables/products"
CACHE_PATH = f"{ROOT}/scrape-workspace/structures/translation-cache.json"

SPANISH = re.compile(
    r"[áéíóúñ¿¡]|\b(botas?|fútbol|futbol|césped|cesped|blanc[oa]s?|negr[oa]s?|"
    r"roj[oa]s?|azul(?:es)?|verdes?|amarill[oa]s?|naranjas?|rosas?|morad[oa]s?|"
    r"grises?|marron(?:es)?|jugadores?|unidad|espuma|tejido|suela|ajuste|"
    r"colección|coleccion|medias?|calcetines?|camiseta|camisetas|equipación|"
    r"equipacion|pantalón|pantalon|sudadera|chaqueta|gorra|guantes|portero|"
    r"balón|balon|espinilleras|niño|niña|mujer|hombre|entrenamiento|manga larga)\b",
    re.IGNORECASE,
)

FIXES = [
    (re.compile(r"\bChándals?\b", re.IGNORECASE), "Tracksuit"),
    (re.compile(r"\bEspaña\b", re.IGNORECASE), "Spain"),
    (re.compile(r"\bEspañol\b", re.IGNORECASE), "Spanish"),
    (re.compile(r"\bNiños?\b", re.IGNORECASE), "Kids"),
    (re.compile(r"\bNiñas?\b", re.IGNORECASE), "Kids"),
    (re.compile(r"\bIdentidad culé\b", re.IGNORECASE), "Culé identity"),
    (re.compile(r"\bculés?\b", re.IGNORECASE), "Barça"),
    (re.compile(r"\bPrecio\b", re.IGNORECASE), "Price"),
    (re.compile(r"\bstatement of price\b", re.IGNORECASE), "statement of pride"),
    (re.compile(r"\bNational price\b", re.IGNORECASE), "National pride"),
    (re.compile(r"\bplay and cheese\b", re.IGNORECASE), "play and enjoy"),
    (re.compile(r"\bDri-Fit 2\.0 Pole\b", re.IGNORECASE), "Dri-Fit 2.0 Jersey"),
    (re.compile(r"\bScrap\s+", re.IGNORECASE), ""),
    (re.compile(r"\bhood\b", re.IGNORECASE), "Hoodie"),
    (re.compile(r"\b2a\b", re.IGNORECASE), "2nd"),
    (re.compile(r"\b1a\b", re.IGNORECASE), "1st"),
    (re.compile(r"\b3a\b", re.IGNORECASE), "3rd"),
    (re.compile(r"\bBotellín\b", re.IGNORECASE), "Bottle"),
    (re.compile(r"\bTermo\b", re.IGNORECASE), "Thermo"),
    (re.compile(r"\bspinner with integrated media\b", re.IGNORECASE), "sock with integrated support"),
]


def apply_fixes(s):
    for rx, to in FIXES:
        s = rx.sub(to, s)
    return s


def main():
    cache = {}
    if os.path.exists(CACHE_PATH):
        try:
            cache = json.load(open(CACHE_PATH, encoding="utf-8"))
        except Exception:
            pass
    real = {k: v for k, v in cache.items() if k != v}

    changed = 0
    for path in glob.glob(os.path.join(DIR, "*.json")):
        try:
            p = json.load(open(path, encoding="utf-8"))
        except Exception:
            continue
        dirty = False
        d = p.get("description") or {}
        c = p.get("classification") or {}

        def fix_field(v):
            nonlocal dirty
            if not isinstance(v, str) or not v:
                return v
            nv = apply_fixes(v)
            if nv != v:
                dirty = True
                return nv
            if SPANISH.search(nv):
                hit = real.get(nv)
                if hit and hit != nv:
                    dirty = True
                    return hit
            return nv

        p["name"] = fix_field(p.get("name"))
        p["color"] = fix_field(p.get("color"))
        for k in ("subtitle", "tagline", "intro", "collection"):
            d[k] = fix_field(d.get(k))
        if isinstance(d.get("key_benefits"), list):
            d["key_benefits"] = [fix_field(b) for b in d["key_benefits"]]
        for k in ("root_model", "submodel", "product_model"):
            c[k] = fix_field(c.get(k))
        p["description"] = d
        p["classification"] = c

        if dirty:
            tmp = path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(p, f, ensure_ascii=False, indent=2)
            os.replace(tmp, path)
            changed += 1
    print(f"updated {changed} files")


if __name__ == "__main__":
    main()