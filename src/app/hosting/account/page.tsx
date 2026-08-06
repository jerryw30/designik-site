import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentCustomer } from "@/lib/customer-auth";
import { AccountAuth } from "./account-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account — Designik Hosting",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const customer = await currentCustomer();
  if (customer) redirect("/hosting/dashboard");
  const { next } = await searchParams;
  // Only allow same-site continue targets.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/hosting/dashboard";

  return (
    <main className="flex min-h-screen flex-col bg-blush-100/30 px-5 py-10">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <Link href="/hosting" className="mb-8 text-center font-display text-[20px] font-bold uppercase tracking-wide text-wine-500">
          Designik <span className="text-black/40">Hosting</span>
        </Link>
        <AccountAuth next={target} />
        <p className="mt-6 text-center font-sans text-[13px] text-black/50">
          <Link href="/hosting" className="underline hover:text-wine-500">← Back to plans</Link>
        </p>
      </div>
    </main>
  );
}
