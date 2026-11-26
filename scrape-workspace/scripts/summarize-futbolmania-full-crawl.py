#!/usr/bin/env python3
"""Summarise the full Futbolmania crawl: per-menu-item counts, unique products, Markdown + CSV."""
import csv
import json
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path("/home/lordwhitefire/current-project/athletica")
MENU = json.loads((ROOT / "scrape-workspace/structures/futbolmania-menu.json").read_text())
CRAWL = json.loads((ROOT / "scrape-workspace/structures/futbolmania-full-crawl.json").read_text())
OUT_CSV = ROOT / "scrape-workspace/structures/futbolmania-full-crawl.csv"
OUT_MD = ROOT / "scrape-workspace/structures/futbolmania-full-crawl.md"
OUT_UNIQUE = ROOT / "scrape-workspace/structures/futbolmania-unique-products.json"

rows = []
unique_urls = set()
for item in MENU["items"]:
    c = CRAWL.get(item["href"], {})
    urls = c.get("product_urls", []) if isinstance(c, dict) else []
    unique_urls.update(urls)
    rows.append(
        {
            "audience": item["audience"],
            "root": item["root"],
            "level": item["level"],
            "name": item["name"],
            "href": item["href"],
            "pages": c.get("pages", "") if isinstance(c, dict) else "",
            "total": c.get("total", "") if isinstance(c, dict) else "",
            "product_urls": len(urls),
            "status": "ok" if isinstance(c, dict) and "total" in c else (c.get("error") if isinstance(c, dict) else "pending") or "pending",
        }
    )

with OUT_CSV.open("w", newline="") as f:
    w = csv.DictWriter(
        f,
        fieldnames=["audience", "root", "level", "name", "href", "pages", "total", "product_urls", "status"],
    )
    w.writeheader()
    w.writerows(rows)

# Per audience/root stats
groups = defaultdict(list)
for r in rows:
    groups[(r["audience"], r["root"])].append(r)

root_stats = []
for r in MENU["root_order"]:
    key = (r["audience"], r["root"])
    items = groups.get(key, [])
    totals = [x["total"] for x in items if isinstance(x["total"], int)]
    root_page = next((x["total"] for x in items if x["level"] == "level1" and x["name"] == r["root"]), None)
    root_stats.append(
        {
            "audience": r["audience"],
            "root": r["root"],
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

# Unique products
products = []
for url in sorted(unique_urls):
    sku = url.rstrip("/").split("/")[-1]
    products.append({"url": url, "sku": sku.upper()})
OUT_UNIQUE.write_text(json.dumps({"count": len(products), "products": products}, indent=2))

lines = []
lines.append("# Futbolmania full menu — product counts")
lines.append("")
lines.append(f"Source: {MENU['source']}  ")
lines.append(f"Captured: {date.today().isoformat()}  ")
lines.append(f"Audiences: adult + kids  ")
lines.append(f"Menu items: {len(rows)}  ")
lines.append(f"Products counted (sum over menu items): **{grand_sum}**  ")
lines.append(f"Unique product URLs: **{len(products)}**")
lines.append("")
lines.append(
    "> Categories overlap: one product appears under Boots, its brand, its model and its surface. "
    "The sum is a coverage number; the unique product count is the real catalogue size."
)
lines.append("")
lines.append("## Per section")
lines.append("")
lines.append("| Audience | Section | Menu items | Section page products | Sum of item counts | Max item | Min item |")
lines.append("|---|---|---:|---:|---:|---:|---:|")
for s in root_stats:
    lines.append(
        f"| {s['audience']} | {s['root']} | {s['items']} | {s['root_page'] if s['root_page'] is not None else '—'} | "
        f"{s['sum']} | {s['max']} | {s['min']} |"
    )
lines.append("")
lines.append("## Top 20 menu items by product count")
lines.append("")
lines.append("| Audience | Section | Item | Level | Pages | Products |")
lines.append("|---|---|---|---|---:|---:|")
for r in top:
    lines.append(f"| {r['audience']} | {r['root']} | {r['name']} | {r['level']} | {r['pages']} | {r['total']} |")
lines.append("")
lines.append("## Full list")
for s in root_stats:
    lines.append("")
    lines.append(f"### {s['audience']} / {s['root']}")
    lines.append("")
    lines.append("| Item | Level | Pages | Products | Product URLs |")
    lines.append("|---|---|---:|---:|---:|")
    for r in groups.get((s["audience"], s["root"]), []):
        lines.append(f"| {r['name']} | {r['level']} | {r['pages']} | {r['total']} | {r['product_urls']} |")

OUT_MD.write_text("\n".join(lines) + "\n")

print(f"wrote {OUT_CSV}")
print(f"wrote {OUT_MD}")
print(f"wrote {OUT_UNIQUE}")
print(f"items: {len(rows)}, counted: {len(all_totals)}, pending/error: {len(rows)-len(all_totals)}")
print(f"sum of counts: {grand_sum}")
print(f"unique product URLs: {len(products)}")
print("\nPer section:")
for s in root_stats:
    print(
        f"  {s['audience']:5} / {s['root']}: items={s['items']} root_page={s['root_page']} "
        f"sum={s['sum']} max={s['max']} min={s['min']}"
    )
print("\nTop 10 items:")
for r in top[:10]:
    print(f"  {r['audience']} / {r['root']} / {r['name']}: {r['total']} ({r['pages']} pages)")