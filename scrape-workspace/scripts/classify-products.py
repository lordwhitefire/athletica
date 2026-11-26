#!/usr/bin/env python3
"""Classify the extracted Futbolmania products into the store taxonomy, clean names to English,
and write import-ready product files + categories/models.

Futbolmania's menu is source metadata only. The store category comes from the product itself.
"""
import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path("/home/lordwhitefire/current-project/athletica")
RAW_DIR = ROOT / "scrape-workspace/structures/futbolmania-products-raw"
OUT_DIR = ROOT / "scrape-workspace/deliverables/products"
CLS_DIR = ROOT / "scrape-workspace/deliverables/classification"
REV_DIR = ROOT / "scrape-workspace/validations"
for d in (OUT_DIR, CLS_DIR, REV_DIR):
    d.mkdir(parents=True, exist_ok=True)

CATEGORIES = [
    ("boots", "Boots"),
    ("multi-stud-boots", "Multi-Stud Boots"),
    ("indoor-shoes", "Indoor Shoes"),
    ("jerseys", "Jerseys"),
    ("kits", "Kits"),
    ("socks", "Socks"),
    ("shin-guards", "Shin Guards"),
    ("balls", "Balls"),
    ("goalkeeper-gloves", "Goalkeeper Gloves"),
    ("apparel", "Apparel"),
    ("clothing", "Clothing"),
    ("accessories", "Accessories"),
]
CAT_NAMES = {slug: name for slug, name in CATEGORIES}

BRANDS = {
    "adidas": "adidas", "nike": "Nike", "puma": "Puma", "new balance": "New Balance",
    "mizuno": "Mizuno", "joma": "Joma", "kelme": "Kelme", "lotto": "Lotto",
    "munich": "Munich", "diadora": "Diadora", "errea": "Errea", "macron": "Macron",
    "under armour": "Under Armour", "umbro": "Umbro", "castore": "Castore",
    "hummel": "Hummel", "select": "Select", "spalding": "Spalding", "wilson": "Wilson",
    "molten": "Molten", "mitre": "Mitre", "reebok": "Reebok", "asics": "ASICS",
    "brooks": "Brooks", "saucony": "Saucony", "victas": "VICTAS", "dhs": "DHS",
    "jart": "Jart", "joma": "Joma", "activa": "Activa", "fifa": "FIFA",
}

SPANISH_CHARS = re.compile(r"[áéíóúñ¿¡]")
SPANISH_WORDS = re.compile(
    r"\b(botas?|fútbol|futbol|césped|cesped|blanc[oa]s?|negr[oa]s?|roj[oa]s?|azul(?:es)?|"
    r"verdes?|amarill[oa]s?|naranjas?|rosas?|morad[oa]s?|grises?|marron(?:es)?|jugadores?|"
    r"unidad|espuma|tejido|suela|ajuste|colección|coleccion|medias?|calcetines?|camiseta|"
    r"camisetas|equipación|equipacion|pantalón|pantalon|sudadera|chaqueta|gorra|guantes|"
    r"portero|balón|balon|espinilleras)\b",
    re.I,
)

LEADING_TYPE = re.compile(
    r"^(botas de f[uú]tbol|botas|zapatillas de f[uú]tbol|zapatillas|cami?setas?|"
    r"equipaciones?|medias|calcetines|espinilleras|balones|bal[oó]n|guantes|gorras?|"
    r"sudaderas?|chaquetas?|pantalones?|pantal[oó]n|shorts?|ropa|accesorios?)\s+",
    re.I,
)
TRAILING_COLOUR = re.compile(
    r"\s+(-|–|—)?\s*(color\s+)?(blanc[oa]s?|negr[oa]s?|roj[oa]s?|azul(?:es)?|verdes?|"
    r"amarill[oa]s?|naranjas?|rosas?|morad[oa]s?|grises?|marron(?:es)?|dorad[oa]s?|"
    r"platead[oa]s?|blanco y negro|blanco rosa|azul verde)\s*$",
    re.I,
)
TRAILING_PARA = re.compile(r"\s+para\s+.*$", re.I)


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def norm(s: str) -> str:
    return strip_accents(s or "").lower().strip()


def slugify(s: str) -> str:
    s = strip_accents(s or "").lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def clean_name(name: str) -> str:
    s = (name or "").strip()
    s = LEADING_TYPE.sub("", s)
    s = TRAILING_PARA.sub("", s)
    s = TRAILING_COLOUR.sub("", s)
    s = re.sub(r"\s+", " ", s).strip(" -–—")
    return s or (name or "").strip()


def has_spanish(text: str) -> bool:
    if not text:
        return False
    return bool(SPANISH_CHARS.search(text) or SPANISH_WORDS.search(text))


def normalize_brand(brand: str) -> str:
    b = (brand or "").strip()
    key = norm(b)
    if key in BRANDS:
        return BRANDS[key]
    return b.title() if b else ""


BOOT_MODELS = [
    "copa", "f50", "predator", "tiempo", "phantom", "mercurial", "future", "king",
    "ultra", "vapor", "superfly", "magista", "nemeziz", "messi", "x", "adizero",
]
BOOT_BRANDS = {
    "nike", "adidas", "puma", "new balance", "mizuno", "joma", "kelme", "lotto",
    "munich", "diadora", "errea", "macron", "umbro", "under armour",
}


def detect_category(name: str, src_category: str, brand: str = "") -> tuple[str, str, str]:
    n = norm(name)
    src = norm(src_category)
    b = norm(brand)
    if b in BOOT_BRANDS and any(k in n for k in BOOT_MODELS):
        return "boots", "high", "boot model"
    if "entrenamiento" in n or "training" in n:
        return "apparel", "high", "name contains training"
    rules = [
        ("goalkeeper-gloves", ["guante", "guantes", "portero", "glove", "goalkeeper"]),
        ("balls", ["balon", "balones", "ball", "pelota"]),
        ("shin-guards", ["espinillera", "shin"]),
        ("socks", ["media", "medias", "calcetin", "sock"]),
        ("indoor-shoes", ["sala", "indoor", "futsal"]),
        ("multi-stud-boots", ["multitaco", "multi-taco", "multi stud", "multitacos"]),
        ("boots", ["bota", "botas", "botin", "cleat", "boot", "zapatilla", "taco"]),
        ("jerseys", ["camiseta", "jersey", "shirt", "camisola"]),
        ("kits", ["equipacion", "kit", "conjunto", "set"]),
        ("apparel", ["sudadera", "chaqueta", "pantalon", "short", "entrenamiento", "training", "top", "polo"]),
        ("clothing", ["ropa", "camiseta", "pantalon", "sudadera", "chaqueta", "short", "venda", "braga", "gorro", "buffer"]),
        ("accessories", ["gorra", "cap", "bolsa", "mochila", "botella", "bottle", "llavero", "lanyard", "necesser", "toalla", "cinta", "bolso", "accesorio"]),
    ]
    for cat, words in rules:
        for w in words:
            if w in n:
                # boots: avoid "zapatilla" without football context
                if cat == "boots" and w == "zapatilla" and not ("futbol" in n or "soccer" in n or "taco" in n):
                    continue
                return cat, "high", f"name contains '{w}'"
    # source fallback (menu metadata, not the store category)
    src_map = {
        "botas": "boots", "multitaco": "multi-stud-boots", "zapatillas": "indoor-shoes",
        "camisetas": "jerseys", "equipaciones": "kits", "medias": "socks",
        "espinilleras": "shin-guards", "balones": "balls", "porteros": "goalkeeper-gloves",
        "accesorios": "accessories", "ropa": "clothing", "ofertas": "accessories",
        "equipos": "accessories",
    }
    for key, cat in src_map.items():
        if key in src:
            return cat, "medium", f"source fallback '{key}'"
    return "accessories", "low", "no rule matched"


SOLE_RE = re.compile(r"\b(AG-PRO|FG-PRO|SG-PRO|AG|FG|SG|MG|TF|IC|HG|XF|CL|MX)\b", re.I)


def parse_model(name: str, brand: str, category: str) -> tuple[str, str, str, str]:
    s = clean_name(name)
    if brand:
        s = re.sub(rf"^{re.escape(brand)}\s+", "", s, flags=re.I).strip()
    sole = ""
    m = SOLE_RE.search(s)
    if m:
        sole = m.group(1).upper()
        s = (s[: m.start()] + s[m.end():]).strip()
    s = re.sub(r"\s+", " ", s).strip(" -–—")
    if not s:
        return s, "", "", sole
    if category in ("boots", "multi-stud-boots", "indoor-shoes"):
        parts = s.split(" ")
        root = parts[0]
        sub = " ".join(parts[1:]).strip()
        return root, sub, s, sole
    # non-boots: use the first 1-2 words as root if they look like a team/league
    team_words = {"real", "barcelona", "madrid", "manchester", "city", "united", "liverpool",
                  "arsenal", "chelsea", "bayern", "dortmund", "juventus", "milan", "inter",
                  "psg", "ajax", "porto", "benfica", "la", "liga", "serie", "a", "premier"}
    words = s.split(" ")
    root = " ".join(words[:2]) if len(words) > 1 and norm(words[0]) in team_words else words[0]
    return root, "", s, sole


def existing_sanity(file_id: str):
    p = OUT_DIR / f"{file_id}.json"
    if not p.exists():
        return None
    try:
        d = json.loads(p.read_text())
    except Exception:
        return None
    if d.get("sanity_assets") or d.get("main_image", "").startswith("https://cdn.sanity.io/"):
        return d
    return None


def main():
    files = sorted(RAW_DIR.glob("*.json"))
    products = []
    cat_counts = Counter()
    conf_counts = Counter()
    brand_counts = Counter()
    aud_counts = Counter()
    gender_counts = Counter()
    spanish = []
    low_conf = []

    for f in files:
        try:
            raw = json.loads(f.read_text())
        except Exception:
            continue
        if not raw.get("id"):
            continue

        name = clean_name(raw.get("name", ""))
        brand = normalize_brand(raw.get("brand", ""))
        cat, conf, rule = detect_category(raw.get("name", ""), raw.get("source", {}).get("category", ""), raw.get("brand", ""))
        root, sub, product_model, sole = parse_model(raw.get("name", ""), brand, cat)
        traction = sole if cat in ("boots", "multi-stud-boots") else None
        color = raw.get("color", "")
        audience = raw.get("audience", "adult")
        gender = raw.get("gender", "Unisex")
        nname = norm(raw.get("name", ""))
        if re.search(r"\b(nino|nina|kids|infantil)\b", nname):
            gender = "Kids"
            audience = "kids"
        elif re.search(r"\b(mujer|women)\b", nname):
            gender = "Women"
        elif re.search(r"\b(hombre|men)\b", nname):
            gender = "Men"

        desc = raw.get("description", {}) or {}
        # Spanish audit on store-facing text
        texts = [name, desc.get("subtitle", ""), desc.get("tagline", ""), desc.get("intro", ""),
                 desc.get("collection", ""), color] + list(desc.get("key_benefits", []) or [])
        if any(has_spanish(t) for t in texts):
            spanish.append(raw["id"])

        if conf == "low":
            low_conf.append(raw["id"])

        file_id = re.sub(r"[^A-Za-z0-9._-]+", "-", raw["id"]).strip("-") or "product"
        old = existing_sanity(file_id)

        source_gallery = (raw.get("images", {}) or {}).get("source_gallery", []) or []
        if old:
            main_image = old.get("main_image") or (source_gallery[0] if source_gallery else "")
            gallery = old.get("image_gallery", [])
            image_links = old.get("image_links", [])
            sanity_assets = old.get("sanity_assets", [])
        else:
            main_image = source_gallery[0] if source_gallery else ""
            gallery = source_gallery[1:] if len(source_gallery) > 1 else []
            image_links = source_gallery[:]
            sanity_assets = []

        menu = []
        seen_roots = set()
        for m in raw.get("menu_items", []) or []:
            key = (m.get("audience"), m.get("root"))
            if key in seen_roots:
                continue
            seen_roots.add(key)
            menu.append({"audience": m.get("audience"), "root": m.get("root")})

        variants = []
        seen_colors = {norm(color)}
        for v in raw.get("color_variants", []) or []:
            vc = v.get("color", "")
            if norm(vc) in seen_colors:
                continue
            seen_colors.add(norm(vc))
            variants.append({
                "color": vc,
                "sku": v.get("sku", ""),
                "product_id": slugify(f"{name}-{vc}"),
                "thumbnail": "",
                "source_image": v.get("source_image", ""),
            })

        product = {
            "id": raw["id"],
            "slug": raw.get("slug") or slugify(f"{name}-{color}"),
            "name": name,
            "model": product_model or name,
            "brand": brand,
            "category": CAT_NAMES[cat],
            "category_slug": cat,
            "audience": audience,
            "gender": gender,
            "color": color,
            "color_variants": variants,
            "price": raw.get("price") or {"current": 0, "original": 0, "discount_percent": 0, "member_price": 0, "currency": "€"},
            "sizes": [],
            "description": {
                "subtitle": desc.get("subtitle", ""),
                "tagline": desc.get("tagline", ""),
                "intro": desc.get("intro", ""),
                "collection": desc.get("collection", ""),
                "key_benefits": desc.get("key_benefits", []) or [],
                "technical_details": desc.get("technical_details", {}) or {},
            },
            "traction": traction,
            "asin": None,
            "status": raw.get("status", "published"),
            "main_image": main_image,
            "thumbnail": main_image,
            "image_gallery": gallery,
            "image_links": image_links,
            "sanity_assets": sanity_assets,
            "source": {
                **(raw.get("source", {}) or {}),
                "menu": menu,
                "futbolmania_url": (raw.get("source", {}) or {}).get("url", ""),
            },
            "classification": {
                "category": cat,
                "confidence": conf,
                "rule": rule,
                "root_model": root,
                "submodel": sub,
                "product_model": product_model or name,
                "sole_type": sole,
            },
        }
        (OUT_DIR / f"{file_id}.json").write_text(json.dumps(product, indent=2, ensure_ascii=False))

        cat_counts[cat] += 1
        conf_counts[conf] += 1
        brand_counts[brand] += 1
        aud_counts[audience] += 1
        gender_counts[gender] += 1
        products.append(product)

    # categories.json
    (CLS_DIR / "categories.json").write_text(json.dumps(
        [{"id": slug, "slug": slug, "name": name} for slug, name in CATEGORIES], indent=2))

    # models.json — flat list + simple tree
    models = {}
    for p in products:
        c = p["classification"]
        key = (p["brand"], c["category"], c["root_model"], c["submodel"], c["product_model"])
        if key not in models:
            models[key] = {
                "id": slugify(" ".join(x for x in key if x)),
                "slug": slugify(" ".join(x for x in key if x)),
                "name": c["product_model"] or p["name"],
                "brand": p["brand"],
                "category": p["category"],
                "root_model": c["root_model"],
                "submodel": c["submodel"],
                "product_model": c["product_model"] or p["name"],
                "level": 3,
                "products": [],
            }
        models[key]["products"].append(p["id"])
    model_list = sorted(models.values(), key=lambda x: (x["brand"], x["root_model"], x["name"]))
    (CLS_DIR / "models.json").write_text(json.dumps(model_list, indent=2, ensure_ascii=False))

    # summary.md
    lines = [
        "# Classification summary",
        "",
        f"Products: **{len(products)}**",
        "",
        "## Categories",
        "",
        "| Category | Products |",
        "|---|---:|",
    ]
    for slug, name in CATEGORIES:
        lines.append(f"| {name} | {cat_counts[slug]} |")
    lines += [
        "",
        "## Confidence",
        "",
        "| Confidence | Products |",
        "|---|---:|",
    ]
    for k in ("high", "medium", "low"):
        lines.append(f"| {k} | {conf_counts[k]} |")
    lines += [
        "",
        "## Audience / gender",
        "",
        "| Audience | Products |",
        "|---|---:|",
    ]
    for k, v in aud_counts.most_common():
        lines.append(f"| {k} | {v} |")
    lines += ["", "| Gender | Products |", "|---|---:|"]
    for k, v in gender_counts.most_common():
        lines.append(f"| {k} | {v} |")
    lines += [
        "",
        "## Brands (top 20)",
        "",
        "| Brand | Products |",
        "|---|---:|",
    ]
    for k, v in brand_counts.most_common(20):
        lines.append(f"| {k} | {v} |")
    lines += [
        "",
        "## Spanish audit",
        "",
        f"Store-facing fields with Spanish: **{len(spanish)}**",
        "",
        "## Low-confidence",
        "",
        f"Low-confidence products: **{len(low_conf)}**",
        "",
    ]
    (CLS_DIR / "summary.md").write_text("\n".join(lines) + "\n")

    # review.md
    review = ["# Review list", "", "## Spanish in store-facing fields", ""]
    review += [f"- {x}" for x in spanish[:200]]
    review += ["", "## Low-confidence classification", ""]
    review += [f"- {x}" for x in low_conf[:200]]
    (CLS_DIR / "review.md").write_text("\n".join(review) + "\n")

    print(f"products: {len(products)}")
    print("categories:", {CAT_NAMES[k]: v for k, v in cat_counts.most_common()})
    print("confidence:", dict(conf_counts))
    print("spanish:", len(spanish), "low_conf:", len(low_conf))
    print("wrote", CLS_DIR, OUT_DIR)


if __name__ == "__main__":
    main()