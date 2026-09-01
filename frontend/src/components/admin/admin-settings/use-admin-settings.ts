"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface AdminProfile {
    name: string;
    email: string;
    role: string;
    memberSince: string;
}

export interface SessionItem {
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    current: boolean;
}

export interface HistoryItem {
    event: string;
    device: string;
    location: string;
    time: string;
}

export const TIMEZONES = [
    "(GMT+01:00) West Africa Time (Lagos)",
    "(GMT+00:00) Greenwich Mean Time (London)",
    "(GMT-05:00) Eastern Time (New York)",
    "(GMT-08:00) Pacific Time (Los Angeles)",
];

export const LANGUAGES = ["English", "Français", "Deutsch", "Español"];

export const AVATAR_LETTERS = ["A", "C", "D", "M", "N", "S", "T", "V"];

export type TabName = "profile" | "security" | "roles";

export interface Toast {
    id: number;
    title: string;
    message: string;
    type: "success" | "warning" | "error";
}

export type ModalKind =
    | "avatar"
    | "sessions"
    | "twoFactor"
    | "history"
    | "owner"
    | "account"
    | "signout"
    | "docs"
    | "support";

export interface PasswordState {
    current: string;
    next: string;
    confirm: string;
    visible: [boolean, boolean, boolean];
    errors: [string, string, string];
}

export interface AdminSettingsModel {
    tab: TabName;
    profile: AdminProfile;
    timezone: string;
    language: string;
    saving: boolean;
    avatar: string;
    avatarChoice: string;
    password: PasswordState;
    twoFactorEnabled: boolean;
    sessions: SessionItem[];
    history: HistoryItem[];
    modal: ModalKind | null;
    toasts: Toast[];
    twoFactorCode: string;
    twoFactorError: string;
    meter: {
        score: number;
        width: number;
        label: { text: string; tone: "neutral" | "good" | "bad" };
    };
    setTab: (tab: TabName) => void;
    setTimezone: (value: string) => void;
    setLanguage: (value: string) => void;
    saveChanges: () => void;
    togglePasswordVisible: (index: number) => void;
    setPasswordField: (field: "current" | "next" | "confirm", value: string) => void;
    updatePassword: () => void;
    openModal: (kind: ModalKind) => void;
    closeModal: () => void;
    chooseAvatar: (letter: string) => void;
    applyAvatar: () => void;
    setTwoFactorCode: (value: string) => void;
    confirmTwoFactor: () => void;
    disableTwoFactor: () => void;
    accountAction: (action: "profile" | "security" | "signout") => void;
    confirmSignOut: () => void;
    dismissToast: (id: number) => void;
}

export const PASSWORD_RULES = [
    (v: string) => v.length >= 8,
    (v: string) => /[A-Z]/.test(v),
    (v: string) => /[a-z]/.test(v),
    (v: string) => /[0-9!@#$%^&*(),.?":{}|<>]/.test(v),
];

export const PASSWORD_RULE_LABELS = [
    "At least 8 characters",
    "One uppercase letter",
    "One lowercase letter",
    "One number or special character",
];

export function passwordScore(value: string): number {
    return PASSWORD_RULES.reduce((acc, rule) => acc + (rule(value) ? 1 : 0), 0);
}

export function useAdminSettings(profile: AdminProfile): AdminSettingsModel {
    const [tab, setTabState] = useState<TabName>("profile");
    const [timezone, setTimezone] = useState(TIMEZONES[0]);
    const [language, setLanguage] = useState(LANGUAGES[0]);
    const [saving, setSaving] = useState(false);
    const [avatar, setAvatar] = useState(profile.name.trim().charAt(0).toUpperCase() || "A");
    const [avatarChoice, setAvatarChoice] = useState(avatar);
    const [password, setPassword] = useState<PasswordState>({
        current: "",
        next: "",
        confirm: "",
        visible: [false, false, false],
        errors: ["", "", ""],
    });
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [sessions, setSessions] = useState<SessionItem[]>([
        {
            device: "Current browser session",
            browser: "Firefox",
            location: "Current session",
            lastActive: "Now",
            current: true,
        },
    ]);
    const [history] = useState<HistoryItem[]>([
        {
            event: "Successful login",
            device: "Current browser",
            location: "Current session",
            time: "Now",
        },
    ]);
    const [modal, setModal] = useState<ModalKind | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [twoFactorError, setTwoFactorError] = useState("");

    const toastId = useRef(0);

    const showToast = useCallback((title: string, message = "", type: Toast["type"] = "success") => {
        const id = ++toastId.current;
        setToasts((prev) => [...prev.slice(-3), { id, title, message, type }]);
        window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3400);
    }, []);

    const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

    const setTab = useCallback(
        (name: TabName) => {
            setTabState(name);
            if (name === "roles") {
                showToast("Roles", "Role management is coming soon.", "warning");
            }
        },
        [showToast]
    );

    const saveChanges = useCallback(() => {
        setSaving(true);
        window.setTimeout(() => {
            setSaving(false);
            showToast("Changes saved", "Your profile preferences have been saved.");
        }, 550);
    }, [showToast]);

    const togglePasswordVisible = useCallback((index: number) => {
        setPassword((prev) => ({
            ...prev,
            visible: prev.visible.map((v, i) => (i === index ? !v : v)) as [boolean, boolean, boolean],
        }));
    }, []);

    const setPasswordField = useCallback((field: "current" | "next" | "confirm", value: string) => {
        setPassword((prev) => {
            const index = field === "current" ? 0 : field === "next" ? 1 : 2;
            const errors = [...prev.errors] as [string, string, string];
            if (errors[index]) errors[index] = "";
            return { ...prev, [field]: value, errors };
        });
    }, []);

    const updatePassword = useCallback(() => {
        const { current, next, confirm } = password;
        const errors: [string, string, string] = ["", "", ""];
        let valid = true;

        if (!current) {
            errors[0] = "Enter your current password.";
            valid = false;
        }
        if (!next) {
            errors[1] = "Enter a new password.";
            valid = false;
        } else if (passwordScore(next) < 4) {
            errors[1] = "The new password does not meet all requirements.";
            valid = false;
        }
        if (!confirm) {
            errors[2] = "Confirm the new password.";
            valid = false;
        } else if (next !== confirm) {
            errors[2] = "Passwords do not match.";
            valid = false;
        }

        setPassword((prev) => ({ ...prev, errors }));

        if (!valid) {
            showToast("Password not updated", "Check the highlighted fields.", "error");
            return;
        }

        setPassword({ current: "", next: "", confirm: "", visible: [false, false, false], errors: ["", "", ""] });
        showToast("Password updated", "Your password has been changed successfully.");
    }, [password, showToast]);

    const openModal = useCallback((kind: ModalKind) => {
        setTwoFactorError("");
        setTwoFactorCode("");
        setAvatarChoice(avatar);
        setModal(kind);
    }, [avatar]);

    const closeModal = useCallback(() => setModal(null), []);

    const chooseAvatar = useCallback((letter: string) => setAvatarChoice(letter), []);

    const applyAvatar = useCallback(() => {
        setAvatar(avatarChoice);
        setModal(null);
        showToast("Avatar updated", "Your profile avatar has been changed.");
    }, [avatarChoice, showToast]);

    const confirmTwoFactor = useCallback(() => {
        if (!/^\d{6}$/.test(twoFactorCode.trim())) {
            setTwoFactorError("Enter a valid six-digit verification code.");
            return;
        }
        setTwoFactorEnabled(true);
        setModal(null);
        showToast("2FA enabled", "Two-factor authentication is now protecting your account.");
    }, [twoFactorCode, showToast]);

    const disableTwoFactor = useCallback(() => {
        setTwoFactorEnabled(false);
        setModal(null);
        showToast("2FA disabled", "Two-factor authentication is no longer enabled.", "warning");
    }, [showToast]);

    const accountAction = useCallback(
        (action: "profile" | "security" | "signout") => {
            setModal(null);
            if (action === "profile") {
                setTabState("profile");
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
            if (action === "security") {
                setTabState("security");
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
            setModal("signout");
        },
        []
    );

    const confirmSignOut = useCallback(() => {
        setModal(null);
        showToast("Signed out", "The sign-out action completed.");
    }, [showToast]);

    const meter = useMemo(() => {
        const score = passwordScore(password.next);
        return {
            score,
            width: [0, 25, 50, 75, 100][score],
            label: !password.next
                ? { text: "Enter a new password.", tone: "neutral" as const }
                : score < 4
                  ? { text: `${score}/4 password requirements met.`, tone: "bad" as const }
                  : { text: "Strong password.", tone: "good" as const },
        };
    }, [password.next]);

    return {
        tab,
        profile,
        timezone,
        language,
        saving,
        avatar,
        avatarChoice,
        password,
        twoFactorEnabled,
        sessions,
        history,
        modal,
        toasts,
        twoFactorCode,
        twoFactorError,
        setTab,
        setTimezone,
        setLanguage,
        saveChanges,
        togglePasswordVisible,
        setPasswordField,
        updatePassword,
        openModal,
        closeModal,
        chooseAvatar,
        applyAvatar,
        setTwoFactorCode,
        confirmTwoFactor,
        disableTwoFactor,
        accountAction,
        confirmSignOut,
        dismissToast,
        meter,
    };
}