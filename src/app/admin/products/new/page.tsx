import { createProduct } from "@/lib/actions/products";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
    return (
        <div>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-6">New Product</h1>
            <ProductForm action={createProduct} />
        </div>
    );
}
