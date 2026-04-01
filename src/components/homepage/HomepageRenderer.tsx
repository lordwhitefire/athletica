"use client";

import { Product } from "@/types/product";
import ProductCarousel from "@/components/product/ProductCarousel";
import CategoryGridSection from "@/components/homepage/CategorySection";

interface HomepageRendererProps {
    adidasElite?: Product[];
    nikeMercurial?: Product[];
    pumaFuture?: Product[];
    newBalanceSpeed?: Product[];
    predatorElite?: Product[];
    speedBoots?: Product[];
    agBoots?: Product[];
    fgBoots?: Product[];
    goalkeeperEssentials?: Product[];
    matchdayEssentials?: Product[];
    nikePhantomsGX?: Product[];
    adidasPredatorElite?: Product[];
    trainingEssentials?: Product[];
    budgetBoots?: Product[];
    pumaSpeed?: Product[];
    nikeSpeed?: Product[];
    eliteGear?: Product[];
    underHundred?: Product[];
}

export default function HomepageRenderer({
    adidasElite = [],
    nikeMercurial = [],
    pumaFuture = [],
    newBalanceSpeed = [],
    predatorElite = [],
    speedBoots = [],
    agBoots = [],
    fgBoots = [],
    goalkeeperEssentials = [],
    matchdayEssentials = [],
    nikePhantomsGX = [],
    adidasPredatorElite = [],
    trainingEssentials = [],
    budgetBoots = [],
    pumaSpeed = [],
    nikeSpeed = [],
    eliteGear = [],
    underHundred = [],
}: HomepageRendererProps) {
    return (
        <div>
            {/* ── 1. CATEGORY CAROUSEL 1 — Ground Type ── */}
            <CategoryGridSection
                title="Shop by Surface"
                variant="grid-4-equal"
                viewAllHref="/en/football-boots"
                viewAllLabel="View All"
                items={[
                    { label: "FG", href: "/en/fg-football-boots" },
                    { label: "AG", href: "/en/ag-football-boots" },
                    { label: "TF", href: "/en/tf-football-boots" },
                    { label: "SG", href: "/en/sg-football-boots" },
                ]}
            />

            {/* ── 2. PRODUCT CAROUSEL 1 — Adidas Elite ── */}
            <div className="bg-surface-container-low">
                <ProductCarousel
                    title="Adidas Elite"
                    subtitle="Top-tier adidas football boots"
                    products={adidasElite}
                    link="/en/adidas-football-boots"
                    linkLabel="View All Adidas"
                />
            </div>

            {/* ── 3. PRODUCT CAROUSEL 2 — Nike Mercurial ── */}
            <div className="bg-surface">
                <ProductCarousel
                    title="Nike Mercurial"
                    subtitle="Speed redefined"
                    products={nikeMercurial}
                    link="/en/nike-mercurial-football-boots"
                    linkLabel="View All Mercurial"
                />
            </div>

            {/* ── 4. CATEGORY CAROUSEL 2 — The Titans (Brands) ── */}
            <CategoryGridSection
                title="The Titans"
                variant="scroll-brands"
                bg="bg-surface"
                items={[
                    { label: "ADIDAS", href: "/en/adidas-football-boots", bg: "bg-black" },
                    { label: "NIKE", href: "/en/nike-football-boots", bg: "bg-primary" },
                    { label: "PUMA", href: "/en/puma-football-boots", bg: "bg-neutral-800" },
                    { label: "NEW BALANCE", href: "/en/new-balance-football-boots", bg: "bg-neutral-200", textColor: "text-neutral-900" },
                ]}
            />

            {/* ── 5. PRODUCT CAROUSEL 3 — Puma Future ── */}
            <div className="bg-surface-container-low">
                <ProductCarousel
                    title="Puma Future"
                    subtitle="Customizable NETFIT performance"
                    products={pumaFuture}
                    link="/en/puma-future-football-boots"
                    linkLabel="View All Puma Future"
                />
            </div>

            {/* ── 6. PRODUCT CAROUSEL 4 — New Balance Speed ── */}
            <div className="bg-surface">
                <ProductCarousel
                    title="New Balance Speed"
                    subtitle="Furon, Tekela and 442"
                    products={newBalanceSpeed}
                    link="/en/new-balance-football-boots"
                    linkLabel="View All New Balance"
                />
            </div>

            {/* ── 7. CATEGORY CAROUSEL 3 — Collections (dark tiles) ── */}
            <CategoryGridSection
                title="The Collections"
                variant="grid-tiles-dark"
                bg="bg-neutral-900"
                items={[
                    { label: "PREDATOR", href: "/en/adidas-predator-football-boots" },
                    { label: "PHANTOM", href: "/en/nike-phantom-football-boots" },
                    { label: "X SPEED", href: "/en/adidas-x-football-boots" },
                    { label: "MERCURIAL", href: "/en/nike-mercurial-football-boots" },
                ]}
            />

            {/* ── 8. PRODUCT CAROUSEL 5 — Predator Elite ── */}
            <div className="bg-surface-container-high">
                <ProductCarousel
                    title="Predator Elite"
                    subtitle="Dominate with control"
                    products={predatorElite}
                    link="/en/adidas-predator-football-boots"
                    linkLabel="View All Predator"
                />
            </div>

            {/* ── 9. PRODUCT CAROUSEL 6 — Speed Boots ── */}
            <div className="bg-surface">
                <ProductCarousel
                    title="Speed Boots"
                    subtitle="Nike Air Zoom · Adidas X Crazyfast · Puma Ultra"
                    products={speedBoots}
                    link="/en/football-boots"
                    linkLabel="View All Speed Boots"
                />
            </div>

            {/* ── 10. CATEGORY CAROUSEL 4 — Surface Pro (bordered tiles) ── */}
            <CategoryGridSection
                title="Surface Pro"
                variant="grid-3-bordered"
                bg="bg-surface"
                items={[
                    { label: "Natural Grass", href: "/en/fg-football-boots", bg: "bg-neutral-100", accent: "border-l-8 border-primary" },
                    { label: "Artificial Turf", href: "/en/ag-football-boots", bg: "bg-neutral-200", accent: "border-l-8 border-primary" },
                    { label: "Hard Ground", href: "/en/mg-football-boots", bg: "bg-neutral-300", accent: "border-l-8 border-primary" },
                ]}
            />

            {/* ── 11. PRODUCT CAROUSEL 7 — Artificial Ground ── */}
            <div className="bg-surface-container-lowest">
                <ProductCarousel
                    title="Artificial Ground Boots"
                    subtitle="Engineered for AG surfaces"
                    products={agBoots}
                    link="/en/ag-football-boots"
                    linkLabel="Shop AG Range"
                />
            </div>

            {/* ── 12. PRODUCT CAROUSEL 8 — Firm Ground ── */}
            <div className="bg-surface">
                <ProductCarousel
                    title="Firm Ground Boots"
                    subtitle="Built for natural grass"
                    products={fgBoots}
                    link="/en/fg-football-boots"
                    linkLabel="Shop FG Range"
                />
            </div>

            {/* ── 13. CATEGORY CAROUSEL 5 — Performance Gear (red scroll) ── */}
            <CategoryGridSection
                title="Performance Gear"
                variant="scroll-categories"
                bg="bg-primary"
                items={[
                    { label: "Gloves", href: "/en/goalkeeper-gloves", accent: "border-white", textColor: "text-white" },
                    { label: "Shin Guards", href: "/en/shin-guards", accent: "border-white", textColor: "text-white" },
                    { label: "Match Balls", href: "/en/footballs", accent: "border-white", textColor: "text-white" },
                    { label: "Training Vests", href: "/en/training-wear", accent: "border-white", textColor: "text-white" },
                ]}
            />

            {/* ── 14. PRODUCT CAROUSEL 9 — Goalkeeper Essentials ── */}
            <div className="bg-surface">
                <ProductCarousel
                    title="Goalkeeper Essentials"
                    subtitle="Gloves, gear and more"
                    products={goalkeeperEssentials}
                    link="/en/goalkeeper-gloves"
                    linkLabel="View All Gloves"
                />
            </div>

            {/* ── 15. PRODUCT CAROUSEL 10 — Matchday Essentials ── */}
            <div className="bg-surface-container-low">
                <ProductCarousel
                    title="Matchday Essentials"
                    subtitle="Balls, socks, shin guards"
                    products={matchdayEssentials}
                    link="/en/football-boots"
                    linkLabel="View All"
                />
            </div>

            {/* ── 16. CATEGORY SECTION 1 — Asymmetric 3+2 ── */}
            <CategoryGridSection
                title="Featured Collections"
                variant="asymmetric-3-2"
                bg="bg-surface"
                items={[
                    { label: "Adidas Predator", href: "/en/adidas-predator-football-boots" },
                    { label: "Nike Phantom", href: "/en/nike-phantom-football-boots", bg: "bg-primary" },
                ]}
            />

            {/* ── 17. PRODUCT CAROUSEL 11 — Nike Phantom GX ── */}
            <div className="bg-surface">
                <ProductCarousel
                    title="Nike Phantom GX"
                    subtitle="Grip and traction technology"
                    products={nikePhantomsGX}
                    link="/en/nike-phantom-gx-football-boots"
                    linkLabel="View All Phantom GX"
                />
            </div>

            {/* ── 18. PRODUCT CAROUSEL 12 — Adidas Predator Elite ── */}
            <div className="bg-surface-container-low">
                <ProductCarousel
                    title="Adidas Predator Elite"
                    subtitle="FT · LL · Laced"
                    products={adidasPredatorElite}
                    link="/en/adidas-predator-football-boots"
                    linkLabel="View All Predator Elite"
                />
            </div>

            {/* ── 19. CATEGORY SECTION 2 — Split 1/3 + 2/3 ── */}
            <CategoryGridSection
                title="Gear Up"
                variant="split-1-2"
                bg="bg-surface"
                items={[
                    { label: "GK Gloves", href: "/en/goalkeeper-gloves", bg: "bg-black" },
                    { label: "Training Gear", href: "/en/training-wear", bg: "bg-primary" },
                ]}
            />

            {/* ── 20. PRODUCT CAROUSEL 13 — Training Essentials ── */}
            <div className="bg-surface">
                <ProductCarousel
                    title="Training Essentials"
                    subtitle="Pants, tops, jackets"
                    products={trainingEssentials}
                    link="/en/training-wear"
                    linkLabel="View All Training"
                />
            </div>

            {/* ── 21. PRODUCT CAROUSEL 14 — Budget Boots ── */}
            <div className="bg-surface-container-low">
                <ProductCarousel
                    title="Budget Boots"
                    subtitle="High performance, lower price"
                    products={budgetBoots}
                    link="/en/football-boots"
                    linkLabel="View All"
                />
            </div>

            {/* ── 22. CATEGORY SECTION 3 — Asymmetric 3+2 ── */}
            <CategoryGridSection
                title="Speed Machines"
                variant="asymmetric-3-2"
                bg="bg-surface"
                items={[
                    { label: "Puma Future", href: "/en/puma-future-football-boots" },
                    { label: "Mercurial Superfly", href: "/en/nike-mercurial-superfly-football-boots", bg: "bg-neutral-900" },
                ]}
            />

            {/* ── 23. PRODUCT CAROUSEL 15 — Puma Speed ── */}
            <div className="bg-surface">
                <ProductCarousel
                    title="Puma Speed Boots"
                    subtitle="Ultra Ultimate · Ultra Pro · Ultra Match"
                    products={pumaSpeed}
                    link="/en/puma-ultra-football-boots"
                    linkLabel="View All Puma Ultra"
                />
            </div>

            {/* ── 24. PRODUCT CAROUSEL 16 — Nike Speed ── */}
            <div className="bg-surface-container-high">
                <ProductCarousel
                    title="Nike Speed Boots"
                    subtitle="Air Zoom Mercurial collection"
                    products={nikeSpeed}
                    link="/en/nike-mercurial-football-boots"
                    linkLabel="View All Nike Speed"
                />
            </div>

            {/* ── 25. CATEGORY SECTION 4 — 2-col thick border accent ── */}
            <CategoryGridSection
                title="Signature Silos"
                variant="asymmetric-2-split"
                bg="bg-surface"
                items={[
                    { label: "X Crazyfast", href: "/en/adidas-x-football-boots", accent: "border-r-[24px] border-primary" },
                    { label: "Puma King", href: "/en/puma-king-football-boots", accent: "border-l-[24px] border-black", bg: "bg-primary/30" },
                ]}
            />

            {/* ── 26. PRODUCT CAROUSEL 17 — Elite Performance Gear ── */}
            <div className="bg-surface">
                <ProductCarousel
                    title="Elite Performance Gear"
                    subtitle="GPS trackers, recovery systems and more"
                    products={eliteGear}
                    link="/en/football-boots"
                    linkLabel="View All"
                />
            </div>

            {/* ── 27. CATEGORY SECTION 5 — Stacked banners ── */}
            <CategoryGridSection
                title="Don't Miss"
                variant="stacked-banners"
                bg="bg-surface"
                items={[
                    { label: "Premium Boots", href: "/en/football-boots", bg: "bg-black", height: "h-48" },
                    { label: "Sale — Up to 50%", href: "/en/football-boots", bg: "bg-primary", height: "h-80" },
                ]}
            />

            {/* ── 28. PRODUCT CAROUSEL 18 — Under €100 Deals ── */}
            <div className="bg-neutral-900">
                <ProductCarousel
                    title="Under €100 Deals"
                    subtitle="Vapor 15 Academy · Predator League · Future Match"
                    products={underHundred}
                    link="/en/football-boots"
                    linkLabel="Shop All Deals"
                />
            </div>
        </div>
    );
}