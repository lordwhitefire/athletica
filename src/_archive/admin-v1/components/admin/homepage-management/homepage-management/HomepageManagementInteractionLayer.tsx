"use client";

import { createContext, useContext, type ReactNode } from "react";
import { IMAGE_CHOICES, SECTION_TYPES } from "./homepage-management.data";
import { ImageChoiceThumb } from "./homepage-management.thumbs";
import type { HomepageManagementModel } from "./use-homepage-management";
import { useHomepageManagement } from "./use-homepage-management";
import "./homepage-management-interactions.css";

type HomepageManagementContextValue = {
  model: HomepageManagementModel;
};

const HomepageManagementContext = createContext<HomepageManagementContextValue | null>(
  null,
);

export function useHomepageManagementModel() {
  const ctx = useContext(HomepageManagementContext);
  if (!ctx) {
    throw new Error(
      "useHomepageManagementModel must be used inside HomepageManagementInteractionLayer",
    );
  }
  return ctx;
}

export function HomepageManagementInteractionLayer({
  children,
}: {
  children: ReactNode;
}) {
  const model = useHomepageManagement();

  return (
    <HomepageManagementContext.Provider value={{ model }}>
      <div
        className="homepage-management-interaction-layer"
        data-homepage-management-root
        data-responsive="phone-tablet-desktop"
      >
        {children}
        <HomepageOverlaySurfaces model={model} />
      </div>
    </HomepageManagementContext.Provider>
  );
}

function HomepageOverlaySurfaces({ model }: { model: HomepageManagementModel }) {
  const {
    state,
    selectSection,
    duplicateSection,
    toggleSection,
    askDelete,
    closeDelete,
    deleteSection,
    closeAddModal,
    selectAddType,
    addSection,
    closePreview,
    closeImagePicker,
    selectImageChoice,
    useSelectedImage,
    discardAndClose,
    cancelCloseConfirm,
  } = model;

  const selectedSection =
    state.sections.find((s) => s.id === state.selectedId) ?? state.sections[0];

  const previewTitle =
    selectedSection?.title ?? selectedSection?.desc ?? "Elevate your game";
  const previewSubtitle =
    selectedSection?.subtitle ?? "Premium gear for every athlete";
  const previewButton = selectedSection?.buttonText || "Shop Now";

  return (
    <>
      {state.contextMenu && (
        <div
          className="ap-context-menu is-open"
          style={{ left: state.contextMenu.x, top: state.contextMenu.y }}
          data-section-id={state.contextMenu.sectionId}
          role="menu"
        >
          <button
            type="button"
            className="ap-context-item"
            data-context-action="edit"
            role="menuitem"
            onClick={() => selectSection(state.contextMenu!.sectionId, true)}
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            <span>Edit section</span>
          </button>
          <button
            type="button"
            className="ap-context-item"
            data-context-action="duplicate"
            role="menuitem"
            onClick={() => duplicateSection(state.contextMenu!.sectionId)}
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            className="ap-context-item"
            data-context-action="toggle"
            role="menuitem"
            onClick={() => toggleSection(state.contextMenu!.sectionId)}
          >
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            <span>Toggle active</span>
          </button>
          <div className="ap-context-divider" />
          <button
            type="button"
            className="ap-context-item danger"
            data-context-action="delete"
            role="menuitem"
            onClick={() => askDelete(state.contextMenu!.sectionId)}
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
            <span>Delete section</span>
          </button>
        </div>
      )}

      <div className={`ap-layer${state.addOpen ? " is-open" : ""}`} id="ap-add-layer">
        <div className="ap-backdrop" onClick={closeAddModal} />
        <div className="ap-modal" role="dialog" aria-modal="true" aria-labelledby="ap-add-title">
          <div className="ap-modal-head">
            <div className="ap-modal-title" id="ap-add-title">
              Add Section
            </div>
            <button type="button" className="ap-modal-close" onClick={closeAddModal} aria-label="Close">
              ×
            </button>
          </div>

          <div className="ap-modal-body">
            <div className="ap-section-grid">
              {SECTION_TYPES.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  className={`ap-section-option${state.addType === item.name ? " selected" : ""}`}
                  data-section-type={item.name}
                  onClick={() => selectAddType(item.name)}
                >
                  <div className="ap-section-option-title">{item.name}</div>
                  <div className="ap-section-option-copy">{item.copy}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="ap-modal-foot">
            <button type="button" className="ap-btn" onClick={closeAddModal}>
              Cancel
            </button>
            <button type="button" className="ap-btn primary" id="ap-confirm-add" onClick={addSection}>
              Add Section
            </button>
          </div>
        </div>
      </div>

      <div
        className={`ap-layer${state.previewOpen ? " is-open" : ""}`}
        id="ap-preview-layer"
      >
        <div className="ap-backdrop" onClick={closePreview} />
        <div className="ap-modal ap-preview-modal" role="dialog" aria-modal="true" aria-labelledby="ap-preview-title">
          <div className="ap-modal-head">
            <div className="ap-modal-title" id="ap-preview-title">
              Homepage Preview
            </div>
            <button type="button" className="ap-modal-close" onClick={closePreview} aria-label="Close">
              ×
            </button>
          </div>

          <div className="ap-modal-body" style={{ padding: 0 }}>
            <div className="ap-preview-frame">
              <div className="ap-preview-browser">
                <span className="ap-browser-dot" />
                <span className="ap-browser-dot" />
                <span className="ap-browser-dot" />
              </div>

              <div className="ap-preview-site">
                <div className="ap-preview-site-head">
                  <div className="ap-preview-logo">ATHLETICA</div>
                  <div className="ap-preview-nav">
                    <span>Football</span>
                    <span>Running</span>
                    <span>Training</span>
                    <span>Brands</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px]">search</span>
                </div>

                <div className="ap-preview-hero">
                  <div className="ap-preview-copy">
                    <small>ATHLETICA PERFORMANCE</small>
                    <h2>{previewTitle}</h2>
                    <p>{previewSubtitle}</p>
                    <button type="button" className="ap-btn primary">
                      {previewButton}
                    </button>
                  </div>
                </div>

                <div className="ap-preview-products">
                  <div className="ap-product-card"><div /><div /></div>
                  <div className="ap-product-card"><div /><div /></div>
                  <div className="ap-product-card"><div /><div /></div>
                  <div className="ap-product-card"><div /><div /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`ap-layer${state.pendingDelete ? " is-open" : ""}`}
        id="ap-delete-layer"
      >
        <div className="ap-backdrop" onClick={closeDelete} />
        <div className="ap-modal" style={{ width: "min(430px,calc(100vw - 20px))" }} role="dialog" aria-modal="true" aria-labelledby="ap-delete-title">
          <div className="ap-modal-head">
            <div className="ap-modal-title" id="ap-delete-title">
              Delete Section
            </div>
            <button type="button" className="ap-modal-close" onClick={closeDelete} aria-label="Close">
              ×
            </button>
          </div>
          <div className="ap-modal-body">
            <div className="ap-confirm-copy">
              Are you sure you want to delete{" "}
              <strong id="ap-delete-name">
                {state.sections.find((s) => s.id === state.pendingDelete)?.name ?? ""}
              </strong>
              ? This removes the section from the homepage layout.
            </div>
            <div className="ap-confirm-warning">
              This action can be undone only by adding the section again.
            </div>
          </div>
          <div className="ap-modal-foot">
            <button type="button" className="ap-btn" onClick={closeDelete}>
              Cancel
            </button>
            <button
              type="button"
              className="ap-btn danger"
              id="ap-confirm-delete"
              onClick={() => state.pendingDelete && deleteSection(state.pendingDelete)}
            >
              Delete Section
            </button>
          </div>
        </div>
      </div>

      <div className={`ap-layer${state.imageOpen ? " is-open" : ""}`} id="ap-image-layer">
        <div className="ap-backdrop" onClick={closeImagePicker} />
        <div className="ap-modal" role="dialog" aria-modal="true" aria-labelledby="ap-image-title">
          <div className="ap-modal-head">
            <div className="ap-modal-title" id="ap-image-title">
              Select Image
            </div>
            <button type="button" className="ap-modal-close" onClick={closeImagePicker} aria-label="Close">
              ×
            </button>
          </div>
          <div className="ap-modal-body">
            <div className="ap-image-library">
              {IMAGE_CHOICES.map((name, i) => (
                <button
                  type="button"
                  key={name}
                  className={`ap-image-choice${state.imageIndex === String(i) ? " selected" : ""}`}
                  data-image-index={String(i)}
                  title={name}
                  onClick={() => selectImageChoice(String(i))}
                >
                  <ImageChoiceThumb index={i} />
                </button>
              ))}
            </div>
          </div>
          <div className="ap-modal-foot">
            <button type="button" className="ap-btn" onClick={closeImagePicker}>
              Cancel
            </button>
            <button type="button" className="ap-btn primary" id="ap-use-image" onClick={useSelectedImage}>
              Use Image
            </button>
          </div>
        </div>
      </div>

      {state.confirmCloseOpen && (
        <div className="ap-layer is-open">
          <div className="ap-backdrop" onClick={cancelCloseConfirm} />
          <div className="ap-modal" style={{ width: "min(430px,calc(100vw - 20px))" }} role="dialog" aria-modal="true" aria-labelledby="ap-dirty-title">
            <div className="ap-modal-head">
              <div className="ap-modal-title" id="ap-dirty-title">
                Unsaved Changes
              </div>
              <button type="button" className="ap-modal-close" onClick={cancelCloseConfirm} aria-label="Close">
                ×
              </button>
            </div>
            <div className="ap-modal-body">
              <div className="ap-confirm-copy">
                You have unsaved changes in the section editor. Discard them and close
                the editor?
              </div>
              <div className="ap-confirm-warning">Unsaved edits will be lost.</div>
            </div>
            <div className="ap-modal-foot">
              <button type="button" className="ap-btn" onClick={cancelCloseConfirm}>
                Cancel
              </button>
              <button type="button" className="ap-btn danger" onClick={discardAndClose}>
                Discard &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {state.toast && (
        <div className="ap-toast-stack" role="status" aria-live="polite">
          <div className={`ap-toast ${state.toast.type} show`}>
            <strong>{state.toast.title}</strong>
            {state.toast.message}
          </div>
        </div>
      )}
    </>
  );
}
