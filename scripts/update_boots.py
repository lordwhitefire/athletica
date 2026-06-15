import json
import re

# 1. UPDATE JSON
json_path = '/home/lordwhitefire/current-project/athletica/athletica/frontend/scripts/nav-seed.json'
with open(json_path, 'r') as f:
    data = json.load(f)

def update_node(node):
    if isinstance(node, dict):
        if 'label' in node and isinstance(node['label'], str):
            node['label'] = node['label'].replace('Football Boots', 'Boots')
            node['label'] = node['label'].replace('football boots', 'boots')
        if 'href' in node and isinstance(node['href'], str):
            node['href'] = node['href'].replace('football-boots', 'boots')
        
        for key, value in node.items():
            if isinstance(value, (dict, list)):
                update_node(value)
    elif isinstance(node, list):
        for item in node:
            update_node(item)

# Find Boots category (k-65)
for adult_category in data.get('items', []):
    for l1 in adult_category.get('children', []):
        if l1.get('_key') == 'k-65':
            update_node(l1)

with open(json_path, 'w') as f:
    json.dump(data, f, indent=2)

# 2. UPDATE MARKDOWN
md_path = '/home/lordwhitefire/current-project/athletica/athletica/frontend/scripts/nav-seed-reference.md'
with open(md_path, 'r') as f:
    lines = f.readlines()

in_boots = False
new_lines = []
for line in lines:
    if 'L1  Boots  [k-65]' in line:
        in_boots = True
    elif in_boots and line.startswith('L1 '): # Next L1 item
        in_boots = False
        
    if in_boots:
        line = line.replace('Football Boots', 'Boots')
        line = line.replace('football boots', 'boots')
        line = line.replace('football-boots', 'boots')
        
    new_lines.append(line)

with open(md_path, 'w') as f:
    f.writelines(new_lines)
