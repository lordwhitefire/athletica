import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import { AuthShell } from "../signin/auth-view";
import { createAdminClient } from "@/lib/supabase/server";
import { hashToken } from "@/lib/auth/door-key";
import "../signin/signin.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign up | Athletica",
  description: "Join the Athletica family — premium football gear for real fans.",
  robots: { index: false, follow: false },
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80";

type InviteRow = {
  id: string;
  user_id: string | null;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  if (!code) {
    notFound();
  }

  const tokenHash = hashToken(code);

  // admin_access_keys isn't in the generated DB types yet — cast through any.
  const supabase = createAdminClient() as unknown as {
    from: (table: string) => AnyChain;
  };

  type AnyChain = {
    select: (cols: string) => AnyChain;
    eq: (col: string, val: string | number | null) => AnyChain;
    is: (col: string, val: null) => AnyChain;
    gt: (col: string, val: string) => AnyChain;
    maybeSingle: () => Promise<{ data: InviteRow | null; error: unknown }>;
  };

  // Lock #1: the invite code. Checked on the server, before the page is sent.
  // No code / wrong / expired / already used / revoked → 404.
  const { data: invite, error: findError } = await supabase
    .from('admin_access_keys')
    .select('id, user_id, expires_at, used_at, revoked_at')
    .eq('token_hash', tokenHash)
    .eq('kind', 'invite')
    .is('used_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (findError || !invite) {
    notFound();
  }

  return (
    <main
      className={`ath-signin-page ${inter.variable} ${montserrat.variable}`}
    >
      <AuthShell heroImage={HERO_IMAGE} view="signup" signupCode={code} />
    </main>
  );
}
