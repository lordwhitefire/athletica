import Link from "next/link";
import { getMainCategoryHref } from "@/lib/getNavigation";

export default async function NotFound() {
    const mainHref = await getMainCategoryHref();
    return (
        <div className="min-h-[70vh] bg-surface flex flex-col items-center justify-center text-center px-4 py-24">
            <div className="w-20 h-20 bg-primary rounded-sm flex items-center justify-center mb-8">
                <span className="text-on-primary text-3xl font-black">A</span>
            </div>
            <h1 className="text-8xl font-black font-headline text-primary tracking-tighter">404</h1>
            <h2 className="text-2xl font-black text-on-surface mt-4 mb-2">Page Not Found</h2>
            <p className="text-on-surface-variant max-w-md mb-10">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <div className="flex gap-4">
                <Link
                    href="/"
                    className="px-8 py-3.5 bg-primary text-on-primary font-black rounded hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                    Back to Home
                </Link>
                <Link
                    href={mainHref}
                    className="px-8 py-3.5 border border-outline-variant text-on-surface font-bold rounded hover:border-primary hover:text-primary transition-colors"
                >
                    Shop Football Boots
                </Link>
            </div>
        </div>
    );
}
