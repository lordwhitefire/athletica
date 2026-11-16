// test-runtime.mjs — ROLL-12 runtime browser check
// Full extraction of everything on the page — no selective retrieval, no guessing.
// Attaches to Chrome on :9222, creates ONE tab (reuses if already created),
// navigates :3011, probes everything, saves results, detaches (tab stays open).

import { attach, ensureTab, navigate, probe, getConsoleErrors,
  clearConsoleErrors, detach } from './_lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;
function check(name, condition, detail = '') {
  if (condition) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name}: ${detail}`); }
}

async function main() {
  console.log('=== ROLL-12 runtime browser check (FULL EXTRACTION) ===\n');

  await attach();
  await ensureTab('http://127.0.0.1:3011/');

  try {
    await clearConsoleErrors();
    await navigate('http://127.0.0.1:3011/');

    const facts = await probe();

    // Save full extraction to file
    const outDir = path.join(process.cwd(), 'runs', 'home');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'surface-probe.json'), JSON.stringify(facts, null, 2));
    fs.writeFileSync(path.join(outDir, 'surface-probe.txt'), `
ROLL-12 Runtime Browser Check — Full Extraction
================================================
URL: ${facts.url}
Title: ${facts.title}
ReadyState: ${facts.readyState}
UserAgent: ${facts.userAgent}
DocumentElement: ${facts.documentElementTag} class="${facts.documentElementClass}"
Viewport: ${JSON.stringify(facts.viewport)}
Console Errors: ${facts.consoleErrors.length}

HEAD HTML:
${facts.headHtml.slice(0, 2000)}

BODY TEXT (first 2000 chars):
${facts.bodyText.slice(0, 2000)}

ELEMENT INVENTORY (${facts.elementInventory.length} elements):
${JSON.stringify(facts.elementInventory.slice(0, 50), null, 2)}

LINKS (${facts.links.length}):
${JSON.stringify(facts.links.slice(0, 30), null, 2)}

IMAGES (${facts.images.length}):
${JSON.stringify(facts.images.slice(0, 30), null, 2)}

BUTTONS (${facts.buttons.length}):
${JSON.stringify(facts.buttons.slice(0, 30), null, 2)}

TABS (${facts.tabs.length}):
${JSON.stringify(facts.tabs, null, 2)}

FORMS (${facts.forms.length}):
${JSON.stringify(facts.forms, null, 2)}

HIDDEN ELEMENTS (${facts.hiddenElements.length}):
${JSON.stringify(facts.hiddenElements.slice(0, 30), null, 2)}

CSS VARIABLES (${Object.keys(facts.cssVariables || {}).length}):
${JSON.stringify(facts.cssVariables, null, 2)}

COMPUTED STYLES (${facts.computedStyles.length}):
${JSON.stringify(facts.computedStyles.slice(0, 20), null, 2)}

SCRIPTS (${facts.scripts.length}):
${facts.scripts.join('\n')}

CSS LINKS (${facts.cssLinks.length}):
${JSON.stringify(facts.cssLinks, null, 2)}

ACCESSIBILITY TREE (${facts.accessibilityTree.length} nodes):
${JSON.stringify(facts.accessibilityTree.slice(0, 50), null, 2)}

CONSOLE ERRORS:
${facts.consoleErrors.map(e => `  [${e.level}] ${e.text}`).join('\n')}

STYLESHEETS (${facts.styleSheets.length}):
${JSON.stringify(facts.styleSheets.map(s => ({ href: s.href, ruleCount: s.rules.length })), null, 2)}
`);
    console.log(`\nFull extraction saved to ${outDir}/surface-probe.json and surface-probe.txt`);

    // Basic integrity checks only (not selective retrieval)
    check('page has a title', facts.title && facts.title.length > 0, `title was: "${facts.title}"`);
    check('page is loaded', facts.readyState === 'complete' || facts.readyState === 'interactive', `readyState: ${facts.readyState}`);
    check('page has body text', facts.bodyText && facts.bodyText.length > 0, 'no body text');
    check('page has elements', facts.elementInventory && facts.elementInventory.length > 0, 'no elements');
    check('no console errors', facts.consoleErrors.length === 0, `${facts.consoleErrors.length} errors`);

    console.log(`\n=== ${passed} passed, ${failed} failed ===`);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    await detach();
  }
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
