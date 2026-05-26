import { getAllProductsAdmin } from "@/lib/actions/products";
import Link from "next/link";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const { q } = await searchParams;
    const products = await getAllProductsAdmin(q);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black uppercase tracking-tight">Products</h1>
                <Link href="/admin/products/new" className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded transition-colors flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    New Product
                </Link>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-800">
                        <tr className="text-zinc-400 uppercase tracking-wider text-xs">
                            <th className="text-left p-3 font-medium">ID</th>
                            <th className="text-left p-3 font-medium">Model</th>
                            <th className="text-left p-3 font-medium">Brand</th>
                            <th className="text-left p-3 font-medium">Category</th>
                            <th className="text-left p-3 font-medium">Price</th>
                            <th className="text-right p-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {products.map((p: Record<string, unknown>) => (
                            <tr key={p._id as string} className="hover:bg-neutral-800/50 transition-colors">
                                <td className="p-3 text-zinc-400 font-mono text-xs">{p.id as string}</td>
                                <td className="p-3 font-medium">{p.model as string}</td>
                                <td className="p-3 text-zinc-300">{p.brand as string}</td>
                                <td className="p-3 text-zinc-400">{p.category as string}</td>
                                <td className="p-3 text-zinc-300">
                                    {p.price && typeof p.price === "object" && "current" in (p.price as Record<string, unknown>)
                                        ? `${(p.price as Record<string, string>).currency || "EUR"} ${(p.price as Record<string, number>).current?.toFixed(2)}`
                                        : "-"}
                                </td>
                                <td className="p-3 text-right">
                                    <Link
                                        href={`/admin/products/${p._id}/edit`}
                                        className="text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-wider transition-colors"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-zinc-500">
                                    No products found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
