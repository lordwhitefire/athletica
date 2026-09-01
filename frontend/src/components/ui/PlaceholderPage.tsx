import Link from "next/link";

interface PlaceholderPageProps {
    title: string;
    description: string;
    icon: string;
}

export default function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
    return (
        <div className="min-h-[60vh] bg-surface flex flex-col items-center justify-center text-center px-4 py-24">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                </span>
            </div>
            <h1 className="text-3xl font-black font-headline text-on-surface mb-3">{title}</h1>
            <p className="text-on-surface-variant max-w-md mb-10">{description}</p>
            <Link
                href="/"
                className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
                Back to Home
            </Link>
        </div>
    );
}
