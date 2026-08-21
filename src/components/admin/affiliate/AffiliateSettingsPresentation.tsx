"use client";

import { useEffect, useRef, useState } from "react";
import { useAffiliateModel } from "./AffiliateInteractionLayer";
import { AFFILIATE_PRODUCTS, DATE_RANGES } from "./use-affiliate";
import "./affiliate.css";

function ProductMenu() {
    const { model } = useAffiliateModel();
    const [query, setQuery] = useState("");
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        searchRef.current?.focus();
    }, []);

    const q = query.trim().toLowerCase();
    const matches = AFFILIATE_PRODUCTS.filter(
        (p) => !q || p.name.toLowerCase().includes(q) || p.asin.toLowerCase().includes(q)
    );

    return (
        <div className="interaction-dropdown interaction-product-dropdown" role="menu" aria-label="Product selector">
            <input
                ref={searchRef}
                type="search"
                className="interaction-product-search"
                placeholder="Search products…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products"
            />
            <div>
                {matches.length === 0 && <div className="interaction-empty">No products found.</div>}
                {matches.map((p) => (
                    <button
                        key={p.asin}
                        type="button"
                        className="interaction-product-row"
                        data-selected={p.asin === model.product.asin}
                        onClick={() => model.selectProduct(p)}
                    >
                        <span className="interaction-product-thumb">
                            <span className="text-zinc-400 text-[10px] font-bold">{p.name.slice(0, 2).toUpperCase()}</span>
                        </span>
                        <span className="interaction-product-meta">
                            <span className="interaction-product-title">{p.name}</span>
                            <span className="interaction-product-asin">ASIN: {p.asin}</span>
                        </span>
                        {p.asin === model.product.asin && (
                            <span className="interaction-check material-symbols-outlined text-[14px]">check</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function AffiliateSettingsPresentation() {
    const { model } = useAffiliateModel();
    const { config, checkboxes, dirty, errors, dateLabel, product, generatedUrl, dropdown, saving, savedFlash, testing } =
        model;

    return (
        <div className="affiliate-page">
            <div className="affiliate-inner">
                <header className="topbar">
                    <div>
                        <h1 className="page-title">
                            Affiliate Settings
                            {dirty && <span className="interaction-unsaved-dot" title="Unsaved changes" />}
                        </h1>
                        <p className="page-description">Manage your Amazon affiliate configuration and test links.</p>
                    </div>

                    <div className="top-actions">
                        <div className="aff-dropdown-anchor">
                            <button type="button" className="date-button" onClick={() => model.openDropdown("date")}>
                                <span className="date-left">
                                    <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                                    <span>{dateLabel}</span>
                                </span>
                                <span className="material-symbols-outlined text-[13px]">expand_more</span>
                            </button>
                            {dropdown === "date" && (
                                <div className="interaction-dropdown" role="menu" aria-label="Date range">
                                    {DATE_RANGES.map((range) => (
                                        <button
                                            key={range}
                                            type="button"
                                            className="interaction-dropdown-item"
                                            data-selected={range === dateLabel}
                                            onClick={() => model.selectDate(range)}
                                        >
                                            {range}
                                            <span className="interaction-check material-symbols-outlined text-[14px]">
                                                check
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="save-button interaction-save-button"
                            data-dirty={dirty}
                            disabled={saving}
                            onClick={model.handleSaveClick}
                        >
                            <span className="material-symbols-outlined text-[15px]">
                                {savedFlash ? "check" : "save"}
                            </span>
                            {saving ? "Saving…" : savedFlash ? "Saved!" : "Save Changes"}
                        </button>
                    </div>
                </header>

                <section className="settings-grid">
                    {/* Amazon Configuration */}
                    <article className="card configuration-card">
                        <h2 className="card-heading">Amazon Configuration</h2>
                        <p className="card-description">Configure your Amazon Associate account and marketplace settings.</p>

                        <div className="form-grid">
                            <div className="field">
                                <label className="field-label" htmlFor="associateId">
                                    Amazon Associate ID
                                    <span className="material-symbols-outlined info-icon text-[14px]">info</span>
                                </label>
                                <input
                                    id="associateId"
                                    className={`control${errors.associateId ? " interaction-invalid" : ""}`}
                                    value={config.associateId}
                                    onChange={(e) => model.setField("associateId", e.target.value)}
                                />
                                {errors.associateId && <p className="interaction-field-error">{errors.associateId}</p>}
                                <p className="field-help">Your tracking ID used in affiliate links.</p>
                            </div>

                            <div className="field">
                                <label className="field-label" htmlFor="affiliateTag">
                                    Default Affiliate Tag (Tracking ID)
                                    <span className="material-symbols-outlined info-icon text-[14px]">info</span>
                                </label>
                                <input
                                    id="affiliateTag"
                                    className={`control${errors.affiliateTag ? " interaction-invalid" : ""}`}
                                    value={config.affiliateTag}
                                    onChange={(e) => model.setField("affiliateTag", e.target.value)}
                                />
                                {errors.affiliateTag && <p className="interaction-field-error">{errors.affiliateTag}</p>}
                                <p className="field-help">This will be used as the default tracking ID.</p>
                            </div>

                            <div className="field full">
                                <label className="field-label" htmlFor="marketplace">
                                    Marketplace
                                    <span className="material-symbols-outlined info-icon text-[14px]">info</span>
                                </label>
                                <div className="select-wrap">
                                    <select
                                        id="marketplace"
                                        className="control"
                                        value={config.marketplace}
                                        onChange={(e) => model.setField("marketplace", e.target.value)}
                                    >
                                        <option>🇺🇸  Amazon.com (US)</option>
                                        <option>🇬🇧  Amazon.co.uk (UK)</option>
                                        <option>🇨🇦  Amazon.ca (Canada)</option>
                                        <option>🇩🇪  Amazon.de (Germany)</option>
                                    </select>
                                </div>
                                <p className="field-help">Select the primary Amazon marketplace.</p>
                            </div>

                            <div className="field">
                                <label className="field-label" htmlFor="linkType">
                                    Default Link Type
                                    <span className="material-symbols-outlined info-icon text-[14px]">info</span>
                                </label>
                                <div className="select-wrap">
                                    <select
                                        id="linkType"
                                        className="control"
                                        value={config.linkType}
                                        onChange={(e) => model.setField("linkType", e.target.value)}
                                    >
                                        <option>Text Link</option>
                                        <option>Image Link</option>
                                        <option>Button Link</option>
                                    </select>
                                </div>
                                <p className="field-help">Default type of links generated.</p>
                            </div>

                            <div className="field">
                                <label className="field-label" htmlFor="locale">
                                    Amazon Locale
                                </label>
                                <div className="select-wrap">
                                    <select
                                        id="locale"
                                        className="control"
                                        value={config.locale}
                                        onChange={(e) => model.setField("locale", e.target.value)}
                                    >
                                        <option>en_US</option>
                                        <option>en_GB</option>
                                        <option>en_CA</option>
                                        <option>de_DE</option>
                                    </select>
                                </div>
                                <p className="field-help">Locale used for Amazon links.</p>
                            </div>

                            <div className="field">
                                <label className="field-label" htmlFor="cartRedirect">
                                    Add-to-Cart Redirect
                                    <span className="material-symbols-outlined info-icon text-[14px]">info</span>
                                </label>
                                <div className="select-wrap">
                                    <select
                                        id="cartRedirect"
                                        className="control"
                                        value={config.cartRedirect}
                                        onChange={(e) => model.setField("cartRedirect", e.target.value)}
                                    >
                                        <option>Enable</option>
                                        <option>Disable</option>
                                    </select>
                                </div>
                                <p className="field-help">Redirect users to Amazon cart after adding.</p>
                            </div>

                            <div className="field">
                                <label className="field-label" htmlFor="openLinks">
                                    Open Links In
                                </label>
                                <div className="select-wrap">
                                    <select
                                        id="openLinks"
                                        className="control"
                                        value={config.openLinks}
                                        onChange={(e) => model.setField("openLinks", e.target.value)}
                                    >
                                        <option>New Tab</option>
                                        <option>Same Tab</option>
                                    </select>
                                </div>
                                <p className="field-help">How affiliate links should open.</p>
                            </div>
                        </div>

                        <div className="other-settings">
                            <h2 className="card-heading">Other Settings</h2>

                            <div className="checkbox-list">
                                {[
                                    "Automatically append Associate ID to all product links",
                                    "Use secure (https://) Amazon links",
                                    "Enable link cloaking (recommended)",
                                ].map((label, i) => (
                                    <label key={label} className="checkbox-row">
                                        <input type="checkbox" checked={checkboxes[i]} onChange={() => model.toggleCheckbox(i)} />
                                        <span className="custom-checkbox" />
                                        {label}
                                    </label>
                                ))}
                            </div>

                            <p className="settings-note">These settings will apply across the entire platform.</p>
                        </div>
                    </article>

                    {/* Right column */}
                    <div className="testing-column">
                        {/* Testing */}
                        <article className="card testing-card">
                            <h2 className="card-heading">Affiliate Link Testing</h2>
                            <p className="card-description">Test Amazon links for any product to verify your configuration.</p>

                            <div className="product-selector">
                                <p className="product-selector-label">Select a Product</p>

                                <div className="product-select">
                                    <button type="button" className="product-select-button" onClick={() => model.openDropdown("product")}>
                                        <span className="product-image">
                                            <span className="text-zinc-400 text-[10px] font-bold">
                                                {product.name.slice(0, 2).toUpperCase()}
                                            </span>
                                        </span>
                                        <span className="product-copy">
                                            <span className="product-name">{product.name}</span>
                                            <span className="product-asin">ASIN: {product.asin}</span>
                                        </span>
                                        <span className="material-symbols-outlined product-select-chevron text-[15px]">
                                            expand_more
                                        </span>
                                    </button>
                                    {dropdown === "product" && <ProductMenu />}
                                </div>

                                <p className="product-help">Search and select any product to test the link.</p>

                                <button type="button" className="test-button" disabled={testing} onClick={model.testLink}>
                                    <span className="material-symbols-outlined text-[15px]">
                                        {testing ? "progress_activity" : "link"}
                                    </span>
                                    {testing ? "Testing…" : "Test Amazon Link"}
                                </button>
                            </div>
                        </article>

                        {/* Generated preview */}
                        <article className="card preview-card">
                            <h2 className="card-heading">Generated Amazon Link (Preview)</h2>
                            <p className="card-description">This link is generated dynamically and not saved.</p>

                            <div className="preview-content">
                                <div className="generated-link">
                                    <span className="generated-url">{generatedUrl}</span>
                                    <button
                                        type="button"
                                        className="copy-button"
                                        aria-label="Copy affiliate link"
                                        onClick={model.copyLink}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                    </button>
                                </div>

                                <button type="button" className="open-link-button" onClick={model.openLink}>
                                    Open Link
                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                </button>

                                <div className="success-message">
                                    <span className="material-symbols-outlined success-icon text-[18px]">check_circle</span>
                                    <div>
                                        <p className="success-title">Link Generated Successfully</p>
                                        <p className="success-copy">This link includes your Associate ID and is ready to use.</p>
                                    </div>
                                </div>
                            </div>
                        </article>

                        {/* How it works */}
                        <article className="card how-card">
                            <h2 className="card-heading">How It Works</h2>
                            <ul className="how-list">
                                <li>Links are generated in real-time using your configuration.</li>
                                <li>Test different products to verify links are working correctly.</li>
                                <li>No links are stored or logged by the system.</li>
                            </ul>
                        </article>
                    </div>
                </section>
            </div>
        </div>
    );
}