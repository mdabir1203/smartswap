/**
 * INDEX PAGE — The Mock E-Commerce Store
 * 
 * This is the "Store" that the personalization widget operates on.
 * It simulates a real Shopify/Webflow monitor store with:
 *   - Dynamic hero (swapped by the AI engine)
 *   - Trust bar (social proof)
 *   - Product grid (sorted by detected intent)
 *   - Funnel-stage CTA banner (Buy / Compare / Explore)
 *   - Section reordering based on intent
 *   - Debug overlay (SMB owner trust-builder)
 *   - Persona toggle (manual intent switcher)
 *   - Behavior tracking (scroll/click in first 5s)
 */

import { Link } from "react-router-dom";
import { usePersonalization } from "@/hooks/use-personalization";
import { useBehaviorTracking } from "@/hooks/use-behavior-tracking";
import StoreNav from "@/components/StoreNav";
import HeroSection from "@/components/HeroSection";
import TrustBar from "@/components/TrustBar";
import ProductGrid from "@/components/ProductGrid";
import FunnelBanner from "@/components/FunnelBanner";
import DebugOverlay from "@/components/DebugOverlay";
import PersonaToggle from "@/components/PersonaToggle";
import type { FunnelStage } from "@/lib/personalization-engine";

/**
 * SECTION REORDERING LOGIC
 * 
 * Different funnel stages prioritize different sections:
 *   - Buy:     Products first (they're ready to purchase), then trust, then funnel CTA
 *   - Compare: Funnel banner first (comparison tool), then products, then trust
 *   - Explore: Trust first (build confidence), then funnel CTA (quiz), then products
 */
type SectionId = "trust" | "products" | "funnel";

const SECTION_ORDER: Record<FunnelStage, SectionId[]> = {
  buy:     ["products", "trust", "funnel"],
  compare: ["funnel", "products", "trust"],
  explore: ["trust", "funnel", "products"],
};

const Index = () => {
  const { variant, result } = usePersonalization();
  const behavior = useBehaviorTracking(true);

  const sectionOrder = SECTION_ORDER[variant.funnelStage] || SECTION_ORDER.explore;

  const sections: Record<SectionId, React.ReactNode> = {
    trust: <TrustBar key="trust" />,
    products: <ProductGrid key="products" intent={result.intent} />,
    funnel: <FunnelBanner key="funnel" variant={variant} />,
  };

  return (
    <div className="min-h-screen bg-background">
      <StoreNav intent={result.intent} />
      <HeroSection variant={variant} />

      {/* Reordered sections based on funnel stage */}
      {sectionOrder.map((sectionId) => sections[sectionId])}

      <DebugOverlay result={result} behavior={behavior} />
      <PersonaToggle />

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 PixelVue Monitors — AI Personalization Layer Demo
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Try: <code className="font-mono text-primary">?utm_campaign=gaming</code> · 
            <code className="font-mono text-creative"> ?ref=dribbble</code> · 
            <code className="font-mono text-developer"> ?ref=github</code> · 
            <code className="font-mono text-student"> ?q=student</code> · 
            <code className="font-mono text-budget"> ?q=cheap</code>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Section order: <code className="font-mono text-primary">{sectionOrder.join(" → ")}</code>
            <span className="text-muted-foreground/60"> (funnel: {variant.funnelStage})</span>
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            <Link to="/integrate" className="text-primary hover:underline">
              View Integration Guide →
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
