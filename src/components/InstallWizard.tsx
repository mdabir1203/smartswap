/**
 * SIMULATED INSTALL WIZARD
 * 
 * A multi-step "Connect Store → Configure → Activate" flow
 * simulating the real onboarding journey for SMB store owners.
 * 
 * Steps:
 * 1. Connect — Choose platform & enter store URL
 * 2. Configure — Set selectors & pick intents
 * 3. Activate — Review & deploy
 * 4. Done — Success confirmation
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Globe, Code, Check, ChevronRight,
  Settings, Zap, ArrowRight, Rocket, Copy,
  Shield, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type WizardStep = "connect" | "configure" | "activate" | "done";

const STEPS: { id: WizardStep; label: string; icon: React.ElementType }[] = [
  { id: "connect", label: "Connect Store", icon: ShoppingBag },
  { id: "configure", label: "Configure", icon: Settings },
  { id: "activate", label: "Activate", icon: Zap },
  { id: "done", label: "Live!", icon: Check },
];

const PLATFORM_OPTIONS = [
  { id: "shopify", name: "Shopify", icon: ShoppingBag, desc: "One-click install via Shopify App Store" },
  { id: "webflow", name: "Webflow", icon: Globe, desc: "Paste into Project Settings → Custom Code" },
  { id: "custom", name: "Custom HTML", icon: Code, desc: "Add script tag to your HTML head" },
];

const InstallWizard = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>("connect");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState("");
  const [heroSelector, setHeroSelector] = useState("#hero-container");
  const [ctaSelector, setCtaSelector] = useState(".hero-cta");
  const [enableDebug, setEnableDebug] = useState(true);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [selectedIntents, setSelectedIntents] = useState<string[]>(["gaming", "productivity", "budget"]);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canProceedFromConnect = selectedPlatform && storeUrl.length > 3;
  const canProceedFromConfigure = heroSelector.length > 0;

  const goNext = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEPS.length) {
      setCurrentStep(STEPS[nextIdx].id);
    }
  };

  const goBack = () => {
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) {
      setCurrentStep(STEPS[prevIdx].id);
    }
  };

  const reset = () => {
    setCurrentStep("connect");
    setSelectedPlatform(null);
    setStoreUrl("");
    setHeroSelector("#hero-container");
    setCtaSelector(".hero-cta");
    setEnableDebug(true);
    setCopiedSnippet(false);
  };

  const generatedSnippet = `<!-- PixelVue AI Personalization -->
<script 
  src="https://cdn.pixelvue.ai/widget.js" 
  data-store-id="${storeUrl ? btoa(storeUrl).slice(0, 12) : 'YOUR_ID'}"
  data-hero-selector="${heroSelector}"
  data-cta-selector="${ctaSelector}"
  data-intents="${selectedIntents.join(",")}"${enableDebug ? '\n  data-debug="true"' : ""}
  async
></script>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(generatedSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const toggleIntent = (intent: string) => {
    setSelectedIntents((prev) =>
      prev.includes(intent)
        ? prev.filter((i) => i !== intent)
        : [...prev, intent]
    );
  };

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Step Progress Bar */}
      <div className="flex items-center border-b border-border bg-secondary/30">
        {STEPS.map((step, i) => {
          const isActive = step.id === currentStep;
          const isCompleted = i < stepIndex;
          return (
            <div key={step.id} className="flex-1 flex items-center">
              <button
                onClick={() => isCompleted && setCurrentStep(step.id)}
                disabled={!isCompleted}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-3 text-xs font-medium transition-all ${
                  isActive
                    ? "text-primary bg-primary/5 border-b-2 border-primary"
                    : isCompleted
                    ? "text-foreground cursor-pointer hover:bg-secondary/50"
                    : "text-muted-foreground cursor-default"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCompleted
                      ? "bg-budget text-background"
                      : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className={`w-4 h-4 shrink-0 ${isCompleted ? "text-budget" : "text-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="p-6 lg:p-8"
        >
          {/* STEP 1: Connect */}
          {currentStep === "connect" && (
            <div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">
                Connect Your Store
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose your platform and enter your store URL. We'll generate a personalized install snippet.
              </p>

              {/* Platform Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {PLATFORM_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedPlatform === p.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 bg-secondary/20"
                    }`}
                  >
                    <p.icon className={`w-5 h-5 mb-2 ${selectedPlatform === p.id ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{p.desc}</p>
                  </button>
                ))}
              </div>

              {/* Store URL */}
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Store URL
              </label>
              <input
                type="text"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder={
                  selectedPlatform === "shopify"
                    ? "mystore.myshopify.com"
                    : selectedPlatform === "webflow"
                    ? "mysite.webflow.io"
                    : "www.mysite.com"
                }
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-6"
              />

              <div className="flex justify-end">
                <Button
                  onClick={goNext}
                  disabled={!canProceedFromConnect}
                  className="bg-primary text-primary-foreground rounded-xl px-6 gap-2"
                >
                  Configure
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Configure */}
          {currentStep === "configure" && (
            <div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">
                Configure Selectors & Intents
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Tell the widget which elements to personalize and which intents to activate.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                    Hero Container Selector
                  </label>
                  <input
                    type="text"
                    value={heroSelector}
                    onChange={(e) => setHeroSelector(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">CSS selector for your hero section</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                    CTA Button Selector
                  </label>
                  <input
                    type="text"
                    value={ctaSelector}
                    onChange={(e) => setCtaSelector(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">CSS selector for the main CTA button</p>
                </div>
              </div>

              {/* Intent Toggles */}
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Active Intents
              </label>
              <div className="flex flex-wrap gap-2 mb-6">
                {["gaming", "productivity", "budget", "creative", "student", "developer"].map((intent) => (
                  <button
                    key={intent}
                    onClick={() => toggleIntent(intent)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedIntents.includes(intent)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {intent.charAt(0).toUpperCase() + intent.slice(1)}
                  </button>
                ))}
              </div>

              {/* Debug Toggle */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border mb-6">
                <button
                  onClick={() => setEnableDebug(!enableDebug)}
                  className={`w-10 h-6 rounded-full transition-all flex items-center ${
                    enableDebug ? "bg-primary justify-end" : "bg-muted justify-start"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-foreground mx-0.5" />
                </button>
                <div>
                  <p className="text-sm font-medium text-foreground">Debug Overlay</p>
                  <p className="text-[10px] text-muted-foreground">Show intent detection details on your store (recommended for setup)</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={goBack} className="rounded-xl border-border text-foreground">
                  Back
                </Button>
                <Button
                  onClick={goNext}
                  disabled={!canProceedFromConfigure}
                  className="bg-primary text-primary-foreground rounded-xl px-6 gap-2"
                >
                  Review & Activate
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Activate */}
          {currentStep === "activate" && (
            <div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">
                Review & Activate
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Here's your personalized install snippet. Copy it and paste it into your site.
              </p>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Platform</p>
                  <p className="text-sm font-medium text-foreground capitalize">{selectedPlatform}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Store</p>
                  <p className="text-sm font-medium text-foreground truncate">{storeUrl || "—"}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Intents</p>
                  <p className="text-sm font-medium text-foreground">{selectedIntents.length} active</p>
                </div>
              </div>

              {/* Generated Snippet */}
              <div className="code-block overflow-hidden mb-4">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-destructive/60" />
                      <span className="w-3 h-3 rounded-full bg-primary/60" />
                      <span className="w-3 h-3 rounded-full bg-budget/60" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      Your install snippet
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopySnippet}
                    className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    {copiedSnippet ? (
                      <><Check className="w-3.5 h-3.5 text-budget" /> Copied!</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Copy</>
                    )}
                  </Button>
                </div>
                <pre className="p-4 text-sm leading-relaxed overflow-x-auto">
                  <code className="text-foreground/90">{generatedSnippet}</code>
                </pre>
              </div>

              {/* Safety Note */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-budget/5 border border-budget/20 mb-6">
                <Shield className="w-4 h-4 text-budget mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Safe & Non-Destructive</p>
                  <p className="text-[11px] text-muted-foreground">
                    The widget only modifies the hero and CTA elements matching your selectors.
                    If anything goes wrong, it falls back to your original content. Removing the script tag
                    instantly restores your site.
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={goBack} className="rounded-xl border-border text-foreground">
                  Back
                </Button>
                <Button
                  onClick={goNext}
                  className="bg-budget text-background rounded-xl px-6 gap-2 font-semibold"
                >
                  <Rocket className="w-4 h-4" />
                  Activate Personalization
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Done */}
          {currentStep === "done" && (
            <div className="text-center py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-budget/20 flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles className="w-8 h-8 text-budget" />
              </motion.div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                You're Live! 🎉
              </h3>
              <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                The PixelVue AI personalization layer is now active on <strong className="text-foreground">{storeUrl}</strong>.
              </p>
              <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                Every visitor will now see a hero experience tailored to their intent.
                Open your store with <code className="font-mono text-primary">?debug=true</code> to see the overlay.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border text-center">
                  <p className="text-lg font-bold text-foreground">{selectedIntents.length}</p>
                  <p className="text-[10px] text-muted-foreground">Active Intents</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 border border-border text-center">
                  <p className="text-lg font-bold text-foreground">12KB</p>
                  <p className="text-[10px] text-muted-foreground">Widget Size</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 border border-border text-center">
                  <p className="text-lg font-bold text-foreground">0ms</p>
                  <p className="text-[10px] text-muted-foreground">CLS Impact</p>
                </div>
              </div>

              <Button
                onClick={reset}
                variant="outline"
                className="rounded-xl border-border text-foreground"
              >
                Start Over (Demo)
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InstallWizard;
