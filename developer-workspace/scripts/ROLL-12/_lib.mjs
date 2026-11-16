// _lib.mjs — ROLL-12 browser-check harness
// Attach-only: connects to the one Chrome on CDP :9222, creates ONE tab, reuses it.
// Never launches Chrome, never headless, never touches tabs this harness did not open.
// FULL extraction — everything from the runtime, no selective retrieval.
// CDP protocol per official docs: after Target.attachToTarget(flatten:true), include
// sessionId as a top-level parameter on every command to that target.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CDP_URL = 'http://127.0.0.1:9222';
const BUILD_URL = 'http://127.0.0.1:3011';
const TAB_STATE_FILE = path.join(process.cwd(), '.roll12-tab-state.json');

let ws = null;
let nextId = 1;
let sessionId = null;
let targetId = null;
let tabCreatedByUs = false;
let reusedExistingTab = false;
let consoleErrors = [];

// Pending CDP call resolvers, keyed by message id
const pending = new Map();

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function cdpSend(method, params = {}) {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket not open'));
      return;
    }
    const id = nextId++;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    const timeoutRef = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 15000);
    pending.set(id, { resolve, reject, timeoutRef });
    ws.send(JSON.stringify(message));
  });
}

export async function attach() {
  const res = await httpGet(`${CDP_URL}/json/version`);
  if (res.status !== 200) throw new Error(`Chrome CDP not alive at ${CDP_URL}`);
  const version = JSON.parse(res.body);
  if (/Headless/i.test(version['User-Agent'] || '')) {
    throw new Error('Chrome is headless — refusing to attach');
  }
  console.log(`Attached to Chrome: ${version.Browser}`);

  const wsUrl = version.webSocketDebuggerUrl;
  ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  // Single message handler: handles both responses to our calls and incoming events
  ws.addEventListener('message', (event) => {
    try {
      const parsed = JSON.parse(event.data);

      // Response to a pending CDP call
      if (parsed.id !== undefined && parsed.id !== null) {
        const entry = pending.get(parsed.id);
        if (entry) {
          pending.delete(parsed.id);
          clearTimeout(entry.timeoutRef);
          if (parsed.error) {
            entry.reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          } else {
            entry.resolve(parsed.result);
          }
        }
        return;
      }

      // Event: Log.entryAdded — capture console errors/warnings
      if (parsed.method === 'Log.entryAdded') {
        const entry = parsed.params.entry;
        if (entry.level === 'error' || entry.level === 'warning') {
          consoleErrors.push({ level: entry.level, text: entry.text, source: entry.source });
        }
      }
    } catch { /* ignore malformed messages */ }
  });
}

export async function listTabs() {
  const res = await httpGet(`${CDP_URL}/json/list`);
  return JSON.parse(res.body);
}

async function findOurTab() {
  const tabs = await listTabs();
  const ourTab = tabs.find((t) => t.url && t.url.startsWith(BUILD_URL));
  if (ourTab) {
    targetId = ourTab.id;
    reusedExistingTab = true;
    console.log(`Reusing existing tab ${targetId} → ${ourTab.url}`);
    return true;
  }
  return false;
}

export async function createTab(url) {
  const result = await cdpSend('Target.createTarget', { url, newWindow: false });
  targetId = result.targetId;
  tabCreatedByUs = true;
  reusedExistingTab = false;
  console.log(`Created tab ${targetId} → ${url}`);
  saveTabState();
  return targetId;
}

async function ensureTab(url) {
  const found = await findOurTab();
  if (found) {
    await attachSession();
    return;
  }
  await createTab(url);
  await attachSession();
  saveTabState();
}

export async function attachSession() {
  const result = await cdpSend('Target.attachToTarget', { targetId, flatten: true });
  sessionId = result.sessionId;
  console.log(`Attached session ${sessionId} (flatten)`);
  await cdpSend('Page.enable');
  await cdpSend('Runtime.enable');
  await cdpSend('Log.enable');
}

export async function navigate(url) {
  await cdpSend('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 2000));
}

async function evalStr(expr) {
  const r = await cdpSend('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
  });
  return r.result.value;
}

async function evalObj(expr) {
  const r = await cdpSend('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
  });
  return r.result.value;
}

async function probe() {
  // FULL extraction — everything from the runtime, no selective retrieval
  const facts = {};

  // Page-level info
  facts.title = await evalStr('document.title');
  facts.url = await evalStr('window.location.href');
  facts.readyState = await evalStr('document.readyState');
  facts.userAgent = await evalStr('navigator.userAgent');
  facts.documentElementTag = await evalStr('document.documentElement.tagName');
  facts.documentElementClass = await evalStr('document.documentElement.className');

  // Head: all meta, link, script, style, title
  facts.headHtml = await evalStr('document.head.outerHTML');

  // Body: full outerHTML (complete DOM tree)
  facts.bodyHtml = await evalStr('document.body.outerHTML');

  // Body innerText (all visible text)
  facts.bodyText = await evalStr('document.body.innerText');

  // All elements inventory
  facts.elementInventory = await evalObj(`
    (() => {
      const els = document.querySelectorAll('*');
      const out = [];
      for (const el of els) {
        out.push({
          tag: el.tagName,
          class: el.className || '',
          id: el.id || '',
          text: el.innerText ? el.innerText.slice(0, 200) : '',
          href: el.href || '',
          src: el.src || '',
          type: el.type || '',
          role: el.getAttribute('role') || '',
          ariaLabel: el.getAttribute('aria-label') || '',
          hidden: el.hidden || false,
          style: el.getAttribute('style') || '',
        });
      }
      return out;
    })()
  `);

  // All stylesheets
  facts.styleSheets = await evalObj(`
    (() => {
      const out = [];
      for (const ss of document.styleSheets) {
        try {
          const rules = Array.from(ss.cssRules || []).map(r => r.cssText);
          out.push({ href: ss.href || 'inline', rules });
        } catch { out.push({ href: ss.href || 'inline', rules: ['CROSS-ORIGIN-BLOCKED'] }); }
      }
      return out;
    })()
  `);

  // Accessibility tree
  facts.accessibilityTree = await evalObj(`
    (() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      const out = [];
      let node;
      while ((node = walker.nextNode())) {
        out.push({
          tag: node.tagName,
          role: node.getAttribute('role') || '',
          ariaLabel: node.getAttribute('aria-label') || '',
          ariaHidden: node.getAttribute('aria-hidden') || '',
          tabIndex: node.getAttribute('tabindex') || '',
        });
      }
      return out;
    })()
  `);

  // All console errors captured
  facts.consoleErrors = [...consoleErrors];

  // All links
  facts.links = await evalObj(`
    (() => {
      const links = document.querySelectorAll('a[href]');
      return Array.from(links).map(a => ({ href: a.href, text: a.innerText.slice(0, 100), rel: a.rel || '' }));
    })()
  `);

  // All images
  facts.images = await evalObj(`
    (() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).map(img => ({ src: img.src, alt: img.alt || '', loading: img.loading || '' }));
    })()
  `);

  // All forms
  facts.forms = await evalObj(`
    (() => {
      const forms = document.querySelectorAll('form');
      return Array.from(forms).map(f => ({
        action: f.action || '',
        method: f.method || '',
        inputs: Array.from(f.querySelectorAll('input, select, textarea')).map(i => ({
          type: i.type || i.tagName,
          name: i.name || '',
          id: i.id || '',
          placeholder: i.placeholder || '',
        }))
      }));
    })()
  `);

  // All buttons
  facts.buttons = await evalObj(`
    (() => {
      const btns = document.querySelectorAll('button, [role="button"]');
      return Array.from(btns).map(b => ({
        tag: b.tagName,
        text: b.innerText.slice(0, 100),
        role: b.getAttribute('role') || '',
        type: b.type || '',
        disabled: b.disabled || false,
      }));
    })()
  `);

  // All tabs
  facts.tabs = await evalObj(`
    (() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      return Array.from(tabs).map(t => ({ text: t.innerText.slice(0, 100), selected: t.getAttribute('aria-selected') || '' }));
    })()
  `);

  // Hidden elements
  facts.hiddenElements = await evalObj(`
    (() => {
      const hidden = document.querySelectorAll('[hidden], dialog, .toast, .overlay, .modal');
      return Array.from(hidden).map(el => ({
        tag: el.tagName,
        id: el.id || '',
        class: el.className || '',
        hidden: el.hidden || false,
        style: el.getAttribute('style') || '',
      }));
    })()
  `);

  // Computed styles
  facts.computedStyles = await evalObj(`
    (() => {
      const els = document.querySelectorAll('body, nav, header, footer, main, h1, button, a');
      const out = [];
      for (const el of els) {
        const cs = window.getComputedStyle(el);
        out.push({
          selector: el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : '') + (el.id ? '#' + el.id : ''),
          display: cs.display,
          visibility: cs.visibility,
          position: cs.position,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          fontSize: cs.fontSize,
          margin: cs.margin,
          padding: cs.padding,
        });
      }
      return out;
    })()
  `);

  // CSS custom properties
  facts.cssVariables = await evalObj(`
    (() => {
      const cs = window.getComputedStyle(document.documentElement);
      const vars = {};
      for (let i = 0; i < cs.length; i++) {
        const name = cs[i];
        vars[name] = cs.getPropertyValue(name);
      }
      return vars;
    })()
  `);

  // Viewport
  facts.viewport = await evalObj(`
    (() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    }))()
  `);

  // Scripts
  facts.scripts = await evalObj(`
    (() => {
      const scripts = document.querySelectorAll('script[src]');
      return Array.from(scripts).map(s => s.src);
    })()
  `);

  // CSS links
  facts.cssLinks = await evalObj(`
    (() => {
      const links = document.querySelectorAll('link[rel="stylesheet"], link[rel="icon"], link[rel="apple-touch-icon"]');
      return Array.from(links).map(l => ({ rel: l.rel, href: l.href, media: l.media || '' }));
    })()
  `);

  return facts;
}

function saveTabState() {
  fs.writeFileSync(TAB_STATE_FILE, JSON.stringify({ targetId, tabCreatedByUs, reusedExistingTab }));
}

function loadTabState() {
  try {
    const data = JSON.parse(fs.readFileSync(TAB_STATE_FILE, 'utf8'));
    targetId = data.targetId;
    tabCreatedByUs = data.tabCreatedByUs;
    reusedExistingTab = data.reusedExistingTab;
    return true;
  } catch {
    return false;
  }
}

export async function getConsoleErrors() {
  return [...consoleErrors];
}

export async function clearConsoleErrors() {
  consoleErrors = [];
}

export async function detach() {
  if (sessionId) {
    try { await cdpSend('Target.detachFromTarget', { sessionId }); } catch { /* ignore */ }
  }
  if (ws) { ws.close(); }
  console.log('Detached. Tab stays open for the human.');
}

export { BUILD_URL, tabCreatedByUs, reusedExistingTab, ensureTab, probe };
