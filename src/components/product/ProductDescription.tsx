import { Product } from "@/types/product";

interface ProductDescriptionProps {
    product: Product;
}

export default function ProductDescription({ product }: ProductDescriptionProps) {
    const { description } = product;

    return (
        <div className="bg-surface-container-low -mx-6 px-6 py-24 mt-8">
            <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">

                {/* Left: Tagline + Intro + Benefits */}
                <div className="space-y-10">
                    <div>
                        <h2 className="text-4xl font-black font-headline tracking-tighter uppercase mb-6 leading-tight">
                            {description.tagline.split(".").map((part, i, arr) =>
                                i === arr.length - 2 ? (
                                    <span key={i}>
                                        {part}.{" "}
                                        <br />
                                        <span className="text-primary">{arr[arr.length - 1]}</span>
                                    </span>
                                ) : i < arr.length - 2 ? (
                                    <span key={i}>{part}. </span>
                                ) : null
                            )}
                            {/* Fallback if tagline has no period split */}
                            {!description.tagline.includes(".") && (
                                <span>{description.tagline}</span>
                            )}
                        </h2>
                        <p className="text-secondary text-lg leading-relaxed max-w-xl">
                            {description.intro}
                        </p>
                    </div>

                    {description.key_benefits.length > 0 && (
                        <div>
                            <h3 className="font-black uppercase tracking-widest text-xs mb-6 text-on-surface">
                                Key Performance Benefits
                            </h3>
                            <ul className="space-y-4">
                                {description.key_benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <span
                                            className="material-symbols-outlined text-primary mt-0.5"
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            check_circle
                                        </span>
                                        <div>
                                            <span className="font-bold block uppercase text-xs">
                                                {benefit}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right: Technical Specifications */}
                <div className="bg-surface-container-lowest p-10 border border-surface-container shadow-sm">
                    <h3 className="font-black uppercase tracking-widest text-xs mb-8 text-on-surface border-b border-surface-container pb-4">
                        Technical Specifications
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: "Brand", value: product.brand },
                            { label: "Model Line", value: product.model_line || "—" },
                            { label: "Surface", value: description.technical_details.sole_type },
                            { label: "Upper Material", value: description.technical_details.upper_material },
                            { label: "Adjustment", value: description.technical_details.adjustment },
                            { label: "Range", value: description.technical_details.range },
                            { label: "Gender", value: product.gender },
                            { label: "Primary Color", value: product.color },
                        ].map((row, i, arr) => (
                            <div
                                key={row.label}
                                className={`flex justify-between py-2 ${i < arr.length - 1
                                        ? "border-b border-surface-container/50"
                                        : ""
                                    }`}
                            >
                                <span className="text-secondary text-sm font-label uppercase">
                                    {row.label}
                                </span>
                                <span className="font-bold text-sm text-right">
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}