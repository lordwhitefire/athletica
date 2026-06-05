import { getBrandByIdAdmin } from "@/lib/actions/brands";
import { notFound } from "next/navigation";
import BrandForm from "../../new/BrandForm";

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await getBrandByIdAdmin(id);
  if (!brand) notFound();

  return (
    <div>
      <h1 className="text-2xl font-black uppercase tracking-tight mb-6">Edit Brand</h1>
      <BrandForm brandId={id} initial={brand} />
    </div>
  );
}
