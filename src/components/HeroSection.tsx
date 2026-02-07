import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { ContentVariant, IntentType } from "@/lib/personalization-engine";
import { resolveTemplate, type HeroTemplate } from "@/lib/template-registry";

import heroGaming from "@/assets/hero-gaming.jpg";
import heroProductivity from "@/assets/hero-productivity.jpg";
import heroBudget from "@/assets/hero-budget.jpg";
import heroCreative from "@/assets/hero-creative.jpg";
import heroStudent from "@/assets/hero-student.jpg";
import heroDeveloper from "@/assets/hero-developer.jpg";
import heroDefault from "@/assets/hero-default.jpg";

const HERO_IMAGES: Record<string, string> = {
  gaming: heroGaming,
  productivity: heroProductivity,
  budget: heroBudget,
  creative: heroCreative,
  student: heroStudent,
  developer: heroDeveloper,
  default: heroDefault,
};

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
  creative: {
    overlayGradient: "from-[hsl(280,15%,5%)] via-[hsl(280,15%,5%)/85%] to-transparent",
    accentText: "text-creative",
  },
  student: {
    overlayGradient: "from-[hsl(25,15%,5%)] via-[hsl(25,15%,5%)/85%] to-transparent",
    accentText: "text-student",
  },
  developer: {
    overlayGradient: "from-[hsl(142,15%,4%)] via-[hsl(142,15%,4%)/85%] to-transparent",
    accentText: "text-developer",
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
  const template = resolveTemplate(variant.intent);

  // Render different layouts based on template type
  if (template.layoutType === "split-screen") {
    return <SplitScreenHero variant={variant} styles={styles} heroImage={heroImage} template={template} />;
  }

  if (template.layoutType === "minimal") {
    return <MinimalHero variant={variant} styles={styles} template={template} />;
  }

  return <CenteredHero variant={variant} styles={styles} heroImage={heroImage} template={template} />;
};

// =====================
// LAYOUT: CENTERED (immersive full-bleed background)
// =====================
const CenteredHero = ({ variant, styles, heroImage, template }: LayoutProps) => (
  <section id="hero-container" className="relative min-h-[100vh] flex items-center overflow-hidden">
    <AnimatePresence mode="wait">
      <motion.div
        key={variant.intent}
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        <img src={heroImage} alt={`${variant.intent} monitor display`} className="w-full h-full object-cover" loading="eager" />
      </motion.div>
    </AnimatePresence>

    <div className={`absolute inset-0 z-10 bg-gradient-to-r ${styles.overlayGradient}`} />
    <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-transparent to-transparent" />

    <div className={`relative z-20 container mx-auto px-4 lg:px-8 pt-24 pb-16 ${template.config.contentAlignment === "center" ? "text-center flex flex-col items-center" : ""}`}>
      <div className={template.config.contentAlignment === "center" ? "max-w-3xl" : "max-w-2xl"}>
        <HeroContent variant={variant} styles={styles} template={template} />
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-32 z-20 bg-gradient-to-t from-background to-transparent" />
  </section>
);

// =====================
// LAYOUT: SPLIT-SCREEN (text left, image right)
// =====================
const SplitScreenHero = ({ variant, styles, heroImage, template }: LayoutProps) => (
  <section id="hero-container" className="relative min-h-[100vh] flex items-center overflow-hidden bg-background">
    <div className="relative z-20 container mx-auto px-4 lg:px-8 pt-24 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Text Side */}
        <div className="order-2 lg:order-1">
          <HeroContent variant={variant} styles={styles} template={template} />
        </div>

        {/* Image Side */}
        <AnimatePresence mode="wait">
          <motion.div
            key={variant.intent}
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl">
              <img src={heroImage} alt={`${variant.intent} monitor display`} className="w-full h-full object-cover" loading="eager" />
              <div className={`absolute inset-0 bg-gradient-to-t from-background/30 to-transparent`} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  </section>
);

// =====================
// LAYOUT: MINIMAL (text-dominant, no hero image)
// =====================
const MinimalHero = ({ variant, styles, template }: Omit<LayoutProps, "heroImage">) => (
  <section id="hero-container" className="relative min-h-[85vh] flex items-center overflow-hidden bg-background">
    {/* Subtle gradient backdrop */}
    <div className={`absolute inset-0 z-0 opacity-30 bg-gradient-to-br ${styles.overlayGradient}`} />

    <div className="relative z-20 container mx-auto px-4 lg:px-8 pt-24 pb-16">
      <div className="max-w-2xl">
        <HeroContent variant={variant} styles={styles} template={template} />
      </div>
    </div>
  </section>
);

// =====================
// SHARED: Hero Content (badge + headline + subhead + CTAs)
// =====================
interface HeroContentProps {
  variant: ContentVariant;
  styles: { overlayGradient: string; accentText: string };
  template: HeroTemplate;
}

const HeroContent = ({ variant, styles, template }: HeroContentProps) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={variant.intent}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      {/* Intent Badge */}
      {template.config.showBadge && (
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
      )}

      {/* Funnel Stage Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-3"
      >
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
          {variant.funnelStage === "buy" ? "🛒 Ready to Buy" : variant.funnelStage === "compare" ? "🔍 Compare & Decide" : "🌍 Explore & Discover"}
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

      {/* CTAs with link targets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`flex ${template.config.ctaStyle === "stacked" ? "flex-col" : "flex-col sm:flex-row"} gap-4`}
      >
        <Button
          asChild
          size="lg"
          className="text-base font-semibold px-8 py-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all group"
        >
          <Link to={variant.ctaLink}>
            {variant.ctaText}
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
        {template.config.ctaStyle !== "single" && (
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-base font-medium px-8 py-6 rounded-xl border-border text-foreground hover:bg-secondary transition-all"
          >
            <Link to={variant.ctaSecondaryLink}>
              {variant.ctaSecondary}
            </Link>
          </Button>
        )}
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// =====================
// TYPES
// =====================
interface LayoutProps {
  variant: ContentVariant;
  styles: { overlayGradient: string; accentText: string };
  heroImage: string;
  template: HeroTemplate;
}

export default HeroSection;
