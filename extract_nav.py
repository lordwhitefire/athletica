import json
import sys

def format_links(links):
    if not links:
        return ""
    return ", ".join([f"{link.get('label', 'N/A')} → {link.get('href') if link.get('href') else '(no link)'}" for link in links])

def print_item(item, level, indent=""):
    label = item.get('label', 'N/A')
    href = item.get('href')
    if href is None:
        href = "(no link)"
    children = item.get('children', [])
    has_children_text = "HAS CHILDREN" if children else "NO CHILDREN"
    
    if level == 0:
        print(f"GROUP: {label}")
    else:
        # Use '-' for all items nested under GROUP
        # User's format: CHILD(2 spaces), GRANDCHILD(4 spaces), LEVEL4(6 spaces)
        print(f"{indent}- {label} → {href} {has_children_text}")
    
    # Links only if HAS CHILDREN
    if children:
        c_links = item.get('customLinks', [])
        s_links = item.get('sizeLinks', [])
        b_links = item.get('bottomLinks', [])
        
        # Indentation for links: 2 spaces more than the item's dash?
        # User example:
        # - [child] ...
        #   customLinks: ...
        link_indent = indent + "  "
        if c_links:
            print(f"{link_indent}customLinks: [{format_links(c_links)}]")
        if s_links:
            print(f"{link_indent}sizeLinks: [{format_links(s_links)}]")
        if b_links:
            print(f"{link_indent}bottomLinks: [{format_links(b_links)}]")
            
        for child in children:
            new_indent = indent + "  " if level > 0 else "  "
            print_item(child, level + 1, new_indent)

def main():
    try:
        with open('src/data/navigation.json', 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON: {e}", file=sys.stderr)
        return

    for group in data:
        print_item(group, 0)
        print() # Newline between groups

if __name__ == "__main__":
    main()
