/**
 * THIRD-PARTY DATA INTEGRATION DEMO
 * 
 * Shows how SmartSwap ingests external data sources (Shopify customer tags, 
 * ad platform audiences) through the same weighted signal pipeline used for 
 * URL parameters. Includes:
 *   1. Architecture diagram (Mermaid) — data flow from external sources → adapter → engine
 *   2. Interactive simulator — toggle third-party profiles and see live signal output
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Target, Tag, Users, Zap, ChevronRight,
  ArrowRight, BarChart3, Shield
} from "lucide-react";
import MermaidDiagram from "./MermaidDiagram";
import { CONTENT_VARIANTS, type IntentType, type UserSignal } from "@/lib/personalization-engine";

// ─────────────────────────────────────────────────────────────────
// MERMAID DIAGRAM — Third-Party Data Integration Architecture
//
// Shows how external data sources (Shopify tags, ad cohorts, cookies)
// are adapted into UserSignal[] and fed into the SAME pipeline as 
// URL-based signals — collectSignals() → resolveIntent() → DOM swap
// ─────────────────────────────────────────────────────────────────

const THIRD_PARTY_DIAGRAM = `flowchart TD
  subgraph EXTERNAL["🌐 External Data Sources"]
    SHOP["🛍️ Shopify Customer Tags\\n<i>metafields · order_count · tags[]</i>\\n<i>e.g. vip · wholesale · student-verified</i>"]
    ADS["📣 Ad Platform Audiences\\n<i>Meta CAPI · Google Ads · TikTok Pixel</i>\\n<i>e.g. retargeting · lookalike · in-market</i>"]
    COOKIE["🍪 First-Party Cookies\\n<i>_ss_segment · _ss_cohort</i>\\n<i>Set by analytics or CDP</i>"]
  end

  SHOP --> ADAPT["🔌 Signal Adapter Layer\\n<b>adaptThirdPartySignals()</b>\\n<i>Transforms external data → UserSignal[]</i>"]
  ADS --> ADAPT
  COOKIE --> ADAPT

  ADAPT --> VALIDATE["✅ Validation\\n<i>Type check · weight bounds [0, 1]</i>\\n<i>Unknown sources → logged + skipped</i>"]
  VALIDATE --> MERGE["🔀 Signal Merge\\n<b>Append to URL signals</b>\\n<i>Third-party weight cap: 0.85</i>\\n<i>Never overrides ?intent= (1.0)</i>"]

  subgraph EXISTING["⚡ Existing SmartSwap Pipeline"]
    URL["📡 URL Signals\\n<i>utm_campaign · ref · q · etc.</i>"]
    URL --> COLLECT["collectSignals()\\n<i>Keyword matching · compound detection</i>"]
    MERGE --> COLLECT
    COLLECT --> RESOLVE["resolveIntent()\\n<i>Weighted scoring · Δ < 0.15 tiebreaker</i>"]
    RESOLVE --> DECISION["🧠 IntentResult\\n<i>Same structured decision object</i>"]
  end

  subgraph SHOPIFY_DETAIL["Shopify Tag → Signal Mapping"]
    ST1["tag: 'vip'\\n→ intent: gaming · weight: 0.70\\n<i>High-value → premium products</i>"]
    ST2["tag: 'wholesale'\\n→ intent: budget · weight: 0.65\\n<i>Bulk buyer → value-oriented</i>"]
    ST3["tag: 'student-verified'\\n→ intent: student · weight: 0.80\\n<i>Verified status → high confidence</i>"]
    ST4["order_count > 5\\n→ funnelStage: buy · weight: 0.60\\n<i>Returning customer → ready to purchase</i>"]
  end

  subgraph AD_DETAIL["Ad Audience → Signal Mapping"]
    AD1["cohort: 'retargeting_gaming'\\n→ intent: gaming · weight: 0.75\\n<i>Previously browsed gaming products</i>"]
    AD2["cohort: 'in_market_office'\\n→ intent: productivity · weight: 0.70\\n<i>Google Ads in-market segment</i>"]
    AD3["cohort: 'lookalike_high_ltv'\\n→ intent: creative · weight: 0.65\\n<i>Lookalike of high-spend customers</i>"]
    AD4["cohort: 'interest_pc_gaming'\\n→ intent: gaming · weight: 0.60\\n<i>Interest-based targeting</i>"]
  end

  DECISION --> DOM["🏪 DOM Surgery\\n<i>Hero · CTA · Section order</i>"]

  style EXTERNAL fill:#0f172a,stroke:#3b82f6,color:#f8fafc
  style SHOP fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style ADS fill:#1e293b,stroke:#a855f7,color:#f8fafc
  style COOKIE fill:#1e293b,stroke:#f97316,color:#f8fafc
  style ADAPT fill:#1e293b,stroke:#f97316,stroke-width:2px,color:#f8fafc
  style VALIDATE fill:#0f172a,stroke:#22c55e,color:#86efac
  style MERGE fill:#1e293b,stroke:#fbbf24,color:#f8fafc
  style EXISTING fill:#0f172a,stroke:#f97316,color:#f8fafc
  style URL fill:#1e293b,stroke:#3b82f6,color:#f8fafc
  style COLLECT fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style RESOLVE fill:#1e293b,stroke:#a855f7,color:#f8fafc
  style DECISION fill:#1e293b,stroke:#f97316,stroke-width:2px,color:#f97316
  style DOM fill:#1e293b,stroke:#06b6d4,color:#f8fafc
  style SHOPIFY_DETAIL fill:#0f172a,stroke:#22c55e,color:#f8fafc
  style ST1 fill:#0f172a,stroke:#22c55e,color:#86efac
  style ST2 fill:#0f172a,stroke:#22c55e,color:#86efac
  style ST3 fill:#0f172a,stroke:#22c55e,color:#86efac
  style ST4 fill:#0f172a,stroke:#22c55e,color:#86efac
  style AD_DETAIL fill:#0f172a,stroke:#a855f7,color:#f8fafc
  style AD1 fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style AD2 fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style AD3 fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style AD4 fill:#0f172a,stroke:#a855f7,color:#c4b5fd`;

// ─────────────────────────────────────────────────────────────────
// THIRD-PARTY PROFILE PRESETS
// Simulates different external data scenarios a real store would see
// ─────────────────────────────────────────────────────────────────

interface ThirdPartyProfile {
  id: string;
  name: string;
  icon: React.ElementType;
  source: "shopify" | "ad_platform";
  description: string;
  tags: string[];
  signals: UserSignal[];
  expectedIntent: IntentType;
  expectedFunnel: "buy" | "compare" | "explore";
}

const PROFILES: ThirdPartyProfile[] = [
  {
    id: "vip_returning",
    name: "VIP Returning Customer",
    icon: ShoppingBag,
    source: "shopify",
    description: "Shopify tag: 'vip' · order_count: 12 · lifetime_value: $2,400+",
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
    description: "Meta CAPI: viewed gaming monitors 3x in 7 days · abandoned cart",
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
// SIMULATE INTENT RESOLUTION
// Mirrors the real resolveIntent() logic with third-party signals
// ─────────────────────────────────────────────────────────────────

function simulateResolution(signals: UserSignal[], urlSignals: UserSignal[] = []) {
  const allSignals = [...urlSignals, ...signals];
  const scores: Record<string, number> = {};
  
  allSignals.forEach(s => {
    scores[s.intentMatch] = (scores[s.intentMatch] || 0) + s.weight;
  });

  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  const topIntent = (sorted[0]?.[0] || "default") as IntentType;
  const topScore = sorted[0]?.[1] || 0;
  const secondScore = sorted[1]?.[1] || 0;

  const confidence = topScore >= 0.8 ? "high" : topScore >= 0.4 ? "medium" : "low";
  const closeContest = topScore - secondScore < 0.15 && sorted.length > 1;

  return { topIntent, topScore, scores, confidence, closeContest, secondIntent: sorted[1]?.[0] as IntentType | undefined };
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const ThirdPartyDataDemo = () => {
  const [activeProfile, setActiveProfile] = useState<string>("vip_returning");
  const [urlOverride, setUrlOverride] = useState<string>("");

  const profile = PROFILES.find(p => p.id === activeProfile)!;

  // Simulate URL signal overlay
  const urlSignals: UserSignal[] = useMemo(() => {
    if (!urlOverride) return [];
    const mapping: Record<string, UserSignal> = {
      gaming: { source: "utm_campaign", value: "gaming", intentMatch: "gaming", weight: 0.95 },
      budget: { source: "search_query", value: "cheap monitors", intentMatch: "budget", weight: 0.80 },
      creative: { source: "referrer_domain", value: "dribbble", intentMatch: "creative", weight: 0.75 },
    };
    return mapping[urlOverride] ? [mapping[urlOverride]] : [];
  }, [urlOverride]);

  const resolution = useMemo(() => 
    simulateResolution(profile.signals, urlSignals),
    [profile, urlSignals]
  );

  const variant = CONTENT_VARIANTS[resolution.topIntent] || CONTENT_VARIANTS.default;

  return (
    <div className="space-y-12">
      {/* Architecture Diagram */}
      <section>
        <div className="flex items-start gap-3 mb-5">
          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">
            <Shield className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-display font-bold text-foreground leading-snug">
              Third-Party Data → Signal Pipeline
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              External data sources are adapted into <code className="text-primary text-xs bg-primary/5 px-1.5 py-0.5 rounded">UserSignal[]</code> and 
              merged into the <strong>same pipeline</strong> as URL-based signals — no separate decision path. 
              Third-party signals are capped at <code className="text-primary text-xs">0.85</code> weight to ensure 
              <code className="text-primary text-xs">?intent=</code> (1.0) always wins as a direct override.
            </p>
          </div>
        </div>
        <MermaidDiagram chart={THIRD_PARTY_DIAGRAM} id="third-party-pipeline" />
      </section>

      {/* Interactive Simulator */}
      <section>
        <div className="flex items-start gap-3 mb-6">
          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">
            <Zap className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-display font-bold text-foreground leading-snug">
              Live Simulator — Toggle Third-Party Profiles
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Select a customer profile or ad audience segment to see how external data produces real signals, 
              scores, and personalization decisions through the engine.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Profile Selector */}
          <div className="lg:col-span-4 space-y-2">
            {/* Source Tabs */}
            <div className="flex gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-budget/10 text-budget border border-budget/20">
                <ShoppingBag className="w-3 h-3 inline mr-1" />Shopify
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-creative/10 text-creative border border-creative/20">
                <Target className="w-3 h-3 inline mr-1" />Ad Platforms
              </span>
            </div>

            {PROFILES.map((p) => {
              const isActive = p.id === activeProfile;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveProfile(p.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isActive
                      ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                      : "bg-card border-border hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                      p.source === "shopify" ? "bg-budget/10" : "bg-creative/10"
                    }`}>
                      <Icon className={`w-3.5 h-3.5 ${
                        p.source === "shopify" ? "text-budget" : "text-creative"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {p.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 truncate">{p.description}</p>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                </button>
              );
            })}

            {/* URL Override */}
            <div className="mt-4 p-3 rounded-lg bg-card border border-border">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">
                + Combine with URL signal
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["", "gaming", "budget", "creative"].map((val) => (
                  <button
                    key={val || "none"}
                    onClick={() => setUrlOverride(val)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
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
                <p className="text-[9px] text-muted-foreground/70 mt-1.5">
                  Simulating: <code className="text-primary">?utm_campaign={urlOverride}</code> (weight: 0.95)
                </p>
              )}
            </div>
          </div>

          {/* Signal Output + Resolution */}
          <div className="lg:col-span-8 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeProfile}-${urlOverride}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Raw Signals */}
                <div className="rounded-lg bg-card border border-border overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border bg-secondary/30 flex items-center justify-between">
                    <span className="text-xs font-display font-semibold text-foreground">
                      Raw Signals Generated
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {profile.signals.length + urlSignals.length} signals
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {[...urlSignals, ...profile.signals].map((signal, i) => (
                      <div key={`${signal.source}-${i}`} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          signal.source.startsWith("shopify") ? "bg-budget/10 text-budget" :
                          signal.source.startsWith("meta") || signal.source.startsWith("google") ? "bg-creative/10 text-creative" :
                          "bg-primary/10 text-primary"
                        }`}>
                          {signal.source}
                        </span>
                        <span className="text-muted-foreground flex-1 truncate font-mono">{signal.value}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        <span className="font-semibold text-foreground capitalize w-20">{signal.intentMatch}</span>
                        <span className="font-mono text-primary font-bold w-10 text-right">{signal.weight.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="rounded-lg bg-card border border-border overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border bg-secondary/30">
                    <span className="text-xs font-display font-semibold text-foreground">
                      Score Resolution
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {Object.entries(resolution.scores)
                        .sort(([, a], [, b]) => b - a)
                        .map(([intent, score]) => {
                          const maxScore = resolution.topScore || 1;
                          const pct = Math.round((score / maxScore) * 100);
                          const isWinner = intent === resolution.topIntent;
                          return (
                            <div key={intent} className="flex items-center gap-3">
                              <span className={`text-xs w-24 capitalize ${isWinner ? "font-bold text-foreground" : "text-muted-foreground"}`}>
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
                              <span className={`text-xs font-mono w-12 text-right ${isWinner ? "text-primary font-bold" : "text-muted-foreground"}`}>
                                {score.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                    </div>

                    {resolution.closeContest && (
                      <p className="text-[10px] text-primary mt-3 font-medium">
                        ⚠ Close contest: Δ &lt; 0.15 — resolved by priority matrix tiebreaker
                      </p>
                    )}
                  </div>
                </div>

                {/* Decision Output */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-primary/20 flex items-center justify-between">
                    <span className="text-xs font-display font-semibold text-foreground">
                      🧠 Engine Decision
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      resolution.confidence === "high" ? "bg-budget/10 text-budget" :
                      resolution.confidence === "medium" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {resolution.confidence} confidence
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Intent</p>
                      <p className="text-sm font-bold text-foreground capitalize">{resolution.topIntent}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CTA</p>
                      <p className="text-sm font-semibold text-primary">{variant.ctaText}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Funnel</p>
                      <p className="text-sm font-bold text-foreground capitalize">{variant.funnelStage}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hero</p>
                      <p className="text-sm font-semibold text-foreground">{variant.badgeText}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="px-4 pb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {profile.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-secondary text-muted-foreground border border-border">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Integration Code Example */}
      <section>
        <div className="flex items-start gap-3 mb-5">
          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">
            &lt;/&gt;
          </span>
          <div>
            <h3 className="text-base font-display font-bold text-foreground leading-snug">
              Integration Code — Script Tag Attributes
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Pass third-party data to SmartSwap via <code className="text-primary text-xs bg-primary/5 px-1.5 py-0.5 rounded">data-*</code> attributes 
              on the script tag. The adapter layer handles type conversion and weight assignment automatically.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-destructive/60" />
              <span className="w-3 h-3 rounded-full bg-primary/60" />
              <span className="w-3 h-3 rounded-full bg-budget/60" />
            </div>
            <span className="text-xs font-mono text-muted-foreground">theme.liquid — Shopify Integration</span>
          </div>
          <pre className="p-4 text-sm leading-relaxed overflow-x-auto">
            <code className="text-foreground/90">{`<!-- SmartSwap with Shopify Customer Tags -->
<script 
  src="https://cdn.smartswap.ai/widget.js"
  data-store-id="YOUR_STORE_ID"
  data-hero-selector="#hero-container"
  data-cta-selector=".hero-cta"

  <!-- Third-party data attributes -->
  data-customer-tags="{{ customer.tags | join: ',' }}"
  data-customer-orders="{{ customer.orders_count }}"
  data-customer-ltv="{{ customer.total_spent }}"

  <!-- Ad platform audience (set by pixel/tag manager) -->
  data-ad-cohort="retargeting_gaming"
  data-ad-source="meta_capi"

  async
></script>`}</code>
          </pre>
        </div>
      </section>
    </div>
  );
};

export default ThirdPartyDataDemo;
