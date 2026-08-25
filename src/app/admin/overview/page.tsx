import { getDashboardOverview } from "@/lib/actions/get-dashboard-overview";
import { InteractionProvider } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import OverviewTopbar from "@/components/admin/dashboard-v2/OverviewTopbar";
import InteractionLayer from "@/components/admin/dashboard-v2/InteractionLayer";
import KpiCard from "@/components/admin/dashboard-v2/KpiCard";
import ClicksChart from "@/components/admin/dashboard-v2/ClicksChart";
import TopProducts from "@/components/admin/dashboard-v2/TopProducts";
import ActivityFeed from "@/components/admin/dashboard-v2/ActivityFeed";
import TasksPanel from "@/components/admin/dashboard-v2/TasksPanel";
import CategoryDistribution from "@/components/admin/dashboard-v2/CategoryDistribution";

function pctOf(n: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((n / total) * 1000) / 10}%`;
}

function OverviewError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-sm text-red-400 mb-2">Failed to load dashboard.</p>
      <p className="text-xs text-zinc-500 mb-3">{message}</p>
      <button
        type="button"
        data-testid="overview-retry"
        onClick={retry}
        className="text-xs font-semibold text-[#b8e51f] underline hover:brightness-110"
      >
        Retry
      </button>
    </div>
  );
}

async function OverviewBody() {
  const result = await getDashboardOverview();

  if (result.error) {
    return (
      <OverviewError
        message={result.error.message}
        retry={() => {}}
      />
    );
  }

  const d = result.data!;
  const totalVersions = d.counts.products + d.counts.drafts;
  const thisMonth =
    d.counts.createdThisMonth > 0 ? `↑ ${d.counts.createdThisMonth} this month` : "0 this month";

  return (
    <>
      <div className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
          <KpiCard icon="inventory_2" title="Total Products" value={d.counts.products} note={thisMonth} tone="lime" href="/admin/products" />
          <KpiCard icon="check_circle" title="Active Products" value={d.counts.active} note={`${pctOf(d.counts.active, totalVersions)} of total`} tone="green" href="/admin/products" />
          <KpiCard icon="link_off" title="Missing Amazon ASIN" value={d.quality.missingAsin} note={`${pctOf(d.quality.missingAsin, d.counts.products)} of total`} tone="orange" href="/admin/products" />
          <KpiCard icon="image_not_supported" title="Missing Images" value={d.quality.missingImages} note={`${pctOf(d.quality.missingImages, d.counts.products)} of total`} tone="orange" href="/admin/products" />
          <KpiCard icon="folder_off" title="Missing Categories" value={d.quality.missingCategories} note={`${pctOf(d.quality.missingCategories, d.counts.products)} of total`} tone="yellow" href="/admin/products" />
          <KpiCard icon="north_east" title="Total Amazon Clicks" value={d.clicks.total} note="0% vs last 7 days" tone="blue" href="/admin/products" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ClicksChart thisWeek={d.clicks.thisWeek} lastWeek={d.clicks.lastWeek} />
          <TopProducts products={d.recentProducts} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ActivityFeed />
          <TasksPanel
            quality={{ ...d.quality, unpublished: d.counts.drafts }}
            items={d.issueItems}
          />
          <CategoryDistribution categories={d.categories} total={d.counts.products} />
        </div>
      </div>
      <InteractionLayer data={d} />
    </>
  );
}

export default async function OverviewDashboard() {
  return (
    <InteractionProvider>
      <SpecSidebar />
      <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64">
        <OverviewTopbar />
        <OverviewBody />
      </div>
    </InteractionProvider>
  );
}