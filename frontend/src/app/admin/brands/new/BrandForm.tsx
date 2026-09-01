"use client";

import { useRouter } from "next/navigation";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { brandFormSchema, BrandFormData } from "@/lib/schemas/brand";
import { Form } from "@/components/ui/Form";
import AutoSuggest from "@/components/admin/AutoSuggest";
import { suggestBrands } from "@/lib/actions/suggestions";
import ImageSelector from "@/components/admin/ImageSelector";
import { logger } from "@/lib/logger";

export default function BrandForm({ initial, brandId }: { initial?: Record<string, unknown>; brandId?: string }) {
    const router = useRouter();

    const methods = useForm({
        resolver: zodResolver(brandFormSchema),
        defaultValues: {
            name: initial?.name as string || "",
            logo_asset: initial?.logo && typeof initial.logo === "object"
                ? ((initial.logo as Record<string, unknown>).asset as Record<string, unknown>)?._ref as string || ""
                : "",
        },
    });

    const { handleSubmit, setError, control, formState: { errors, isSubmitting } } = methods;

    async function onSubmit(data: BrandFormData) {
        try {
            const formData = new FormData();
            formData.set("name", data.name);
            formData.set("logo_asset", data.logo_asset || "");

            if (brandId) {
                const { updateBrand } = await import("@/lib/actions/brands");
                const result = await updateBrand(brandId, formData);
                if (result.error) {
                    if (result.error.fields) {
                        for (const f of result.error.fields) {
                            setError(f.field as keyof BrandFormData, { message: f.message });
                        }
                    } else {
                        alert(result.error.message);
                    }
                    return;
                }
            } else {
                const { createBrand } = await import("@/lib/actions/brands");
                const result = await createBrand(formData);
                if (result.error) {
                    if (result.error.fields) {
                        for (const f of result.error.fields) {
                            setError(f.field as keyof BrandFormData, { message: f.message });
                        }
                    } else {
                        alert(result.error.message);
                    }
                    return;
                }
            }
            router.push("/admin/brands");
            router.refresh();
        } catch (err) {
            logger.error(err, "BrandForm error");
            alert("Failed to save brand");
        }
    }

    return (
        <FormProvider {...methods}>
            <Form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                    <div>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <AutoSuggest
                                        name="name"
                                        label="Brand Name"
                                        value={field.value || ""}
                                        onChange={field.onChange}
                                        fetchSuggestions={suggestBrands}
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                    <Controller
                        name="logo_asset"
                        control={control}
                        render={({ field }) => (
                            <ImageSelector
                                name="logo_sel"
                                label="Brand Logo"
                                value={field.value || null}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </div>

                <div className="flex gap-3">
                    <button type="submit" disabled={isSubmitting} className="bg-primary hover:brightness-75 disabled:opacity-50 text-on-primary font-bold px-6 py-2.5 rounded transition-colors">
                        {isSubmitting ? "Saving..." : brandId ? "Update Brand" : "Create Brand"}
                    </button>
                    <button type="button" onClick={() => router.back()} className="bg-neutral-800 hover:bg-neutral-700 text-zinc-300 font-medium px-6 py-2.5 rounded transition-colors">
                        Cancel
                    </button>
                </div>
            </Form>
        </FormProvider>
    );
}
