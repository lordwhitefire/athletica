"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, CheckoutInput } from "@/lib/schemas/checkout";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Form } from "@/components/ui/Form";
import { useCart } from "@/context/CartContext";

export default function CheckoutForm({ mainCategoryHref }: { mainCategoryHref: string }) {
    const { cart } = useCart();
    const [submitted, setSubmitted] = useState(false);

    const methods = useForm({
        resolver: zodResolver(checkoutSchema),
        defaultValues: { country: "United States" },
    });

    const { handleSubmit } = methods;

    function onSubmit(_data: CheckoutInput) {
        setSubmitted(true);
    }

    if (cart.items.length === 0 && !submitted) {
        return (
            <div className="min-h-[60vh] bg-surface flex flex-col items-center justify-center text-center px-4">
                <span className="material-symbols-outlined text-6xl text-surface-container-highest mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>
                    shopping_cart
                </span>
                <h1 className="text-2xl font-black text-on-surface mb-2">Your cart is empty</h1>
                <p className="text-on-surface-variant mb-8">Add some products before checking out.</p>
                <Link href={mainCategoryHref} className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors">
                    Shop Football Boots
                </Link>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-[60vh] bg-surface flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
                <h1 className="text-3xl font-black font-headline text-on-surface mb-2">Order Placed!</h1>
                <p className="text-on-surface-variant mb-8 max-w-md">
                    Thank you for your order. You will receive a confirmation email shortly.
                </p>
                <Link href="/" className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-6xl mx-auto px-4 py-10">
                <h1 className="text-3xl font-black font-headline text-on-surface mb-10">Checkout</h1>

                <FormProvider {...methods}>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                            <div className="lg:col-span-3 space-y-6">
                                <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface">
                                    <h2 className="font-bold text-on-surface text-lg mb-6">Shipping Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <Input label="Full name" type="text" registration={methods.register("fullName")} error={methods.formState.errors.fullName?.message} className="border-outline-variant focus:border-primary" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Input label="Email" type="email" registration={methods.register("email")} error={methods.formState.errors.email?.message} className="border-outline-variant focus:border-primary" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Input label="Address" type="text" registration={methods.register("address")} error={methods.formState.errors.address?.message} className="border-outline-variant focus:border-primary" />
                                        </div>
                                        <div>
                                            <Input label="City" type="text" registration={methods.register("city")} error={methods.formState.errors.city?.message} className="border-outline-variant focus:border-primary" />
                                        </div>
                                        <div>
                                            <Input label="Postal code" type="text" registration={methods.register("postalCode")} error={methods.formState.errors.postalCode?.message} className="border-outline-variant focus:border-primary" />
                                        </div>
                                        <div>
                                            <Input label="Country" type="text" registration={methods.register("country")} error={methods.formState.errors.country?.message} className="border-outline-variant focus:border-primary" />
                                        </div>
                                        <div>
                                            <Input label="Phone" type="tel" registration={methods.register("phone")} error={methods.formState.errors.phone?.message} className="border-outline-variant focus:border-primary" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface">
                                    <h2 className="font-bold text-on-surface text-lg mb-6">Payment</h2>
                                    <p className="text-sm text-on-surface-variant">Payment integration coming soon. Your card will not be charged yet.</p>
                                    <div className="mt-4 p-4 bg-surface-container rounded text-sm text-on-surface-variant flex items-center gap-3">
                                        <span className="material-symbols-outlined">lock</span>
                                        <span>This is a demo — no real payment will be processed.</span>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface sticky top-24">
                                    <h2 className="font-bold text-on-surface text-lg mb-4">Order Summary</h2>

                                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                        {cart.items.map((item) => (
                                            <div key={`${item.product.id}-${item.selectedSize}`} className="flex justify-between text-sm">
                                                <span className="text-on-surface-variant truncate mr-2">
                                                    {item.product.model} x{item.quantity}
                                                </span>
                                                <span className="text-on-surface flex-shrink-0">
                                                    {item.product.price.currency} {(item.product.price.current * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-surface pt-4 mb-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-on-surface-variant">Subtotal</span>
                                            <span className="font-bold text-on-surface">EUR {cart.totalPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-on-surface-variant">Shipping</span>
                                            <span className="text-on-surface-variant">Calculated at checkout</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-surface pt-4 mb-6">
                                        <div className="flex justify-between">
                                            <span className="font-black text-on-surface">Total</span>
                                            <span className="font-black text-xl text-on-surface">EUR {cart.totalPrice.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <SubmitButton label="Place Order" />
                                </div>
                            </div>
                        </div>
                    </Form>
                </FormProvider>
            </div>
        </div>
    );
}
