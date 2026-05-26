import { getProductByIdAdmin } from "@/lib/actions/products";
import ProductForm from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProductByIdAdmin(id);

    if (!product) notFound();

    return (
        <div>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-6">Edit Product</h1>
            <ProductForm productId={id} initial={product} action={async () => {}} />
        </div>
    );
}
