import { Suspense } from "react";
import { InteractionProvider } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import MobileTopbar from "@/components/admin/dashboard-v2/MobileTopbar";
import { MediaLibraryInteractionLayer } from "@/components/admin/media-library/MediaLibraryInteractionLayer";
import { MediaLibraryPresentation } from "@/components/admin/media-library/MediaLibraryPresentation";
import { getMediaAssets } from "@/lib/actions/media";
import type { MediaAsset } from "@/components/admin/media-library/media-library.types";

interface SanityMediaAsset {
  _id?: string;
  url?: string;
  originalFilename?: string;
  _createdAt?: string;
  metadata?: { dimensions?: { width?: number; height?: number } | null } | null;
}

function toMediaAsset(raw: SanityMediaAsset): MediaAsset | null {
  if (!raw._id || !raw.url) return null;
  const filename = raw.originalFilename ?? raw._id;
  const ext = (filename.split(".").pop() ?? "").toUpperCase();
  const dims = raw.metadata?.dimensions;
  return {
    id: raw._id,
    filename,
    type: ["JPG", "PNG", "WEBP", "GIF", "AVIF"].includes(ext) ? ext : "JPG",
    dims: dims?.width && dims?.height ? `${dims.width} × ${dims.height}` : "—",
    url: raw.url,
    usageText: "Unused",
    used: false,
    sizeMb: 0,
    addedAt: raw._createdAt ?? new Date().toISOString(),
  };
}

function MediaError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-sm text-red-400 mb-2">Failed to load media library.</p>
      <p className="text-xs text-zinc-500 mb-3">{message}</p>
      <button
        type="button"
        onClick={retry}
        className="text-xs font-semibold text-[#b8e51f] underline hover:brightness-110"
      >
        Retry
      </button>
    </div>
  );
}

async function MediaBody() {
  const result = await getMediaAssets();

  if (result.error) {
    return (
      <MediaError
        message={result.error.message}
        retry={() => {}}
      />
    );
  }

  const assets: MediaAsset[] = (result.data as SanityMediaAsset[])
    .map(toMediaAsset)
    .filter((a): a is MediaAsset => a !== null);

  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-9 bg-neutral-800 rounded w-72" />
          <div className="h-16 bg-neutral-900 border border-neutral-800 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-square bg-neutral-900 border border-neutral-800 rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <MediaLibraryInteractionLayer initialAssets={assets}>
        <MediaLibraryPresentation />
      </MediaLibraryInteractionLayer>
    </Suspense>
  );
}

export default async function AdminMediaPage() {
  return (
    <InteractionProvider>
      <SpecSidebar />
      <MobileTopbar />
      <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64 max-[760px]:pt-14">
        <MediaBody />
      </div>
    </InteractionProvider>
  );
}