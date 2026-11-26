#!/usr/bin/env python3
"""Build the Futbolmania menu list from the saved Boots page capture.

The Boots page contains the full layered menu (nav.amshopby-advanced). We keep the
10 sections from the fetch plan and every linked category under them.
"""
import json
import re
from collections import Counter
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path("/home/lordwhitefire/current-project/athletica")
CAP = ROOT / "scrape-workspace/captures/futbolmania/boots.html"
OUT = ROOT / "scrape-workspace/structures/futbolmania-menu.json"

ROOT_NAMES = [
    "Botas de fútbol",
    "Camisetas de fútbol",
    "Equipaciones de fútbol",
    "Zapatillas fútbol sala",
    "Medias y calcetines",
    "Ropa entrenamiento",
    "Ropa de fútbol",
    "Botas multitaco",
    "Balón de fútbol",
    "Espinilleras fútbol",
]

html = CAP.read_text()
soup = BeautifulSoup(html, "lxml")
nav = soup.select_one("nav.amshopby-advanced")
if nav is None:
    raise SystemExit("menu nav not found in capture")

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

    # nearest level1 ancestor = section root
    parent = li.find_parent("li", class_="amshopby-cat")
    root = None
    while parent:
        if "level1" in parent.get("class", []):
            pa = parent.find("a", recursive=False)
            pl = pa.select_one(".link") if pa else None
            root = pl.get_text(strip=True) if pl else (pa.get_text(strip=True) if pa else None)
            break
        parent = parent.find_parent("li", class_="amshopby-cat")

    if root in ROOT_NAMES:
        items.append(
            {
                "root": root,
                "level": level,
                "name": name,
                "href": href,
            }
        )

# Add the 10 section roots themselves (they are the level1 links).
for li in nav.select("li.amshopby-cat.level1"):
    a = li.find("a", recursive=False)
    if not a:
        continue
    link = a.select_one(".link")
    name = link.get_text(strip=True) if link else a.get_text(strip=True)
    href = a.get("href", "").strip()
    if name in ROOT_NAMES:
        items.append({"root": name, "level": "level1", "name": name, "href": href})

# De-duplicate by href, keep first occurrence.
seen = set()
unique = []
for it in items:
    if it["href"] in seen:
        continue
    seen.add(it["href"])
    unique.append(it)

# Stable order: root order, then level, then name.
root_order = {r: i for i, r in enumerate(ROOT_NAMES)}
level_order = {"level1": 0, "level2": 1, "level3": 2, "level4": 3}
unique.sort(key=lambda x: (root_order.get(x["root"], 99), level_order.get(x["level"], 9), x["name"]))

counts = Counter(it["root"] for it in unique)
by_level = Counter(it["level"] for it in unique)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(
    json.dumps(
        {
            "source": "https://www.futbolmania.com/",
            "captured_from": str(CAP),
            "root_order": ROOT_NAMES,
            "item_count": len(unique),
            "counts_by_root": dict(counts),
            "counts_by_level": dict(by_level),
            "items": unique,
        },
        indent=2,
        ensure_ascii=False,
    )
)

print(f"wrote {OUT} with {len(unique)} unique linked items")
print("by root:")
for r in ROOT_NAMES:
    print(f"  {r}: {counts[r]}")
print("by level:", dict(by_level))