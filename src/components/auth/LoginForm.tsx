"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/schemas/auth";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Form } from "@/components/ui/Form";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const methods = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const { handleSubmit, setError, formState: { errors } } = methods;

    async function onSubmit(data: LoginInput) {
        const result = await login(data.email, data.password);

        if (result.error) {
            if (result.error.fields) {
                for (const f of result.error.fields) {
                    setError(f.field as keyof LoginInput, { message: f.message });
                }
            } else {
                setError("root", { message: result.error.message });
            }
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
                        <span className="text-2xl font-black tracking-tight text-on-surface">
                            athletica
                        </span>
                    </Link>
                    <h1 className="text-2xl font-black text-on-surface">Welcome back</h1>
                    <p className="text-on-surface-variant mt-1 text-sm">Sign in to your account</p>
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
                            </div>

                            <div className="flex items-center justify-end">
                                <Link href="/forgot-password" className="text-xs font-bold text-primary-container hover:text-primary transition-colors">
                                    Forgot password?
                                </Link>
                            </div>

                            <SubmitButton label="Sign In" />
                        </Form>
                    </FormProvider>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-on-surface-variant">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-primary-container font-bold hover:text-primary transition-colors">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-on-surface-variant/60 mt-6">
                    By signing in you agree to our{" "}
                    <Link href="/privacy-policy" className="hover:text-on-surface underline">Privacy Policy</Link>
                    {" "}and{" "}
                    <Link href="/terms" className="hover:text-on-surface underline">Terms of Service</Link>
                </p>
            </div>
        </div>
    );
}
