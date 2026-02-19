/**
 * THIRD-PARTY DATA INTEGRATION DEMO
 *
 * Full control panel for store owners to:
 *   1. Choose their data source profile (Shopify tags / Ad audiences)
 *   2. Manually configure template settings with smart suggestions
 *   3. See a live production-accurate preview of the final decision
 *
 * All suggestions and defaults are derived from the actual
 * personalization engine, template registry, and content variants.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Target, Tag, Users, Zap, ChevronRight,
  ArrowRight, BarChart3, Shield, Settings, Lightbulb,
  Monitor, Eye, Code, LayoutTemplate, Sparkles, RefreshCw,
  CheckCircle, Info, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CONTENT_VARIANTS,
  type IntentType,
  type UserSignal,
} from "@/lib/personalization-engine";
import {
  HERO_TEMPLATES,
  TEMPLATE_MAPPINGS,
  type HeroTemplate,
} from "@/lib/template-registry";

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface ThirdPartyProfile {
  id: string;
  name: string;
  icon: React.ElementType;
  source: "shopify" | "ad_platform";
  description: string;
  scriptAttr: string; // the actual data-* attribute value
  tags: string[];
  signals: UserSignal[];
  expectedIntent: IntentType;
  expectedFunnel: "buy" | "compare" | "explore";
}

interface TemplateSuggestion {
  field: string;
  current: string;
  suggested: string;
  reason: string;
  confidence: "high" | "medium" | "low";
}

// ─────────────────────────────────────────────────────────────────
// PROFILE PRESETS (Shopify + Ad Platforms)
// ─────────────────────────────────────────────────────────────────

const PROFILES: ThirdPartyProfile[] = [
  {
    id: "vip_returning",
    name: "VIP Returning Customer",
    icon: ShoppingBag,
    source: "shopify",
    description: "Shopify tag: 'vip' · order_count: 12 · lifetime_value: $2,400+",
    scriptAttr: 'data-customer-tags="vip,returning,high_ltv" data-customer-orders="12"',
    tags: ["vip", "returning", "high_ltv"],
    signals: [
      { source: "shopify_tag", value: "vip", intentMatch: "gaming", weight: 0.70 },
      { source: "shopify_meta", value: "order_count:12", intentMatch: "gaming", weight: 0.60 },
      { source: "shopify_meta", value: "high_ltv", intentMatch: "creative", weight: 0.50 },
    ],
    expectedIntent: "gaming",
    expectedFunnel: "buy",
  },
  {
    id: "student_verified",
    name: "Verified Student",
    icon: Tag,
    source: "shopify",
    description: "Shopify tag: 'student-verified' via UNiDAYS · first_order: true",
    scriptAttr: 'data-customer-tags="student-verified,first_order,age_18_24"',
    tags: ["student-verified", "first_order", "age_18_24"],
    signals: [
      { source: "shopify_tag", value: "student-verified", intentMatch: "student", weight: 0.80 },
      { source: "shopify_meta", value: "first_order", intentMatch: "student", weight: 0.40 },
    ],
    expectedIntent: "student",
    expectedFunnel: "explore",
  },
  {
    id: "wholesale_buyer",
    name: "Wholesale / Bulk Buyer",
    icon: Users,
    source: "shopify",
    description: "Shopify tag: 'wholesale' · avg_order_qty: 25+ · B2B account",
    scriptAttr: 'data-customer-tags="wholesale,b2b,bulk" data-customer-orders="25"',
    tags: ["wholesale", "b2b", "bulk"],
    signals: [
      { source: "shopify_tag", value: "wholesale", intentMatch: "budget", weight: 0.65 },
      { source: "shopify_tag", value: "b2b", intentMatch: "productivity", weight: 0.55 },
      { source: "shopify_meta", value: "avg_qty:25", intentMatch: "budget", weight: 0.45 },
    ],
    expectedIntent: "budget",
    expectedFunnel: "buy",
  },
  {
    id: "retargeting_gaming",
    name: "Gaming Retarget (Meta)",
    icon: Target,
    source: "ad_platform",
    description: "Meta CAPI: viewed gaming monitors 3× in 7 days · abandoned cart",
    scriptAttr: 'data-ad-cohort="retargeting_gaming" data-ad-source="meta_capi"',
    tags: ["retargeting", "gaming_interest", "cart_abandoner"],
    signals: [
      { source: "meta_capi", value: "retargeting_gaming", intentMatch: "gaming", weight: 0.75 },
      { source: "meta_capi", value: "cart_abandoner", intentMatch: "gaming", weight: 0.55 },
    ],
    expectedIntent: "gaming",
    expectedFunnel: "buy",
  },
  {
    id: "inmarket_office",
    name: "In-Market: Office (Google)",
    icon: BarChart3,
    source: "ad_platform",
    description: "Google Ads: in-market for 'Computer Monitors — Office' · CPC campaign",
    scriptAttr: 'data-ad-cohort="in_market_office" data-ad-source="google_ads"',
    tags: ["in_market", "office_monitors", "google_ads"],
    signals: [
      { source: "google_ads", value: "in_market_office", intentMatch: "productivity", weight: 0.70 },
      { source: "google_ads", value: "cpc_campaign", intentMatch: "productivity", weight: 0.35 },
    ],
    expectedIntent: "productivity",
    expectedFunnel: "compare",
  },
  {
    id: "lookalike_creative",
    name: "Lookalike: High-LTV Creators",
    icon: Zap,
    source: "ad_platform",
    description: "Meta Lookalike: top 1% creator-segment purchasers · DCI-P3 interest",
    scriptAttr: 'data-ad-cohort="high_ltv_creators" data-ad-source="meta_lookalike"',
    tags: ["lookalike", "high_ltv_creators", "dci_p3"],
    signals: [
      { source: "meta_lookalike", value: "high_ltv_creators", intentMatch: "creative", weight: 0.65 },
      { source: "meta_interest", value: "dci_p3_color", intentMatch: "creative", weight: 0.50 },
    ],
    expectedIntent: "creative",
    expectedFunnel: "explore",
  },
];

// ─────────────────────────────────────────────────────────────────
// SIMULATE INTENT RESOLUTION (mirrors resolveIntent logic)
// ─────────────────────────────────────────────────────────────────

function simulateResolution(signals: UserSignal[], urlSignals: UserSignal[] = []) {
  const allSignals = [...urlSignals, ...signals];
  const scores: Record<string, number> = {};

  allSignals.forEach((s) => {
    scores[s.intentMatch] = (scores[s.intentMatch] || 0) + s.weight;
  });

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const topIntent = (sorted[0]?.[0] || "default") as IntentType;
  const topScore = sorted[0]?.[1] || 0;
  const secondScore = sorted[1]?.[1] || 0;
  const confidence = topScore >= 0.8 ? "high" : topScore >= 0.4 ? "medium" : "low";
  const closeContest = topScore - secondScore < 0.15 && sorted.length > 1;

  return {
    topIntent,
    topScore,
    scores,
    confidence,
    closeContest,
    secondIntent: sorted[1]?.[0] as IntentType | undefined,
  };
}

// ─────────────────────────────────────────────────────────────────
// SMART SUGGESTION ENGINE
// Generates context-aware suggestions based on what the engine
// actually decides, cross-referenced with the template registry
// ─────────────────────────────────────────────────────────────────

function generateSuggestions(
  intent: IntentType,
  heroSelector: string,
  ctaSelector: string,
  template: HeroTemplate,
): TemplateSuggestion[] {
  const variant = CONTENT_VARIANTS[intent];
  const mapping = TEMPLATE_MAPPINGS.find((m) => m.intent === intent);
  const suggestions: TemplateSuggestion[] = [];

  // Hero selector suggestion
  if (!heroSelector || heroSelector === "#hero-container") {
    const selectorHints: Record<string, string> = {
      gaming:      "#hero-container, .hero-section, [data-section='hero']",
      student:     ".hero-section, #page-hero, .banner-section",
      productivity: "#hero-container, .hero-wrapper, .page-header",
      creative:    ".hero-section, .full-bleed-hero, #hero",
      budget:      "#hero-container, .promotional-banner, .hero-banner",
      developer:   "#hero-container, .hero-section, .dev-hero",
      default:     "#hero-container",
    };
    suggestions.push({
      field: "Hero Selector",
      current: heroSelector,
      suggested: selectorHints[intent] || "#hero-container",
      reason: `For ${intent} visitors using ${template.layoutType} layout — these selectors are most common on ${intent}-category stores.`,
      confidence: "high",
    });
  }

  // CTA selector based on funnel stage
  if (mapping) {
    const ctaHints: Record<string, string> = {
      buy:     ".add-to-cart, .hero-cta, #buy-now-btn, .btn-primary",
      compare: ".compare-btn, .hero-cta, .cta-secondary, .view-specs",
      explore: ".hero-cta, .learn-more, .explore-btn, .discover-btn",
    };
    if (!ctaSelector || ctaSelector === ".hero-cta") {
      suggestions.push({
        field: "CTA Selector",
        current: ctaSelector,
        suggested: ctaHints[mapping.funnelStage],
        reason: `Engine resolved to "${mapping.funnelStage}" funnel stage — CTA should be "${variant.ctaText}". Match selectors to your store's primary action button.`,
        confidence: "high",
      });
    }
  }

  // Template layout suggestion
  suggestions.push({
    field: "Layout Template",
    current: template.id,
    suggested: mapping?.templateId || "hero_centered",
    reason: `${template.name} (${template.layoutType}) is optimal for ${intent} intent — ${template.description.split(".")[0]}.`,
    confidence: mapping?.templateId === template.id ? "high" : "medium",
  });

  // Headline suggestion from actual content variant
  suggestions.push({
    field: "Headline",
    current: "Your current hero headline",
    suggested: `"${variant.headline}"`,
    reason: `The engine will replace your hero text with this copy for ${intent} visitors. Make sure your hero element's inner text is swappable (not hardcoded in an SVG or image).`,
    confidence: "high",
  });

  // Badge text
  suggestions.push({
    field: "Badge / Label",
    current: "No badge",
    suggested: variant.badgeText,
    reason: `SmartSwap surfaces this badge above the headline for ${intent} visitors to immediately signal relevance.`,
    confidence: "medium",
  });

  // Image hint
  suggestions.push({
    field: "Hero Image",
    current: "Current hero image",
    suggested: `hero-${intent}.jpg (${template.config.imagePosition} position)`,
    reason: `Template uses "${template.config.imagePosition}" image position with ${template.config.overlayOpacity > 0 ? `${template.config.overlayOpacity * 100}% overlay` : "no overlay"}. Your hero image element must be accessible via the selector.`,
    confidence: "medium",
  });

  return suggestions;
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const ThirdPartyDataDemo = () => {
  const [activeProfile, setActiveProfile] = useState<string>("vip_returning");
  const [urlOverride, setUrlOverride] = useState<string>("");
  const [heroSelector, setHeroSelector] = useState("#hero-container");
  const [ctaSelector, setCtaSelector] = useState(".hero-cta");
  const [debugMode, setDebugMode] = useState(true);
  const [activeTab, setActiveTab] = useState<"signals" | "config" | "preview" | "code">("signals");
  const [copiedCode, setCopiedCode] = useState(false);
  const [appliedSuggestion, setAppliedSuggestion] = useState<string | null>(null);

  const profile = PROFILES.find((p) => p.id === activeProfile)!;

  const urlSignals: UserSignal[] = useMemo(() => {
    if (!urlOverride) return [];
    const mapping: Record<string, UserSignal> = {
      gaming:      { source: "utm_campaign", value: "gaming", intentMatch: "gaming", weight: 0.95 },
      budget:      { source: "search_query", value: "cheap monitors", intentMatch: "budget", weight: 0.80 },
      creative:    { source: "referrer_domain", value: "dribbble", intentMatch: "creative", weight: 0.75 },
      productivity:{ source: "utm_campaign", value: "office-monitors", intentMatch: "productivity", weight: 0.95 },
    };
    return mapping[urlOverride] ? [mapping[urlOverride]] : [];
  }, [urlOverride]);

  const resolution = useMemo(
    () => simulateResolution(profile.signals, urlSignals),
    [profile, urlSignals],
  );

  const variant = CONTENT_VARIANTS[resolution.topIntent] || CONTENT_VARIANTS.default;
  const template = HERO_TEMPLATES[
    TEMPLATE_MAPPINGS.find((m) => m.intent === resolution.topIntent)?.templateId || "hero_centered"
  ] as HeroTemplate;

  const suggestions = useMemo(
    () => generateSuggestions(resolution.topIntent, heroSelector, ctaSelector, template),
    [resolution.topIntent, heroSelector, ctaSelector, template],
  );

  const generatedSnippet = `<!-- SmartSwap — Third-Party Data Integration -->
<!-- Paste before </head> in your theme.liquid / HTML -->
<script 
  src="https://cdn.smartswap.ai/widget.js"
  data-store-id="YOUR_STORE_ID"
  data-hero-selector="${heroSelector}"
  data-cta-selector="${ctaSelector}"

  <!-- Shopify Customer Context -->
  ${profile.source === "shopify" ? profile.scriptAttr : "<!-- no shopify tags for this profile -->"}

  <!-- Ad Platform Audience -->
  ${profile.source === "ad_platform" ? profile.scriptAttr : "<!-- no ad audience for this profile -->"}
${debugMode ? '  data-debug="true"' : ""}
  async
></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const applySuggestion = (suggestion: TemplateSuggestion) => {
    if (suggestion.field === "Hero Selector") {
      setHeroSelector(suggestion.suggested.split(",")[0].trim());
    } else if (suggestion.field === "CTA Selector") {
      setCtaSelector(suggestion.suggested.split(",")[0].trim());
    }
    setAppliedSuggestion(suggestion.field);
    setTimeout(() => setAppliedSuggestion(null), 2000);
  };

  const tabs = [
    { id: "signals",  label: "Signals",      icon: Zap },
    { id: "config",   label: "Configuration", icon: Settings },
    { id: "preview",  label: "Preview",       icon: Eye },
    { id: "code",     label: "Code",          icon: Code },
  ] as const;

  return (
    <div className="space-y-0">
      {/* ── Top: Profile Selector + Resolution Summary ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-border rounded-xl overflow-hidden">

        {/* Left column — Profile picker */}
        <div className="lg:col-span-4 border-r border-border bg-secondary/20">
          <div className="px-4 py-3 border-b border-border bg-secondary/40">
            <p className="text-xs font-display font-bold text-foreground">Visitor Profile</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Select a real-world data scenario</p>
          </div>

          {/* Source labels */}
          <div className="flex gap-2 px-4 pt-3 pb-2">
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-budget/10 text-budget border border-budget/20">
              <ShoppingBag className="w-2.5 h-2.5 inline mr-0.5" />Shopify Tags
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-creative/10 text-creative border border-creative/20">
              <Target className="w-2.5 h-2.5 inline mr-0.5" />Ad Audiences
            </span>
          </div>

          <div className="p-3 space-y-1.5">
            {PROFILES.map((p) => {
              const isActive = p.id === activeProfile;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveProfile(p.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isActive
                      ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                      : "bg-card border-border hover:border-primary/20 hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      p.source === "shopify" ? "bg-budget/10" : "bg-creative/10"
                    }`}>
                      <Icon className={`w-4 h-4 ${p.source === "shopify" ? "text-budget" : "text-creative"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {p.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 leading-snug mt-0.5 line-clamp-2">
                        {p.description}
                      </p>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* URL signal overlay */}
          <div className="mx-3 mb-3 p-3 rounded-lg bg-card border border-border">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">
              + Overlay URL signal
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["", "gaming", "budget", "creative", "productivity"].map((val) => (
                <button
                  key={val || "none"}
                  onClick={() => setUrlOverride(val)}
                  className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${
                    urlOverride === val
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {val || "None"}
                </button>
              ))}
            </div>
            {urlOverride && (
              <p className="text-[9px] text-muted-foreground mt-2">
                <code className="text-primary">?utm_campaign={urlOverride}</code> · weight: 0.95
              </p>
            )}
          </div>
        </div>

        {/* Right column — Output panel */}
        <div className="lg:col-span-8 flex flex-col">
          {/* Decision header */}
          <div className="px-5 py-4 border-b border-border bg-secondary/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-display font-bold text-foreground">Engine Decision</p>
                  <p className="text-[10px] text-muted-foreground">Based on active signals</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                resolution.confidence === "high"   ? "bg-budget/15 text-budget border border-budget/20" :
                resolution.confidence === "medium" ? "bg-primary/15 text-primary border border-primary/20" :
                "bg-muted text-muted-foreground border border-border"
              }`}>
                {resolution.confidence} confidence
              </span>
            </div>

            {/* 4-up decision grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Resolved Intent",  value: resolution.topIntent,        bold: true },
                { label: "Funnel Stage",     value: profile.expectedFunnel,      bold: false },
                { label: "Hero Template",    value: template.layoutType,         bold: false },
                { label: "Top Score",        value: resolution.topScore.toFixed(2), bold: true },
              ].map(({ label, value, bold }) => (
                <div key={label} className="bg-card rounded-lg p-3 border border-border">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                  <p className={`text-sm capitalize ${bold ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-border bg-secondary/10">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-b-2 ${
                  activeTab === id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeProfile}-${urlOverride}-${activeTab}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="p-5 space-y-4"
              >

                {/* ── TAB: SIGNALS ──────────────────────────────── */}
                {activeTab === "signals" && (
                  <>
                    {/* Raw signals table */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-border bg-secondary/30 flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Raw Signals</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {profile.signals.length + urlSignals.length} total · cap 0.85
                        </span>
                      </div>
                      <div className="divide-y divide-border">
                        {[...urlSignals, ...profile.signals].map((signal, i) => (
                          <div key={`${signal.source}-${i}`} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap ${
                              signal.source.startsWith("shopify") ? "bg-budget/10 text-budget" :
                              signal.source.startsWith("meta") || signal.source.startsWith("google") ? "bg-creative/10 text-creative" :
                              "bg-primary/10 text-primary"
                            }`}>
                              {signal.source}
                            </span>
                            <span className="text-muted-foreground flex-1 truncate font-mono text-[10px]">{signal.value}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                            <span className="font-semibold text-foreground capitalize w-20">{signal.intentMatch}</span>
                            <span className="font-mono text-primary font-bold w-10 text-right">{signal.weight.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Score bars */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-border bg-secondary/30">
                        <span className="text-xs font-semibold text-foreground">Score Resolution</span>
                      </div>
                      <div className="p-4 space-y-2.5">
                        {Object.entries(resolution.scores)
                          .sort(([, a], [, b]) => b - a)
                          .map(([intent, score]) => {
                            const isWinner = intent === resolution.topIntent;
                            const pct = Math.round((score / (resolution.topScore || 1)) * 100);
                            return (
                              <div key={intent} className="flex items-center gap-3">
                                <span className={`text-xs w-20 capitalize ${isWinner ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                                  {intent}
                                </span>
                                <div className="flex-1 h-5 bg-secondary/50 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className={`h-full rounded-full ${isWinner ? "bg-primary" : "bg-muted-foreground/30"}`}
                                  />
                                </div>
                                <span className={`text-xs font-mono w-10 text-right ${isWinner ? "text-primary font-bold" : "text-muted-foreground"}`}>
                                  {score.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        {resolution.closeContest && (
                          <p className="text-[10px] text-primary font-medium mt-2">
                            ⚠ Close contest (Δ &lt; 0.15) — resolved by priority matrix tiebreaker
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* ── TAB: CONFIGURATION ─────────────────────────── */}
                {activeTab === "config" && (
                  <>
                    {/* Manual selectors */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
                        <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-foreground">Element Selectors</span>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                            Hero Container <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="text"
                            value={heroSelector}
                            onChange={(e) => setHeroSelector(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">CSS selector for the hero section SmartSwap will personalize</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                            CTA Button
                          </label>
                          <input
                            type="text"
                            value={ctaSelector}
                            onChange={(e) => setCtaSelector(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Button will be swapped to: <code className="text-primary">"{variant.ctaText}"</code> for {resolution.topIntent} visitors
                          </p>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                          <button
                            onClick={() => setDebugMode(!debugMode)}
                            className={`w-10 h-6 rounded-full transition-all flex items-center ${debugMode ? "bg-primary justify-end" : "bg-muted justify-start"}`}
                          >
                            <div className="w-5 h-5 rounded-full bg-foreground mx-0.5" />
                          </button>
                          <div>
                            <p className="text-xs font-medium text-foreground">Debug Overlay</p>
                            <p className="text-[10px] text-muted-foreground">Shows intent badge + score on page (recommended during setup)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Smart Suggestions */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-foreground">Smart Suggestions</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          Based on <span className="text-primary font-medium capitalize">{resolution.topIntent}</span> intent
                        </span>
                      </div>
                      <div className="divide-y divide-border">
                        {suggestions.map((sug) => (
                          <div key={sug.field} className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  sug.confidence === "high"   ? "bg-budget" :
                                  sug.confidence === "medium" ? "bg-primary" :
                                  "bg-muted-foreground"
                                }`} />
                                <span className="text-xs font-semibold text-foreground">{sug.field}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  sug.confidence === "high"   ? "bg-budget/10 text-budget" :
                                  sug.confidence === "medium" ? "bg-primary/10 text-primary" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {sug.confidence}
                                </span>
                              </div>
                              {(sug.field === "Hero Selector" || sug.field === "CTA Selector") && (
                                <button
                                  onClick={() => applySuggestion(sug)}
                                  className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium shrink-0"
                                >
                                  {appliedSuggestion === sug.field ? (
                                    <><CheckCircle className="w-3 h-3" /> Applied!</>
                                  ) : (
                                    <><RefreshCw className="w-3 h-3" /> Apply</>
                                  )}
                                </button>
                              )}
                            </div>
                            <code className="block text-[11px] font-mono text-primary bg-primary/5 px-2 py-1.5 rounded mb-1.5 break-all">
                              {sug.suggested}
                            </code>
                            <p className="text-[10px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                              <Info className="w-3 h-3 shrink-0 mt-0.5 text-muted-foreground/50" />
                              {sug.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Template info card */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          Active Template: <span className="text-primary">{template.name}</span>
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[
                            { k: "Alignment",  v: template.config.contentAlignment },
                            { k: "Image",      v: template.config.imagePosition },
                            { k: "CTA Style",  v: template.config.ctaStyle },
                          ].map(({ k, v }) => (
                            <div key={k} className="bg-secondary/40 rounded-lg p-2 text-center">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{k}</p>
                              <p className="text-xs font-semibold text-foreground capitalize mt-0.5">{v}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.slots.map((slot) => (
                            <span key={slot.name} className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                              slot.required ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                            }`}>
                              {slot.name}{slot.required ? "*" : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ── TAB: PREVIEW ───────────────────────────────── */}
                {activeTab === "preview" && (
                  <div className="space-y-4">
                    {/* Simulated hero preview */}
                    <div className="rounded-xl border border-border overflow-hidden bg-card">
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
                        <div className="flex gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-destructive/60" />
                          <span className="w-3 h-3 rounded-full bg-primary/60" />
                          <span className="w-3 h-3 rounded-full bg-budget/60" />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground flex-1">
                          yourstore.com · visitor: {profile.name}
                        </span>
                        {debugMode && (
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">
                            DEBUG ON
                          </span>
                        )}
                      </div>

                      <div className={`p-8 lg:p-10 ${
                        template.layoutType === "split-screen"
                          ? "flex gap-8 items-center"
                          : template.layoutType === "minimal"
                          ? "max-w-xl"
                          : "text-center max-w-2xl mx-auto"
                      }`}>
                        <div className={template.layoutType === "split-screen" ? "flex-1" : ""}>
                          {/* Debug badge */}
                          {debugMode && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold border bg-secondary/80 text-muted-foreground mb-3">
                              <Shield className="w-3 h-3" />
                              SmartSwap: {resolution.topIntent} · {resolution.confidence} · score {resolution.topScore.toFixed(2)}
                            </div>
                          )}

                          {/* Badge */}
                          <div
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 text-xs font-medium"
                            style={{
                              background: `hsl(var(${variant.accentColor}) / 0.15)`,
                              color: `hsl(var(${variant.accentColor}))`,
                              border: `1px solid hsl(var(${variant.accentColor}) / 0.3)`,
                            }}
                          >
                            {variant.badgeText}
                          </div>

                          <h3 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-3 leading-tight">
                            {variant.headline}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                            {variant.subhead}
                          </p>
                          <div className={`flex gap-3 ${template.config.contentAlignment === "center" ? "justify-center" : ""} ${template.config.ctaStyle === "stacked" ? "flex-col max-w-xs" : "flex-row flex-wrap"}`}>
                            <Button
                              size="sm"
                              style={{ background: `hsl(var(${variant.accentColor}))` }}
                              className="text-background font-semibold rounded-lg"
                            >
                              {variant.ctaText}
                            </Button>
                            {template.config.ctaStyle !== "single" && (
                              <Button size="sm" variant="outline" className="rounded-lg border-border text-foreground">
                                {variant.ctaSecondary}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Split-screen image placeholder */}
                        {template.layoutType === "split-screen" && (
                          <div className="flex-1 aspect-video rounded-xl bg-secondary/50 border border-border flex items-center justify-center">
                            <div className="text-center">
                              <Monitor className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-[10px] text-muted-foreground font-mono">hero-{resolution.topIntent}.jpg</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Decision summary */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-card border border-border p-3">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Template Applied</p>
                        <p className="text-xs font-semibold text-foreground">{template.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{template.layoutType}</p>
                      </div>
                      <div className="rounded-lg bg-card border border-border p-3">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Data Source</p>
                        <p className="text-xs font-semibold text-foreground capitalize">{profile.source.replace("_", " ")}</p>
                        <p className="text-[10px] text-muted-foreground">{profile.signals.length} signals injected</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: CODE ──────────────────────────────────── */}
                {activeTab === "code" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-destructive/60" />
                            <span className="w-3 h-3 rounded-full bg-primary/60" />
                            <span className="w-3 h-3 rounded-full bg-budget/60" />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">
                            {profile.source === "shopify" ? "theme.liquid" : "page-head.html"}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopy}
                          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                        >
                          {copiedCode ? (
                            <><Check className="w-3.5 h-3.5 text-budget" /> Copied!</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> Copy</>
                          )}
                        </Button>
                      </div>
                      <pre className="p-4 text-xs leading-relaxed overflow-x-auto">
                        <code className="text-foreground/90">{generatedSnippet}</code>
                      </pre>
                    </div>

                    {/* Attribute reference */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-border bg-secondary/30">
                        <span className="text-xs font-semibold text-foreground">Third-Party Attribute Reference</span>
                      </div>
                      <div className="divide-y divide-border text-xs">
                        {[
                          { attr: "data-customer-tags",   ex: "vip,student-verified,wholesale", note: "Comma-separated Shopify customer tags" },
                          { attr: "data-customer-orders", ex: "12",                              note: "Shopify customer.orders_count" },
                          { attr: "data-customer-ltv",    ex: "2400.00",                         note: "Shopify customer.total_spent" },
                          { attr: "data-ad-cohort",       ex: "retargeting_gaming",              note: "Ad platform audience segment ID" },
                          { attr: "data-ad-source",       ex: "meta_capi, google_ads",           note: "Which platform sent the audience" },
                        ].map((row) => (
                          <div key={row.attr} className="px-4 py-3">
                            <div className="flex items-start justify-between gap-2">
                              <code className="text-primary font-mono text-[10px]">{row.attr}</code>
                              <span className="text-muted-foreground text-[10px] text-right">{row.note}</span>
                            </div>
                            <p className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">e.g. "{row.ex}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThirdPartyDataDemo;
