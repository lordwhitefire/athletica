'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import './affiliate-workspace.css';

type View = 'signup' | 'verify' | 'dashboard' | 'trackers' | 'balance' | 'payouts' | 'admin-affiliates' | 'campaigns' | 'admin-payouts';
type Row = Record<string, unknown> & { id?: string };

const META: Record<View, [string, string, string]> = {
  signup: ['JOIN THE NETWORK', 'Affiliate application', 'Create your account in three short steps.'],
  verify: ['ACCOUNT VERIFICATION', 'Verify your email', 'Check your inbox for the verification link.'],
  dashboard: ['AFFILIATE WORKSPACE', 'Overview', 'Your performance and account activity.'],
  trackers: ['AFFILIATE WORKSPACE', 'Trackers', 'Create and manage the links you share.'],
  balance: ['AFFILIATE WORKSPACE', 'Balance', 'A record of commissions credited to your account.'],
  payouts: ['AFFILIATE WORKSPACE', 'Payouts', 'Request a payout and follow its status.'],
  'admin-affiliates': ['ADMIN WORKSPACE', 'Affiliates', 'Review applications and manage affiliate access.'],
  campaigns: ['ADMIN WORKSPACE', 'Campaigns', 'Configure commission terms attached to trackers.'],
  'admin-payouts': ['ADMIN WORKSPACE', 'Payout review', 'Review payout requests and record each transition.'],
};

const ENDPOINT: Partial<Record<View, string>> = {
  dashboard: '/api/affiliate/me', trackers: '/api/affiliate/trackers',
  balance: '/api/affiliate/balance', payouts: '/api/affiliate/payouts',
  'admin-affiliates': '/api/admin/affiliates', campaigns: '/api/admin/campaigns',
  'admin-payouts': '/api/admin/payouts',
};

function rowsFrom(data: unknown): Row[] {
  if (Array.isArray(data)) return data as Row[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['items', 'data', 'rows', 'trackers', 'entries', 'affiliates', 'campaigns', 'payouts']) {
      if (Array.isArray(obj[key])) return obj[key] as Row[];
    }
  }
  return [];
}
const val = (v: unknown) => v === null || v === undefined || v === '' ? '—' : String(v);

export default function AffiliateWorkspace({ view }: { view: View }) {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(Boolean(ENDPOINT[view]));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Record<string, string | boolean>>({
    email: '', password: '', full_name: '', address: '', country: '', payout_method: '',
    payout_instructions: '', notify_balance: true, label: '', reward_type: 'cash_reward',
    commission_type: 'percentage', reward: '', recurring: false, recurring_limit: '',
    minimum_payout: '', payout_term: 'net-30', scheduled_for: '',
  });
  const meta = META[view];

  const load = useCallback(async () => {
    const endpoint = ENDPOINT[view];
    if (!endpoint) return;
    setLoading(true); setError('');
    try {
      const response = await fetch(endpoint, { credentials: 'same-origin', cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Request failed (' + response.status + ')');
      setData(result && typeof result === 'object' ? result : {});
      setRows(rowsFrom(result));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load data.'); }
    finally { setLoading(false); }
  }, [view]);
  useEffect(() => { void load(); }, [load]);

  const setField = (name: string, value: string | boolean) => setForm(old => ({ ...old, [name]: value }));
  const send = async (endpoint: string, body: Record<string, unknown> = {}, method = 'POST') => {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(endpoint, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: method === 'GET' ? undefined : JSON.stringify(body) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Request failed (' + response.status + ')');
      setNotice(typeof result.message === 'string' ? result.message : 'Action completed.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'The request could not be completed.'); }
    finally { setBusy(false); }
  };
  const submit = (endpoint: string, body: Record<string, unknown>) => (e: FormEvent) => { e.preventDefault(); void send(endpoint, body); };

  const tableColumns = view === 'trackers' ? ['label', 'id', 'created_at']
    : view === 'balance' ? ['created_at', 'trace', 'amount', 'currency', 'released']
    : view === 'payouts' || view === 'admin-payouts' ? ['number', 'created_at', 'amount', 'currency', 'status', 'scheduled_for']
    : view === 'admin-affiliates' ? ['full_name', 'email', 'country', 'status', 'created_at']
    : ['reward_type', 'commission_type', 'reward', 'recurring', 'recurring_limit', 'minimum_payout', 'payout_term', 'status'];

  return <main className="aw-page"><div className="aw-shell">
    <header className="aw-header"><div><p className="aw-eyebrow">{meta[0]}</p><h1>{meta[1]}</h1><p className="aw-description">{meta[2]}</p></div>
      <nav className="aw-nav">{view.startsWith('admin-') || view === 'campaigns' ?
        <><Link href="/admin/affiliates">Affiliates</Link><Link href="/admin/campaigns">Campaigns</Link><Link href="/admin/payouts">Payouts</Link></> :
        view !== 'signup' && view !== 'verify' ? <><Link href="/affiliate/dashboard">Overview</Link><Link href="/affiliate/trackers">Trackers</Link><Link href="/affiliate/balance">Balance</Link><Link href="/affiliate/payouts">Payouts</Link></> : null}
      </nav>
    </header>
    {notice && <p className="aw-notice" role="status">{notice}</p>}
    {error && <p className="aw-error" role="alert">{error}</p>}

    {view === 'signup' && <section className="aw-panel">
      <div className="aw-steps">{['Profile', 'Payout details', 'Terms'].map((s, i) => <div key={s} className={step === i + 1 ? 'current' : step > i + 1 ? 'done' : ''}><b>{i + 1}</b>{s}</div>)}</div>
      <form onSubmit={e => { if (step < 3) { e.preventDefault(); setStep(step + 1); } else submit('/api/affiliate/signup', form)(e); }}>
        {step === 1 && <div className="aw-fields"><Field label="Full name" name="full_name" value={form.full_name} set={setField} required/><Field label="Email" name="email" type="email" value={form.email} set={setField} required/><Field label="Password" name="password" type="password" value={form.password} set={setField} required/><Field label="Country" name="country" value={form.country} set={setField} required/></div>}
        {step === 2 && <div className="aw-fields"><Field label="Address" name="address" value={form.address} set={setField} required/><Field label="Payout method" name="payout_method" value={form.payout_method} set={setField} required/><Field label="Payout instructions" name="payout_instructions" value={form.payout_instructions} set={setField} required/><label className="aw-check"><input type="checkbox" checked={Boolean(form.notify_balance)} onChange={e => setField('notify_balance', e.target.checked)}/> Notify me about balance changes</label></div>}
        {step === 3 && <div className="aw-terms"><h2>Affiliate terms</h2><p>Your application remains pending until email verification and administrator approval. You will only be able to access your own affiliate data. Commission terms are defined by the campaigns you participate in.</p><label className="aw-check"><input type="checkbox" required/> I accept the affiliate agreement.</label><p><Link href="/affiliate-agreement">Read affiliate agreement</Link></p></div>}
        <div className="aw-actions">{step > 1 && <button type="button" className="aw-button" onClick={() => setStep(step - 1)}>Back</button>}<button className="aw-button primary" disabled={busy}>{busy ? 'Submitting…' : step === 3 ? 'Submit application' : 'Continue'}</button></div>
      </form>
    </section>}

    {view === 'verify' && <section className="aw-panel aw-center"><div className="aw-mark">A</div><h2>Check your inbox</h2><p>Follow the verification link sent to your email. Your application remains pending until it is reviewed.</p><button className="aw-button" disabled={busy} onClick={() => void send('/api/affiliate/verification/resend')}>Resend verification email</button></section>}

    {view === 'dashboard' && <><div className="aw-stats"><Stat label="Available balance" value={val(data.balance_due)}/><Stat label="Total clicks" value={val(data.clicks)}/><Stat label="Active trackers" value={val(data.tracker_count)}/><Stat label="Account status" value={val(data.status)}/></div><section className="aw-panel"><h2>Your tracking link</h2><p className="aw-muted">Create a tracker for each channel so clicks can be attributed correctly.</p><strong className="aw-url">{val(data.primary_tracker_url)}</strong><Link href="/affiliate/trackers">Manage trackers →</Link></section><section className="aw-panel"><h2>Recent activity</h2><State loading={loading} error={error} empty={!rows.length} retry={load}/>{!loading && rows.length > 0 && <Table rows={rows.slice(0, 5)} columns={['created_at', 'event', 'amount', 'status']}/>}</section></>}

    {view === 'trackers' && <section className="aw-panel"><h2>Create tracker</h2><form className="aw-inline" onSubmit={submit('/api/affiliate/trackers', { label: form.label })}><Field label="Tracker label" name="label" value={form.label} set={setField} required/><button className="aw-button primary" disabled={busy}>Create tracker</button></form><State loading={loading} error={error} empty={!rows.length} retry={load}/>{!loading && rows.length > 0 && <div className="aw-table-wrap"><table className="aw-table"><thead><tr><th>Label</th><th>Tracking ID</th><th>Created</th><th>Link</th></tr></thead><tbody>{rows.map((r,i) => <tr key={val(r.id) + i}><td>{val(r.label)}</td><td><code>{val(r.id)}</code></td><td>{val(r.created_at)}</td><td><button className="aw-link-button" onClick={() => navigator.clipboard.writeText(window.location.origin + '/go/' + val(r.id))}>Copy link</button></td></tr>)}</tbody></table></div>}</section>}

    {view === 'balance' && <section className="aw-panel"><div className="aw-balance"><div><p className="aw-eyebrow">UNRELEASED COMMISSIONS</p><strong>{val(data.balance_due)}</strong></div><p className="aw-muted">Balance is calculated from unreleased ledger entries. Reversals appear as separate negative entries.</p></div><State loading={loading} error={error} empty={!rows.length} retry={load}/>{!loading && rows.length > 0 && <Table rows={rows} columns={tableColumns}/>}</section>}

    {view === 'payouts' && <section className="aw-panel"><div className="aw-heading"><div><h2>Payout history</h2><p className="aw-muted">Requests are subject to your minimum and payout details.</p></div><button className="aw-button primary" disabled={busy} onClick={() => void send('/api/affiliate/payouts/request')}>Request payout</button></div><State loading={loading} error={error} empty={!rows.length} retry={load}/>{!loading && rows.length > 0 && <Table rows={rows} columns={tableColumns}/>}</section>}

    {view === 'admin-affiliates' && <section className="aw-panel"><h2>Affiliate applications</h2><p className="aw-muted">Approval activates the account and issues its default tracker.</p><State loading={loading} error={error} empty={!rows.length} retry={load}/>{!loading && rows.length > 0 && <div className="aw-table-wrap"><table className="aw-table"><thead><tr><th>Name</th><th>Email</th><th>Country</th><th>Status</th><th>Applied</th><th>Action</th></tr></thead><tbody>{rows.map((r,i) => <tr key={val(r.id) + i}><td>{val(r.full_name)}</td><td>{val(r.email)}</td><td>{val(r.country)}</td><td><Status value={r.status}/></td><td>{val(r.created_at)}</td><td>{r.status === 'pending' ? <button className="aw-link-button" disabled={busy} onClick={() => void send('/api/admin/affiliates/' + encodeURIComponent(val(r.id)) + '/approve')}>Approve</button> : '—'}</td></tr>)}</tbody></table></div>}</section>}

    {view === 'campaigns' && <section className="aw-panel"><h2>Create campaign</h2><form className="aw-fields" onSubmit={submit('/api/admin/campaigns', form)}><label className="aw-field">Reward type<select value={String(form.reward_type)} onChange={e => setField('reward_type',e.target.value)}><option value="cash_reward">Cash reward</option><option value="discount_coupon">Discount coupon</option></select></label><label className="aw-field">Commission type<select value={String(form.commission_type)} onChange={e => setField('commission_type',e.target.value)}><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select></label><Field label="Reward" name="reward" type="number" value={form.reward} set={setField} required/><Field label="Minimum payout" name="minimum_payout" type="number" value={form.minimum_payout} set={setField} required/><label className="aw-field">Payout term<select value={String(form.payout_term)} onChange={e => setField('payout_term',e.target.value)}><option>net-7</option><option>net-14</option><option>net-30</option><option>net-60</option></select></label><label className="aw-check"><input type="checkbox" checked={Boolean(form.recurring)} onChange={e => setField('recurring',e.target.checked)}/> Recurring commission</label><Field label="Recurring limit (blank = lifetime)" name="recurring_limit" type="number" value={form.recurring_limit} set={setField}/><button className="aw-button primary" disabled={busy}>Create campaign</button></form><hr/><h2>Existing campaigns</h2><State loading={loading} error={error} empty={!rows.length} retry={load}/>{!loading && rows.length > 0 && <Table rows={rows} columns={tableColumns}/>}</section>}

    {view === 'admin-payouts' && <section className="aw-panel"><h2>Payout requests</h2><State loading={loading} error={error} empty={!rows.length} retry={load}/>{!loading && rows.length > 0 && <div className="aw-table-wrap"><table className="aw-table"><thead><tr><th>Affiliate</th><th>Number</th><th>Amount</th><th>Status</th><th>Scheduled</th><th>Actions</th></tr></thead><tbody>{rows.map((r,i) => <tr key={val(r.id) + i}><td>{val(r.full_name || r.email)}</td><td>{val(r.number)}</td><td>{val(r.amount)} {val(r.currency)}</td><td><Status value={r.status}/></td><td>{val(r.scheduled_for)}</td><td>{r.status === 'requested' ? <><button className="aw-link-button" disabled={busy} onClick={() => void send('/api/admin/payouts/' + encodeURIComponent(val(r.id)) + '/schedule', {scheduled_for: form.scheduled_for})}>Schedule</button><button className="aw-link-button danger" disabled={busy} onClick={() => void send('/api/admin/payouts/' + encodeURIComponent(val(r.id)) + '/reject')}>Reject</button></> : r.status === 'scheduled' ? <button className="aw-link-button" disabled={busy} onClick={() => void send('/api/admin/payouts/' + encodeURIComponent(val(r.id)) + '/paid')}>Mark paid</button> : '—'}</td></tr>)}</tbody></table></div>}<div className="aw-date"><Field label="Schedule date" name="scheduled_for" type="date" value={form.scheduled_for} set={setField}/></div></section>}
  </div></main>;
}

function Field({label,name,value,set,type='text',required=false}:{label:string;name:string;value:unknown;set:(n:string,v:string)=>void;type?:string;required?:boolean}) { return <label className="aw-field"><span>{label}</span><input name={name} type={type} value={String(value ?? '')} required={required} onChange={e=>set(name,e.target.value)}/></label>; }
function Stat({label,value}:{label:string;value:string}) { return <article className="aw-stat"><span>{label}</span><strong>{value}</strong></article>; }
function Status({value}:{value:unknown}) { const s=String(value ?? 'unknown').toLowerCase(); return <span className={'aw-status aw-status--' + s}>{val(value)}</span>; }
function Table({rows,columns}:{rows:Row[];columns:string[]}) { return <div className="aw-table-wrap"><table className="aw-table"><thead><tr>{columns.map(c=><th key={c}>{c.replaceAll('_',' ')}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={val(r.id)+i}>{columns.map(c=><td key={c}>{c==='status'?<Status value={r[c]}/>:val(r[c])}</td>)}</tr>)}</tbody></table></div>; }
function State({loading,error,empty,retry}:{loading:boolean;error:string;empty:boolean;retry:()=>void}) { if(loading)return <div className="aw-state">Loading…</div>;if(error)return <div className="aw-state"><strong>Could not load this page.</strong><p>{error}</p><button className="aw-button" onClick={retry}>Try again</button></div>;if(empty)return <div className="aw-state"><strong>Nothing here yet.</strong><p>When there is activity, it will appear here.</p></div>;return null; }
