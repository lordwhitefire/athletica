#!/usr/bin/env python3
"""Build the full Futbolmania menu from the adult (Boots page) and kids captures.

Every linked `amshopby-cat` category is kept: all levels, both audiences. This is the
site's own menu, not our 10-section subset.
"""
import json
from collections import Counter
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path("/home/lordwhitefire/current-project/athletica")
CAP = ROOT / "scrape-workspace/captures/futbolmania"
OUT = ROOT / "scrape-workspace/structures/futbolmania-menu.json"

SOURCES = [
    ("adult", CAP / "boots.html"),
    ("kids", CAP / "kids.html"),
]


def parse_menu(path: Path, audience: str):
    soup = BeautifulSoup(path.read_text(), "lxml")
    nav = soup.select_one("nav.amshopby-advanced")
    if nav is None:
        raise SystemExit(f"menu nav not found in {path}")
    items = []
    for li in nav.select("li.amshopby-cat"):
        a = li.find("a", recursive=False)
        if not a:
            continue
        link = a.select_one(".link")
        name = link.get_text(strip=True) if link else a.get_text(strip=True)
        href = a.get("href", "").strip()
        if not href:
            continue
        classes = li.get("class", [])
        level = next((c for c in classes if c.startswith("level")), "")

        parent = li.find_parent("li", class_="amshopby-cat")
        root = None
        while parent:
            if "level1" in parent.get("class", []):
                pa = parent.find("a", recursive=False)
                pl = pa.select_one(".link") if pa else None
                root = pl.get_text(strip=True) if pl else (pa.get_text(strip=True) if pa else None)
                break
            parent = parent.find_parent("li", class_="amshopby-cat")

        items.append(
            {
                "audience": audience,
                "root": root or name,
                "level": level,
                "name": name,
                "href": href,
            }
        )
    return items


items = []
for audience, path in SOURCES:
    items.extend(parse_menu(path, audience))

# De-duplicate by href (adult and kids URLs are distinct, but custom links can repeat).
seen = set()
unique = []
for it in items:
    if it["href"] in seen:
        continue
    seen.add(it["href"])
    unique.append(it)

# Root order: first appearance, grouped by audience then level1 name.
root_order = []
root_seen = set()
for it in unique:
    key = (it["audience"], it["root"])
    if key not in root_seen:
        root_seen.add(key)
        root_order.append({"audience": it["audience"], "root": it["root"]})

level_order = {"level1": 0, "level2": 1, "level3": 2, "level4": 3}
aud_order = {"adult": 0, "kids": 1}
root_index = {(r["audience"], r["root"]): i for i, r in enumerate(root_order)}
unique.sort(
    key=lambda x: (
        aud_order.get(x["audience"], 9),
        root_index.get((x["audience"], x["root"]), 99),
        level_order.get(x["level"], 9),
        x["name"],
    )
)

counts = Counter((it["audience"], it["root"]) for it in unique)
by_level = Counter(it["level"] for it in unique)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(
    json.dumps(
        {
            "source": "https://www.futbolmania.com/",
            "audiences": [a for a, _ in SOURCES],
            "captured_from": [str(p) for _, p in SOURCES],
            "root_order": root_order,
            "item_count": len(unique),
            "counts_by_root": {f"{a} / {r}": n for (a, r), n in counts.items()},
            "counts_by_level": dict(by_level),
            "items": unique,
        },
        indent=2,
        ensure_ascii=False,
    )
)

print(f"wrote {OUT} with {len(unique)} unique linked items")
print("by audience / root:")
for r in root_order:
    print(f"  {r['audience']:5} / {r['root']}: {counts[(r['audience'], r['root'])]}")
print("by level:", dict(by_level))