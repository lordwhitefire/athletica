import fs from 'fs';

const SEED_PATH = './frontend/scripts/nav-seed.json';
const REF_PATH = './frontend/scripts/nav-seed-reference.md';

// 1. Read seed file
const data = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
const rootGroup = data.items[0];
const l1Nodes = rootGroup.children.filter(child => child.level === 1);

if (l1Nodes.length === 0) {
  console.error("Could not find any Level 1 nodes");
  process.exit(1);
}

// ── Utilities ─────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripContext(label, suffixes) {
  if (!label) return "";
  let clean = label;
  for (const suffix of suffixes) {
    const trimmedSuffix = suffix.trim();
    const regex = new RegExp(`(^|\\s)${escapeRegex(trimmedSuffix)}(\\s|$)`, 'gi');
    clean = clean.replace(regex, ' ').replace(/\s+/g, ' ').trim();
  }
  return clean;
}

function stripPrefix(label, prefix) {
  const check = prefix + ' ';
  if (label.startsWith(check)) return label.slice(prefix.length + 1).trim();
  if (label === prefix) return "";
  return label;
}

function stripPrepositions(label) {
  if (!label) return "";
  let clean = label.trim();
  const preps = ["with", "without", "for", "by", "and", "of", "in", "the"];
  let changed = true;
  while (changed) {
    changed = false;
    const words = clean.split(' ');
    if (words.length > 1 && preps.includes(words[0].toLowerCase())) {
      clean = words.slice(1).join(' ').trim();
      changed = true;
    }
  }
  return clean;
}

// ── Phase 1 — Screening (READ-ONLY) ──────────────────────────────

function detectL1Identifier(l1Node) {
  const l2Nodes = (l1Node.children || []).filter(n => !n.disabled);
  if (l2Nodes.length === 0) return [];

  const total = l2Nodes.length;
  const minCount = Math.max(2, Math.floor(total * 0.3));
  const suffixCounts = {};

  for (const node of l2Nodes) {
    const label = node.label.replace(/\s*\[DISABLED\]/i, '').trim();
    const words = label.split(' ');
    for (let i = 1; i <= words.length; i++) {
      const suffix = words.slice(-i).join(' ');
      suffixCounts[suffix] = (suffixCounts[suffix] || 0) + 1;
    }
  }

  const qualifying = Object.keys(suffixCounts)
    .filter(suffix => suffixCounts[suffix] >= minCount)
    .sort((a, b) => b.length - a.length);

  return qualifying;
}

function detectL2Identifiers(l1Node, l1Id) {
  const result = new Map();

  function scan(node) {
    if (node.level === 2 && node.children && node.children.length > 0) {
      const stripped = node.children.map(child => {
        let label = child.label;
        if (l1Id.length > 0) label = stripContext(label, l1Id);
        return label;
      });

      const viable = stripped.filter(l => l.length > 0);
      if (viable.length < 2) return;

      const firstWords = viable.map(l => l.split(' ')[0]);
      const allSameFirst = firstWords.every(w => w === firstWords[0]);

      if (allSameFirst && firstWords[0]) {
        let prefix = firstWords[0];
        for (let i = 2; i <= 5; i++) {
          const candidate = viable[0].split(' ').slice(0, i).join(' ');
          if (viable.every(l => l.startsWith(candidate + ' ') || l === candidate)) {
            prefix = candidate;
          } else break;
        }
        result.set(node._key, prefix);
      }
    }
    if (node.children) node.children.forEach(scan);
  }

  scan(l1Node);
  return result;
}

function detectL3Identifiers(l1Node, l1Id, l2Ids) {
  const result = new Map();

  function scan(node, currentL2Id) {
    if (node.level === 3 && node.children && node.children.length > 0 && currentL2Id) {
      const stripped = node.children.map(child => {
        let label = child.label;
        if (l1Id.length > 0) label = stripContext(label, l1Id);
        label = stripPrefix(label, currentL2Id);
        return label;
      });

      const viable = stripped.filter(l => l.length > 0);
      if (viable.length < 1) return;

      const firstWords = viable.map(l => l.split(' ')[0]);
      if (firstWords.every(w => w && w === firstWords[0])) {
        result.set(node._key, firstWords[0]);
      }
    }

    if (node.children) {
      const nextL2Id = node.level === 2 ? (l2Ids.get(node._key) || currentL2Id) : currentL2Id;
      node.children.forEach(child => scan(child, nextL2Id));
    }
  }

  scan(l1Node, null);
  return result;
}

// ── Phase 2 — Application ────────────────────────────────────────

function nullifyHrefs(node) {
  node.href = null;
  if (node.customLinks) node.customLinks.forEach(link => { link.href = null; });
  if (node.sizeLinks) node.sizeLinks.forEach(link => { link.href = null; });
  if (node.bottomLinks) node.bottomLinks.forEach(link => { link.href = null; });
  if (node.children) node.children.forEach(nullifyHrefs);
}

function applyL1Identifier(l1Node, l1Id) {
  if (l1Id.length === 0) return;
  function recurse(node) {
    const orig = node.label;
    node.label = stripContext(node.label, l1Id);
    if (node.label === "") node.label = orig;

    for (const links of [node.customLinks, node.sizeLinks, node.bottomLinks]) {
      if (links) links.forEach(link => {
        const origLink = link.label;
        link.label = stripContext(link.label, l1Id);
        if (link.label === "") link.label = origLink;
      });
    }
    if (node.children) node.children.forEach(recurse);
  }
  if (l1Node.children) l1Node.children.forEach(recurse);
}

function applyL2Identifiers(node, l2Ids) {
  if (l2Ids.has(node._key)) {
    const id = l2Ids.get(node._key);
    function recurse(n) {
      if (n.level >= 3) {
        const orig = n.label;
        n.label = stripPrefix(n.label, id);
        if (n.label === "") n.label = orig;
        for (const links of [n.customLinks, n.sizeLinks, n.bottomLinks]) {
          if (links) links.forEach(link => {
            const origLink = link.label;
            link.label = stripPrefix(link.label, id);
            if (link.label === "") link.label = origLink;
          });
        }
      }
      if (n.children) n.children.forEach(recurse);
    }
    if (node.children) node.children.forEach(recurse);
  }
  if (node.children) node.children.forEach(child => applyL2Identifiers(child, l2Ids));
}

function applyL3Identifiers(node, l3Ids) {
  if (l3Ids.has(node._key)) {
    const id = l3Ids.get(node._key);
    function recurse(n) {
      if (n.level >= 4) {
        const orig = n.label;
        n.label = stripPrefix(n.label, id);
        if (n.label === "") n.label = orig;
      }
      if (n.children) n.children.forEach(recurse);
    }
    if (node.children) node.children.forEach(recurse);
  }
  if (node.children) node.children.forEach(child => applyL3Identifiers(child, l3Ids));
}

// ── Classification Restructuring (Phase 2B) ──────────────────────

function applyClassificationRestructuring(node) {
  if (!node.children || node.children.length === 0) return;
  node.children.forEach(applyClassificationRestructuring);

  const parentKey = node._key;
  const parentLevel = node.level;

  const counts = {};
  node.children.forEach(child => {
    const label = child.label.trim();
    const words = label.split(' ');
    if (words.length > 1) {
      counts[words[0]] = (counts[words[0]] || 0) + 1;
    }
  });

  const classifications = Object.keys(counts).filter(word => counts[word] >= 2);

  if (classifications.length > 0) {
    const newChildren = [];
    const groupedKeys = new Set();

    classifications.forEach(word => {
      const group = node.children.filter(child => {
        const label = child.label.trim();
        return label.startsWith(word + ' ') || label === word;
      });

      if (group.length > 0) {
        group.forEach(child => groupedKeys.add(child._key));

        const brandKey = `k-class-${parentKey}-${word.toLowerCase()}`.replace(/\s+/g, '-');
        const brandId = `${parentLevel + 1}-class-${parentKey}-${word.toLowerCase()}`.replace(/\s+/g, '-');

        const modelChildren = group.map(child => {
          let childLabel = child.label.trim();
          if (childLabel.startsWith(word + ' ')) {
            childLabel = childLabel.slice(word.length + 1).trim();
          }
          return {
            ...child,
            level: parentLevel + 2,
            id: child.id ? child.id.replace(new RegExp(`^${parentLevel + 1}-`), `${parentLevel + 2}-`) : null,
            label: childLabel,
            href: null,
          };
        });

        newChildren.push({
          _key: brandKey,
          id: brandId,
          level: parentLevel + 1,
          label: word,
          href: null,
          children: modelChildren,
        });
      }
    });

    node.children.forEach(child => {
      if (!groupedKeys.has(child._key)) newChildren.push(child);
    });

    node.children = newChildren;
  }
}

// ── Phase 3 — Preposition Stripping & Post-processing ────────────

function applyPhase3(node, l1Label) {
  const originalLabel = node.label;
  node.label = stripPrepositions(node.label);

  if (node.label === "") {
    const isTraining = originalLabel.toLowerCase().includes("training") || node._key === "k-489";
    node.label = isTraining ? "Training" : l1Label;
  }

  if (node.label === "Players'") node.label = "Players";

  for (const links of [node.customLinks, node.sizeLinks, node.bottomLinks]) {
    if (links) links.forEach(link => {
      link.label = stripPrepositions(link.label);
      if (link.label === "Players'") link.label = "Players";
    });
  }

  // Strip parent context prefix if child starts with parent label
  if (node.children) {
    node.children.forEach(child => {
      if (child.label.startsWith(node.label + ' ')) {
        child.label = child.label.slice(node.label.length + 1).trim();
      }
    });
    node.children.forEach(child => applyPhase3(child, l1Label));
  }
}

// ── SPECIFIC_FIXES override ──────────────────────────────────────

const SPECIFIC_FIXES = {
  "k-144": "Players",
  "k-145": "CR7",
  "k-146": "Messi",
  "k-147": "Bellingham",
  "k-148": "Neymar",
  "k-149": "Lamine Yamal",
  "k-127": "Aluminum Studs",
  "k-128": "AG",
  "k-129": "FG",
  "k-130": "Rubber Studs",
  "k-134": "Hard Ground / Dirt",
  "k-141": "Ankle Support",
  "k-67": "Women's",
  "k-132": "Natural Grass",
  "k-133": "Artificial Turf",
  "k-136": "High-End",
  "k-137": "Mid-Range",
  "k-138": "Entry-Level",
  "k-140": "Leather",
  "k-142": "Laceless",
  "k-143": "Kangaroo Leather",
  "k-188": "Players",
  "k-262": "Players",
  "k-330": "Color",
  "k-343": "Anklets",
  "k-356": "Brand",
  "k-427": "Women's",
  "k-485": "Women's",
  "k-510": "Women's",
  "k-511": "Kids",
};

function fixLabelsByKeys(node) {
  if (SPECIFIC_FIXES[node._key]) node.label = SPECIFIC_FIXES[node._key];
  for (const links of [node.customLinks, node.sizeLinks, node.bottomLinks]) {
    if (links) links.forEach(link => {
      if (SPECIFIC_FIXES[link._key]) link.label = SPECIFIC_FIXES[link._key];
    });
  }
  if (node.children) node.children.forEach(fixLabelsByKeys);
}

// ── Serialize ────────────────────────────────────────────────────

function serializeNode(node, indent = 0) {
  let lines = [];
  const spacing = " ".repeat(indent);
  if (node.level === 0) {
    lines.push(`Group level=0 label="${node.label}" slug="${node.slug}" [${node._key}]`);
  } else {
    const disabledStr = node.disabled ? " [DISABLED]" : "";
    const childrenCount = node.children ? node.children.length : 0;
    lines.push(`${spacing}L${node.level}  ${node.label}${disabledStr}  [${node._key}]  children=${childrenCount}`);
  }
  const linkSpacing = " ".repeat(indent + 2);
  for (const kind of ["customLinks", "sizeLinks", "bottomLinks"]) {
    if (node[kind]) {
      for (const link of node[kind]) {
        lines.push(`${linkSpacing}[${kind}] "${link.label}" [${link._key}]`);
      }
    }
  }
  if (node.children) {
    for (const child of node.children) {
      lines.push(...serializeNode(child, node.level === 0 ? 0 : indent + 2));
    }
  }
  return lines;
}

// ── Main ─────────────────────────────────────────────────────────

for (const l1Node of l1Nodes) {
  nullifyHrefs(l1Node);

  const l1Id = detectL1Identifier(l1Node);
  const l2Ids = detectL2Identifiers(l1Node, l1Id);
  const l3Ids = detectL3Identifiers(l1Node, l1Id, l2Ids);

  applyL1Identifier(l1Node, l1Id);
  applyL2Identifiers(l1Node, l2Ids);
  applyL3Identifiers(l1Node, l3Ids);

  applyClassificationRestructuring(l1Node);

  applyPhase3(l1Node, l1Node.label);

  fixLabelsByKeys(l1Node);
}

// ── Write output ─────────────────────────────────────────────────

fs.writeFileSync(SEED_PATH, JSON.stringify(data, null, 2), 'utf8');
const markdownContent = serializeNode(rootGroup, 0).join('\n') + '\n';
fs.writeFileSync(REF_PATH, markdownContent, 'utf8');

console.log("Successfully updated nav-seed.json and nav-seed-reference.md!");
