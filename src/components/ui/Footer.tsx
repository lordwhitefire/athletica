import Link from "next/link";

const footerLinks = {
    Store: [
        { label: "Football Boots", href: "/football-boots" },
        { label: "Goalkeeper Gloves", href: "/goalkeeper-gloves" },
        { label: "Other Products", href: "/other-products" },
    ],
    Account: [
        { label: "My Account", href: "/account" },
        { label: "Order Status", href: "/orders" },
        { label: "Returns", href: "/returns" },
    ],
    Support: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Settings", href: "/cookies" },
    ],
};

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-zinc-900 w-full pt-16 pb-8">

            {/* Main grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 max-w-screen-2xl mx-auto font-body text-sm tracking-wide">

                {/* Brand column */}
                <div className="md:col-span-1">
                    <Link href="/">
                        <div className="text-3xl font-black text-white italic font-headline mb-4">
                            Athletica
                        </div>
                    </Link>
                    <p className="text-zinc-400 mb-6 leading-relaxed">
                        Premium equipment for the professional athlete. Engineered for peak performance and unparalleled style.
                    </p>
                    <div className="flex gap-4">
                        <a
                            href="#"
                            aria-label="Website"
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">public</span>
                        </a>
                        <a
                            href="#"
                            aria-label="Email"
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">mail</span>
                        </a>
                    </div>
                </div>

                {/* Link columns */}
                {Object.entries(footerLinks).map(([title, links]) => (
                    <div key={title}>
                        <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">
                            {title}
                        </h4>
                        <ul className="space-y-4">
                            {links.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-zinc-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Bottom bar */}
            <div className="max-w-screen-2xl mx-auto px-8 pt-16 border-t border-zinc-800 mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">
                <div>© {year} Athletica Performance. Engineered for Excellence.</div>
                <div className="flex gap-8">
                    <span>Fast Global Shipping</span>
                    <span>Secure Payments</span>
                    <span>Elite Service</span>
                </div>
            </div>
        </footer>
    );
}