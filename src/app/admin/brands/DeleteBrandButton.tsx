"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteBrand } from "@/lib/actions/brands";

export default function DeleteBrandButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this brand?")) return;
    setDeleting(true);
    await deleteBrand(id);
    router.refresh();
  }

  return (
    <button type="button" onClick={handleDelete} disabled={deleting}
      className="text-zinc-500 hover:text-red-500 disabled:text-zinc-700 text-xs font-bold uppercase tracking-wider transition-colors">
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
