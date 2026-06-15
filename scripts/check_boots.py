import json

json_path = '/home/lordwhitefire/current-project/athletica/athletica/frontend/scripts/nav-seed.json'
with open(json_path, 'r') as f:
    data = json.load(f)

def print_if_matches(node):
    if isinstance(node, dict):
        label = node.get('label', '')
        href = node.get('href', '')
        if isinstance(label, str) and 'football' in label.lower() and 'boots' in label.lower():
            print("Found label:", label)
        if isinstance(href, str) and 'football' in href.lower() and 'boots' in href.lower():
            print("Found href:", href)
        
        for value in node.values():
            if isinstance(value, (dict, list)):
                print_if_matches(value)
    elif isinstance(node, list):
        for item in node:
            print_if_matches(item)

for adult_category in data.get('items', []):
    for l1 in adult_category.get('children', []):
        if l1.get('_key') == 'k-65':
            print_if_matches(l1)
