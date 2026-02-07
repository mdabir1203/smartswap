/**
 * ============================================================
 * TEMPLATE REGISTRY — "The Blueprint Catalog"
 * ============================================================
 * 
 * Defines a finite set of hero layout templates that map to 
 * visitor intents. Each template specifies:
 *   - Layout type (centered / split-screen / minimal)
 *   - Content slot definitions
 *   - Visual config (alignment, CTA style, image treatment)
 * 
 * This is a structural layer ABOVE the ContentVariant (which
 * holds the actual text/images). Templates define HOW content
 * is arranged; variants define WHAT content is shown.
 * ============================================================
 */

import type { IntentType, FunnelStage } from "./personalization-engine";

// ---------------------
// TEMPLATE TYPES
// ---------------------

export type TemplateLayoutType = "centered" | "split-screen" | "minimal";

export interface TemplateSlot {
  name: string;
  type: "image" | "text" | "cta" | "badge";
  required: boolean;
}

export interface HeroTemplate {
  id: string;
  name: string;
  layoutType: TemplateLayoutType;
  description: string;
  /** Content slots this template can render */
  slots: TemplateSlot[];
  /** Visual configuration */
  config: {
    contentAlignment: "left" | "center" | "right";
    imagePosition: "background" | "right" | "none";
    ctaStyle: "stacked" | "inline" | "single";
    showBadge: boolean;
    overlayOpacity: number;
  };
}

export interface TemplateMapping {
  intent: IntentType;
  templateId: string;
  funnelStage: FunnelStage;
  /** Priority — lower wins if multiple mappings match */
  priority: number;
}

// ---------------------
// TEMPLATE DEFINITIONS
// ---------------------

export const HERO_TEMPLATES: Record<string, HeroTemplate> = {
  hero_centered: {
    id: "hero_centered",
    name: "Hero Centered",
    layoutType: "centered",
    description: "Full-width background image with centered text overlay. High-impact, immersive. Best for emotional/aspirational intents.",
    slots: [
      { name: "hero_image", type: "image", required: true },
      { name: "headline", type: "text", required: true },
      { name: "subheadline", type: "text", required: true },
      { name: "cta_primary", type: "cta", required: true },
      { name: "cta_secondary", type: "cta", required: false },
      { name: "badge", type: "badge", required: false },
    ],
    config: {
      contentAlignment: "center",
      imagePosition: "background",
      ctaStyle: "inline",
      showBadge: true,
      overlayOpacity: 0.85,
    },
  },

  hero_split: {
    id: "hero_split",
    name: "Hero Split-Screen",
    layoutType: "split-screen",
    description: "50/50 content-image split. Text left, product image right. Best for comparison/professional intents.",
    slots: [
      { name: "hero_image", type: "image", required: true },
      { name: "headline", type: "text", required: true },
      { name: "subheadline", type: "text", required: true },
      { name: "cta_primary", type: "cta", required: true },
      { name: "cta_secondary", type: "cta", required: false },
      { name: "badge", type: "badge", required: false },
    ],
    config: {
      contentAlignment: "left",
      imagePosition: "right",
      ctaStyle: "stacked",
      showBadge: true,
      overlayOpacity: 0,
    },
  },

  hero_minimal: {
    id: "hero_minimal",
    name: "Hero Minimal",
    layoutType: "minimal",
    description: "Text-dominant with subtle background gradient. No hero image distraction. Best for deal/budget intents where the offer speaks louder.",
    slots: [
      { name: "headline", type: "text", required: true },
      { name: "subheadline", type: "text", required: true },
      { name: "cta_primary", type: "cta", required: true },
      { name: "badge", type: "badge", required: false },
    ],
    config: {
      contentAlignment: "left",
      imagePosition: "none",
      ctaStyle: "single",
      showBadge: true,
      overlayOpacity: 0,
    },
  },
};

// ---------------------
// INTENT → TEMPLATE MAPPING
// ---------------------

export const TEMPLATE_MAPPINGS: TemplateMapping[] = [
  // Gaming & Creative → Immersive centered layout (aspirational)
  { intent: "gaming",       templateId: "hero_centered",  funnelStage: "buy",     priority: 1 },
  { intent: "creative",     templateId: "hero_centered",  funnelStage: "explore", priority: 1 },

  // Productivity & Developer → Split-screen (informational, comparison)
  { intent: "productivity", templateId: "hero_split",     funnelStage: "compare", priority: 1 },
  { intent: "developer",    templateId: "hero_split",     funnelStage: "compare", priority: 1 },

  // Budget & Student → Minimal (deal-focused, text-first)
  { intent: "budget",       templateId: "hero_minimal",   funnelStage: "buy",     priority: 1 },
  { intent: "student",      templateId: "hero_minimal",   funnelStage: "explore", priority: 1 },

  // Default → Centered (safe, broad appeal)
  { intent: "default",      templateId: "hero_centered",  funnelStage: "explore", priority: 1 },
];

// ---------------------
// REGISTRY API
// ---------------------

/**
 * Resolve the correct template for a given intent.
 */
export function resolveTemplate(intent: IntentType): HeroTemplate {
  const mapping = TEMPLATE_MAPPINGS.find(m => m.intent === intent);
  if (!mapping) return HERO_TEMPLATES.hero_centered;
  return HERO_TEMPLATES[mapping.templateId] || HERO_TEMPLATES.hero_centered;
}

/**
 * Get the funnel stage for a given intent.
 */
export function resolveFunnelStage(intent: IntentType): FunnelStage {
  const mapping = TEMPLATE_MAPPINGS.find(m => m.intent === intent);
  return mapping?.funnelStage || "explore";
}

/**
 * Get the full mapping for a given intent.
 */
export function getTemplateMapping(intent: IntentType): TemplateMapping | undefined {
  return TEMPLATE_MAPPINGS.find(m => m.intent === intent);
}

/**
 * List all available templates.
 */
export function listTemplates(): HeroTemplate[] {
  return Object.values(HERO_TEMPLATES);
}

/**
 * Export as JSON (for external widget configuration).
 */
export function exportRegistryJSON(): string {
  return JSON.stringify({
    templates: HERO_TEMPLATES,
    mappings: TEMPLATE_MAPPINGS,
  }, null, 2);
}
