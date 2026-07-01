"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HomepageData } from "@/types/homepage";

interface HomepagePreviewProps {
  data: HomepageData;
}

// Hero Carousel Component
function HeroCarousel({ banners }: { banners: HomepageData["hero_carousel"]["banners"] }) {
  return (
    <div className="relative w-full h-[60vh] overflow-hidden">
      {banners.map((banner, index) => (
        <div
          key={banner._key || index}
          className="absolute inset-0 flex items-center justify-center"
        >
          {banner.image ? (
            <Image
              src={banner.image}
              alt={banner.label}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          ) : (
            <div className={`w-full h-full ${banner.bg || "bg-gradient-to-r from-blue-500 to-purple-600"}`} />
          )}
          
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">{banner.label}</h1>
              <Link 
                href={banner.link || "/"} 
                className="inline-block bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      ))}
      
      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === 0 ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Grid Components
function Grid4Equal({ items }: { items: any[] }) {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item) => (
            <Link
              key={item._key}
              href={item.link || "/"}
              className={`group relative h-64 rounded-lg overflow-hidden ${item.bg || "bg-surface"} transition-transform hover:scale-105`}
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📷</div>
                    <div className={`text-lg font-medium ${item.textColor || "text-on-surface"}`}>
                      {item.label}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <span className={`text-lg font-medium ${item.textColor || "text-white"}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Asymmetric3_2({ items }: { items: any[] }) {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {items.map((item, index) => (
            <Link
              key={item._key}
              href={item.link || "/"}
              className={`relative ${index === 0 ? "lg:col-span-2" : "lg:col-span-1"} rounded-lg overflow-hidden group ${item.bg || "bg-zinc-900"} transition-transform hover:scale-[1.02]`}
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  className="object-cover"
                  sizes={index === 0 ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📷</div>
                    <div className={`text-xl font-medium ${item.textColor || "text-white"}`}>
                      {item.label}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className={`text-2xl font-bold ${item.textColor || "text-white"}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScrollBrands({ items }: { items: any[] }) {
  return (
    <section className="py-16 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {items.map((item) => (
            <Link
              key={item._key}
              href={item.link || "/"}
              className={`flex-shrink-0 w-64 h-32 ${item.bg || "bg-zinc-800"} rounded-lg overflow-hidden group transition-transform hover:scale-105`}
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  className="object-contain p-4"
                  sizes="256px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-medium ${item.textColor || "text-white"}`}>
                    {item.label}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section Renderer
function SectionRenderer({ section }: { section: any }) {
  switch (section.variant) {
    case "grid-4-equal":
      return <Grid4Equal items={section.items} />;
    case "asymmetric-3-2":
      return <Asymmetric3_2 items={section.items} />;
    case "scroll-brands":
      return <ScrollBrands items={section.items} />;
    // Add more variants as needed
    default:
      return (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-zinc-400">Unsupported variant: {section.variant}</p>
          </div>
        </section>
      );
  }
}

export default function HomepagePreview({ data }: HomepagePreviewProps) {
  const [currentSection, setCurrentSection] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Carousel */}
      <HeroCarousel banners={data.hero_carousel.banners} />

      {/* Navigation */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {data.sections.map((section, index) => (
              <button
                key={section._key}
                onClick={() => setCurrentSection(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  currentSection === index
                    ? "bg-primary text-on-primary"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div>
        {data.sections.map((section, index) => (
          <div
            key={section._key}
            className={`${index === currentSection ? "ring-2 ring-primary ring-offset-4" : ""}`}
          >
            <SectionRenderer section={section} />
          </div>
        ))}
      </div>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex gap-1 p-2">
          {data.sections.map((section, index) => (
            <button
              key={section._key}
              onClick={() => setCurrentSection(index)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentSection === index
                  ? "bg-primary text-on-primary"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}