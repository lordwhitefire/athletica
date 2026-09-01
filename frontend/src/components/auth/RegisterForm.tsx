"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/schemas/auth";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Form } from "@/components/ui/Form";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

function ConfirmationScreen({ email, onBack }: { email: string; onBack: () => void }) {
    return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6 mx-auto">
                    <span className="material-symbols-outlined text-4xl text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                </div>
                <h1 className="text-3xl font-black font-headline text-on-surface mb-3">Check your email</h1>
                <p className="text-on-surface-variant max-w-md mb-2">
                    We sent a confirmation link to <strong className="text-on-surface">{email}</strong>
                </p>
                <p className="text-on-surface-variant text-sm mb-10">Click the link to activate your account, then sign in.</p>
                <div className="flex flex-col gap-3 items-center">
                    <Link href="/login" className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors">
                        Sign In
                    </Link>
                    <button onClick={onBack} className="text-sm text-primary-container font-bold hover:text-primary transition-colors">
                        Use a different email
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RegisterForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
    const { register: authRegister } = useAuth();
    const router = useRouter();

    const methods = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    });

    const { handleSubmit, setError, watch, formState: { errors } } = methods;
    const password = watch("password");
    const confirmPassword = watch("confirmPassword");

    const passwordChecks = {
        minLength: (password?.length || 0) >= 6,
        hasMatch: (confirmPassword?.length || 0) > 0 && password === confirmPassword,
        hasMismatch: (confirmPassword?.length || 0) > 0 && password !== confirmPassword,
    };

    if (confirmedEmail) {
        return (
            <ConfirmationScreen
                email={confirmedEmail}
                onBack={() => setConfirmedEmail(null)}
            />
        );
    }

    async function onSubmit(data: RegisterInput) {
        const result = await authRegister(data.name, data.email, data.password);

        if (result.error) {
            if (result.error.fields) {
                for (const f of result.error.fields) {
                    setError(f.field as keyof RegisterInput, { message: f.message });
                }
            } else {
                setError("root", { message: result.error.message });
            }
            return;
        }

        if (result.data.needsEmailConfirmation) {
            setConfirmedEmail(data.email);
            return;
        }

        router.push("/");
    }

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                        <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center group-hover:bg-primary-container transition-colors">
                            <span className="text-on-primary font-black">A</span>
                        </div>
                        <span className="text-2xl font-black tracking-tight text-on-surface">athletica</span>
                    </Link>
                    <h1 className="text-2xl font-black text-on-surface">Create your account</h1>
                    <p className="text-on-surface-variant mt-1 text-sm">Join Athletica and start shopping</p>
                </div>

                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-8 border border-surface">
                    {errors.root && (
                        <div className="mb-4 p-4 bg-error-container border border-error-container text-on-error-container text-sm rounded flex items-start gap-3">
                            <span className="material-symbols-outlined text-[18px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                            <span>{errors.root.message}</span>
                        </div>
                    )}

                    <FormProvider {...methods}>
                        <Form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <Input label="Full name" type="text" placeholder="John Smith" registration={methods.register("name")} error={errors.name?.message} className="border-outline-variant focus:border-primary-container" />

                            <Input label="Email address" type="email" placeholder="you@example.com" registration={methods.register("email")} error={errors.email?.message} className="border-outline-variant focus:border-primary-container" />

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-1.5">Password</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        {...methods.register("password")}
                                        aria-invalid={!!errors.password}
                                        aria-describedby={errors.password ? "password-error" : undefined}
                                        placeholder="Password"
                                        className="w-full px-4 py-2.5 pr-10 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary-container text-sm transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                                        tabIndex={-1}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {showPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </button>
                                </div>
                                {errors.password && (
                                    <p id="password-error" className="text-xs text-error mt-1" role="alert">{errors.password.message}</p>
                                )}
                                {password && (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${passwordChecks.minLength ? "text-primary-container" : "text-on-surface-variant/50"}`}>
                                            {passwordChecks.minLength ? (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                    6+ characters
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">radio_button_unchecked</span>
                                                    6+ characters
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-on-surface mb-1.5">Confirm password</label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        {...methods.register("confirmPassword")}
                                        aria-invalid={!!errors.confirmPassword}
                                        aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                                        placeholder="Repeat your password"
                                        className="w-full px-4 py-2.5 pr-10 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary-container text-sm transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                                        tabIndex={-1}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {showConfirmPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p id="confirmPassword-error" className="text-xs text-error mt-1.5" role="alert">{errors.confirmPassword.message}</p>
                                )}
                                {!errors.confirmPassword && passwordChecks.hasMismatch && (
                                    <p className="text-xs text-error mt-1.5 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                                        Passwords do not match
                                    </p>
                                )}
                                {passwordChecks.hasMatch && (
                                    <p className="text-xs text-primary-container mt-1.5 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        Passwords match
                                    </p>
                                )}
                            </div>

                            <SubmitButton label="Create Account" />
                        </Form>
                    </FormProvider>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-on-surface-variant">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary-container font-bold hover:text-primary transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-on-surface-variant/60 mt-6">
                    By creating an account you agree to our{" "}
                    <Link href="/privacy-policy" className="hover:text-on-surface underline">Privacy Policy</Link>
                    {" "}and{" "}
                    <Link href="/terms" className="hover:text-on-surface underline">Terms of Service</Link>
                </p>
            </div>
        </div>
    );
}
