import Link from "next/link";

const footerLinks = {
    "Football Boots": [
        { label: "All Football Boots", href: "/football-boots" },
        { label: "adidas Football Boots", href: "/adidas-football-boots" },
        { label: "Nike Football Boots", href: "/nike-football-boots" },
        { label: "Puma Football Boots", href: "/puma-football-boots" },
        { label: "FG Boots", href: "/fg-football-boots" },
        { label: "AG Boots", href: "/ag-football-boots" },
    ],
    "Goalkeeper Gloves": [
        { label: "All Goalkeeper Gloves", href: "/goalkeeper-gloves" },
        { label: "adidas Gloves", href: "/adidas-goalkeeper-gloves" },
        { label: "Nike Gloves", href: "/nike-goalkeeper-gloves" },
        { label: "Puma Gloves", href: "/puma-goalkeeper-gloves" },
    ],
    "Other Products": [
        { label: "Footballs", href: "/footballs" },
        { label: "Shin Guards", href: "/shin-guards" },
        { label: "Training Wear", href: "/training-wear" },
        { label: "Futsal Shoes", href: "/futsal-shoes" },
    ],
    "My Account": [
        { label: "Login", href: "/login" },
        { label: "Register", href: "/register" },
        { label: "My Cart", href: "/cart" },
    ],
};

const socialLinks = [
    { label: "f", name: "Facebook" },
    { label: "ig", name: "Instagram" },
    { label: "x", name: "Twitter" },
];

export default function Footer() {
    const year = new Date().getFullYear();
    const legalLinks = ["Privacy Policy", "Terms of Service", "Cookie Policy"];

    return (
        <footer className="bg-gray-900 text-gray-300 mt-16">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    <div className="col-span-2 md:col-span-4 lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-500 rounded-sm flex items-center justify-center">
                                <span className="text-white font-black text-sm">A</span>
                            </div>
                            <span className="text-xl font-black tracking-tight text-white">athletica</span>
                        </Link>
                        <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                            The ultimate destination for football gear. Boots, gloves, balls and more from the world top brands.
                        </p>
                        <div className="flex gap-3 mt-6">
                            {socialLinks.map((s) => (
                                <a key={s.name} href="#" aria-label={s.name} className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center hover:bg-green-500 transition-colors">
                                    <span className="text-xs font-bold">{s.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">{title}</h3>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-sm text-gray-400 hover:text-green-400 transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-800">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">{year} Athletica. All rights reserved.</p>
                    <div className="flex gap-4">
                        {legalLinks.map((item) => (
                            <a key={item} href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">{item}</a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}