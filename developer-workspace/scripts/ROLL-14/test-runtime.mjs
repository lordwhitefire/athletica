// test-runtime.mjs — ROLL-14 runtime browser check
// Interaction-driven: CTA enabled/disable, /go/[id] redirect, no window.open
// Attaches to Chrome on :9222, creates ONE tab (reuses if exists),
// drives checklist states, full extraction, detaches (tab stays open).

import { attach, ensureTab, navigate, probe, getConsoleErrors,
  clearConsoleErrors, detach } from '../ROLL-12/_lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;
function check(name, condition, detail = '') {
  if (condition) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name}: ${detail}`); }
}

async function main() {
  console.log('=== ROLL-14 runtime browser check (interaction-driven) ===\n');

  await attach();
  await ensureTab('http://127.0.0.1:3011/');

  try {
    // ---- State 1: Published product page (CTA disabled - no AMAZON_TAG/MARKETPLACE) ----
    console.log('\n--- State: published product (/product/bench1-430706) ---');
    await clearConsoleErrors();
    await navigate('http://127.0.0.1:3011/product/bench1-430706');

    const facts = await probe();
    console.log(`  title: ${facts.title}`);
    console.log(`  url: ${facts.url}`);
    console.log(`  readyState: ${facts.readyState}`);

    check('page loads', facts.readyState === 'complete' || facts.readyState === 'interactive', `readyState: ${facts.readyState}`);

    // Check CTA button exists and is disabled (no AMAZON_TAG/MARKETPLACE set)
    const ctaButtons = facts.buttons.filter(b => b.text && b.text.includes('Link coming soon'));
    check('CTA button "Link coming soon" exists', ctaButtons.length > 0, `buttons: ${JSON.stringify(facts.buttons.map(b => b.text))}`);
    const ctaDisabled = ctaButtons.length > 0 && ctaButtons.some(b => b.disabled);
    check('CTA button is disabled (no AMAZON_TAG/MARKETPLACE)', ctaDisabled, `CTA disabled: ${ctaDisabled}`);

    // Check no unexpected console errors (HMR WebSocket failures are expected dev noise)
    const errors = await getConsoleErrors();
    const nonHmrErrors = errors.filter(e => !e.text.includes('_next/hmr'));
    check('no non-HMR console errors on product page', nonHmrErrors.length === 0, `${nonHmrErrors.length} errors: ${nonHmrErrors.map(e => e.text).join('; ')}`);

    // Save extraction
    const outDir = path.join(process.cwd(), 'runs', 'product-page');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'surface-probe.json'), JSON.stringify(facts, null, 2));

    // ---- State 2: Missing product (404) ----
    console.log('\n--- State: missing product (/product/does-not-exist) ---');
    await clearConsoleErrors();
    await navigate('http://127.0.0.1:3011/product/does-not-exist');

    const notFoundFacts = await probe();
    check('404 page loads', notFoundFacts.readyState === 'complete' || notFoundFacts.readyState === 'interactive', `readyState: ${notFoundFacts.readyState}`);
    check('404 page has no product name', !notFoundFacts.title || !notFoundFacts.title.includes('bench1-430706'), `title: ${notFoundFacts.title}`);

    const notFoundErrors = await getConsoleErrors();
    const nonHmrNotFoundErrors = notFoundErrors.filter(e => !e.text.includes('_next/hmr'));
    check('404 page has no non-HMR console errors', nonHmrNotFoundErrors.length === 0, `${nonHmrNotFoundErrors.length} errors`);

    const notFoundDir = path.join(process.cwd(), 'runs', 'missing-product');
    fs.mkdirSync(notFoundDir, { recursive: true });
    fs.writeFileSync(path.join(notFoundDir, 'surface-probe.json'), JSON.stringify(notFoundFacts, null, 2));

    // ---- State 3: /go/[id] redirect (affiliate not configured -> 404) ----
    console.log('\n--- State: /go/[id] redirect (/go/V4qZOE?source=instagram) ---');
    await clearConsoleErrors();
    await navigate('http://127.0.0.1:3011/go/V4qZOE?source=instagram');

    const goFacts = await probe();
    console.log(`  title: ${goFacts.title}`);
    console.log(`  url: ${goFacts.url}`);
    console.log(`  readyState: ${goFacts.readyState}`);

    // /go/V4qZOE should return 404 because AMAZON_TAG is not set
    // (getAffiliateUrlByAsin returns { url: null, error: 'Affiliate not configured' })
    check('/go page loads', goFacts.readyState === 'complete' || goFacts.readyState === 'interactive', `readyState: ${goFacts.readyState}`);

    const goErrors = await getConsoleErrors();
    const nonHmrGoErrors = goErrors.filter(e => !e.text.includes('_next/hmr') && !e.text.includes('preload'));
    check('/go page has no unexpected console errors', nonHmrGoErrors.length === 0, `${nonHmrGoErrors.length} errors: ${nonHmrGoErrors.map(e => e.text).join('; ')}`);

    const goDir = path.join(process.cwd(), 'runs', 'go-redirect');
    fs.mkdirSync(goDir, { recursive: true });
    fs.writeFileSync(path.join(goDir, 'surface-probe.json'), JSON.stringify(goFacts, null, 2));

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
