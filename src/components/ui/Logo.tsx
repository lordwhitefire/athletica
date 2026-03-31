import Link from "next/link";

interface LogoProps {
    className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
    return (
        <Link
            href="/"
            className={`flex items-center gap-2 ${className}`}
        >
            {/* Icon mark */}
            <div className="w-8 h-8 bg-green-500 rounded-sm flex items-center justify-center">
                <span className="text-white font-black text-sm">A</span>
            </div>
            {/* Wordmark */}
            <span className="text-xl font-black tracking-tight text-gray-900">
                athletica
            </span>
        </Link>
    );
}