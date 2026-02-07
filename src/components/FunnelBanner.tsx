/**
 * FUNNEL CTA BANNER — Intent-aware promotional section
 * 
 * Renders different promotional content based on the detected funnel stage:
 *   - Buy: Urgency-driven with countdown/limited stock
 *   - Compare: Feature comparison table prompt
 *   - Explore: Educational content / quiz prompt
 * 
 * This demonstrates section-level personalization beyond just the hero.
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Timer, BarChart3, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FunnelStage, ContentVariant } from "@/lib/personalization-engine";

interface FunnelBannerProps {
  variant: ContentVariant;
}

const FUNNEL_CONTENT: Record<FunnelStage, {
  icon: React.ElementType;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  accent: string;
  urgencyBadge?: string;
}> = {
  buy: {
    icon: Timer,
    title: "Limited Time Offer",
    description: "Free 3-year extended warranty on all monitors ordered today. Plus free expedited shipping.",
    ctaText: "Claim Offer",
    ctaLink: "/collections/deals",
    accent: "bg-budget/10 border-budget/20 text-budget",
    urgencyBadge: "Ends in 4h 23m",
  },
  compare: {
    icon: BarChart3,
    title: "Side-by-Side Comparison",
    description: "Not sure which monitor fits your workflow? Compare specs, prices, and reviews across our entire catalog.",
    ctaText: "Open Comparison Tool",
    ctaLink: "/compare",
    accent: "bg-productivity/10 border-productivity/20 text-productivity",
  },
  explore: {
    icon: Compass,
    title: "Find Your Perfect Monitor",
    description: "Answer 4 quick questions and our AI will recommend the ideal monitor for your use case, budget, and desk setup.",
    ctaText: "Take the Quiz",
    ctaLink: "/quiz",
    accent: "bg-primary/10 border-primary/20 text-primary",
  },
};

const FunnelBanner = ({ variant }: FunnelBannerProps) => {
  const funnel = FUNNEL_CONTENT[variant.funnelStage];
  const Icon = funnel.icon;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`relative rounded-2xl border p-8 lg:p-10 overflow-hidden ${funnel.accent}`}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-current opacity-[0.03] -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-current/10 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-display font-bold text-foreground">
                  {funnel.title}
                </h3>
                {funnel.urgencyBadge && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold uppercase animate-pulse">
                    <Timer className="w-3 h-3" />
                    {funnel.urgencyBadge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                {funnel.description}
              </p>
            </div>

            <Button
              asChild
              className="rounded-xl px-6 bg-primary text-primary-foreground hover:opacity-90 group shrink-0"
            >
              <Link to={funnel.ctaLink}>
                {funnel.ctaText}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Funnel stage indicator */}
          <div className="mt-6 pt-4 border-t border-current/10 flex items-center gap-3">
            <Sparkles className="w-3.5 h-3.5 opacity-60" />
            <p className="text-[10px] font-mono opacity-60 uppercase tracking-wider">
              Funnel stage: {variant.funnelStage} · Personalized for {variant.intent} intent
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FunnelBanner;
