'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProductRow, ProductBenefit, ProductDetail, BenefitIcon } from '@/lib/database.types';
import { ConfirmDialog } from '@/lib/ui/confirm-dialog';
import { parseAutofillFile, mapAutofillRow } from '@/lib/autofill';

// ---------------------------------------------------------------
// Types + helpers
// ---------------------------------------------------------------

const ICON_OPTIONS: BenefitIcon[] = ['boot', 'bolt', 'target', 'speed'];

interface EditorForm {
  name: string;
  slug: string;
  slugEdited: boolean;
  status: 'published' | 'unpublished';
  gender: string;
  color: string;
  asin: string;
  sku: string;
  collection: string;
  tagline: string;
  subtitle: string;
  intro: string;
  key_benefits: ProductBenefit[];
  technical_details: ProductDetail[];
  adjustment: string;
  range: string;
  sole_type: string;
  upper_material: string;
  traction: string;
  price: string;
  mainImage: string;
  gallery: string[];
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  tags: string[];
  box_contents: string[];
  sizes: string[];
  sizes_detail: string;
}

type EditorErrors = Partial<Record<'name' | 'slug' | 'price', string>>;

type ProductEditorProps =
  | {
      mode: 'create';
      onSaved: (product: ProductRow) => void;
      onClose: () => void;
    }
  | {
      mode: 'edit';
      initial: ProductRow;
      onSaved: (product: ProductRow) => void;
    };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function emptyForm(): EditorForm {
  return {
    name: '',
    slug: '',
    slugEdited: false,
    status: 'unpublished',
    gender: '',
    color: '',
    asin: '',
    sku: '',
    collection: '',
    tagline: '',
    subtitle: '',
    intro: '',
    key_benefits: [],
    technical_details: [],
    adjustment: '',
    range: '',
    sole_type: '',
    upper_material: '',
    traction: '',
    price: '',
    mainImage: '',
    gallery: [],
    seoTitle: '',
    seoDescription: '',
    keywords: '',
    tags: [],
    box_contents: [],
    sizes: [],
    sizes_detail: '',
  };
}

function formFromProduct(product: ProductRow): EditorForm {
  return {
    name: product.name,
    slug: product.slug,
    slugEdited: true,
    status: product.status,
    gender: product.gender ?? '',
    color: product.color ?? '',
    asin: product.asin ?? '',
    sku: product.sku ?? '',
    collection: product.collection ?? '',
    tagline: product.tagline ?? '',
    subtitle: product.subtitle ?? '',
    intro: product.intro ?? '',
    key_benefits: Array.isArray(product.key_benefits) ? product.key_benefits : [],
    technical_details: Array.isArray(product.technical_details) ? product.technical_details : [],
    adjustment: product.adjustment ?? '',
    range: product.range ?? '',
    sole_type: product.sole_type ?? '',
    upper_material: product.upper_material ?? '',
    traction: product.traction ?? '',
    price: typeof product.price === 'number' ? String(product.price) : '',
    mainImage: product.main_image ?? '',
    gallery: Array.isArray(product.images) ? product.images : [],
    seoTitle: product.meta?.seo_title ?? '',
    seoDescription: product.meta?.seo_description ?? '',
    keywords: product.meta?.keywords ?? '',
    tags: Array.isArray(product.tags) ? product.tags : [],
    box_contents: Array.isArray(product.box_contents) ? product.box_contents : [],
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    sizes_detail: product.sizes_detail ?? '',
  };
}

function formIsDirty(initial: EditorForm, current: EditorForm): boolean {
  const normalize = (f: EditorForm): EditorForm => {
    const slug = f.slugEdited ? f.slug : slugify(f.name);
    return { ...f, slug, slugEdited: false };
  };
  return JSON.stringify(normalize(initial)) !== JSON.stringify(normalize(current));
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------

export default function ProductEditor(props: ProductEditorProps) {
  const isEdit = props.mode === 'edit';
  const product = isEdit ? props.initial : null;

  const [form, setForm] = useState<EditorForm>(() => (product ? formFromProduct(product) : emptyForm()));
  const [errors, setErrors] = useState<EditorErrors>({});
  const [saveState, setSaveState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);

  // Image editor state
  const [linkInput, setLinkInput] = useState('');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<{ _id: string; url: string; originalFilename?: string }[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  // Autofill state
  const [autofillSummary, setAutofillSummary] = useState<string | null>(null);

  // Dirty-close protection
  const [confirmClose, setConfirmClose] = useState<'open' | 'discard' | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const baseline = product ? formFromProduct(product) : emptyForm();
  const dirty = formIsDirty(baseline, form);

  const setField = useCallback(<K extends keyof EditorForm>(key: K, value: EditorForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateBenefit = (index: number, patch: Partial<ProductBenefit>) => {
    setForm((prev) => ({
      ...prev,
      key_benefits: prev.key_benefits.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    }));
  };

  const moveArrayItem = <T,>(arr: T[], index: number, dir: -1 | 1): T[] => {
    const next = [...arr];
    const target = index + dir;
    if (target < 0 || target >= next.length) return next;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    return next;
  };

  // ---------------------------------------------------------------
  // Slug + uniqueness
  // ---------------------------------------------------------------

  const handleNameChange = (value: string) => {
    setForm((prev) => {
      const next = { ...prev, name: value };
      if (!prev.slugEdited) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
  };

  const checkSlugUnique = useCallback(
    async (slug: string): Promise<boolean> => {
      if (!slug) return true;
      const excludeId = props.mode === 'edit' ? props.initial.id : undefined;
      setSlugChecking(true);
      try {
        const params = new URLSearchParams({ search: slug, status: 'all', page: '1', pageSize: '50' });
        const res = await fetch(`/api/admin/products?${params.toString()}`);
        if (!res.ok) return true;
        const data = await res.json();
        return !(data.items ?? []).some((p: ProductRow) => p.slug === slug && p.id !== excludeId);
      } catch {
        return true;
      } finally {
        setSlugChecking(false);
      }
    },
    [props.mode, props.mode === 'edit' ? props.initial.id : null]
  );

  const validate = (): EditorErrors => {
    const next: EditorErrors = {};
    if (!form.name.trim()) next.name = 'Name is required';
    const slugValue = form.slug.trim() || slugify(form.name);
    if (!slugValue) next.slug = 'Slug is required';
    if (form.price.trim() === '' || Number.isNaN(Number.parseFloat(form.price)) || Number.parseFloat(form.price) <= 0) {
      next.price = 'Price must be greater than 0';
    }
    return next;
  };

  // ---------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------

  const buildPayload = useCallback(
    (): Partial<ProductRow> => {
      const slug = form.slug.trim() || slugify(form.name);
      const sku = form.sku.trim() || slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || null;
      const price = Number.parseFloat(form.price);
      return {
        name: form.name.trim(),
        slug,
        status: form.status,
        gender: form.gender.trim() || null,
        color: form.color.trim() || null,
        asin: form.asin.trim() || null,
        sku: sku,
        collection: form.collection.trim() || null,
        tagline: form.tagline.trim() || null,
        subtitle: form.subtitle.trim() || null,
        intro: form.intro.trim() || null,
        key_benefits: form.key_benefits,
        technical_details: form.technical_details,
        adjustment: form.adjustment.trim() || null,
        range: form.range.trim() || null,
        sole_type: form.sole_type.trim() || null,
        upper_material: form.upper_material.trim() || null,
        traction: form.traction.trim() || null,
        price,
        main_image: form.mainImage.trim() || null,
        images: form.gallery,
        tags: form.tags,
        box_contents: form.box_contents,
        sizes: form.sizes,
        sizes_detail: form.sizes_detail.trim() || null,
        meta: {
          seo_title: form.seoTitle.trim(),
          seo_description: form.seoDescription.trim(),
          keywords: form.keywords.trim(),
        },
      };
    },
    [form]
  );

  const handleSubmit = async () => {
    if (saveState === 'loading') return;

    const found = validate();
    setErrors(found);

    if (found.name) {
      nameRef.current?.focus();
      return;
    }
    if (found.slug) {
      slugRef.current?.focus();
      return;
    }
    if (found.price) {
      priceRef.current?.focus();
      return;
    }

    const slug = form.slug.trim() || slugify(form.name);

    // Uniqueness check (exclude self)
    const unique = await checkSlugUnique(slug);
    if (!unique) {
      setErrors((e) => ({ ...e, slug: 'Slug already in use' }));
      slugRef.current?.focus();
      return;
    }

    setSaveState('loading');
    setSaveError(null);

    const payload = buildPayload();
    const editId = isEdit && product ? product.id : null;

    try {
      let res: Response;
      let data: { item?: ProductRow; error?: string };

      if (editId) {
        res = await fetch(`/api/admin/products/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to save changes');
        setSaveState('success');
        props.onSaved(data.item as ProductRow);
      } else {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to create product');
        setSaveState('success');
        props.onSaved(data.item as ProductRow);
      }
    } catch (err) {
      setSaveState('error');
      setSaveError(err instanceof Error ? err.message : 'Unable to save changes');
    }
  };

  // ---------------------------------------------------------------
  // Autofill
  // ---------------------------------------------------------------

  const handleAutofillFile = async (file: File | null) => {
    if (!file) return;
    setAutofillSummary(null);
    try {
      const row = await parseAutofillFile(file);
      const mapped = mapAutofillRow(row);
      const count = Object.keys(mapped).length;
      if (count === 0) {
        setAutofillSummary('No matching columns found in file');
        return;
      }
      setForm((prev) => {
        const next = { ...prev };
        if (mapped.name) next.name = mapped.name;
        if (mapped.slug) {
          next.slug = mapped.slug;
          next.slugEdited = true;
        } else if (mapped.name) {
          next.slug = slugify(mapped.name);
          next.slugEdited = false;
        }
        if (mapped.status === 'published' || mapped.status === 'unpublished') next.status = mapped.status;
        if (mapped.gender) next.gender = mapped.gender;
        if (mapped.color) next.color = mapped.color;
        if (mapped.asin) next.asin = mapped.asin;
        if (mapped.sku) next.sku = mapped.sku;
        if (mapped.collection) next.collection = mapped.collection;
        if (mapped.tagline) next.tagline = mapped.tagline;
        if (mapped.subtitle) next.subtitle = mapped.subtitle;
        if (mapped.intro) next.intro = mapped.intro;
        if (Array.isArray(mapped.key_benefits) && mapped.key_benefits.length > 0) next.key_benefits = mapped.key_benefits;
        if (Array.isArray(mapped.technical_details) && mapped.technical_details.length > 0) next.technical_details = mapped.technical_details;
        if (mapped.adjustment) next.adjustment = mapped.adjustment;
        if (mapped.range) next.range = mapped.range;
        if (mapped.sole_type) next.sole_type = mapped.sole_type;
        if (mapped.upper_material) next.upper_material = mapped.upper_material;
        if (mapped.traction) next.traction = mapped.traction;
        if (typeof mapped.price === 'number') next.price = String(mapped.price);
        if (mapped.main_image) next.mainImage = mapped.main_image;
        if (Array.isArray(mapped.images) && mapped.images.length > 0) next.gallery = mapped.images;
        if (Array.isArray(mapped.tags) && mapped.tags.length > 0) next.tags = mapped.tags;
        if (Array.isArray(mapped.box_contents) && mapped.box_contents.length > 0) next.box_contents = mapped.box_contents;
        if (Array.isArray(mapped.sizes) && mapped.sizes.length > 0) next.sizes = mapped.sizes;
        if (mapped.sizes_detail) next.sizes_detail = mapped.sizes_detail;
        const meta = mapped.meta;
        if (meta) {
          if (meta.seo_title) next.seoTitle = meta.seo_title;
          if (meta.seo_description) next.seoDescription = meta.seo_description;
          if (meta.keywords) next.keywords = meta.keywords;
        }
        return next;
      });
      setAutofillSummary(`Autofilled ${count} fields`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to read file';
      if (props.mode === 'create') {
        setAutofillSummary(`Unable to read file: ${message}`);
      }
    }
  };

  // ---------------------------------------------------------------
  // Images — routes 1/2/3
  // ---------------------------------------------------------------

  const addImageUrl = (url: string) => {
    setForm((prev) => {
      if (!prev.mainImage) return { ...prev, mainImage: url };
      return { ...prev, gallery: [...prev.gallery, url] };
    });
  };

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploadState('uploading');
    setUploadFile(file);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      addImageUrl(data.item.url);
      setUploadState('idle');
      setUploadFile(null);
    } catch {
      setUploadState('error');
    }
  };

  const openMediaBrowser = async () => {
    setMediaOpen(true);
    setMediaLoading(true);
    setMediaError(false);
    try {
      const res = await fetch('/api/admin/media/assets');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch media assets');
      setMediaItems(data.items ?? []);
    } catch {
      setMediaError(true);
    } finally {
      setMediaLoading(false);
    }
  };

  // ---------------------------------------------------------------
  // Dirty-close handling
  // ---------------------------------------------------------------

  const requestClose = () => {
    if (props.mode !== 'create') return;
    if (dirty) {
      setConfirmClose('open');
    } else {
      props.onClose();
    }
  };

  const discardAndClose = () => {
    setConfirmClose(null);
    if (product) {
      setForm(formFromProduct(product));
    } else {
      setForm(emptyForm());
    }
    if (props.mode === 'create') props.onClose();
  };

  // Escape closes modal when idle (and not submitting)
  useEffect(() => {
    if (props.mode !== 'create') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && saveState !== 'loading') {
        requestClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode, saveState, dirty]);

  // ---------------------------------------------------------------
  // Render — small sub-renderers
  // ---------------------------------------------------------------

  const renderSection = (label: string, children: React.ReactNode) => (
    <section className="editor-section">
      <h3 className="editor-section__label">{label}</h3>
      {children}
    </section>
  );

  const renderTextInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: { placeholder?: string; textarea?: boolean; type?: string }
  ) => (
    <label className="editor-field">
      <span className="editor-field__label">{label}</span>
      {opts?.textarea ? (
        <textarea
          className="editor-input"
          value={value}
          placeholder={opts.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="editor-input"
          type={opts?.type ?? 'text'}
          value={value}
          placeholder={opts?.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );

  const content = (
    <div className="editor">
      {isEdit ? (
        <div className="editor-header">
          <div className="editor-eyebrow">ROLLOUT 1</div>
          <h2 className="editor-title">Edit Product</h2>
        </div>
      ) : (
        <div className="editor-header editor-header--modal">
          <div className="editor-eyebrow">ROLLOUT 1</div>
          <h2 className="editor-title">Add Product</h2>
          <span className="editor-autofill">
            <button
              type="button"
              className="editor-btn editor-btn--ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              Autofill from file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              hidden
              onChange={(e) => {
                handleAutofillFile(e.target.files?.[0] ?? null);
                e.target.value = '';
              }}
            />
          </span>
          <button type="button" className="editor-close" onClick={requestClose} aria-label="Close editor">
            ×
          </button>
          {autofillSummary && <p className="editor-autofill__summary">{autofillSummary}</p>}
        </div>
      )}

      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {renderSection(
          'IDENTITY',
          <>
            {isEdit && product && renderTextInput('ID', product.id, () => {}, {})}
            <div className="editor-field">
              <span className="editor-field__label">Name</span>
              <input
                ref={nameRef}
                className={`editor-input ${errors.name ? 'is-invalid' : ''}`}
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              {errors.name && <span className="editor-field__error">{errors.name}</span>}
            </div>
            <div className="editor-field">
              <span className="editor-field__label">Slug</span>
              <input
                ref={slugRef}
                className={`editor-input ${errors.slug ? 'is-invalid' : ''}`}
                value={form.slug}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, slug: slugify(e.target.value), slugEdited: true }));
                  if (errors.slug) setErrors((er) => ({ ...er, slug: undefined }));
                }}
                onBlur={() => {
                  if (form.slug && form.slug.trim()) {
                    checkSlugUnique(form.slug).then((unique) => {
                      if (!unique) setErrors((e) => ({ ...e, slug: 'Slug already in use' }));
                    });
                  }
                }}
              />
              {errors.slug && <span className="editor-field__error">{errors.slug}</span>}
              {slugChecking && <span className="editor-field__hint">Checking…</span>}
            </div>
            <div className="editor-row">
              <label className="editor-field">
                <span className="editor-field__label">Status</span>
                <select
                  className="editor-input"
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value as 'published' | 'unpublished')}
                >
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </label>
              {renderTextInput('Gender', form.gender, (v) => setField('gender', v))}
              {renderTextInput('Color', form.color, (v) => setField('color', v))}
            </div>
            <div className="editor-row">
              {renderTextInput('ASIN (optional)', form.asin, (v) => setField('asin', v))}
              {renderTextInput('SKU (optional)', form.sku, (v) => setField('sku', v))}
            </div>
          </>
        )}

        {renderSection(
          'DESCRIPTION',
          <>
            {renderTextInput('Collection', form.collection, (v) => setField('collection', v))}
            {renderTextInput('Tagline', form.tagline, (v) => setField('tagline', v))}
            {renderTextInput('Subtitle', form.subtitle, (v) => setField('subtitle', v))}
            {renderTextInput('Intro', form.intro, (v) => setField('intro', v), { textarea: true })}
          </>
        )}

        {renderSection(
          'KEY BENEFITS',
          <>
            {form.key_benefits.map((benefit, index) => (
              <div className="editor-benefit" key={`${index}-${benefit.title}`}>
                <div className="editor-benefit__icon-picker" role="group" aria-label={`Icon for benefit ${index + 1}`}>
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`editor-icon ${benefit.icon === icon ? 'is-active' : ''}`}
                      onClick={() => updateBenefit(index, { icon })}
                      aria-pressed={benefit.icon === icon}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <input
                  className="editor-input"
                  value={benefit.title}
                  placeholder="Title"
                  onChange={(e) => updateBenefit(index, { title: e.target.value })}
                />
                <input
                  className="editor-input"
                  value={benefit.text}
                  placeholder="Text"
                  onChange={(e) => updateBenefit(index, { text: e.target.value })}
                />
                <div className="editor-move-row">
                  <button type="button" className="editor-btn editor-btn--ghost" onClick={() => setForm((p) => ({ ...p, key_benefits: moveArrayItem(p.key_benefits, index, -1) }))}>
                    Up
                  </button>
                  <button type="button" className="editor-btn editor-btn--ghost" onClick={() => setForm((p) => ({ ...p, key_benefits: moveArrayItem(p.key_benefits, index, 1) }))}>
                    Down
                  </button>
                  <button type="button" className="editor-btn editor-btn--ghost editor-btn--danger" onClick={() => setForm((p) => ({ ...p, key_benefits: p.key_benefits.filter((_, i) => i !== index) }))}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="editor-btn editor-btn--ghost"
              disabled={form.key_benefits.length >= 8}
              onClick={() =>
                setForm((p) => ({ ...p, key_benefits: [...p.key_benefits, { title: '', text: '', icon: 'boot' }] }))
              }
            >
              + Add benefit
            </button>
          </>
        )}

        {renderSection(
          'TECHNICAL DETAILS',
          <>
            {form.technical_details.map((detail, index) => (
              <div className="editor-benefit" key={`${index}-${detail.label}`}>
                <input
                  className="editor-input"
                  value={detail.label}
                  placeholder="Label (e.g. ADJUSTMENT)"
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      technical_details: p.technical_details.map((d, i) => (i === index ? { ...d, label: e.target.value } : d)),
                    }))
                  }
                />
                <input
                  className="editor-input"
                  value={detail.value}
                  placeholder="Value"
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      technical_details: p.technical_details.map((d, i) => (i === index ? { ...d, value: e.target.value } : d)),
                    }))
                  }
                />
                <div className="editor-move-row">
                  <button type="button" className="editor-btn editor-btn--ghost" onClick={() => setForm((p) => ({ ...p, technical_details: moveArrayItem(p.technical_details, index, -1) }))}>
                    Up
                  </button>
                  <button type="button" className="editor-btn editor-btn--ghost" onClick={() => setForm((p) => ({ ...p, technical_details: moveArrayItem(p.technical_details, index, 1) }))}>
                    Down
                  </button>
                  <button
                    type="button"
                    className="editor-btn editor-btn--ghost editor-btn--danger"
                    onClick={() => setForm((p) => ({ ...p, technical_details: p.technical_details.filter((_, i) => i !== index) }))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="editor-btn editor-btn--ghost"
              onClick={() => setForm((p) => ({ ...p, technical_details: [...p.technical_details, { label: '', value: '' }] }))}
            >
              + Add detail
            </button>
          </>
        )}

        {renderSection(
          'ATTRIBUTES',
          <>
            <div className="editor-row">
              {renderTextInput('Adjustment', form.adjustment, (v) => setField('adjustment', v))}
              {renderTextInput('Range', form.range, (v) => setField('range', v))}
            </div>
            <div className="editor-row">
              {renderTextInput('Sole Type', form.sole_type, (v) => setField('sole_type', v))}
              {renderTextInput('Upper Material', form.upper_material, (v) => setField('upper_material', v))}
              {renderTextInput('Traction', form.traction, (v) => setField('traction', v))}
            </div>
            <div className="editor-field">
              <span className="editor-field__label">Price ($)</span>
              <input
                ref={priceRef}
                className={`editor-input ${errors.price ? 'is-invalid' : ''}`}
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => {
                  setField('price', e.target.value);
                  if (errors.price) setErrors((er) => ({ ...er, price: undefined }));
                }}
              />
              {errors.price && <span className="editor-field__error">{errors.price}</span>}
            </div>
          </>
        )}

        {renderSection(
          'SIZES',
          <>
            <div className="editor-chips">
              {form.sizes.map((size, index) => (
                <span className="editor-chip" key={`${index}-${size}`}>
                  {size}
                  <button
                    type="button"
                    aria-label={`Remove size ${size}`}
                    onClick={() => setForm((p) => ({ ...p, sizes: p.sizes.filter((_, i) => i !== index) }))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="editor-chip-add">
              <input
                className="editor-input"
                placeholder="Type a size and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) setForm((p) => ({ ...p, sizes: p.sizes.includes(value) ? p.sizes : [...p.sizes, value] }));
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
            {renderTextInput('Sizes detail', form.sizes_detail, (v) => setField('sizes_detail', v))}
          </>
        )}

        {renderSection(
          'IMAGES',
          <>
            <div className="editor-row">
              <div className="editor-field editor-field--grow">
                <span className="editor-field__label">Add image link</span>
                <div className="editor-inline">
                  <input
                    className="editor-input"
                    value={linkInput}
                    placeholder="Paste a direct image URL"
                    onChange={(e) => setLinkInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="editor-btn"
                    onClick={() => {
                      const url = linkInput.trim();
                      if (url) {
                        addImageUrl(url);
                        setLinkInput('');
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="editor-image-actions">
              <button type="button" className="editor-btn" onClick={() => uploadInputRef.current?.click()} disabled={uploadState === 'uploading'}>
                {uploadState === 'uploading' ? 'Uploading…' : 'Upload image'}
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                hidden
                onChange={(e) => {
                  handleUpload(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
              {uploadState === 'error' && (
                <button type="button" className="editor-btn editor-btn--danger" onClick={() => uploadFile && handleUpload(uploadFile)}>
                  Upload failed — Retry
                </button>
              )}
              <button type="button" className="editor-btn editor-btn--ghost" onClick={openMediaBrowser}>
                Select from media
              </button>
            </div>

            <div className="editor-thumb">
              <div className="editor-thumb__badge">MAIN</div>
              {form.mainImage ? (
                <img className="editor-thumb__img" src={form.mainImage} alt="Main product image" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              ) : (
                <div className="editor-thumb__placeholder">No main image set</div>
              )}
              {form.mainImage && (
                <button type="button" className="editor-btn editor-btn--ghost" onClick={() => setForm((p) => ({ ...p, mainImage: '' }))}>
                  Remove main
                </button>
              )}
            </div>

            {form.gallery.length > 0 && (
              <div className="editor-grid">
                {form.gallery.map((url, index) => (
                  <div className="editor-grid__item" key={`${index}-${url}`}>
                    <img className="editor-grid__img" src={url} alt="" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                    <div className="editor-grid__caption">
                      <button type="button" className="editor-btn editor-btn--ghost" onClick={() => setForm((p) => ({ ...p, mainImage: url, gallery: p.gallery.filter((_, i) => i !== index) }))}>
                        Set as main
                      </button>
                      <button type="button" className="editor-btn editor-btn--ghost" onClick={() => setForm((p) => ({ ...p, gallery: moveArrayItem(p.gallery, index, -1) }))}>
                        Up
                      </button>
                      <button type="button" className="editor-btn editor-btn--ghost" onClick={() => setForm((p) => ({ ...p, gallery: moveArrayItem(p.gallery, index, 1) }))}>
                        Down
                      </button>
                      <button type="button" className="editor-btn editor-btn--ghost editor-btn--danger" onClick={() => setForm((p) => ({ ...p, gallery: p.gallery.filter((_, i) => i !== index) }))}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mediaOpen && (
              <div className="media-browser">
                <div className="media-browser__header">
                  <strong>Sanity media</strong>
                  <button type="button" className="editor-close" onClick={() => setMediaOpen(false)} aria-label="Close media browser">
                    ×
                  </button>
                </div>
                {mediaLoading && <p className="editor-field__hint">Loading…</p>}
                {mediaError && (
                  <div className="media-browser__empty">
                    <p>Unable to load media.</p>
                    <button type="button" className="editor-btn" onClick={openMediaBrowser}>
                      TRY AGAIN
                    </button>
                  </div>
                )}
                {!mediaLoading && !mediaError && mediaItems.length === 0 && <p className="editor-field__hint">No media found.</p>}
                {!mediaLoading && !mediaError && mediaItems.length > 0 && (
                  <div className="media-browser__grid">
                    {mediaItems.map((asset) => (
                      <button
                        key={asset._id}
                        type="button"
                        className="media-browser__item"
                        onClick={() => {
                          addImageUrl(asset.url);
                          setMediaOpen(false);
                        }}
                      >
                        <img src={asset.url} alt={asset.originalFilename ?? 'Media asset'} />
                        <span>{asset.originalFilename ?? 'Untitled'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {renderSection(
          'SEO',
          <>
            {renderTextInput('SEO Title', form.seoTitle, (v) => setField('seoTitle', v))}
            {renderTextInput('SEO Description', form.seoDescription, (v) => setField('seoDescription', v), { textarea: true })}
            {renderTextInput('Keywords', form.keywords, (v) => setField('keywords', v))}
          </>
        )}

        {renderSection(
          'TAGS',
          <>
            <div className="editor-chips">
              {form.tags.map((tag, index) => (
                <span className="editor-chip" key={`${index}-${tag}`}>
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove tag ${tag}`}
                    onClick={() => setForm((p) => ({ ...p, tags: p.tags.filter((_, i) => i !== index) }))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="editor-chip-add">
              <input
                className="editor-input"
                placeholder="Type a tag and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) setForm((p) => ({ ...p, tags: p.tags.includes(value) ? p.tags : [...p.tags, value] }));
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </>
        )}

        {renderSection(
          'BOX CONTENTS',
          <>
            <div className="editor-box-list">
              {form.box_contents.map((item, index) => (
                <div className="editor-box-list__row" key={`${index}-${item}`}>
                  <span>{item}</span>
                  <button
                    type="button"
                    className="editor-btn editor-btn--ghost editor-btn--danger"
                    onClick={() => setForm((p) => ({ ...p, box_contents: p.box_contents.filter((_, i) => i !== index) }))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="editor-chip-add">
              <input
                className="editor-input"
                placeholder="Add an item (e.g. 1 × Product)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) setForm((p) => ({ ...p, box_contents: [...p.box_contents, value] }));
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </>
        )}

        <div className="editor-savebar">
          {saveState === 'error' && <span className="editor-savebar__error">{saveError ?? 'Unable to save changes'}</span>}
          {saveState === 'success' && <span className="editor-savebar__success">Saved</span>}
          <button type="submit" className="editor-btn editor-btn--primary" disabled={saveState === 'loading'}>
            {isEdit ? (saveState === 'loading' ? 'Saving…' : 'Save Changes') : saveState === 'loading' ? 'Creating…' : 'Create Product'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmClose === 'open'}
        title="UNSAVED CHANGES"
        description="You have changes that haven't been saved."
        confirmLabel="Discard Changes"
        busy={confirmClose === 'discard'}
        onCancel={() => setConfirmClose(null)}
        onConfirm={() => discardAndClose()}
      />
    </div>
  );

  if (props.mode === 'create') {
    return (
      <div className="confirm-overlay editor-overlay">
        <div className="editor-sheet" role="dialog" aria-modal="true">
          {content}
        </div>
      </div>
    );
  }

  return content;
}