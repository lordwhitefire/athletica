import Link from "next/link";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className="py-3">
            <ol className="flex items-center gap-1 flex-wrap">
                <li>
                    <Link
                        href="/"
                        className="text-sm text-gray-500 hover:text-green-500 transition-colors"
                    >
                        Home
                    </Link>
                </li>

                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <li key={index} className="flex items-center gap-1">
                            <span className="text-gray-300 text-sm">/</span>
                            {isLast || !item.href ? (
                                <span className="text-sm text-gray-900 font-medium">
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    href={item.href}
                                    className="text-sm text-gray-500 hover:text-green-500 transition-colors"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}