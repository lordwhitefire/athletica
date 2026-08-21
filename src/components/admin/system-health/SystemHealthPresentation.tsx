"use client";

import { useSystemHealthModel } from "./SystemHealthInteractionLayer";
import { ShIcon } from "./sh-icons";
import {
    ALERTS,
    HEALTH_ROWS,
    ISSUES,
    SCORE,
    SYNCS,
    type Issue,
    type IssueKey,
} from "./system-health-data";
import "./system-health.css";

const TABS: { key: IssueKey | "all"; label: string }[] = [
    { key: "all", label: "All Issues" },
    { key: "images", label: "Images" },
    { key: "asin", label: "ASIN" },
    { key: "category", label: "Category" },
    { key: "broken", label: "Broken Links" },
];

const METRIC_CARDS: IssueKey[] = ["images", "asin", "category", "broken"];

function matchesTab(issue: Issue, tab: string): boolean {
    if (tab === "all") return true;
    const text = issue.title.toLowerCase();
    return (
        (tab === "images" && text.includes("images")) ||
        (tab === "asin" && text.includes("asin")) ||
        (tab === "category" && text.includes("category")) ||
        (tab === "broken" && text.includes("broken"))
    );
}

function MetricCard({ issue }: { issue: Issue }) {
    const { model } = useSystemHealthModel();
    return (
        <article className="sh-metric-card">
            <div className="sh-metric-top">
                <div className={`sh-metric-icon ${issue.iconTone}`}>
                    <ShIcon name={issue.icon} />
                </div>
                <div>
                    <div className="sh-metric-label">{issue.title}</div>
                    <div className={`sh-metric-number ${issue.iconTone === "pink" ? "red" : issue.iconTone}`}>
                        {issue.count}
                    </div>
                </div>
            </div>
            <div className="sh-metric-sub">{issue.percentage} of total products</div>
            <div
                className="sh-metric-link"
                role="button"
                tabIndex={0}
                aria-label={`View ${issue.title}`}
                onClick={() => model.openProducts(issue.title)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        model.openProducts(issue.title);
                    }
                }}
            >
                View products <span>→</span>
            </div>
        </article>
    );
}

function IssueRow({ issue }: { issue: Issue }) {
    const { model } = useSystemHealthModel();
    const visible =
        matchesTab(issue, model.activeTab) &&
        (!model.searchQuery ||
            issue.title.toLowerCase().includes(model.searchQuery.toLowerCase()));

    return (
        <tr hidden={!visible}>
            <td>
                <div className="sh-issue-name">
                    <span className={`sh-row-icon ${issue.iconTone === "pink" ? "red" : issue.iconTone}`}>
                        <ShIcon name={issue.icon} />
                    </span>
                    {issue.title}
                </div>
            </td>
            <td>{issue.count}</td>
            <td>{issue.percentage}</td>
            <td>
                <div className={`sh-trend ${issue.direction}`}>
                    {issue.trend}
                    <svg className={`sh-spark ${issue.direction}`} viewBox="0 0 86 21" preserveAspectRatio="none">
                        <polyline points={issue.spark} />
                    </svg>
                </div>
            </td>
            <td>
                <button type="button" className="sh-view-btn" onClick={() => model.openProducts(issue.title)}>
                    View Products
                </button>
            </td>
        </tr>
    );
}

export function SystemHealthPresentation() {
    const { model } = useSystemHealthModel();

    return (
        <div className="sh-page">
            <div className="sh-inner">
                <header className="sh-topbar">
                    <div className="sh-title">
                        <h1>System Health</h1>
                        <p>Monitor data quality, sync status, and system performance.</p>
                    </div>

                    <div className="sh-top-actions">
                        <button type="button" className="sh-date-picker" onClick={() => model.openModal("date")}>
                            <ShIcon name="calendar" />
                            <span>{model.rangeLabel}</span>
                            <ShIcon name="chevron" className="arrow" />
                        </button>

                        <button
                            type="button"
                            className={`sh-refresh${model.isRefreshing ? " is-loading" : ""}`}
                            id="refreshButton"
                            disabled={model.isRefreshing}
                            onClick={model.refresh}
                        >
                            {model.isRefreshing ? <ShIcon name="spinner" /> : <ShIcon name="refresh" />}
                            {model.isRefreshing ? "Refreshing..." : "Refresh Data"}
                        </button>
                    </div>
                </header>

                <div className="sh-workspace">
                    <section className="sh-left-column">
                        <section className="sh-panel sh-overview">
                            <div className="sh-panel-heading">
                                <h2>Data Quality Overview</h2>
                                <p>Key data issues that need your attention.</p>
                            </div>
                            <div className="sh-overview-cards">
                                {METRIC_CARDS.map((key) => (
                                    <MetricCard key={key} issue={ISSUES[key]} />
                                ))}
                            </div>
                        </section>

                        <section className="sh-panel sh-issues">
                            <div className="sh-panel-heading">
                                <h2>Data Issues</h2>
                            </div>

                            <div className="sh-issue-toolbar">
                                <div className="sh-tabs" role="tablist" aria-label="Issue types">
                                    {TABS.map((tab) => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            className={`sh-tab${model.activeTab === tab.key ? " active" : ""}`}
                                            role="tab"
                                            aria-selected={model.activeTab === tab.key}
                                            onClick={() => model.setTab(tab.key)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="sh-issue-actions">
                                    <label className="sh-search">
                                        <input
                                            type="search"
                                            placeholder="Search issues..."
                                            value={model.searchQuery}
                                            onChange={(e) => model.setSearch(e.target.value)}
                                        />
                                        <ShIcon name="search" />
                                    </label>

                                    <button type="button" className="sh-export" onClick={model.exportIssuesReport}>
                                        <ShIcon name="download" />
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="sh-table-wrap">
                                <table className="sh-issue-table">
                                    <colgroup>
                                        <col />
                                        <col />
                                        <col />
                                        <col />
                                        <col />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>Issue Type</th>
                                            <th>Products Affected</th>
                                            <th>Percentage</th>
                                            <th>Trend (vs last 7 days)</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {model.issueOrder.map((key) => (
                                            <IssueRow key={key} issue={ISSUES[key]} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div
                                className="sh-panel-footer-link"
                                role="button"
                                tabIndex={0}
                                onClick={() => model.openModal("issuesReport")}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        model.openModal("issuesReport");
                                    }
                                }}
                            >
                                View all issues report <span>→</span>
                            </div>
                        </section>

                        <div className="sh-lower-grid">
                            <section className="sh-panel sh-alerts">
                                <div className="sh-panel-heading">
                                    <h2>Recent Data Quality Alerts</h2>
                                    <p>Latest issues detected by the system.</p>
                                </div>

                                <div className="sh-alert-list">
                                    {ALERTS.map((alert, i) => (
                                        <div className="sh-alert-row" key={i}>
                                            <div className={`sh-alert-icon ${alert.iconTone}`}>
                                                <ShIcon name={alert.icon} />
                                            </div>
                                            <div className="sh-alert-main">
                                                <div className="sh-alert-title">{alert.title}</div>
                                                <div className="sh-alert-desc">{alert.desc}</div>
                                            </div>
                                            <div className="sh-alert-time">{alert.time}</div>
                                            <div className={`sh-severity${alert.severity === "Medium" ? " medium" : ""}`}>
                                                {alert.severity}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div
                                    className="sh-panel-footer-link"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => model.openModal("alerts")}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            model.openModal("alerts");
                                        }
                                    }}
                                >
                                    View all alerts <span>→</span>
                                </div>
                            </section>

                            <section className="sh-panel sh-score">
                                <div className="sh-panel-heading">
                                    <h2>Data Quality Score</h2>
                                    <p>Overall health score of your product data.</p>
                                </div>

                                <div className="sh-score-content">
                                    <div className="sh-score-ring">
                                        <svg viewBox="0 0 120 120" aria-hidden="true">
                                            <circle className="track" cx="60" cy="60" r="50" />
                                            <circle className="progress" cx="60" cy="60" r="50" />
                                        </svg>
                                        <div>
                                            <div className="sh-score-number">{SCORE.number}</div>
                                            <div className="sh-score-label">{SCORE.label}</div>
                                        </div>
                                    </div>

                                    <div className="sh-score-message">
                                        {SCORE.message}
                                        <span>{SCORE.hint}</span>
                                    </div>
                                </div>

                                <div
                                    className="sh-panel-footer-link"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => model.openModal("improvements")}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            model.openModal("improvements");
                                        }
                                    }}
                                >
                                    View improvement suggestions <span>→</span>
                                </div>
                            </section>
                        </div>
                    </section>

                    <aside className="sh-right-column">
                        <section className="sh-panel sh-sync">
                            <div className="sh-panel-heading">
                                <h2>Sync Status</h2>
                                <p>Real-time status of all data sync operations.</p>
                            </div>

                            <div className="sh-sync-list">
                                {SYNCS.map((sync) => (
                                    <div
                                        className="sh-sync-item"
                                        key={sync.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => model.openSyncDetail(sync.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                model.openSyncDetail(sync.id);
                                            }
                                        }}
                                    >
                                        <div className={`sh-sync-icon ${sync.iconTone}`}>
                                            <ShIcon name={sync.icon} />
                                        </div>
                                        <div>
                                            <div className="sh-sync-name">{sync.title}</div>
                                            <div className="sh-sync-meta">{sync.date}</div>
                                        </div>
                                        <div className="sh-sync-result">
                                            <span className="sh-completed">{sync.status}</span>
                                            <span className="sh-sync-count">{sync.result}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div
                                className="sh-sync-link"
                                role="button"
                                tabIndex={0}
                                onClick={model.openSyncHistory}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        model.openSyncHistory();
                                    }
                                }}
                            >
                                View full sync history <span>→</span>
                            </div>
                        </section>

                        <section className="sh-panel sh-system-status">
                            <div className="sh-panel-heading">
                                <h2>System Status</h2>
                                <p>Current system health and performance.</p>
                            </div>

                            <div className="sh-health-list">
                                {HEALTH_ROWS.map((row) => (
                                    <div className="sh-health-row" key={row.name}>
                                        <span className="sh-health-dot" />
                                        <span className="sh-health-name">{row.name}</span>
                                        <span className="sh-health-value">{row.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="sh-all-operational">
                                <ShIcon name="check" />
                                All systems operational
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}