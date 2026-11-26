#!/usr/bin/env python3
"""Summarise the Futbolmania menu product counts into CSV + Markdown."""
import csv
import json
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path("/home/lordwhitefire/current-project/athletica")
MENU = json.loads((ROOT / "scrape-workspace/structures/futbolmania-menu.json").read_text())
COUNTS = json.loads((ROOT / "scrape-workspace/structures/futbolmania-product-counts.json").read_text())
OUT_CSV = ROOT / "scrape-workspace/structures/futbolmania-product-counts.csv"
OUT_MD = ROOT / "scrape-workspace/structures/futbolmania-product-counts.md"

rows = []
for item in MENU["items"]:
    c = COUNTS.get(item["href"], {})
    rows.append(
        {
            "root": item["root"],
            "level": item["level"],
            "name": item["name"],
            "href": item["href"],
            "pages": c.get("pages", ""),
            "page1": c.get("page1", ""),
            "last": c.get("last", ""),
            "total": c.get("total", ""),
            "status": "ok" if "total" in c else (c.get("error") or "pending"),
        }
    )

# CSV
with OUT_CSV.open("w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["root", "level", "name", "href", "pages", "page1", "last", "total", "status"])
    w.writeheader()
    w.writerows(rows)

# Per-root stats
by_root = defaultdict(list)
for r in rows:
    by_root[r["root"]].append(r)

root_stats = []
for root in MENU["root_order"]:
    items = by_root.get(root, [])
    totals = [r["total"] for r in items if isinstance(r["total"], int)]
    root_page = next((r["total"] for r in items if r["level"] == "level1" and r["name"] == root), None)
    root_stats.append(
        {
            "root": root,
            "items": len(items),
            "root_page": root_page,
            "sum": sum(totals),
            "max": max(totals) if totals else 0,
            "min": min(totals) if totals else 0,
        }
    )

all_totals = [r["total"] for r in rows if isinstance(r["total"], int)]
grand_sum = sum(all_totals)
top = sorted((r for r in rows if isinstance(r["total"], int)), key=lambda r: r["total"], reverse=True)[:20]

lines = []
lines.append("# Futbolmania menu — product counts")
lines.append("")
lines.append(f"Source: {MENU['source']}  ")
lines.append(f"Captured: {date.today().isoformat()}  ")
lines.append(f"Menu items: {len(rows)} across {len(MENU['root_order'])} sections  ")
lines.append(f"Sum of product counts over all menu items: **{grand_sum}**")
lines.append("")
lines.append(
    "> Categories overlap: a product can appear under Boots, its brand, its model and its "
    "surface. The sum is a coverage number, not the number of unique products. The section-page "
    "count in the table is the top-level category total."
)
lines.append("")
lines.append("## Per section")
lines.append("")
lines.append("| Section | Menu items | Section page products | Sum of item counts | Max item | Min item |")
lines.append("|---|---:|---:|---:|---:|---:|")
for s in root_stats:
    lines.append(
        f"| {s['root']} | {s['items']} | {s['root_page'] if s['root_page'] is not None else '—'} | "
        f"{s['sum']} | {s['max']} | {s['min']} |"
    )
lines.append("")
lines.append("## Top 20 menu items by product count")
lines.append("")
lines.append("| Section | Item | Level | Pages | Products |")
lines.append("|---|---|---|---:|---:|")
for r in top:
    lines.append(f"| {r['root']} | {r['name']} | {r['level']} | {r['pages']} | {r['total']} |")
lines.append("")
lines.append("## Full list")
for s in root_stats:
    lines.append("")
    lines.append(f"### {s['root']}")
    lines.append("")
    lines.append("| Item | Level | Pages | Products |")
    lines.append("|---|---|---:|---:|")
    for r in by_root.get(s["root"], []):
        lines.append(f"| {r['name']} | {r['level']} | {r['pages']} | {r['total']} |")

OUT_MD.write_text("\n".join(lines) + "\n")

print(f"wrote {OUT_CSV} and {OUT_MD}")
print(f"items: {len(rows)}, counted: {len(all_totals)}, pending/error: {len(rows)-len(all_totals)}")
print(f"sum of counts: {grand_sum}")
print("\nPer section:")
for s in root_stats:
    print(f"  {s['root']}: items={s['items']} root_page={s['root_page']} sum={s['sum']} max={s['max']} min={s['min']}")
print("\nTop 10 items:")
for r in top[:10]:
    print(f"  {r['root']} / {r['name']}: {r['total']} ({r['pages']} pages)")