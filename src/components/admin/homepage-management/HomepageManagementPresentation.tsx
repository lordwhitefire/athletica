"use client";

import { useState, type DragEvent } from "react";
import {
  HeroArt,
  MobileHeroArt,
  SectionThumb,
  Sparkline,
} from "./homepage-management.thumbs";
import { useHomepageManagementModel } from "./HomepageManagementInteractionLayer";
import "./homepage-management.css";

const LINK_TYPES = ["Category", "Product", "Collection"];

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function HomepageManagementPresentation() {
  const { model } = useHomepageManagementModel();
  const {
    state,
    setTopTab,
    openAddModal,
    openPreview,
    setReorder,
    saveReorder,
    selectSection,
    openContextMenu,
    setEditorTab,
    updateSectionField,
    saveChanges,
    duplicateSection,
    openImagePicker,
    removeImage,
    requestCloseEditor,
    notify,
    beginDrag,
    endDrag,
    dropSection,
  } = model;

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const section = state.sections.find((s) => s.id === state.selectedId) ?? state.sections[0];
  const mobileEditor = state.isMobile && state.editorOpen;

  const editorClassName = [
    "editor",
    state.editorOpen ? "open" : "",
    state.isMobile && state.editorOpen ? "ap-mobile-open" : "",
    !state.isMobile && !state.editorOpen ? "ap-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const titleValue = section?.title ?? section?.desc ?? "Elevate your game";
  const subtitleValue = section?.subtitle ?? "";
  const buttonValue = section?.buttonText ?? "";
  const linkType = section?.linkType ?? "Category";
  const linkValue = section?.linkValue ?? "";
  const linkPath =
    linkValue.trim() && linkType
      ? `/${linkType.toLowerCase()}/${slugify(linkValue)}`
      : "No destination set";

  function handleRowDragStart(id: string) {
    setDraggingId(id);
    beginDrag(id);
  }

  function handleRowDragOver(id: string, event: DragEvent) {
    if (!state.reorder || draggingId === id) return;
    event.preventDefault();
    setDropTargetId(id);
  }

  function handleRowDrop(id: string) {
    dropSection(id);
    setDraggingId(null);
    setDropTargetId(null);
  }

  function handleRowDragEnd() {
    endDrag();
    setDraggingId(null);
    setDropTargetId(null);
  }

  return (
    <div className="homepage-page">
      <header className="topbar">
        <div className="title">
          <h1>Homepage Management</h1>
          <p>Manage homepage sections and content that appear on your store.</p>
        </div>
        <div className="top-actions">
          <button type="button" className="btn" id="previewBtn" onClick={openPreview}>
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            Preview Homepage
          </button>
          <button type="button" className="btn lime" id="addBtn" onClick={openAddModal}>
            <span className="material-symbols-outlined text-[14px]">add</span>
            Add Section
          </button>
        </div>
      </header>

      <div className="tabs">
        <button
          type="button"
          className={`tab${state.topTab === "sections" ? " active" : ""}`}
          onClick={() => setTopTab("sections")}
        >
          Sections
        </button>
        <button
          type="button"
          className={`tab${state.topTab === "settings" ? " active" : ""}`}
          onClick={() => setTopTab("settings")}
        >
          Settings
        </button>
      </div>

      <section className="stats">
        <div className="stat">
          <div className="stat-top">
            <div className="stat-icon">
              <span className="material-symbols-outlined text-[18px]">description</span>
            </div>
            <div>
              <div className="stat-label">Total Sections</div>
              <div className="stat-value">12</div>
            </div>
          </div>
          <div className="stat-trend">Active on homepage</div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <div className="stat-icon blue">
              <span className="material-symbols-outlined text-[18px]">visibility</span>
            </div>
            <div>
              <div className="stat-label">Section Views (30d)</div>
              <div className="stat-value">326,842</div>
            </div>
          </div>
          <div className="stat-trend">↑ 18.6% vs last 30 days</div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <div className="stat-icon blue">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
            </div>
            <div>
              <div className="stat-label">Clicks (30d)</div>
              <div className="stat-value">28,642</div>
            </div>
          </div>
          <div className="stat-trend">↑ 16.3% vs last 30 days</div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <div className="stat-icon">
              <span className="material-symbols-outlined text-[18px]">monitoring</span>
            </div>
            <div>
              <div className="stat-label">CTR (30d)</div>
              <div className="stat-value">8.74%</div>
            </div>
          </div>
          <div className="stat-trend">↑ 1.2% vs last 30 days</div>
        </div>
      </section>

      <section className="workspace">
        <div className="workspace-head">
          <div>
            <div className="workspace-title">Homepage Sections</div>
            <div className="workspace-sub">Drag and drop to reorder sections</div>
          </div>
          <div className="workspace-actions">
            <button
              type="button"
              className="mini-btn"
              id="reorderBtn"
              onClick={() => setReorder(!state.reorder)}
            >
              <span className="material-symbols-outlined text-[13px]">reorder</span>
              Reorder
            </button>
            <button
              type="button"
              className="mini-btn"
              id="storeBtn"
              onClick={() => notify("Store preview", "Opening the storefront preview.")}
            >
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              View on Store
            </button>
          </div>
        </div>

        {state.reorder && (
          <div className="ap-reorder-bar">
            <div className="ap-reorder-copy">
              <strong>Reorder mode</strong> — drag sections into the desired order.
            </div>
            <div className="ap-reorder-actions">
              <button type="button" className="ap-btn" id="ap-cancel-reorder" onClick={() => setReorder(false)}>
                Cancel
              </button>
              <button type="button" className="ap-btn primary" id="ap-save-reorder" onClick={saveReorder}>
                Save Order
              </button>
            </div>
          </div>
        )}

        <div className="table-wrap">
          <div className="table-head">
            <div>Order</div>
            <div>Section</div>
            <div>Type</div>
            <div>Status</div>
            <div className="performance-head">Performance (30d)</div>
            <div>Actions</div>
          </div>

          <div id="rows">
            {state.sections.map((item, index) => (
              <div
                key={item.id}
                className={`section-row${item.id === state.selectedId ? " selected" : ""}${draggingId === item.id ? " ap-dragging" : ""}${dropTargetId === item.id ? " ap-drop-target" : ""}`}
                data-section-id={item.id}
                data-index={index}
                draggable={state.reorder}
                onDragStart={() => handleRowDragStart(item.id)}
                onDragOver={(event) => handleRowDragOver(item.id, event)}
                onDragLeave={() => setDropTargetId((cur) => (cur === item.id ? null : cur))}
                onDrop={() => handleRowDrop(item.id)}
                onDragEnd={handleRowDragEnd}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest(".actions")) return;
                  selectSection(item.id, true);
                }}
              >
                <div className="order-wrap">
                  <div className="drag">
                    <span className="material-symbols-outlined text-[13px]">drag_indicator</span>
                  </div>
                  <div className="order">{index + 1}</div>
                </div>
                <div className="section-cell">
                  <div className="section-info">
                    <div className="thumb">
                      <SectionThumb index={index} />
                    </div>
                    <div>
                      <div className="section-name">{item.name}</div>
                      <div className="section-desc">{item.desc}</div>
                    </div>
                  </div>
                </div>
                <div className="type">{item.type}</div>
                <div>
                  <span className={`status${item.active ? "" : " inactive"}`}>
                    <i />
                    {item.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="performance">
                  <div className="performance-copy">
                    <div className="views">
                      {item.views}
                      {item.views !== "—" ? " views" : ""}
                    </div>
                    <div className="ctr">
                      {item.ctr}
                      {item.ctr !== "—" ? " CTR" : ""}
                    </div>
                  </div>
                  <Sparkline values={item.spark} />
                </div>
                <div className="actions">
                  <button
                    type="button"
                    className="icon-btn edit-row"
                    aria-label="Edit"
                    onClick={(event) => {
                      event.stopPropagation();
                      selectSection(item.id, true);
                    }}
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                  </button>
                  <button
                    type="button"
                    className="icon-btn more-row"
                    aria-label="More"
                    onClick={(event) => {
                      event.stopPropagation();
                      openContextMenu(event, item.id);
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="workspace-foot">
          Showing 1 to {state.sections.length} of {state.sections.length} sections
        </div>
      </section>

      <div
        className={`editor-backdrop${mobileEditor ? " open" : ""}`}
        id="backdrop"
        onClick={requestCloseEditor}
      />

      {section && (
        <aside className={editorClassName} id="editor">
          <div className="editor-head">
            <div className="editor-title">Edit Section</div>
            <button type="button" className="editor-close" id="closeEditor" onClick={requestCloseEditor} aria-label="Close editor">
              ×
            </button>
            <div className="editor-name">
              {section.name}{" "}
              <span className="status" style={{ padding: "3px 7px", marginLeft: 5 }}>
                <i />
                {section.active ? "Active" : "Inactive"}
              </span>{" "}
              {state.dirty && <span className="ap-editor-dirty">Unsaved changes</span>}
              <span className="editor-id">ID: {section.id}</span>
            </div>
          </div>

          <div className="editor-tabs">
            {(["content", "settings", "visibility"] as const).map((tab, index) => (
              <button
                type="button"
                key={tab}
                className={`editor-tab${state.editorTab === tab ? " active" : ""}`}
                onClick={() => setEditorTab(tab)}
              >
                {["Content", "Settings", "Visibility"][index]}
              </button>
            ))}
          </div>

          <div className="editor-body">
            <div className={`ap-content-pane${state.editorTab === "content" ? "" : " is-hidden"}`}>
              <div className="field">
                <label className="label">Banner Image</label>
                <div
                  className="image-preview"
                  id="heroPreview"
                  data-image-removed={state.heroRemoved ? "true" : undefined}
                >
                  {!state.heroRemoved && <HeroArt />}
                </div>
                <div className="image-actions">
                  <button type="button" id="changeImage" onClick={openImagePicker}>
                    Change Image
                  </button>
                  <button type="button" id="removeImage" onClick={removeImage}>
                    Remove
                  </button>
                </div>
              </div>

              <div className="field">
                <label className="label label-row">
                  <span>Title</span>
                  <span className="counter">{titleValue.length} / 60</span>
                </label>
                <input
                  className="input"
                  id="titleInput"
                  value={titleValue}
                  onChange={(event) => updateSectionField("title", event.target.value)}
                />
              </div>

              <div className="field">
                <label className="label label-row">
                  <span>Subtitle</span>
                  <span className="counter">{subtitleValue.length} / 80</span>
                </label>
                <input
                  className="input"
                  value={subtitleValue}
                  placeholder="Premium gear for every athlete"
                  onChange={(event) => updateSectionField("subtitle", event.target.value)}
                />
              </div>

              <div className="field">
                <label className="label label-row">
                  <span>Button Text</span>
                  <span className="counter">{buttonValue.length} / 20</span>
                </label>
                <input
                  className="input"
                  value={buttonValue}
                  placeholder="Shop Now"
                  onChange={(event) => updateSectionField("buttonText", event.target.value)}
                />
              </div>

              <div className="field">
                <label className="label">Button Link</label>
                <div className="link-row">
                  <select
                    className="select"
                    value={linkType}
                    onChange={(event) => {
                      updateSectionField("linkType", event.target.value);
                      notify("Link type changed", `Button destination type: ${event.target.value}.`);
                    }}
                  >
                    {LINK_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <input
                    className="input link-input"
                    value={linkValue}
                    placeholder="Search products..."
                    onFocus={(event) => event.target.select()}
                    onChange={(event) => updateSectionField("linkValue", event.target.value)}
                  />
                  <button
                    type="button"
                    className="clear-link"
                    aria-label="Clear link"
                    onClick={() => updateSectionField("linkValue", "")}
                  >
                    ×
                  </button>
                </div>
                <div className="url-box">
                  {linkPath} <span className="external">↗</span>
                </div>
              </div>

              <div className="field">
                <label className="label">Mobile Image</label>
                <div className="mobile-card">
                  <div id="mobilePreview">
                    <MobileHeroArt />
                  </div>
                  <div>
                    <div className="mobile-file">hero-mobile.jpg</div>
                    <div className="mobile-size">1200 × 1600</div>
                  </div>
                  <button type="button" className="change-btn" onClick={openImagePicker}>
                    Change
                  </button>
                </div>
              </div>
            </div>

            <div className={`ap-settings-pane${state.editorTab === "settings" ? " is-active" : ""}`}>
              <div className="ap-form-section">
                <div className="ap-form-section-title">Section Settings</div>

                <div className="ap-switch-row">
                  <div className="ap-switch-copy">
                    <strong>Show section</strong>
                    <span>Display this section on the homepage.</span>
                  </div>
                  <label className="ap-switch">
                    <input
                      id="ap-section-active"
                      type="checkbox"
                      checked={section.active}
                      onChange={(event) => updateSectionField("active", event.target.checked)}
                    />
                    <span className="ap-switch-track" />
                  </label>
                </div>

                <div className="ap-switch-row">
                  <div className="ap-switch-copy">
                    <strong>Lazy load</strong>
                    <span>Load section media when it approaches the viewport.</span>
                  </div>
                  <label className="ap-switch">
                    <input
                      id="ap-lazy-load"
                      type="checkbox"
                      checked={section.lazyLoad ?? true}
                      onChange={(event) => updateSectionField("lazyLoad", event.target.checked)}
                    />
                    <span className="ap-switch-track" />
                  </label>
                </div>
              </div>

              <div className="ap-form-section">
                <div className="ap-form-section-title">Section Alignment</div>
                <div className="ap-radio-list">
                  {(["left", "center", "right"] as const).map((align) => (
                    <label className="ap-radio" key={align}>
                      <input
                        type="radio"
                        name="ap-align"
                        value={align}
                        checked={(section.align ?? "left") === align}
                        onChange={() => updateSectionField("align", align)}
                      />
                      {align === "left" ? "Left aligned" : align === "center" ? "Center aligned" : "Right aligned"}
                    </label>
                  ))}
                </div>
              </div>

              <div className="ap-form-section">
                <div className="ap-form-section-title">Desktop Behavior</div>
                <select
                  className="input"
                  id="ap-desktop-layout"
                  value={section.desktopLayout ?? "Full width"}
                  onChange={(event) => updateSectionField("desktopLayout", event.target.value)}
                >
                  <option>Full width</option>
                  <option>Contained</option>
                  <option>Wide contained</option>
                </select>
              </div>

              <div className="ap-form-section">
                <div className="ap-form-section-title">Mobile Behavior</div>
                <select
                  className="input"
                  id="ap-mobile-layout"
                  value={section.mobileLayout ?? "Stack content"}
                  onChange={(event) => updateSectionField("mobileLayout", event.target.value)}
                >
                  <option>Stack content</option>
                  <option>Image first</option>
                  <option>Content first</option>
                </select>
              </div>
            </div>

            <div className={`ap-visibility-pane${state.editorTab === "visibility" ? " is-active" : ""}`}>
              <div className="ap-form-section">
                <div className="ap-form-section-title">Visibility Rules</div>

                <div className="ap-switch-row">
                  <div className="ap-switch-copy">
                    <strong>Desktop</strong>
                    <span>Show on desktop screens.</span>
                  </div>
                  <label className="ap-switch">
                    <input
                      id="ap-visible-desktop"
                      type="checkbox"
                      checked={section.visibleDesktop ?? true}
                      onChange={(event) => updateSectionField("visibleDesktop", event.target.checked)}
                    />
                    <span className="ap-switch-track" />
                  </label>
                </div>

                <div className="ap-switch-row">
                  <div className="ap-switch-copy">
                    <strong>Tablet</strong>
                    <span>Show on tablet screens.</span>
                  </div>
                  <label className="ap-switch">
                    <input
                      id="ap-visible-tablet"
                      type="checkbox"
                      checked={section.visibleTablet ?? true}
                      onChange={(event) => updateSectionField("visibleTablet", event.target.checked)}
                    />
                    <span className="ap-switch-track" />
                  </label>
                </div>

                <div className="ap-switch-row">
                  <div className="ap-switch-copy">
                    <strong>Mobile</strong>
                    <span>Show on phone screens.</span>
                  </div>
                  <label className="ap-switch">
                    <input
                      id="ap-visible-mobile"
                      type="checkbox"
                      checked={section.visibleMobile ?? true}
                      onChange={(event) => updateSectionField("visibleMobile", event.target.checked)}
                    />
                    <span className="ap-switch-track" />
                  </label>
                </div>
              </div>

              <div className="ap-form-section">
                <div className="ap-form-section-title">Schedule</div>
                <div className="ap-switch-row">
                  <div className="ap-switch-copy">
                    <strong>Schedule publication</strong>
                    <span>Publish this section during a defined window.</span>
                  </div>
                  <label className="ap-switch">
                    <input
                      id="ap-schedule"
                      type="checkbox"
                      checked={section.scheduled ?? false}
                      onChange={(event) => updateSectionField("scheduled", event.target.checked)}
                    />
                    <span className="ap-switch-track" />
                  </label>
                </div>

                <input
                  className="input"
                  type="datetime-local"
                  style={{ marginTop: 8 }}
                  value={section.scheduleStart ?? ""}
                  onChange={(event) => updateSectionField("scheduleStart", event.target.value)}
                />
                <input
                  className="input"
                  type="datetime-local"
                  style={{ marginTop: 7 }}
                  value={section.scheduleEnd ?? ""}
                  onChange={(event) => updateSectionField("scheduleEnd", event.target.value)}
                />
              </div>
            </div>

            <button type="button" className="save" id="saveBtn" onClick={saveChanges}>
              Save Changes
            </button>
            <button
              type="button"
              className="duplicate"
              id="duplicateBtn"
              onClick={() => duplicateSection(state.selectedId)}
            >
              ▣ &nbsp; Duplicate Section
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
