"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  DATE_FILTER_OPTIONS,
  SIZE_FILTER_OPTIONS,
} from "./media-library.data";
import type { MediaLibraryModel } from "./use-media-library";
import { useMediaLibrary } from "./use-media-library";
import "./media-library-interactions.css";

type MediaLibraryContextValue = {
  model: MediaLibraryModel;
};

const MediaLibraryContext = createContext<MediaLibraryContextValue | null>(null);

export function useMediaLibraryModel() {
  const ctx = useContext(MediaLibraryContext);
  if (!ctx) {
    throw new Error(
      "useMediaLibraryModel must be used inside MediaLibraryInteractionLayer",
    );
  }
  return ctx;
}

export function MediaLibraryInteractionLayer({
  children,
}: {
  children: ReactNode;
}) {
  const model = useMediaLibrary();

  return (
    <MediaLibraryContext.Provider value={{ model }}>
      <div
        className="media-library-interaction-layer"
        data-media-library-root
        data-responsive="phone-tablet-desktop"
      >
        {children}
        <MediaLibraryOverlaySurfaces model={model} />
      </div>
    </MediaLibraryContext.Provider>
  );
}

function MediaLibraryOverlaySurfaces({ model }: { model: MediaLibraryModel }) {
  const {
    state,
    pickPopoverOption,
    closeFilters,
    toggleFilter,
    setSizeFilter,
    setDateFilter,
    resetFilters,
    applyFilters,
    openLightbox,
    closeLightbox,
    closeConfirm,
    performDelete,
    performBulkDelete,
    closeUpload,
    addFiles,
    removePendingFile,
    performUpload,
    performReplace,
    dropzoneRef,
    fileInputRef,
    formatBytes,
  } = model;

  const [dragging, setDragging] = useState(false);

  const handleContextAction = (action: string) => {
    const index = state.context?.index;
    if (index === undefined || index === null) return;
    if (action === "preview") openLightbox(index);
    if (action === "details") model.openDetails(index);
    if (action === "star") model.toggleStar(index);
    if (action === "replace") model.openReplace(index);
    if (action === "delete") model.requestDelete(index);
  };

  const isUsageOverlay = state.confirm?.kind === "usage";
  const isBulkDelete = state.confirm?.kind === "bulk";
  const replacing = state.replaceIndex !== null;

  return (
    <>
      {state.popover && (
        <div
          className="ml-popover open"
          id="mlPopover"
          style={{
            left: state.popover.x,
            top: state.popover.y,
            width: state.popover.width,
          }}
          role="menu"
        >
          <div className="ml-menu-label">
            {state.popover.key === "profile" ? "Account" : state.popover.key}
          </div>
          {state.popover.options.map((option) => (
            <button
              key={`${option.value}:${option.label}`}
              type="button"
              className={`${option.active ? "active" : ""}${option.danger ? " danger" : ""}`}
              data-select-key={state.popover!.key}
              data-select-value={option.value}
              role="menuitem"
              onClick={() => pickPopoverOption(option)}
            >
              <span>{option.label}</span>
              {option.active && <span className="ml-checkmark">✓</span>}
            </button>
          ))}
        </div>
      )}

      {state.context && (
        <div
          className="ml-context open"
          id="mlContext"
          style={{ left: state.context.x, top: state.context.y }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" data-context="preview" onClick={() => handleContextAction("preview")}>
            Preview image
          </button>
          <button type="button" data-context="details" onClick={() => handleContextAction("details")}>
            Open details
          </button>
          <button type="button" data-context="star" onClick={() => handleContextAction("star")}>
            Toggle favorite
          </button>
          <hr />
          <button type="button" data-context="replace" onClick={() => handleContextAction("replace")}>
            Replace image
          </button>
          <button
            type="button"
            className="danger"
            data-context="delete"
            onClick={() => handleContextAction("delete")}
          >
            Delete image
          </button>
        </div>
      )}

      <div
        className={`ml-filter-overlay${state.filterOpen ? " open" : ""}`}
        id="mlFilterOverlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeFilters();
        }}
      >
        <aside className="ml-filter-panel">
          <div className="ml-filter-head">
            <div className="ml-filter-title">Filters</div>
            <button type="button" className="close" data-action="close-filters" aria-label="Close filters" onClick={closeFilters}>
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          </div>

          <div className="ml-filter-body">
            <div className="ml-field">
              <label>File Type</label>
              <label className="ml-check-row">
                <input type="checkbox" data-filter="jpg" checked={state.filters.jpg} onChange={() => toggleFilter("jpg")} /> JPG
              </label>
              <label className="ml-check-row">
                <input type="checkbox" data-filter="png" checked={state.filters.png} onChange={() => toggleFilter("png")} /> PNG
              </label>
              <label className="ml-check-row">
                <input type="checkbox" data-filter="webp" checked={state.filters.webp} onChange={() => toggleFilter("webp")} /> WEBP
              </label>
            </div>

            <div className="ml-field">
              <label>Usage</label>
              <label className="ml-check-row">
                <input type="checkbox" data-filter="used" checked={state.filters.used} onChange={() => toggleFilter("used")} /> Used images
              </label>
              <label className="ml-check-row">
                <input type="checkbox" data-filter="unused" checked={state.filters.unused} onChange={() => toggleFilter("unused")} /> Unused images
              </label>
            </div>

            <div className="ml-field">
              <label>Minimum file size</label>
              <select id="mlSizeFilter" value={state.sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}>
                {SIZE_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-field">
              <label>Added</label>
              <select id="mlDateFilter" value={state.dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                {DATE_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ml-filter-foot">
            <button type="button" className="ml-filter-reset" data-action="reset-filters" onClick={resetFilters}>
              Reset
            </button>
            <button type="button" className="ml-filter-apply" data-action="apply-filters" onClick={applyFilters}>
              Apply filters
            </button>
          </div>
        </aside>
      </div>

      <div
        className={`ml-modal-overlay${state.uploadOpen ? " open" : ""}`}
        id="mlUploadOverlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeUpload();
        }}
      >
        <div className="ml-modal">
          <div className="ml-modal-head">
            <h3>{replacing ? "Replace Image" : "Upload Images"}</h3>
            <button type="button" className="close" data-action="close-upload" aria-label="Close" onClick={closeUpload}>
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          </div>

          <div className="ml-modal-body">
            <input
              ref={fileInputRef}
              className="ml-file-input"
              id="mlFileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              multiple
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <div
              ref={dropzoneRef}
              className={`ml-dropzone${dragging ? " dragover" : ""}`}
              id="mlDropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              <span className="material-symbols-outlined text-[34px]">upload</span>
              <div className="ml-drop-title">Drop images here</div>
              <div className="ml-drop-sub">
                or choose files from your device · JPG, PNG, WEBP, GIF, AVIF
              </div>
            </div>

            <div className="ml-selected-files" id="mlSelectedFiles">
              {state.pendingFiles.map((file, index) => (
                <div className="ml-file-row" key={`${file.name}:${file.size}`}>
                  <img className="ml-file-thumb" src={file.url} alt="" />
                  <div className="ml-file-info">
                    <div className="ml-file-name">{file.name}</div>
                    <div className="ml-file-size">{formatBytes(file.size)}</div>
                  </div>
                  <button
                    type="button"
                    className="ml-file-remove"
                    data-file-index={index}
                    aria-label={`Remove ${file.name}`}
                    onClick={() => removePendingFile(index)}
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="ml-modal-foot">
            <button type="button" className="ml-btn-secondary" data-action="close-upload" onClick={closeUpload}>
              Cancel
            </button>
            <button
              type="button"
              className={`ml-btn-primary${state.pendingFiles.length ? "" : " ml-disabled"}`}
              id="mlUploadConfirm"
              onClick={replacing ? performReplace : performUpload}
            >
              {replacing ? "Replace Image" : "Upload Images"}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`ml-modal-overlay${state.confirm ? " open" : ""}`}
        id="mlConfirmOverlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeConfirm();
        }}
      >
        <div className="ml-modal ml-confirm">
          <div className="ml-modal-head">
            <h3>{isUsageOverlay ? "Image usage" : "Confirm deletion"}</h3>
            <button type="button" className="close" data-action="close-confirm" aria-label="Close" onClick={closeConfirm}>
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          </div>

          <div className="ml-modal-body">
            <div className="ml-confirm-icon">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <h3 id="mlConfirmTitle">{state.confirm?.title ?? "Delete this image?"}</h3>
            {state.confirm?.items ? (
              <div className="ml-usage-list">
                {state.confirm.items.map((name) => (
                  <div className="ml-usage-item" key={name}>
                    <span className="material-symbols-outlined text-[12px]">arrow_right</span>
                    {name}
                  </div>
                ))}
              </div>
            ) : (
              <p id="mlConfirmText">
                {state.confirm?.text ?? "This action cannot be undone."}
              </p>
            )}
          </div>

          <div className="ml-modal-foot">
            {isUsageOverlay ? (
              <button type="button" className="ml-btn-secondary" data-action="close-confirm" onClick={closeConfirm}>
                Close
              </button>
            ) : (
              <>
                <button type="button" className="ml-btn-secondary" data-action="close-confirm" onClick={closeConfirm}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="ml-danger-button"
                  id="mlConfirmDelete"
                  onClick={() => {
                    if (isBulkDelete) performBulkDelete();
                    else performDelete();
                  }}
                >
                  {isBulkDelete ? "Delete selected" : "Delete image"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className={`ml-lightbox${state.lightboxIndex !== null ? " open" : ""}`}
        id="mlLightbox"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeLightbox();
        }}
      >
        <button type="button" className="ml-lightbox-close" data-action="close-lightbox" aria-label="Close" onClick={closeLightbox}>
          <span className="material-symbols-outlined text-[17px]">close</span>
        </button>
        {state.lightboxIndex !== null && state.assets[state.lightboxIndex] && (
          <img
            id="mlLightboxImage"
            src={state.assets[state.lightboxIndex].url}
            alt={state.assets[state.lightboxIndex].filename}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {state.lightboxIndex !== null && state.assets[state.lightboxIndex] && (
          <div className="ml-lightbox-caption" id="mlLightboxCaption">
            {state.assets[state.lightboxIndex].filename}
          </div>
        )}
      </div>

      {state.toasts.length > 0 && (
        <div className="ml-toast-stack" id="mlToastStack" role="status" aria-live="polite">
          {state.toasts.map((toast) => (
            <div key={toast.id} className={`ml-toast${toast.type === "error" ? " error" : ""}`}>
              <span className="ml-toast-dot" />
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}