import { Product } from "@/types/product";

interface ProductDescriptionProps {
    product: Product;
}

export default function ProductDescription({ product }: ProductDescriptionProps) {
    const { description } = product;

    return (
        <div className="border-t border-gray-100 pt-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-lg font-black text-gray-900 mb-2">
                        {description.tagline}
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                        {description.intro}
                    </p>

                    {description.key_benefits.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                                Key Benefits
                            </h3>
                            <ul className="space-y-2">
                                {description.key_benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                                            ✓
                                        </span>
                                        <span className="text-sm text-gray-600">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Technical Details
                    </h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="px-4 py-3 font-medium text-gray-500 w-1/2">
                                        Brand
                                    </td>
                                    <td className="px-4 py-3 text-gray-900">{product.brand}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="px-4 py-3 font-medium text-gray-500">
                                        Model Line
                                    </td>
                                    <td className="px-4 py-3 text-gray-900">
                                        {product.model_line || "—"}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="px-4 py-3 font-medium text-gray-500">
                                        Surface
                                    </td>
                                    <td className="px-4 py-3 text-gray-900">
                                        {description.technical_details.sole_type}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="px-4 py-3 font-medium text-gray-500">
                                        Upper Material
                                    </td>
                                    <td className="px-4 py-3 text-gray-900">
                                        {description.technical_details.upper_material}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="px-4 py-3 font-medium text-gray-500">
                                        Adjustment
                                    </td>
                                    <td className="px-4 py-3 text-gray-900">
                                        {description.technical_details.adjustment}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="px-4 py-3 font-medium text-gray-500">
                                        Range
                                    </td>
                                    <td className="px-4 py-3 text-gray-900">
                                        {description.technical_details.range}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="px-4 py-3 font-medium text-gray-500">
                                        Gender
                                    </td>
                                    <td className="px-4 py-3 text-gray-900">{product.gender}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-medium text-gray-500">
                                        Color
                                    </td>
                                    <td className="px-4 py-3 text-gray-900">{product.color}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}