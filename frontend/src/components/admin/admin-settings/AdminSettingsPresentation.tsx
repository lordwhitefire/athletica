"use client";

import { useAdminSettingsModel } from "./AdminSettingsInteractionLayer";
import { PASSWORD_RULE_LABELS, TIMEZONES, LANGUAGES } from "./use-admin-settings";
import "./admin-settings.css";

const PASSWORD_FIELDS = [
    { field: "current" as const, label: "Current Password", placeholder: "Enter current password" },
    { field: "next" as const, label: "New Password", placeholder: "Enter new password" },
    { field: "confirm" as const, label: "Confirm New Password", placeholder: "Confirm new password" },
];

export function AdminSettingsPresentation() {
    const { model } = useAdminSettingsModel();
    const { profile, password, meter } = model;

    return (
        <div className="admin-settings-page">
            <div className="admin-settings-inner">
                <header className="page-head">
                    <div>
                        <div className="title-row">
                            <span className="material-symbols-outlined title-icon text-[22px]">settings</span>
                            <h1>Admin Settings</h1>
                        </div>
                        <p className="subtitle">Manage your profile, security and system access.</p>
                    </div>

                    <div
                        className="owner"
                        role="button"
                        tabIndex={0}
                        aria-label="Owner access"
                        onClick={() => model.openModal("owner")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                model.openModal("owner");
                            }
                        }}
                    >
                        <div className="owner-icon">
                            <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        </div>
                        <div className="owner-copy">
                            <div className="owner-top">You are the owner</div>
                            <div className="owner-bottom">Full access</div>
                        </div>
                    </div>
                </header>

                <section className="settings-shell">
                    <div className="tabs" role="tablist" aria-label="Admin settings sections">
                        <button
                            type="button"
                            className={`tab${model.tab === "profile" ? " active" : ""}`}
                            role="tab"
                            aria-selected={model.tab === "profile"}
                            onClick={() => model.setTab("profile")}
                        >
                            <span className="material-symbols-outlined tab-icon text-[17px]">person</span>
                            Profile
                        </button>
                        <button
                            type="button"
                            className={`tab${model.tab === "security" ? " active" : ""}`}
                            role="tab"
                            aria-selected={model.tab === "security"}
                            onClick={() => model.setTab("security")}
                        >
                            <span className="material-symbols-outlined tab-icon text-[17px]">lock</span>
                            Security
                        </button>
                        <button
                            type="button"
                            className={`tab${model.tab === "roles" ? " active" : ""}`}
                            role="tab"
                            aria-selected={model.tab === "roles"}
                            onClick={() => model.setTab("roles")}
                        >
                            <span className="material-symbols-outlined tab-icon text-[17px]">group</span>
                            Roles
                            <span className="soon">Soon</span>
                        </button>
                    </div>

                    <div className="top-grid" data-hidden={model.tab === "security"}>
                        <section className="card profile-card">
                            <div className="card-title">
                                <span className="material-symbols-outlined card-title-icon text-[20px]">person</span>
                                Profile Information
                            </div>

                            <div className="profile-body">
                                <div className="profile-top">
                                    <div className="avatar-wrap">
                                        <div className="big-avatar">{model.avatar}</div>
                                        <button type="button" className="camera" aria-label="Change avatar" onClick={() => model.openModal("avatar")}>
                                            <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                                        </button>
                                    </div>

                                    <div>
                                        <div className="info-line">
                                            <div className="info-label">Name</div>
                                            <div className="info-value">{profile.name}</div>
                                        </div>
                                        <div className="info-line">
                                            <div className="info-label">Email address</div>
                                            <div className="info-value">{profile.email}</div>
                                        </div>
                                        <div className="info-line">
                                            <div className="info-label">Role</div>
                                            <span className="role-badge">{profile.role}</span>
                                        </div>
                                        <div className="info-line">
                                            <div className="info-label">Member since</div>
                                            <div className="info-value">{profile.memberSince}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="profile-divider" />

                                <div className="field">
                                    <label htmlFor="timezone">Time zone</label>
                                    <div className="select-wrap">
                                        <select id="timezone" value={model.timezone} onChange={(e) => model.setTimezone(e.target.value)}>
                                            {TIMEZONES.map((tz) => (
                                                <option key={tz}>{tz}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="field">
                                    <label htmlFor="language">Language</label>
                                    <div className="select-wrap">
                                        <select id="language" value={model.language} onChange={(e) => model.setLanguage(e.target.value)}>
                                            {LANGUAGES.map((lang) => (
                                                <option key={lang}>{lang}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button type="button" className="save-btn" disabled={model.saving} onClick={model.saveChanges}>
                                    {model.saving ? "Saving…" : "Save Changes"}
                                </button>
                            </div>
                        </section>

                        <section className="card password-card">
                            <div className="card-title password-head">
                                <span className="material-symbols-outlined card-title-icon text-[20px]">lock_open</span>
                                <span>Change Password</span>
                            </div>
                            <p className="password-sub">Update your password regularly to keep your account secure.</p>

                            {PASSWORD_FIELDS.map(({ field, label, placeholder }, i) => (
                                <div className="password-field" data-error={Boolean(password.errors[i])} key={field}>
                                    <label htmlFor={`password-${field}`}>{label}</label>
                                    <div className="password-wrap">
                                        <input
                                            id={`password-${field}`}
                                            className="password-input"
                                            type={password.visible[i] ? "text" : "password"}
                                            placeholder={placeholder}
                                            value={password[field]}
                                            onChange={(e) => model.setPasswordField(field, e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="eye"
                                            aria-label={password.visible[i] ? "Hide password" : "Show password"}
                                            onClick={() => model.togglePasswordVisible(i)}
                                        >
                                            <span className="material-symbols-outlined text-[17px]">
                                                {password.visible[i] ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </div>
                                    {password.errors[i] && <p className="admin-settings-field-message">{password.errors[i]}</p>}
                                    {field === "next" && (
                                        <>
                                            <div className="admin-settings-password-meter">
                                                <span style={{ width: `${meter.width}%` }} />
                                            </div>
                                            <p className="admin-settings-inline-status" data-tone={meter.label.tone}>
                                                {meter.label.text}
                                            </p>
                                        </>
                                    )}
                                </div>
                            ))}

                            <div className="requirements">
                                <div className="requirements-title">Password must contain:</div>
                                {PASSWORD_RULE_LABELS.map((label, i) => (
                                    <div className="requirement" key={label}>
                                        <span className="check" data-met={rulesMet(password.next)[i]}>
                                            {rulesMet(password.next)[i] ? "✓" : ""}
                                        </span>
                                        {label}
                                    </div>
                                ))}
                            </div>

                            <button type="button" className="update-btn" onClick={model.updatePassword}>
                                Update Password
                            </button>
                        </section>
                    </div>

                    <section className="card security-card">
                        <div className="card-title">
                            <span className="material-symbols-outlined card-title-icon text-[20px]">security</span>
                            Account Security
                        </div>
                        <p className="security-sub">Manage your account security and sessions.</p>

                        <div className="security-grid">
                            <div className="security-item">
                                <div className="security-icon">
                                    <span className="material-symbols-outlined text-[28px]">desktop_windows</span>
                                </div>
                                <div>
                                    <div className="security-name">Active Sessions</div>
                                    <div className="security-desc">
                                        {model.sessions.length} active session{model.sessions.length === 1 ? "" : "s"}
                                    </div>
                                    <div className="security-desc">Current session active now</div>
                                    <button type="button" className="outline-btn" onClick={() => model.openModal("sessions")}>
                                        View Sessions
                                    </button>
                                </div>
                            </div>

                            <div className="security-item">
                                <div className="security-icon">
                                    <span className="material-symbols-outlined text-[28px]">key</span>
                                </div>
                                <div>
                                    <div className="security-name">Two-Factor Authentication</div>
                                    <div className="security-desc">
                                        {model.twoFactorEnabled ? "Extra account protection enabled" : "Add an extra layer of security"}
                                    </div>
                                    <div className="security-status" data-tone={model.twoFactorEnabled ? "good" : "bad"}>
                                        {model.twoFactorEnabled ? "Enabled" : "Not enabled"}
                                    </div>
                                    <button type="button" className="outline-btn" onClick={() => model.openModal("twoFactor")}>
                                        {model.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
                                    </button>
                                </div>
                            </div>

                            <div className="security-item">
                                <div className="security-icon">
                                    <span className="material-symbols-outlined text-[28px]">history</span>
                                </div>
                                <div>
                                    <div className="security-name">Login History</div>
                                    <div className="security-desc">Review recent account activity</div>
                                    <div className="security-desc">Last login: {model.history[0]?.time || "Now"}</div>
                                    <button type="button" className="outline-btn" onClick={() => model.openModal("history")}>
                                        View History
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </section>

                <footer>
                    <div>© {new Date().getFullYear()} Athletica. All rights reserved.</div>
                    <div className="footer-links">
                        <span>Need help?</span>
                        <button type="button" className="footer-link" onClick={() => model.openModal("docs")}>
                            Documentation
                        </button>
                        <button type="button" className="footer-link" onClick={() => model.openModal("support")}>
                            Contact Support
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}

function rulesMet(value: string): boolean[] {
    return [
        value.length >= 8,
        /[A-Z]/.test(value),
        /[a-z]/.test(value),
        /[0-9!@#$%^&*(),.?":{}|<>]/.test(value),
    ];
}