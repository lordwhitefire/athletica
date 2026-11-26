#!/usr/bin/env python3
"""Translate remaining Spanish store-facing fields with local OPUS-MT.

Resumable: every translated string is written to translation-cache.json.
The Spanish original stays in each product's `source` field.
"""
import glob
import json
import os
import re
import time

import torch
from transformers import MarianMTModel, MarianTokenizer

ROOT = "/home/lordwhitefire/current-project/athletica"
DIR = f"{ROOT}/scrape-workspace/deliverables/products"
CACHE_PATH = f"{ROOT}/scrape-workspace/structures/translation-cache.json"
MODEL = "Helsinki-NLP/opus-mt-es-en"
BATCH = 32

SPANISH = re.compile(
    r"[áéíóúñ¿¡]|\b(botas?|fútbol|futbol|césped|cesped|blanc[oa]s?|negr[oa]s?|"
    r"roj[oa]s?|azul(?:es)?|verdes?|amarill[oa]s?|naranjas?|rosas?|morad[oa]s?|"
    r"grises?|marron(?:es)?|jugadores?|unidad|espuma|tejido|suela|ajuste|"
    r"colección|coleccion|medias?|calcetines?|camiseta|camisetas|equipación|"
    r"equipacion|pantalón|pantalon|sudadera|chaqueta|gorra|guantes|portero|"
    r"balón|balon|espinilleras|niño|niña|mujer|hombre|entrenamiento|manga larga)\b",
    re.IGNORECASE,
)

FIXES = [(re.compile(r"\bDoorman\b"), "Goalkeeper")]


def fix(s):
    for rx, to in FIXES:
        s = rx.sub(to, s)
    return s


def load_cache():
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_cache(cache):
    tmp = CACHE_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)
    os.replace(tmp, CACHE_PATH)


def product_files():
    return sorted(glob.glob(os.path.join(DIR, "*.json")))


def field_strings(p):
    d = p.get("description") or {}
    vals = [p.get("name"), p.get("color")]
    vals += [d.get(k) for k in ("subtitle", "tagline", "intro", "collection")]
    vals += list(d.get("key_benefits") or [])
    c = p.get("classification") or {}
    vals += [c.get(k) for k in ("root_model", "submodel", "product_model")]
    return [v for v in vals if isinstance(v, str) and v.strip()]


def collect_missing(cache):
    missing = set()
    for path in product_files():
        try:
            with open(path, encoding="utf-8") as f:
                p = json.load(f)
        except Exception:
            continue
        for s in field_strings(p):
            if SPANISH.search(s):
                hit = cache.get(s)
                if hit is None or hit == s:
                    missing.add(s)
    return sorted(missing)


def load_model():
    torch.set_num_threads(4)
    tok = MarianTokenizer.from_pretrained(MODEL)
    model = MarianMTModel.from_pretrained(MODEL)
    return tok, model


def translate_batch(tok, model, texts):
    batch = tok(texts, return_tensors="pt", padding=True, truncation=True)
    gen = model.generate(**batch, max_length=128, num_beams=1)
    return tok.batch_decode(gen, skip_special_tokens=True)


def translate_missing(cache, missing, tok, model):
    total = len(missing)
    if not total:
        print("nothing to translate", flush=True)
        return
    print(f"translating {total} strings locally...", flush=True)
    t0 = time.time()
    for i in range(0, total, BATCH):
        chunk = missing[i:i + BATCH]
        try:
            outs = translate_batch(tok, model, chunk)
        except Exception as e:
            print(f"  batch error at {i}: {e}", flush=True)
            outs = chunk
        for s, out in zip(chunk, outs):
            cache[s] = fix(out) if out else s
        save_cache(cache)
        done = min(i + BATCH, total)
        rate = done / max(time.time() - t0, 0.001)
        print(f"  [{done}/{total}] {rate:.1f} strings/s", flush=True)


def apply_cache(cache):
    changed = 0
    for path in product_files():
        try:
            with open(path, encoding="utf-8") as f:
                p = json.load(f)
        except Exception:
            continue
        dirty = False
        if isinstance(p.get("name"), str) and SPANISH.search(p["name"]):
            hit = cache.get(p["name"])
            if hit and hit != p["name"]:
                p["name"] = hit
                dirty = True
        if isinstance(p.get("color"), str) and SPANISH.search(p["color"]):
            hit = cache.get(p["color"])
            if hit and hit != p["color"]:
                p["color"] = hit
                dirty = True
        d = p.get("description") or {}
        for k in ("subtitle", "tagline", "intro", "collection"):
            v = d.get(k)
            if isinstance(v, str) and SPANISH.search(v):
                hit = cache.get(v)
                if hit and hit != v:
                    d[k] = hit
                    dirty = True
        benefits = d.get("key_benefits")
        if isinstance(benefits, list):
            new = []
            for b in benefits:
                if isinstance(b, str) and SPANISH.search(b):
                    hit = cache.get(b)
                    if hit and hit != b:
                        new.append(hit)
                        dirty = True
                    else:
                        new.append(b)
                else:
                    new.append(b)
            d["key_benefits"] = new
        c = p.get("classification") or {}
        for k in ("root_model", "submodel", "product_model"):
            v = c.get(k)
            if isinstance(v, str) and SPANISH.search(v):
                hit = cache.get(v)
                if hit and hit != v:
                    c[k] = hit
                    dirty = True
        if dirty:
            p["description"] = d
            p["classification"] = c
            tmp = path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(p, f, ensure_ascii=False, indent=2)
            os.replace(tmp, path)
            changed += 1
    print(f"updated {changed} product files", flush=True)


def main():
    cache = load_cache()
    print(f"cache: {len(cache)} entries", flush=True)
    missing = collect_missing(cache)
    print(f"missing: {len(missing)} unique strings", flush=True)
    tok, model = load_model()
    print("model loaded", flush=True)
    if missing:
        translate_missing(cache, missing, tok, model)
    apply_cache(cache)
    print("done", flush=True)


if __name__ == "__main__":
    main()