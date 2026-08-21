import type { SVGProps } from "react";

const PATHS: Record<string, React.ReactNode> = {
    close: <path d="m7 7 10 10M17 7 7 17" />,
    check: (
        <>
            <circle cx="12" cy="12" r="8" />
            <path d="m8.5 12 2.2 2.2 4.8-5" />
        </>
    ),
    info: (
        <>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 10v5M12 7.5v.2" />
        </>
    ),
    warning: (
        <>
            <path d="m12 3 9 17H3L12 3Z" />
            <path d="M12 9v4M12 16v.2" />
        </>
    ),
    error: (
        <>
            <circle cx="12" cy="12" r="8" />
            <path d="m9 9 6 6M15 9l-6 6" />
        </>
    ),
    download: (
        <>
            <path d="M12 3v11" />
            <path d="m8 10 4 4 4-4" />
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </>
    ),
    chevron: <path d="m7 9 5 5 5-5" />,
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
        </>
    ),
    refresh: (
        <>
            <path d="M20 11a8 8 0 0 0-14.9-3.9L4 9" />
            <path d="M4 4v5h5" />
            <path d="M4 13a8 8 0 0 0 14.9 3.9L20 15" />
            <path d="M20 20v-5h-5" />
        </>
    ),
    spinner: (
        <>
            <path d="M12 4a8 8 0 1 1-7.5 5.2" />
            <path d="M4 4v5h5" />
        </>
    ),
    search: (
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
        </>
    ),
    image: (
        <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8" cy="9" r="1.5" />
            <path d="m4 17 5-5 3 3 3-4 5 6" />
        </>
    ),
    link: (
        <>
            <path d="M10 13.5 8.5 15a3 3 0 0 0 4.2 4.2l2.1-2.1a3 3 0 0 0 0-4.2" />
            <path d="m14 10.5 1.5-1.5a3 3 0 0 0-4.2-4.2L9.2 6.9a3 3 0 0 0 0 4.2" />
            <path d="m8.5 15 7-7" />
        </>
    ),
    folder: (
        <>
            <path d="M3.5 6.5h6l1.5 2h9.5v10a2 2 0 0 1-2 2h-15Z" />
            <path d="M3.5 6.5v-.5a2 2 0 0 1 2-2h4l1.5 2" />
        </>
    ),
    rows: (
        <>
            <rect x="5" y="4" width="14" height="16" rx="2" />
            <path d="M8 8h8M8 12h8M8 16h5" />
        </>
    ),
    upload: (
        <>
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M5 20h14a2 2 0 0 0 2-2v-4" />
            <path d="M3 14v4a2 2 0 0 0 2 2" />
        </>
    ),
    database: (
        <>
            <ellipse cx="12" cy="6" rx="7" ry="3" />
            <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
            <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        </>
    ),
    bars: <path d="M5 19V8M10 19v-5M15 19V5M20 19v-9" />,
};

export function ShIcon({
    name,
    className,
    ...rest
}: { name: string } & SVGProps<SVGSVGElement>) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...rest}
        >
            {PATHS[name] ?? PATHS.info}
        </svg>
    );
}