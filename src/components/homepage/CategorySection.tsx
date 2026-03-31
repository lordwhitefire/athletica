import Link from "next/link";
import { CategoryPanel } from "@/types/homepage";

interface CategorySectionProps {
    panels: CategoryPanel[];
}

export default function CategorySection({ panels }: CategorySectionProps) {
    if (panels.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
            {panels.map((panel) => (
                <Link key={panel.id} href={panel.link} className="group block relative overflow-hidden rounded-lg" style={{ aspectRatio: "16/7" }}>
                    {panel.image ? (
                        <img src={panel.image} alt={panel.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${panel.gradient} flex items-end relative overflow-hidden`}>
                            <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                                <span className="text-9xl">{panel.emoji}</span>
                            </div>
                            <div className="absolute top-4 right-4">
                                <span className="text-5xl">{panel.emoji}</span>
                            </div>
                            {panel.badge && (
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                                        {panel.badge}
                                    </span>
                                </div>
                            )}
                            <div className="relative z-10 p-6  text-white w-full bg-gradient-to-t from-black via-black/40 to-transparent">
                                <h3 className="text-2xl relative left-4 bottom-4 font-black leading-tight">{panel.title}</h3>
                                <p className="text-sm  relative left-4  bottom-4 text-gray-300 mt-1">{panel.subtitle}</p>
                                <span className="inline-block mt-3 text-xs relative left-4 bottom-4 font-bold text-green-400 group-hover:text-green-300 transition-colors">
                                    Shop Now →
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="absolute inset-0 ring-0 group-hover:ring-2 group-hover:ring-green-500 rounded-lg transition-all duration-200 pointer-events-none" />
                </Link>
            ))}
        </div>
    );
}