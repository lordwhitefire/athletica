"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Form } from "@/components/ui/Form";
import { createClient } from "@/lib/supabase/client";

const forgotSchema = z.object({
    email: z.string().email("Enter a valid email address."),
});

type ForgotInput = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState("");

    const methods = useForm<ForgotInput>({
        resolver: zodResolver(forgotSchema),
    });

    const { handleSubmit, setError, formState: { errors } } = methods;

    async function onSubmit(data: ForgotInput) {
        const supabase = createClient();
        const { error: resetError } =
            await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/login`,
            });

        if (resetError) {
            setError("root", { message: resetError.message });
            return;
        }

        setEmail(data.email);
        setSent(true);
    }

    if (sent) {
        return (
            <div className="min-h-[60vh] bg-surface flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6">
                    <span
                        className="material-symbols-outlined text-4xl text-on-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        mail
                    </span>
                </div>
                <h1 className="text-3xl font-black font-headline text-on-surface mb-3">
                    Check your email
                </h1>
                <p className="text-on-surface-variant max-w-md mb-2">
                    We sent a password reset link to{" "}
                    <strong className="text-on-surface">{email}</strong>
                </p>
                <p className="text-on-surface-variant text-sm mb-10">
                    If you don&apos;t see it, check your spam folder.
                </p>
                <Link
                    href="/login"
                    className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                    Back to Sign In
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 mb-6 group"
                    >
                        <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center group-hover:bg-primary-container transition-colors">
                            <span className="text-on-primary font-black">A</span>
                        </div>
                        <span className="text-2xl font-black tracking-tight text-on-surface">
                            athletica
                        </span>
                    </Link>
                    <h1 className="text-2xl font-black text-on-surface">
                        Forgot password?
                    </h1>
                    <p className="text-on-surface-variant mt-1 text-sm">
                        Enter your email and we&apos;ll send you a reset link.
                    </p>
                </div>

                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-8 border border-surface">
                    {errors.root && (
                        <div className="mb-4 p-4 bg-error-container border border-error-container text-on-error-container text-sm rounded flex items-start gap-3">
                            <span
                                className="material-symbols-outlined text-[18px] mt-0.5"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                error
                            </span>
                            <span>{errors.root.message}</span>
                        </div>
                    )}

                    <FormProvider {...methods}>
                        <Form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <Input label="Email address" type="email" placeholder="you@example.com" registration={methods.register("email")} error={errors.email?.message} className="border-outline-variant focus:border-primary" />
                            <SubmitButton label="Send Reset Link" />
                        </Form>
                    </FormProvider>
                    <div className="mt-6 text-center">
                        <Link
                            href="/login"
                            className="text-sm text-primary font-bold hover:text-primary-container transition-colors"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
