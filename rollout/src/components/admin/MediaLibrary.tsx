'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './media-library.css';

type MediaAsset = {
  _id: string;
  url: string;
  originalFilename?: string | null;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export function MediaLibrary() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/media/assets', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to load media.');
      setAssets(Array.isArray(body.items) ? body.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load media.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAssets(); }, [loadAssets]);

  async function uploadFile(file: File) {
    setNotice('');
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setNotice('Choose a JPEG, PNG, WebP or AVIF image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setNotice('The image must be 5MB or smaller.');
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const response = await fetch('/api/admin/media/upload', { method: 'POST', body: form });
      const body = await response.json();
      if (!response.ok || !body.item) throw new Error(body.error || 'Upload failed.');
      setAssets(current => [body.item as MediaAsset, ...current]);
      setNotice('Image uploaded successfully.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Upload failed. Try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setNotice('Image URL copied.');
    } catch {
      setNotice('Could not copy the URL. Select it from the asset details.');
    }
  }

  return (
    <section className="media-library">
      <div className="media-library__heading">
        <div>
          <p className="media-library__eyebrow">CONTENT ASSETS</p>
          <h1>Media library</h1>
          <p>Manage product imagery stored in the Athletica media library.</p>
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload image'}
        </button>
        <input
          ref={inputRef}
          className="media-library__file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={event => {
            const file = event.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
      </div>

      {notice && <p className="media-library__notice" role="status" aria-live="polite">{notice}</p>}

      {loading ? (
        <div className="media-library__grid" aria-label="Loading media">
          {Array.from({ length: 8 }, (_, i) => <div className="media-library__skeleton" key={i} />)}
        </div>
      ) : error ? (
        <div className="media-library__state">
          <h2>Unable to load media</h2>
          <p>{error}</p>
          <button type="button" onClick={() => void loadAssets()}>Try again</button>
        </div>
      ) : assets.length === 0 ? (
        <div className="media-library__state">
          <span className="media-library__empty-mark" aria-hidden="true">＋</span>
          <h2>Your library is empty</h2>
          <p>Upload a product image to make it available in the product editor.</p>
          <button type="button" onClick={() => inputRef.current?.click()}>Upload first image</button>
        </div>
      ) : (
        <div className="media-library__grid">
          {assets.map(asset => (
            <article className="media-library__asset" key={asset._id}>
              <div className="media-library__preview">
                <img src={asset.url} alt={asset.originalFilename || 'Uploaded product asset'} loading="lazy" />
              </div>
              <div className="media-library__asset-meta">
                <div className="media-library__asset-info">
                  <span title={asset.originalFilename || asset._id}>{asset.originalFilename || 'Untitled image'}</span>
                  <code title={asset.url}>{asset.url}</code>
                </div>
                <button type="button" onClick={() => void copyUrl(asset.url)}>Copy URL</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
