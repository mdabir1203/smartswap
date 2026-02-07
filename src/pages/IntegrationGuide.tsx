import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Code, Copy, Check, ChevronRight, Zap, Shield, BarChart3,
  Monitor, ArrowLeft, Globe, Layers, Puzzle, Settings, Play,
  ShoppingBag, ExternalLink, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALL_INTENTS, CONTENT_VARIANTS, type IntentType } from "@/lib/personalization-engine";
import { HERO_TEMPLATES, TEMPLATE_MAPPINGS } from "@/lib/template-registry";
import InstallWizard from "@/components/InstallWizard";

/**
 * INTEGRATION GUIDE PAGE
 * 
 * Simulates the full SMB onboarding journey:
 * 1. Overview — What does this widget do?
 * 2. Installation — Copy-paste a script tag
 * 3. Platform guides — Shopify / Webflow / Custom
 * 4. Configuration — Dashboard simulation
 * 5. Live demo — Interactive intent switcher
 */

const PLATFORMS = [
  {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingBag,
    time: "2 min",
    steps: [
      "Log in to your Shopify Admin",
      'Navigate to Online Store → Themes → Edit Code',
      'Open the "theme.liquid" file',
      'Paste the script tag before the closing </head> tag',
      'Click "Save" — you\'re done!',
    ],
    codeSnippet: `<!-- SmartSwap AI Personalization Widget -->
<!-- Add this to your theme.liquid before </head> -->
<script 
  src="https://cdn.smartswap.ai/widget.js"
  data-store-id="YOUR_STORE_ID"
  data-hero-selector="#hero-container"
  data-cta-selector=".hero-cta"
  async
></script>`,
  },
  {
    id: "webflow",
    name: "Webflow",
    icon: Globe,
    time: "3 min",
    steps: [
      "Open your Webflow project",
      'Go to Project Settings → Custom Code',
      'Paste the script in the "Head Code" section',
      'Add the data-hero-selector attribute matching your hero div\'s class',
      'Publish your site',
    ],
    codeSnippet: `<!-- SmartSwap AI Personalization Widget -->
<!-- Add to Webflow Project Settings → Custom Code → Head -->
<script 
  src="https://cdn.smartswap.ai/widget.js"
  data-store-id="YOUR_STORE_ID"
  data-hero-selector=".hero-section"
  data-cta-selector=".hero-cta-button"
  data-platform="webflow"
  async
></script>`,
  },
  {
    id: "custom",
    name: "Custom HTML",
    icon: Code,
    time: "1 min",
    steps: [
      "Open your HTML file",
      'Add the script tag before </head>',
      'Ensure your hero section has the correct ID',
      'Configure selectors via data attributes',
      'Reload — the widget activates automatically',
    ],
    codeSnippet: `<!-- SmartSwap AI Personalization Widget -->
<script 
  src="https://cdn.smartswap.ai/widget.js"
  data-store-id="YOUR_STORE_ID"
  data-hero-selector="#hero-container"
  data-cta-selector="#hero-cta"
  data-debug="true"
  async
></script>`,
  },
];

const JOURNEY_STEPS = [
  {
    icon: Puzzle,
    title: "Drop In",
    desc: "One script tag. That's it. No dependencies, no build tools, no API keys.",
    detail: "The widget loads asynchronously (non-blocking) and is only 12KB gzipped. It won't slow down your store.",
  },
  {
    icon: Zap,
    title: "Detect Intent",
    desc: "The engine reads UTM params, referrers, search queries, and category signals.",
    detail: "7 built-in intents: Gaming, Productivity, Budget, Creative, Student, Developer, and Default fallback.",
  },
  {
    icon: Layers,
    title: "Swap Content",
    desc: "Safe DOM surgery — only the hero and CTA change. Nothing else is touched.",
    detail: "Uses requestAnimationFrame for zero-jank swaps. Falls back gracefully if selectors don't match.",
  },
  {
    icon: Shield,
    title: "Stay Safe",
    desc: "Unknown intent? The widget does nothing. Your original page stays untouched.",
    detail: "Edge cases like malformed URLs, conflicting signals, and partial matches are all handled.",
  },
  {
    icon: BarChart3,
    title: "Measure Impact",
    desc: "The debug overlay shows exactly what happened and why — building trust with store owners.",
    detail: "Optional analytics mode sends conversion events to your existing GA4/Segment setup.",
  },
];

const IntegrationGuide = () => {
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState("shopify");
  const [copiedCode, setCopiedCode] = useState(false);
  const [activePreviewIntent, setActivePreviewIntent] = useState<IntentType>("default");

  const platform = PLATFORMS.find((p) => p.id === activePlatform)!;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <Monitor className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">
              Smart<span className="text-primary">Swap</span>
            </span>
          </button>
          <span className="text-xs text-muted-foreground font-mono">Integration Guide v2.0</span>
        </div>
      </nav>

      <div className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 lg:px-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Code className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">For Store Owners & Developers</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
              Install in <span className="text-gradient">Under 2 Minutes</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              One script tag turns your generic store into a personalized shopping experience.
              No coding required. No performance impact. Works with Shopify, Webflow, and any custom site.
            </p>
          </motion.div>
        </section>

        {/* How It Works — Journey Steps */}
        <section className="container mx-auto px-4 lg:px-8 mb-24">
          <h2 className="text-2xl font-display font-bold text-foreground mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {JOURNEY_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                <div className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all h-full">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                    <h3 className="font-display font-semibold text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{step.desc}</p>
                  <p className="text-xs text-muted-foreground/70">{step.detail}</p>
                </div>
                {i < JOURNEY_STEPS.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-3 w-5 h-5 text-border z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Simulated Install Wizard */}
        <section className="container mx-auto px-4 lg:px-8 mb-24">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">
            Try the Install Wizard
          </h2>
          <p className="text-muted-foreground mb-8">
            Experience the onboarding flow your store owners will see. Connect → Configure → Activate in under 2 minutes.
          </p>
          <InstallWizard />
        </section>

        {/* Template Registry Documentation */}
        <section className="container mx-auto px-4 lg:px-8 mb-24">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">
            Template Registry
          </h2>
          <p className="text-muted-foreground mb-8">
            The system uses a finite set of hero layouts mapped to visitor intents. Each template defines how content is arranged — not what content is shown.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {Object.values(HERO_TEMPLATES).map((tmpl) => (
              <motion.div
                key={tmpl.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-5 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-primary" />
                  <h3 className="font-display font-semibold text-foreground text-sm">{tmpl.name}</h3>
                </div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary mb-3">
                  {tmpl.layoutType}
                </span>
                <p className="text-xs text-muted-foreground mb-3">{tmpl.description}</p>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Content Slots</p>
                  <div className="flex flex-wrap gap-1">
                    {tmpl.slots.map((slot) => (
                      <span
                        key={slot.name}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          slot.required ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {slot.name}{slot.required ? "*" : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-muted-foreground">
                    Alignment: <span className="text-foreground font-medium">{tmpl.config.contentAlignment}</span> · 
                    Image: <span className="text-foreground font-medium">{tmpl.config.imagePosition}</span> · 
                    CTA: <span className="text-foreground font-medium">{tmpl.config.ctaStyle}</span>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Intent → Template Mapping Table */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-xs font-display font-semibold text-foreground">Intent → Template Mapping</span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {TEMPLATE_MAPPINGS.map((mapping) => {
                const tmpl = HERO_TEMPLATES[mapping.templateId];
                return (
                  <div key={mapping.intent} className="flex items-center justify-between px-4 py-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground capitalize w-24">{mapping.intent}</span>
                      <span className="text-muted-foreground">→</span>
                      <code className="font-mono text-primary">{mapping.templateId}</code>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-secondary text-muted-foreground">
                        {tmpl?.layoutType}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      mapping.funnelStage === "buy" ? "bg-budget/10 text-budget" :
                      mapping.funnelStage === "compare" ? "bg-productivity/10 text-productivity" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {mapping.funnelStage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Platform-Specific Installation */}
        <section className="container mx-auto px-4 lg:px-8 mb-24">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Installation Guide</h2>
          <p className="text-muted-foreground mb-8">Choose your platform for step-by-step instructions.</p>

          {/* Platform Tabs */}
          <div className="flex gap-3 mb-8">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePlatform(p.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                  activePlatform === p.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                <p.icon className="w-4 h-4" />
                {p.name}
                <span className={`text-xs ${activePlatform === p.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {p.time}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Steps */}
            <motion.div
              key={activePlatform}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              {platform.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-display font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed pt-1">{step}</p>
                </div>
              ))}
            </motion.div>

            {/* Code Snippet */}
            <motion.div
              key={`code-${activePlatform}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="code-block overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-destructive/60" />
                      <span className="w-3 h-3 rounded-full bg-primary/60" />
                      <span className="w-3 h-3 rounded-full bg-budget/60" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {activePlatform === "shopify" ? "theme.liquid" : activePlatform === "webflow" ? "head-code" : "index.html"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(platform.codeSnippet)}
                    className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-budget" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="p-4 text-sm leading-relaxed overflow-x-auto">
                  <code className="text-foreground/90">{platform.codeSnippet}</code>
                </pre>
              </div>

              {/* Config Attributes Table */}
              <div className="mt-4 rounded-xl bg-card border border-border overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-display font-semibold text-foreground">
                      Configuration Attributes
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { attr: "data-store-id", desc: "Your unique store identifier", required: true },
                    { attr: "data-hero-selector", desc: "CSS selector for the hero container", required: true },
                    { attr: "data-cta-selector", desc: "CSS selector for the CTA button", required: false },
                    { attr: "data-debug", desc: "Show the debug overlay (true/false)", required: false },
                    { attr: "data-analytics", desc: "Send events to GA4/Segment", required: false },
                  ].map((row) => (
                    <div key={row.attr} className="flex items-center justify-between px-4 py-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-primary">{row.attr}</code>
                        {row.required && (
                          <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[9px] font-bold uppercase">
                            required
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground">{row.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Live Intent Switcher */}
        <section className="container mx-auto px-4 lg:px-8 mb-24">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">
            Live Preview — See Every Intent
          </h2>
          <p className="text-muted-foreground mb-8">
            Click an intent to see exactly what your visitors would experience.
          </p>

          {/* Intent Buttons */}
          <div className="flex flex-wrap gap-2 mb-8">
            {ALL_INTENTS.map((intent) => {
              const variant = CONTENT_VARIANTS[intent];
              const isActive = activePreviewIntent === intent;
              return (
                <button
                  key={intent}
                  onClick={() => setActivePreviewIntent(intent)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {variant.badgeText.split(" ").slice(0, 2).join(" ")}
                </button>
              );
            })}
          </div>

          {/* Preview Card */}
          <motion.div
            key={activePreviewIntent}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-card border border-border overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-destructive/60" />
                <span className="w-3 h-3 rounded-full bg-primary/60" />
                <span className="w-3 h-3 rounded-full bg-budget/60" />
              </div>
              <span className="text-xs font-mono text-muted-foreground flex-1 text-center">
                yourstore.com/?utm_campaign={activePreviewIntent}
              </span>
            </div>
            <div className="p-8 lg:p-12">
              <div className="max-w-lg">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-medium"
                  style={{
                    background: `hsl(var(${CONTENT_VARIANTS[activePreviewIntent].accentColor}) / 0.15)`,
                    color: `hsl(var(${CONTENT_VARIANTS[activePreviewIntent].accentColor}))`,
                    border: `1px solid hsl(var(${CONTENT_VARIANTS[activePreviewIntent].accentColor}) / 0.3)`,
                  }}
                >
                  {CONTENT_VARIANTS[activePreviewIntent].badgeText}
                </div>
                <h3 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
                  {CONTENT_VARIANTS[activePreviewIntent].headline}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {CONTENT_VARIANTS[activePreviewIntent].subhead}
                </p>
                <div className="flex gap-3">
                  <Button size="sm" className="bg-primary text-primary-foreground rounded-lg">
                    {CONTENT_VARIANTS[activePreviewIntent].ctaText}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg border-border text-foreground">
                    {CONTENT_VARIANTS[activePreviewIntent].ctaSecondary}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Edge Cases Section */}
        <section className="container mx-auto px-4 lg:px-8 mb-24">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">
            Edge Cases We Handle
          </h2>
          <p className="text-muted-foreground mb-8">
            Production-grade means anticipating everything that can go wrong.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Unknown UTM Campaigns",
                url: "?utm_campaign=mobilephones",
                result: "Graceful fallback to default — no broken experience",
                status: "fallback",
              },
              {
                title: "Compound/Conflicting Signals",
                url: "?q=cheap+gaming+monitor",
                result: "Weighted scoring resolves conflict — first keyword gets priority boost",
                status: "resolved",
              },
              {
                title: "Malformed URL Encoding",
                url: "?q=%E2%9C%93gaming%20monitor",
                result: "Safe URI decoding with try/catch — never crashes",
                status: "handled",
              },
              {
                title: "Short/Ambiguous Queries",
                url: "?q=lg",
                result: "Queries under 3 chars are skipped — too unreliable as signals",
                status: "skipped",
              },
              {
                title: "Multiple Matching Signals",
                url: "?utm_campaign=gaming&ref=linkedin",
                result: "Highest-weight signal wins — utm_campaign (0.95) beats referrer (0.6)",
                status: "resolved",
              },
              {
                title: "Implicit Referrer Detection",
                url: "?ref=github",
                result: "Known domain → Developer intent with 0.75 weight (no keyword matching needed)",
                status: "detected",
              },
              {
                title: "Duplicate Source Decay",
                url: "?utm_campaign=gaming&utm_source=esports",
                result: "Second signal from same source type gets 0.7x weight decay",
                status: "decayed",
              },
              {
                title: "Fuzzy Intent Param",
                url: "?intent=game",
                result: 'Exact match fails → fuzzy keyword match → maps "game" to gaming intent',
                status: "fuzzy",
              },
            ].map((edge) => (
              <motion.div
                key={edge.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-5 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-semibold text-foreground text-sm">{edge.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    edge.status === "fallback" ? "bg-primary/10 text-primary" :
                    edge.status === "resolved" ? "bg-budget/10 text-budget" :
                    edge.status === "handled" ? "bg-productivity/10 text-productivity" :
                    edge.status === "detected" ? "bg-developer/10 text-developer" :
                    edge.status === "fuzzy" ? "bg-creative/10 text-creative" :
                    "bg-student/10 text-student"
                  }`}>
                    {edge.status}
                  </span>
                </div>
                <code className="text-xs font-mono text-primary block mb-2">{edge.url}</code>
                <p className="text-xs text-muted-foreground">{edge.result}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Smart Listener Data Flow Diagram */}
        <section className="container mx-auto px-4 lg:px-8 mb-24">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">
            Smart Listener — Data Flow Architecture
          </h2>
          <p className="text-muted-foreground mb-8">
            End-to-end data flow from visitor click to backend ledger. Every stage is non-blocking, 
            type-safe, and designed for <code className="font-mono text-primary">&lt;15KB</code> bundle with <code className="font-mono text-primary">0ms</code> main-thread blocking.
          </p>

          {/* Data Flow Diagram — Multi-layer */}
          <div className="rounded-xl bg-card border border-border p-6 lg:p-8 space-y-6">
            {/* Layer 1: Frontend Observer */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">1</span>
                <h3 className="text-sm font-display font-semibold text-foreground">Frontend: "The Minimalist Observer"</h3>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border p-4 font-mono text-xs leading-loose">
                <p className="text-muted-foreground">┌───────────────────── <span className="text-primary font-bold">NON-BLOCKING INIT</span> ─────────────────────┐</p>
                <p className="text-muted-foreground">│                                                               │</p>
                <p className="text-muted-foreground">│  <span className="text-developer">requestIdleCallback</span>(() =&gt; {"{"}                              │</p>
                <p className="text-muted-foreground">│    document.addEventListener('<span className="text-gaming">click</span>', handler, {"{"} <span className="text-budget">capture: true</span> {"}"}) │</p>
                <p className="text-muted-foreground">│  {"}"})  ← <span className="text-student">Doesn't compete with LCP</span>                          │</p>
                <p className="text-muted-foreground">│                                                               │</p>
                <p className="text-muted-foreground">│  Click Event                                                  │</p>
                <p className="text-muted-foreground">│    ↓                                                          │</p>
                <p className="text-muted-foreground">│  ┌──────────────────┐  ┌──────────────────┐                   │</p>
                <p className="text-muted-foreground">│  │ <span className="text-creative font-bold">Semantic Scoring</span> │→ │ <span className="text-productivity font-bold">Event Classify</span>   │                   │</p>
                <p className="text-muted-foreground">│  │ text:  +5..+10   │  │ CTA_CLICK        │                   │</p>
                <p className="text-muted-foreground">│  │ class: +3..+8    │  │ NAV_CLICK        │                   │</p>
                <p className="text-muted-foreground">│  │ aria:  +5..+8    │  │ CART_ACTION       │                   │</p>
                <p className="text-muted-foreground">│  └──────────────────┘  │ COMPARE_CLICK    │                   │</p>
                <p className="text-muted-foreground">│                        │ UX_FRICTION      │                   │</p>
                <p className="text-muted-foreground">│    ↓                   └──────────────────┘                   │</p>
                <p className="text-muted-foreground">│  ┌──────────────────────────────────────────┐                 │</p>
                <p className="text-muted-foreground">│  │ <span className="text-destructive font-bold">Frustration Detector</span> (Click Buffer)       │                 │</p>
                <p className="text-muted-foreground">│  │ 3+ clicks in 1000ms → <span className="text-destructive">UX_FRICTION</span> event  │                 │</p>
                <p className="text-muted-foreground">│  │ Suppresses "Salesy" variant overlays     │                 │</p>
                <p className="text-muted-foreground">│  └──────────────────────────────────────────┘                 │</p>
                <p className="text-muted-foreground">│    ↓                                                          │</p>
                <p className="text-muted-foreground">│  ┌──────────────────────────────────────────┐                 │</p>
                <p className="text-muted-foreground">│  │ <span className="text-student font-bold">Middleware Pipeline</span> (plugin.use())          │                 │</p>
                <p className="text-muted-foreground">│  │ Newsletter Signup → CUSTOM event          │                 │</p>
                <p className="text-muted-foreground">│  │ Video Play → CUSTOM event                 │                 │</p>
                <p className="text-muted-foreground">│  └──────────────────────────────────────────┘                 │</p>
                <p className="text-muted-foreground">└───────────────────────────────────────────────────────────────┘</p>
              </div>
            </div>

            {/* Layer 2: Event Payload */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-border" />
                <span className="text-xs font-mono text-muted-foreground">EventPayload (type-safe)</span>
                <div className="h-px w-12 bg-border" />
              </div>
            </div>

            {/* Layer 2: Event Ledger */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">2</span>
                <h3 className="text-sm font-display font-semibold text-foreground">Backend: "The Scalable Ledger"</h3>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border p-4 font-mono text-xs leading-loose">
                <p className="text-muted-foreground">┌───────────────────── <span className="text-budget font-bold">BATCHED EVENTS</span> ───────────────────────┐</p>
                <p className="text-muted-foreground">│                                                               │</p>
                <p className="text-muted-foreground">│  EventPayload → <span className="text-developer">EventLedger.push()</span>                          │</p>
                <p className="text-muted-foreground">│                                                               │</p>
                <p className="text-muted-foreground">│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐   │</p>
                <p className="text-muted-foreground">│  │ <span className="text-creative font-bold">Dedup Check</span>  │→ │ <span className="text-gaming font-bold">localStorage Q</span>   │→ │ <span className="text-productivity font-bold">Batch Flush</span>  │   │</p>
                <p className="text-muted-foreground">│  │ event_id +   │  │ Crash-safe        │  │ Triggers:    │   │</p>
                <p className="text-muted-foreground">│  │ session_id   │  │ Max 50 events     │  │ • batch full │   │</p>
                <p className="text-muted-foreground">│  │ 5s window    │  │ Auto-restore      │  │ • page leave │   │</p>
                <p className="text-muted-foreground">│  └──────────────┘  └──────────────────┘  │ • idle time  │   │</p>
                <p className="text-muted-foreground">│                                          │ • 30s timer  │   │</p>
                <p className="text-muted-foreground">│                                          └──────────────┘   │</p>
                <p className="text-muted-foreground">│                                                               │</p>
                <p className="text-muted-foreground">│  ┌────────────────────────────────────────────────────────┐    │</p>
                <p className="text-muted-foreground">│  │ <span className="text-student font-bold">JSONB Schema</span> (PostgreSQL)                              │    │</p>
                <p className="text-muted-foreground">│  │ event_type | variant_id | session_score | path_url    │    │</p>
                <p className="text-muted-foreground">│  │ is_friction_event | session_id | metadata(JSONB)      │    │</p>
                <p className="text-muted-foreground">│  └────────────────────────────────────────────────────────┘    │</p>
                <p className="text-muted-foreground">└───────────────────────────────────────────────────────────────┘</p>
              </div>
            </div>

            {/* Layer 3: Director's Cut */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">3</span>
                <h3 className="text-sm font-display font-semibold text-foreground">Preview: "Director's Cut"</h3>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border p-4 font-mono text-xs leading-loose">
                <p className="text-muted-foreground">┌───────────────────── <span className="text-creative font-bold">SHADOW DOM ADMIN</span> ──────────────────────┐</p>
                <p className="text-muted-foreground">│                                                               │</p>
                <p className="text-muted-foreground">│  <span className="text-foreground">Isolated Admin Panel</span> (no CSS leakage into host store)      │</p>
                <p className="text-muted-foreground">│                                                               │</p>
                <p className="text-muted-foreground">│  ┌──────────────────┐  ┌────────────────────────────────┐    │</p>
                <p className="text-muted-foreground">│  │ <span className="text-productivity font-bold">Persona Spoofer</span>  │  │ <span className="text-gaming font-bold">Simulation States</span>              │    │</p>
                <p className="text-muted-foreground">│  │ navigator.conn   │  │ Fast Desktop (fiber)           │    │</p>
                <p className="text-muted-foreground">│  │ navigator.ua     │  │ Slow 3G (budget phone)         │    │</p>
                <p className="text-muted-foreground">│  │ GDPR mode        │  │ Screen Reader (NVDA)           │    │</p>
                <p className="text-muted-foreground">│  └──────────────────┘  │ International (EU/GDPR)        │    │</p>
                <p className="text-muted-foreground">│                        └────────────────────────────────┘    │</p>
                <p className="text-muted-foreground">│                                                               │</p>
                <p className="text-muted-foreground">│  Adaptations per persona: image quality, animation toggle,    │</p>
                <p className="text-muted-foreground">│  ARIA live regions, lazy loading, consent banners             │</p>
                <p className="text-muted-foreground">└───────────────────────────────────────────────────────────────┘</p>
              </div>
            </div>

            {/* Layer 4: Middleware */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">4</span>
                <h3 className="text-sm font-display font-semibold text-foreground">Extensibility: Middleware Hooks</h3>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border p-4 font-mono text-xs leading-loose">
                <p className="text-muted-foreground">// <span className="text-primary">Add custom intent detectors without touching core code</span></p>
                <p className="text-muted-foreground">smartListener.<span className="text-gaming">use</span>((element, event) =&gt; {"{"}</p>
                <p className="text-muted-foreground">  <span className="text-creative">// Newsletter signup detection</span></p>
                <p className="text-muted-foreground">  if (element.closest('[data-newsletter]')) {"{"}</p>
                <p className="text-muted-foreground">    return {"{"} event_type: '<span className="text-budget">CUSTOM</span>', label: 'newsletter_signup' {"}"}</p>
                <p className="text-muted-foreground">  {"}"}</p>
                <p className="text-muted-foreground">  <span className="text-creative">// Video play detection</span></p>
                <p className="text-muted-foreground">  if (element.closest('[data-video-play]')) {"{"}</p>
                <p className="text-muted-foreground">    return {"{"} event_type: '<span className="text-budget">CUSTOM</span>', label: 'video_play' {"}"}</p>
                <p className="text-muted-foreground">  {"}"}</p>
                <p className="text-muted-foreground">  return null; <span className="text-creative">// Pass to next middleware</span></p>
                <p className="text-muted-foreground">{"}"});</p>
              </div>
            </div>
          </div>
        </section>

        {/* Original Architecture Diagram (retained) */}
        <section className="container mx-auto px-4 lg:px-8 mb-24">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Widget Architecture</h2>
          <p className="text-muted-foreground mb-8">
            How the widget fits into any e-commerce stack — zero coupling with the host application.
          </p>

          <div className="rounded-xl bg-card border border-border p-8 overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="font-mono text-xs leading-loose space-y-1">
                <p className="text-muted-foreground">┌──────────────────────────────────────────────────────────────────┐</p>
                <p className="text-muted-foreground">│  <span className="text-primary font-bold">VISITOR BROWSER</span>                                                │</p>
                <p className="text-muted-foreground">│                                                                  │</p>
                <p className="text-muted-foreground">│  ┌─────────────┐    ┌───────────────────────────────────────┐   │</p>
                <p className="text-muted-foreground">│  │ <span className="text-foreground">URL Signals</span> │──→ │ <span className="text-gaming font-bold">SmartSwap Widget</span> (12KB gzip)        │   │</p>
                <p className="text-muted-foreground">│  │ utm_campaign │    │                                       │   │</p>
                <p className="text-muted-foreground">│  │ referrer     │    │  ┌─────────┐  ┌──────┐  ┌──────────┐ │   │</p>
                <p className="text-muted-foreground">│  │ query params │    │  │ <span className="text-productivity">Collect</span> │→ │ <span className="text-creative">Score</span> │→ │ <span className="text-budget">Swap DOM</span> │ │   │</p>
                <p className="text-muted-foreground">│  │ cookies      │    │  └─────────┘  └──────┘  └──────────┘ │   │</p>
                <p className="text-muted-foreground">│  └─────────────┘    │                                       │   │</p>
                <p className="text-muted-foreground">│                     │  <span className="text-developer">Safety: Unknown → Default fallback</span>  │   │</p>
                <p className="text-muted-foreground">│                     └───────────────────────────────────────┘   │</p>
                <p className="text-muted-foreground">│                              ↓                                   │</p>
                <p className="text-muted-foreground">│  ┌───────────────────────────────────────────────────────────┐   │</p>
                <p className="text-muted-foreground">│  │ <span className="text-foreground font-bold">Host Store</span> (Shopify / Webflow / Custom)                  │   │</p>
                <p className="text-muted-foreground">│  │                                                           │   │</p>
                <p className="text-muted-foreground">│  │  #hero-container  ← <span className="text-student">Only this element is modified</span>       │   │</p>
                <p className="text-muted-foreground">│  │  .hero-cta        ← <span className="text-student">Text & href swapped</span>                │   │</p>
                <p className="text-muted-foreground">│  │  [everything else] ← <span className="text-budget">Untouched ✓</span>                       │   │</p>
                <p className="text-muted-foreground">│  └───────────────────────────────────────────────────────────┘   │</p>
                <p className="text-muted-foreground">└──────────────────────────────────────────────────────────────────┘</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 lg:px-8">
          <div className="rounded-2xl bg-card border border-border p-10 lg:p-16 text-center">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
              Ready to Personalize?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              See the full demo in action. Try different URL parameters and watch the store transform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/?utm_campaign=gaming")}
                className="bg-primary text-primary-foreground px-8 py-6 rounded-xl text-base font-semibold group"
              >
                <Play className="w-4 h-4 mr-2" />
                Try Gaming Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/?ref=dribbble")}
                className="border-border text-foreground px-8 py-6 rounded-xl text-base font-medium"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Try Creative Demo
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 SmartSwap AI Personalization Layer — Integration Demo
          </p>
        </div>
      </footer>
    </div>
  );
};

export default IntegrationGuide;
