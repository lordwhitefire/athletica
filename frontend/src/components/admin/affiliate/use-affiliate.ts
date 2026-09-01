"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface AffiliateProduct {
    name: string;
    asin: string;
}

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
    { name: "Nike Mercurial Vapor 15 Elite FG", asin: "B0C2H5X1Z8" },
    { name: "Nike Air Zoom Pegasus 41", asin: "B0C2H5X2A4" },
    { name: "Adidas Predator Elite", asin: "B0C2H5X3B5" },
    { name: "Puma Future Ultimate", asin: "B0C2H5X4C6" },
];

export const DATE_RANGES = [
    "May 13 – May 19, 2025",
    "May 20 – May 26, 2025",
    "May 27 – Jun 2, 2025",
    "Jun 3 – Jun 9, 2025",
];

export interface ConfigState {
    associateId: string;
    affiliateTag: string;
    marketplace: string;
    linkType: string;
    locale: string;
    cartRedirect: string;
    openLinks: string;
}

export type ConfigField = keyof ConfigState;

export interface Toast {
    id: number;
    title: string;
    message: string;
    type: "success" | "error";
}

export type DropdownName = "date" | "product" | "account";

export type ModalState = null | { kind: "save" } | { kind: "openLink"; url: string };

export interface AffiliateModel {
    config: ConfigState;
    checkboxes: boolean[];
    dirty: boolean;
    errors: Partial<Record<ConfigField, string>>;
    dateLabel: string;
    product: AffiliateProduct;
    generatedUrl: string;
    dropdown: DropdownName | null;
    modal: ModalState;
    toasts: Toast[];
    saving: boolean;
    savedFlash: boolean;
    testing: boolean;
    setField: (field: ConfigField, value: string) => void;
    toggleCheckbox: (index: number) => void;
    selectDate: (range: string) => void;
    selectProduct: (product: AffiliateProduct) => void;
    openDropdown: (name: DropdownName) => void;
    closeDropdowns: () => void;
    handleSaveClick: () => void;
    confirmSave: () => void;
    closeModal: () => void;
    testLink: () => void;
    copyLink: () => void;
    openLink: () => void;
    dismissToast: (id: number) => void;
    accountAction: (label: string) => void;
}

export function buildAffiliateUrl(
    asin: string,
    affiliateTag: string,
    associateId: string,
    locale: string,
    marketplace: string
): string {
    const tag = (affiliateTag || "").trim() || (associateId || "").trim();
    let host = "www.amazon.com";
    if (locale === "en_GB") host = "www.amazon.co.uk";
    if (locale === "en_CA") host = "www.amazon.ca";
    if (locale === "de_DE") host = "www.amazon.de";
    if (/amazon\.co\.uk/i.test(marketplace)) host = "www.amazon.co.uk";
    if (/amazon\.ca/i.test(marketplace)) host = "www.amazon.ca";
    if (/amazon\.de/i.test(marketplace)) host = "www.amazon.de";
    return `https://${host}/dp/${encodeURIComponent(asin)}/ref=as_li_ss_tl?ie=UTF8&linkCode=sl1&tag=${encodeURIComponent(tag || "athletica-20")}`;
}

export function useAffiliate(): AffiliateModel {
    const initialConfig: ConfigState = {
        associateId: "athletica-20",
        affiliateTag: "athletica-20",
        marketplace: "🇺🇸  Amazon.com (US)",
        linkType: "Text Link",
        locale: "en_US",
        cartRedirect: "Enable",
        openLinks: "New Tab",
    };

    const [config, setConfig] = useState<ConfigState>(initialConfig);
    const [checkboxes, setCheckboxes] = useState<boolean[]>([true, true, true]);
    const [dirty, setDirty] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<ConfigField, string>>>({});
    const [dateLabel, setDateLabel] = useState(DATE_RANGES[0]);
    const [product, setProduct] = useState<AffiliateProduct>(AFFILIATE_PRODUCTS[0]);
    const [dropdown, setDropdown] = useState<DropdownName | null>(null);
    const [modal, setModal] = useState<ModalState>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [saving, setSaving] = useState(false);
    const [savedFlash, setSavedFlash] = useState(false);
    const [testing, setTesting] = useState(false);

    const toastId = useRef(0);

    const generatedUrl = useMemo(
        () => buildAffiliateUrl(product.asin, config.affiliateTag, config.associateId, config.locale, config.marketplace),
        [product.asin, config.affiliateTag, config.associateId, config.locale, config.marketplace]
    );

    const showToast = useCallback((title: string, message = "", type: "success" | "error" = "success") => {
        const id = ++toastId.current;
        setToasts((prev) => [...prev.slice(-3), { id, title, message, type }]);
        window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800);
    }, []);

    const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

    const setField = useCallback((field: ConfigField, value: string) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
        setDirty(true);
    }, []);

    const toggleCheckbox = useCallback((index: number) => {
        setCheckboxes((prev) => prev.map((c, i) => (i === index ? !c : c)));
        setDirty(true);
    }, []);

    const selectDate = useCallback(
        (range: string) => {
            setDateLabel(range);
            setDropdown(null);
            setDirty(true);
            showToast("Date range changed", range);
        },
        [showToast]
    );

    const selectProduct = useCallback(
        (p: AffiliateProduct) => {
            setProduct(p);
            setDropdown(null);
            setDirty(true);
            showToast("Product selected", p.name);
        },
        [showToast]
    );

    const openDropdown = useCallback((name: DropdownName) => setDropdown((prev) => (prev === name ? null : name)), []);
    const closeDropdowns = useCallback(() => setDropdown(null), []);
    const closeModal = useCallback(() => setModal(null), []);

    const validate = useCallback(() => {
        const next: Partial<Record<ConfigField, string>> = {};
        if (!config.associateId.trim()) next.associateId = "Amazon Associate ID is required.";
        if (!config.affiliateTag.trim()) next.affiliateTag = "Default Affiliate Tag is required.";
        setErrors(next);
        return Object.keys(next).length === 0;
    }, [config.associateId, config.affiliateTag]);

    const handleSaveClick = useCallback(() => {
        if (!dirty) {
            showToast("No changes to save", "Your configuration is already up to date.");
            return;
        }
        if (!validate()) {
            showToast("Cannot save changes", "Complete the required fields first.", "error");
            return;
        }
        setModal({ kind: "save" });
    }, [dirty, validate, showToast]);

    const confirmSave = useCallback(() => {
        setModal(null);
        setSaving(true);
        window.setTimeout(() => {
            setSaving(false);
            setDirty(false);
            setErrors({});
            setSavedFlash(true);
            showToast("Changes saved successfully", "Your affiliate configuration is now active.");
            window.setTimeout(() => setSavedFlash(false), 1200);
        }, 550);
    }, [showToast]);

    const testLink = useCallback(() => {
        if (!validate()) {
            showToast("Testing blocked", "Complete the required affiliate fields.", "error");
            return;
        }
        setTesting(true);
        window.setTimeout(() => {
            setTesting(false);
            showToast("Link generated successfully", "The generated link includes your current Associate ID.");
        }, 500);
    }, [validate, showToast]);

    const copyLink = useCallback(async () => {
        const value = generatedUrl;
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            showToast("Link copied", "Affiliate link copied to clipboard.");
        } catch {
            const area = document.createElement("textarea");
            area.value = value;
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            let copied = false;
            try {
                copied = document.execCommand("copy");
            } catch {
                copied = false;
            }
            area.remove();
            if (copied) showToast("Link copied", "Affiliate link copied to clipboard.");
            else showToast("Copy unavailable", "Copy the displayed link manually.", "error");
        }
    }, [generatedUrl, showToast]);

    const openLink = useCallback(() => {
        setModal({ kind: "openLink", url: generatedUrl });
    }, [generatedUrl]);

    const accountAction = useCallback(
        (label: string) => {
            setDropdown(null);
            if (label === "Sign out") showToast("Sign out", "Sign-out action selected.", "error");
            else showToast(label, "Controls are available here.");
        },
        [showToast]
    );

    useEffect(() => {
        if (!dirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    return {
        config,
        checkboxes,
        dirty,
        errors,
        dateLabel,
        product,
        generatedUrl,
        dropdown,
        modal,
        toasts,
        saving,
        savedFlash,
        testing,
        setField,
        toggleCheckbox,
        selectDate,
        selectProduct,
        openDropdown,
        closeDropdowns,
        handleSaveClick,
        confirmSave,
        closeModal,
        testLink,
        copyLink,
        openLink,
        dismissToast,
        accountAction,
    };
}