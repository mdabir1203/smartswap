/**
 * INDEX PAGE — The Mock E-Commerce Store
 * 
 * This is the "Store" that the personalization widget operates on.
 * It simulates a real Shopify/Webflow monitor store with:
 *   - Dynamic hero (swapped by the AI engine)
 *   - Trust bar (social proof)
 *   - Product grid (sorted by detected intent)
 *   - Debug overlay (SMB owner trust-builder)
 */

import { Link } from "react-router-dom";
import { usePersonalization } from "@/hooks/use-personalization";
import StoreNav from "@/components/StoreNav";
import HeroSection from "@/components/HeroSection";
import TrustBar from "@/components/TrustBar";
import ProductGrid from "@/components/ProductGrid";
import DebugOverlay from "@/components/DebugOverlay";

const Index = () => {
  const { variant, result } = usePersonalization();

  return (
    <div className="min-h-screen bg-background">
      <StoreNav intent={result.intent} />
      <HeroSection variant={variant} />
      <TrustBar />
      <ProductGrid intent={result.intent} />
      <DebugOverlay result={result} />

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
