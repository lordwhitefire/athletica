"use client";

import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/schemas/auth";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Form } from "@/components/ui/Form";
import { adminLogin } from "@/lib/actions/admin-auth";

export default function AdminLoginPage() {
    const router = useRouter();

    const methods = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const { handleSubmit, setError, formState: { errors } } = methods;

    async function onSubmit(data: LoginInput) {
        const result = await adminLogin(data.email, data.password);

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

        router.push("/admin");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950">
            <div className="w-full max-w-md p-8">
                <div className="text-center mb-10">
                    <div className="bg-zinc-900 text-white w-fit px-3 py-1.5 mx-auto mb-4">
                        <span className="text-lg font-black italic tracking-tighter">AT</span>
                    </div>
                    <h1 className="text-white text-2xl font-black uppercase tracking-tight">Admin Login</h1>
                </div>

                <FormProvider {...methods}>
                    <Form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input label="Email" type="email" placeholder="admin@example.com" registration={methods.register("email")} error={errors.email?.message} className="bg-zinc-800 border-zinc-700 text-white focus:border-primary placeholder:text-zinc-500" />
                        <Input label="Password" type="password" registration={methods.register("password")} error={errors.password?.message} className="bg-zinc-800 border-zinc-700 text-white focus:border-primary" />

                        {errors.root && (
                            <p className="text-red-500 text-sm">{errors.root.message}</p>
                        )}

                        <SubmitButton label="Sign In" />
                    </Form>
                </FormProvider>
            </div>
        </div>
    );
}
