"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import VariantSectionEditor from "@/components/admin/VariantSectionEditor";
import HomepagePreview from "@/components/admin/HomepagePreview";
import type { HomepageData } from "@/types/homepage";
import BuildStatus from "@/components/admin/BuildStatus";
import { adminClient } from "@/lib/admin-sanity";

// Real data fetch from Sanity

export default function AdminHomepageEditor() {
  const [homepageData, setHomepageData] = useState<HomepageData | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch real data from Sanity
    const fetchData = async () => {
      try {
        const data = await adminClient.fetch(`*[_type == "homepage"][0]`);
        setHomepageData(data);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleHeroCarouselChange = (banners: any[]) => {
    setHomepageData(prev => ({
      ...prev,
      hero_carousel: {
        ...prev.hero_carousel,
        banners,
      },
    }));
  };

  const handleSectionChange = (sectionKey: string, updates: Partial<HomepageData["sections"][0]>) => {
    setHomepageData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section._key === sectionKey ? { ...section, ...updates } : section
      ),
    }));
  };

  const handleSectionItemsChange = (sectionKey: string, items: any[]) => {
    setHomepageData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section._key === sectionKey ? { ...section, items } : section
      ),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to Sanity
      await adminClient.patch(homepageData._id)
        .set(homepageData)
        .commit();
      
      alert("Homepage data saved successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving homepage data");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (confirm("Are you sure you want to publish these changes? This will trigger a build.")) {
      setIsSaving(true);
      try {
        // Publish to Sanity
        await adminClient.patch(homepageData._id)
          .set({ _updatedAt: new Date().toISOString() })
          .commit();
        
        // Trigger webhook
        await fetch('/api/admin/trigger-build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        alert("Published successfully! Build is starting...");
      } catch (error) {
        console.error("Error publishing:", error);
        alert("Error publishing changes");
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading homepage data...</p>
        </div>
      </div>
    );
  }

  if (!homepageData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Error loading homepage data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="bg-neutral-900 border border-neutral-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Homepage Editor</h1>
            <p className="text-sm text-zinc-400">Manage your homepage sections</p>
          </div>
          <div className="flex items-center gap-3">
            <BuildStatus />
            <button
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-on-secondary rounded-lg text-sm font-medium transition-colors"
            >
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={handlePublish}
              disabled={isSaving}
              className="px-4 py-2 bg-primary hover:brightness-75 disabled:opacity-50 text-on-primary rounded-lg text-sm font-medium transition-colors"
            >
              {isSaving ? "Publishing..." : "Publish & Build"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Carousel Editor */}
        <div className="mb-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="bg-neutral-800 px-6 py-4 border-b border-neutral-700">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Hero Carousel
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Full-width banner slides</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {homepageData.hero_carousel?.banners?.map((banner, index) => (
                  <div key={banner._key || index} className="relative h-48 rounded-lg overflow-hidden">
                    {banner.image ? (
                      <img
                        src={banner.image}
                        alt={banner.label || "Banner"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">{banner.label || "Banner"}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-3">
                      <div className="text-white text-sm font-medium">{banner.label || "Banner"}</div>
                      <div className="text-white/70 text-xs">{banner.link || "/"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section Editors */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white">Homepage Sections</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {homepageData.sections?.map((section) => (
              <motion.div
                key={section._key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
              >
                {/* Section Header */}
                <div
                  className="p-4 border-b border-neutral-700 cursor-pointer hover:bg-neutral-800 transition-colors"
                  onClick={() => setSelectedSection(
                    selectedSection === section._key ? null : section._key
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">{section.title || "Untitled Section"}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {section.variant} • {section.items?.length || 0} items
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-zinc-500 transition-transform duration-200" style={{ transform: selectedSection === section._key ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      chevron_down
                    </span>
                  </div>
                </div>

                {/* Section Editor */}
                {selectedSection === section._key && (
                  <div className="p-6 border-t border-neutral-700">
                    <VariantSectionEditor
                      variant={section.variant}
                      items={section.items || []}
                      onItemsChange={(items) => handleSectionItemsChange(section._key, items)}
                      title={section.title || ""}
                      subtitle={section.subtitle || ""}
                      onTitleChange={(title) => handleSectionChange(section._key, { title })}
                      onSubtitleChange={(subtitle) => handleSectionChange(section._key, { subtitle })}
                      onBgChange={(bg) => handleSectionChange(section._key, { bg })}
                      bg={section.bg}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Add Section Button */}
        <div className="mt-8">
          <button className="w-full py-3 border-2 border-dashed border-neutral-700 hover:border-neutral-600 text-neutral-400 hover:text-white rounded-lg transition-colors">
            <span className="material-symbols-outlined mr-2">add</span>
            Add New Section
          </button>
        </div>
      </main>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/95">
          <div className="h-full flex flex-col">
            {/* Preview Header */}
            <div className="bg-neutral-900 px-6 py-4 border-b border-neutral-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Homepage Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-hidden">
              <HomepagePreview data={homepageData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}