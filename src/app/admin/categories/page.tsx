import { Suspense } from "react";
import { InteractionProvider } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import MobileTopbar from "@/components/admin/dashboard-v2/MobileTopbar";
import CategoryManagementInteractionLayer from "@/components/admin/category-management/CategoryManagementInteractionLayer";
import { getCategoriesAdmin } from "@/lib/actions/categories";
import { kebabCase } from "@/components/admin/category-management/category-management.interactions";

function CategoriesError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="p-6 space-y-4">
      <div className="rounded-[6px] border border-[#5a2a1d] bg-[#241310] px-3 py-2">
        <strong className="text-[#e4612b]">Could not load categories</strong>
        <p className="text-[10px] text-[#e4612b]">{message}</p>
        <button type="button" className="mt-1.5 text-[10px] font-semibold text-[#b8e51f] underline hover:brightness-110" onClick={retry}>
          Retry
        </button>
      </div>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

type CategoryNode = {
  id: string;
  name: string;
  count: string;
  status: "active" | "inactive";
  expanded?: boolean;
  children?: CategoryNode[];
};

async function buildCategoryTree(): Promise<CategoryNode[]> {
  const result = await getCategoriesAdmin();

  if (!result.data) {
    throw new Error(result.error?.message ?? "Could not load categories.");
  }

  const cats = result.data as Array<{
    id: string;
    slug: string;
    name: string;
    parent_id: string | null;
    productCount: number;
  }>;

  const countByParent = new Map<string | null, typeof cats>();
  for (const c of cats) {
    const key = c.parent_id;
    if (!countByParent.has(key)) countByParent.set(key, []);
    countByParent.get(key)!.push(c);
  }

  const build = (parentId: string | null): CategoryNode[] =>
    (countByParent.get(parentId) ?? [])
      .map((c): CategoryNode => ({
        id: c.id,
        name: c.name,
        count: formatCount(c.productCount),
        status: "active",
        children: build(c.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

  const children = build(null);

  // Categories whose parent chain is broken (missing parent, import
  // drift, cycles) never appear under any root — collect them into
  // an explicit "Unsorted" group so they stay visible and fixable.
  const reachable = new Set<string>();
  const collect = (nodes: CategoryNode[]) => {
    nodes.forEach((node) => {
      reachable.add(node.id);
      if (node.children) collect(node.children);
    });
  };
  collect(children);
  const orphans = cats.filter((c) => !reachable.has(c.id));
  const orphanIds = new Set(orphans.map((o) => o.id));
  const rootOrphanCats = orphans.filter((o) => !o.parent_id || !orphanIds.has(o.parent_id));
  const orphanRoots: CategoryNode[] = rootOrphanCats
    .map((c): CategoryNode => ({
      id: c.id,
      name: c.name,
      count: formatCount(c.productCount),
      status: "active",
      children: build(c.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  let topLevels = children;
  if (orphanRoots.length > 0) {
    topLevels = [
      ...children,
      {
        id: "unsorted",
        name: "Unsorted",
        count: formatCount(rootOrphanCats.reduce((sum, c) => sum + c.productCount, 0)),
        status: "active",
        expanded: true,
        children: orphanRoots,
      },
    ];
  }

  const totalProducts = cats.reduce((sum, c) => sum + c.productCount, 0);
  const nextTree: CategoryNode[] = [
    { id: "all", name: "All Categories", count: formatCount(totalProducts), status: "active", expanded: true, children: topLevels },
  ];
  return nextTree;
}

async function CategoriesBody() {
  let tree: CategoryNode[];
  try {
    tree = await buildCategoryTree();
  } catch (err) {
    return (
      <CategoriesError
        message={err instanceof Error ? err.message : "Could not load categories."}
        retry={() => {}}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-9 bg-neutral-800 rounded w-72" />
          <div className="h-16 bg-neutral-900 border border-neutral-800 rounded-lg" />
          <div className="h-40 bg-neutral-900 border border-neutral-800 rounded-lg" />
        </div>
      }
    >
      <CategoryManagementInteractionLayer initialTree={tree} />
    </Suspense>
  );
}

export default async function AdminCategoriesPage() {
  return (
    <InteractionProvider>
      <SpecSidebar />
      <MobileTopbar />
      <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64 max-[760px]:pt-14">
        <div className="p-4 md:p-6">
          <CategoriesBody />
        </div>
      </div>
    </InteractionProvider>
  );
}