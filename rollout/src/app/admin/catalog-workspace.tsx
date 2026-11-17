'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import './catalog-workspace.css';

type Entry = { id: string; name: string; slug: string; description: string; products: number; status: 'Active' | 'Draft' };
type Kind = 'categories' | 'collections';

const initial: Record<Kind, Entry[]> = {
  categories: [
    { id: 'CAT-001', name: 'Running', slug: 'running', description: 'Running footwear and accessories', products: 12, status: 'Active' },
    { id: 'CAT-002', name: 'Training', slug: 'training', description: 'Gym and training essentials', products: 8, status: 'Active' },
    { id: 'CAT-003', name: 'Recovery', slug: 'recovery', description: 'Recovery and mobility products', products: 0, status: 'Draft' },
  ],
  collections: [
    { id: 'COL-001', name: 'New Arrivals', slug: 'new-arrivals', description: 'Recently added products', products: 6, status: 'Active' },
    { id: 'COL-002', name: 'Staff Picks', slug: 'staff-picks', description: 'Selected product highlights', products: 4, status: 'Active' },
  ],
};

export default function CatalogWorkspace({ kind }: { kind: Kind }) {
  const noun = kind === 'categories' ? 'Category' : 'Collection';
  const [items, setItems] = useState(initial[kind]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [dialog, setDialog] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', description: '', status: 'Draft' as Entry['status'] });
  const filtered = useMemo(() => items.filter((item) => (status === 'All' || item.status === status) && (item.name + item.slug).toLowerCase().includes(query.toLowerCase())), [items, query, status]);
  const openCreate = () => { setSelected(null); setForm({ name: '', slug: '', description: '', status: 'Draft' }); setDialog('create'); };
  const openEdit = (item: Entry) => { setSelected(item); setForm({ name: item.name, slug: item.slug, description: item.description, status: item.status }); setDialog('edit'); };
  const save = () => {
    if (!form.name.trim() || !form.slug.trim()) { setNotice('Name and URL slug are required.'); return; }
    if (dialog === 'edit' && selected) setItems((all) => all.map((x) => x.id === selected.id ? { ...x, ...form } : x));
    else setItems((all) => [...all, { id: `${kind === 'categories' ? 'CAT' : 'COL'}-${String(all.length + 1).padStart(3, '0')}`, ...form, products: 0 }]);
    setDialog(null); setNotice(`${noun} saved in this UI preview.`);
  };
  const remove = () => { if (selected) setItems((all) => all.filter((x) => x.id !== selected.id)); setDialog(null); setNotice(`${noun} removed from this UI preview.`); };

  return <main className="catalog-admin">
    <header className="catalog-head"><div><p className="catalog-kicker">ATHLETICA / ADMIN</p><h1>{kind}</h1><p className="catalog-subtitle">Organise how products are grouped across the storefront.</p></div><button className="catalog-primary" onClick={openCreate}>＋ NEW {noun.toUpperCase()}</button></header>
    <section className="catalog-toolbar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${kind}…`} aria-label={`Search ${kind}`} /><div className="catalog-tabs">{['All', 'Active', 'Draft'].map((x) => <button key={x} className={status === x ? 'active' : ''} onClick={() => setStatus(x)}>{x}</button>)}</div><span className="catalog-count">{filtered.length} {kind}</span></section>
    {notice && <div className="catalog-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button></div>}
    {filtered.length ? <div className="catalog-table-wrap"><table><thead><tr><th>Name</th><th>URL slug</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.description || 'No description'}</small></td><td className="catalog-mono">/{item.slug}</td><td>{item.products}</td><td><span className={`catalog-status ${item.status.toLowerCase()}`}>{item.status}</span></td><td><button className="catalog-link" onClick={() => openEdit(item)}>Edit</button><button className="catalog-link danger" onClick={() => { setSelected(item); setDialog('delete'); }}>Delete</button></td></tr>)}</tbody></table></div> : <div className="catalog-empty"><span>✳</span><h2>{query ? 'No matching results' : `No ${kind} yet`}</h2><p>{query ? 'Try another search term or clear your filters.' : `Create your first ${noun.toLowerCase()} to organise the catalog.`}</p><button className="catalog-primary" onClick={query ? () => setQuery('') : openCreate}>{query ? 'CLEAR SEARCH' : `CREATE ${noun.toUpperCase()}`}</button></div>}
    {dialog && <div className="catalog-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setDialog(null); }}><section className="catalog-dialog" role="dialog" aria-modal="true" aria-labelledby="catalog-dialog-title"><button className="catalog-close" onClick={() => setDialog(null)} aria-label="Close dialog">×</button>{dialog === 'delete' ? <><p className="catalog-kicker">CONFIRM ACTION</p><h2 id="catalog-dialog-title">Delete {selected?.name}?</h2><p>This removes the item from this UI preview. Products currently assigned to it are not changed here.</p><div className="catalog-dialog-actions"><button onClick={() => setDialog(null)}>CANCEL</button><button className="danger-fill" onClick={remove}>DELETE {noun.toUpperCase()}</button></div></> : <><p className="catalog-kicker">{dialog === 'edit' ? 'EDIT' : 'CREATE'} {noun.toUpperCase()}</p><h2 id="catalog-dialog-title">{dialog === 'edit' ? 'Update details' : `New ${noun}`}</h2><label>Name<input autoFocus value={form.name} onChange={(e) => setForm((x) => ({ ...x, name: e.target.value, slug: x.slug || e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') }))} /></label><label>URL slug<input value={form.slug} onChange={(e) => setForm((x) => ({ ...x, slug: e.target.value }))} /></label><label>Description<textarea rows={3} value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} /></label><label>Status<select value={form.status} onChange={(e) => setForm((x) => ({ ...x, status: e.target.value as Entry['status'] }))}><option>Draft</option><option>Active</option></select></label><div className="catalog-dialog-actions"><button onClick={() => setDialog(null)}>CANCEL</button><button className="catalog-primary" onClick={save}>SAVE {noun.toUpperCase()}</button></div></>}</section></div>}
  </main>;
}

export function AdminSettingsWorkspace() {
  const [section, setSection] = useState('General');
  const [storeName, setStoreName] = useState('Athletica');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  return <main className="catalog-admin"><header className="catalog-head"><div><p className="catalog-kicker">ATHLETICA / ADMIN</p><h1>Settings</h1><p className="catalog-subtitle">Manage workspace preferences and account security.</p></div></header><div className="settings-layout"><nav className="settings-nav">{['General', 'Notifications', 'Security', 'Appearance'].map((x) => <button key={x} className={section === x ? 'active' : ''} onClick={() => { setSection(x); setSaved(false); }}>{x}</button>)}</nav><section className="settings-panel"><p className="catalog-kicker">WORKSPACE PREFERENCES</p><h2>{section}</h2>{section === 'General' ? <><label>Store name<input value={storeName} onChange={(e) => setStoreName(e.target.value)} /></label><label>Contact email<input type="email" placeholder="team@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label></> : section === 'Notifications' ? <div className="settings-option"><div><strong>Admin activity notifications</strong><p>Show an in-app notice when an admin action needs attention.</p></div><input type="checkbox" defaultChecked /></div> : section === 'Security' ? <div className="settings-option"><div><strong>Two-step verification</strong><p>Display the current security preference.</p></div><input type="checkbox" checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} /></div> : <div className="settings-option"><div><strong>Dark workspace</strong><p>Athletica admin uses the dark workspace appearance.</p></div><span className="catalog-status active">Enabled</span></div>}<div className="settings-save">{saved && <span role="status">Changes saved in this UI preview.</span>}<button className="catalog-primary" onClick={() => setSaved(true)}>SAVE CHANGES</button></div></section></div></main>;
}

export function ProductImportWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<'upload' | 'mapping' | 'processing' | 'complete'>('upload');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [dragging, setDragging] = useState(false);
  const choose = (next: File | null) => { if (!next) return; if (!/\.csv$/i.test(next.name)) { setMessage('Choose a .csv file to continue.'); return; } setFile(next); setMessage(''); setPhase('mapping'); };
  const process = () => { setPhase('processing'); setProgress(0); let n = 0; const timer = window.setInterval(() => { n = Math.min(100, n + 20); setProgress(n); if (n === 100) { window.clearInterval(timer); setPhase('complete'); } }, 180); };
  return <main className="catalog-admin"><header className="catalog-head"><div><p className="catalog-kicker">PRODUCTS / IMPORT</p><h1>Import products</h1><p className="catalog-subtitle">Upload a CSV, review its column mapping, then preview the processing state.</p></div><Link className="catalog-back" href="/admin/products">← BACK TO PRODUCTS</Link></header><div className="import-card">{phase === 'upload' ? <div className={`import-drop ${dragging ? 'dragging' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files[0] ?? null); }}><div className="import-icon">⇧</div><h2>Drop your CSV file here</h2><p>or choose a file from your device</p><label className="catalog-primary import-choose">CHOOSE CSV<input type="file" accept=".csv,text/csv" onChange={(e) => choose(e.target.files?.[0] ?? null)} /></label><small>CSV files only · Review rows before processing</small></div> : <><div className="import-stepper"><span className="done">01 · UPLOAD</span><span className={phase !== 'mapping' ? 'done' : 'current'}>02 · MAPPING</span><span className={phase === 'processing' || phase === 'complete' ? 'done' : ''}>03 · PROCESSING</span></div><div className="import-file"><span>▤</span><div><strong>{file?.name}</strong><small>{file ? (file.size / 1024).toFixed(1) + ' KB' : ''}</small></div><button onClick={() => { setFile(null); setPhase('upload'); setProgress(0); }}>REMOVE</button></div>{phase === 'mapping' ? <><h2>Review column mapping</h2><p className="catalog-subtitle">Confirm which CSV columns correspond to product fields before continuing.</p><div className="mapping-grid">{['Product name', 'Slug', 'Description', 'SKU', 'Main image', 'Status'].map((field, i) => <label key={field}>{field}<select defaultValue={['name', 'slug', 'description', 'sku', 'main_image', 'status'][i]}><option value="name">name</option><option value="slug">slug</option><option value="description">description</option><option value="sku">sku</option><option value="main_image">main_image</option><option value="status">status</option><option value="">Do not import</option></select></label>)}</div><div className="import-footer"><button onClick={() => { setPhase('upload'); setFile(null); }}>CANCEL</button><button className="catalog-primary" onClick={process}>CONTINUE TO PROCESSING →</button></div></> : phase === 'processing' ? <><h2>Processing import</h2><p>Your import is in progress. This is a UI preview state.</p><div className="import-progress"><span style={{ width: progress + '%' }} /></div><div className="import-progress-label"><strong>{progress}%</strong><span>{progress === 100 ? 'Finishing…' : 'Rows being processed'}</span></div></> : <div className="import-complete"><span>✓</span><h2>Import preview complete</h2><p>The interaction flow has reached its completed state. No products were written by this UI preview.</p><button className="catalog-primary" onClick={() => { setPhase('upload'); setFile(null); setProgress(0); }}>START ANOTHER IMPORT</button></div>}</>}{message && <p className="import-message" role="alert">{message}</p>}</div></main>;
}
