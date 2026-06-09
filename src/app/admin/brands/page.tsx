import { getAllBrandsAdmin } from "@/lib/actions/brands";
import DeleteBrandButton from "./DeleteBrandButton";
import Link from "next/link";
import { urlFor } from "@/lib/sanity";
import type { SanityImageSource } from "@sanity/image-url";

export const dynamic = "force-dynamic";

function brandLogoUrl(logo: unknown): string | null {
  if (!logo || typeof logo !== "object") return null;
  try {
    return urlFor(logo as SanityImageSource).width(48).height(48).url();
  } catch {
    return null;
  }
}

export default async function AdminBrandsPage() {
  const brandsResult = await getAllBrandsAdmin();
  const brands = brandsResult.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tight">Brands</h1>
        <Link href="/admin/brands/new" className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded transition-colors flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Brand
        </Link>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-800">
            <tr className="text-zinc-400 uppercase tracking-wider text-xs">
              <th className="text-left p-3 font-medium w-12">Logo</th>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {(brands as Record<string, unknown>[]).map((b) => {
              const logoUrl = brandLogoUrl(b.logo);
              return (
                <tr key={b._id as string} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="p-3">
                    {logoUrl ? (
                      <img src={logoUrl} alt={b.name as string} className="w-8 h-8 object-contain rounded" />
                    ) : (
                      <div className="w-8 h-8 bg-neutral-800 rounded flex items-center justify-center text-zinc-600 text-[10px]">—</div>
                    )}
                  </td>
                  <td className="p-3 font-medium">{b.name as string}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/brands/${b._id}/edit`} className="text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-wider transition-colors">
                        Edit
                      </Link>
                      <DeleteBrandButton id={b._id as string} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {brands.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-zinc-500">
                  No brands found. Create your first brand.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


