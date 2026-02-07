/**
 * INDEX PAGE — The Mock E-Commerce Store
 * 
 * Section ordering is now driven by the DECISION ENGINE's output
 * (result.sectionOrder), not hardcoded in the UI layer.
 * 
 * Smart Listener is initialized via requestIdleCallback (non-blocking)
 * and feeds semantic events into the Event Ledger for batched processing.
 */

import { Link } from "react-router-dom";
import { usePersonalization } from "@/hooks/use-personalization";
import { useBehaviorTracking } from "@/hooks/use-behavior-tracking";
import { useSmartListener } from "@/hooks/use-smart-listener";
import StoreNav from "@/components/StoreNav";
import HeroSection from "@/components/HeroSection";
import TrustBar from "@/components/TrustBar";
import ProductGrid from "@/components/ProductGrid";
import FunnelBanner from "@/components/FunnelBanner";
import DebugOverlay from "@/components/DebugOverlay";
import PersonaToggle from "@/components/PersonaToggle";
import type { SectionId } from "@/lib/personalization-engine";

const Index = () => {
  const { variant, result } = usePersonalization();
  const behavior = useBehaviorTracking(true);
  const smartListener = useSmartListener({
    enabled: true,
    listenerConfig: {
      variantId: result.intent,
      funnelStage: result.funnelStage,
    },
  });

  // §2.6: Section order comes from the ENGINE'S decision, not UI logic
  const sectionOrder = result.sectionOrder;

  const sections: Record<SectionId, React.ReactNode> = {
    trust: <TrustBar key="trust" />,
    products: <ProductGrid key="products" intent={result.intent} />,
    funnel: <FunnelBanner key="funnel" variant={variant} />,
  };

  return (
    <div className="min-h-screen bg-background">
      <StoreNav intent={result.intent} />
      <HeroSection variant={variant} />

      {/* §2.6: Reordered sections — order decided by personalization engine */}
      {sectionOrder.map((sectionId) => sections[sectionId])}

      <DebugOverlay result={result} behavior={behavior} smartListener={smartListener} />
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
            <span className="text-muted-foreground/60"> (funnel: {result.funnelStage})</span>
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
