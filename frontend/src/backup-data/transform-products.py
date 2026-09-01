#!/usr/bin/env python3
"""
transform-products.py

Edits products.json in place:
  1. Converts `model` field from comma-separated to slash-separated
     e.g. "Predator,Pro-FT-AG" -> "Predator/Pro-FT-AG"
  2. Wraps embedded traction notation containing "/" in parentheses,
     so it isn't mistaken for a hierarchy separator
     e.g. "Predator/League-FT-FG/MG" -> "Predator/League-FT-(FG/MG)"
  3. Adds `name` field set to null
  4. Removes `model_line` field

Usage:
  python3 transform-products.py products.json
"""

import json
import sys

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 transform-products.py <products.json>")
        sys.exit(1)

    path = sys.argv[1]

    with open(path, 'r', encoding='utf-8') as f:
        products = json.load(f)

    for product in products:
        if 'model' in product and isinstance(product['model'], str):
            model = '/'.join(part.strip() for part in product['model'].split(','))

            traction = product.get('traction', '')
            if isinstance(traction, str) and '/' in traction and traction in model:
                model = model.replace(traction, f'({traction})')

            product['model'] = model

        product['name'] = None

        if 'model_line' in product:
            del product['model_line']

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    print(f"Updated {len(products)} product(s) in {path}")

if __name__ == '__main__':
    main()