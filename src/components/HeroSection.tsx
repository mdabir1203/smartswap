import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContentVariant, IntentType } from "@/lib/personalization-engine";

import heroGaming from "@/assets/hero-gaming.jpg";
import heroProductivity from "@/assets/hero-productivity.jpg";
import heroBudget from "@/assets/hero-budget.jpg";
import heroDefault from "@/assets/hero-default.jpg";

/**
 * Image map: Maps the engine's heroImageKey to the actual imported asset.
 * Why static imports? Vite can optimize and hash these at build time,
 * ensuring cache-busted URLs in production.
 */
const HERO_IMAGES: Record<string, string> = {
  gaming: heroGaming,
  productivity: heroProductivity,
  budget: heroBudget,
  default: heroDefault,
};

/**
 * Intent-specific styles applied to the hero section.
 * These override CSS custom properties for the glow/accent effect.
 */
const INTENT_STYLES: Record<IntentType, { overlayGradient: string; accentText: string }> = {
  gaming: {
    overlayGradient: "from-[hsl(180,10%,4%)] via-[hsl(180,10%,4%)/85%] to-transparent",
    accentText: "text-gaming",
  },
  productivity: {
    overlayGradient: "from-[hsl(210,15%,6%)] via-[hsl(210,15%,6%)/85%] to-transparent",
    accentText: "text-productivity",
  },
  budget: {
    overlayGradient: "from-[hsl(155,10%,5%)] via-[hsl(155,10%,5%)/85%] to-transparent",
    accentText: "text-budget",
  },
  default: {
    overlayGradient: "from-[hsl(30,15%,4%)] via-[hsl(30,15%,4%)/85%] to-transparent",
    accentText: "text-primary",
  },
};

interface HeroSectionProps {
  variant: ContentVariant;
}

const HeroSection = ({ variant }: HeroSectionProps) => {
  const styles = INTENT_STYLES[variant.intent];
  const heroImage = HERO_IMAGES[variant.heroImageKey] || HERO_IMAGES.default;

  return (
    <section
      id="hero-container"
      className="relative min-h-[100vh] flex items-center overflow-hidden"
    >
      {/* Background Image with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={variant.intent}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <img
            src={heroImage}
            alt={`${variant.intent} monitor display`}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlay — Ensures text readability */}
      <div className={`absolute inset-0 z-10 bg-gradient-to-r ${styles.overlayGradient}`} />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 lg:px-8 pt-24 pb-16">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={variant.intent}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
            >
              {/* Intent Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
                style={{
                  background: `hsl(var(${variant.accentColor}) / 0.15)`,
                  border: `1px solid hsl(var(${variant.accentColor}) / 0.3)`,
                }}
              >
                <Sparkles className={`w-3.5 h-3.5 ${styles.accentText}`} />
                <span className={`text-xs font-medium tracking-wide ${styles.accentText}`}>
                  {variant.badgeText}
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold leading-[1.05] tracking-tight text-foreground mb-6"
              >
                {variant.headline}
              </motion.h1>

              {/* Subhead */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg lg:text-xl text-muted-foreground leading-relaxed mb-10 max-w-xl"
              >
                {variant.subhead}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  size="lg"
                  className="text-base font-semibold px-8 py-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all group"
                >
                  {variant.ctaText}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base font-medium px-8 py-6 rounded-xl border-border text-foreground hover:bg-secondary transition-all"
                >
                  {variant.ctaSecondary}
                </Button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom fade into content area */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
