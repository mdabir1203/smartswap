import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, ChevronDown, ChevronUp, Zap, Eye, Brain, Shield, AlertTriangle, BarChart3, Layers, FileText, ShoppingCart, Search, Compass } from "lucide-react";
import type { IntentResult, IntentType } from "@/lib/personalization-engine";
import type { BehaviorSignal } from "@/hooks/use-behavior-tracking";
import BehaviorPanel from "@/components/BehaviorPanel";

interface BehaviorState {
  signals: BehaviorSignal[];
  isTracking: boolean;
  trackingComplete: boolean;
  scrollDepth: number;
  clickCount: number;
  firstInteractionMs: number | null;
}

interface DebugOverlayProps {
  result: IntentResult;
  behavior?: BehaviorState;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-budget",
  medium: "text-primary",
  low: "text-destructive",
};

const INTENT_LABELS: Record<IntentType, { icon: string; label: string }> = {
  gaming: { icon: "🎮", label: "Gaming" },
  productivity: { icon: "💼", label: "Productivity" },
  budget: { icon: "💰", label: "Budget" },
  creative: { icon: "🎨", label: "Creative" },
  student: { icon: "🎓", label: "Student" },
  developer: { icon: "⌨️", label: "Developer" },
  default: { icon: "🏠", label: "Default" },
};

const FUNNEL_ICONS: Record<string, React.ElementType> = {
  buy: ShoppingCart,
  compare: Search,
  explore: Compass,
};

const DebugOverlay = ({ result, behavior }: DebugOverlayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const intentInfo = INTENT_LABELS[result.intent];
  const confidenceColor = CONFIDENCE_COLORS[result.confidence];
  const maxScore = Math.max(...Object.values(result.scoreBreakdown), 0.1);

  // §2.5: Read funnel stage from engine decision, not hardcoded
  const FunnelIcon = FUNNEL_ICONS[result.funnelStage] || Compass;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1, duration: 0.4 }}
      className="fixed bottom-4 right-4 z-[100] w-[360px] glass-panel rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-primary" />
          <span className="text-xs font-display font-semibold text-foreground tracking-wide">
            AI ENGINE v3 — DECISION OUTPUT
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Quick Status — all from engine decision */}
      <div className="px-4 pb-3 flex items-center gap-2 text-xs flex-wrap">
        <span className="text-muted-foreground">
          {intentInfo.icon} <span className="text-foreground font-medium">{intentInfo.label}</span>
        </span>
        <span className="text-border">|</span>
        <span className={`font-semibold uppercase ${confidenceColor}`}>{result.confidence}</span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <FunnelIcon className="w-3 h-3" />
          <span className="capitalize font-medium text-foreground">{result.funnelStage}</span>
        </span>
        <span className="text-border">|</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {result.templateId}
        </span>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border max-h-[60vh] overflow-y-auto"
          >
            <div className="px-4 py-3 space-y-3">

              {/* §2.5: Structured Decision Object — the spec's required output */}
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Structured Decision Object (§2.5)
                  </p>
                  <div className="code-block rounded-lg p-3 text-[10px] font-mono leading-relaxed space-y-0.5">
                    <p><span className="text-muted-foreground">{"{"}</span></p>
                    <p>  <span className="text-creative">"intent"</span>: <span className="text-budget">"{result.intent}"</span>,</p>
                    <p>  <span className="text-creative">"template"</span>: <span className="text-budget">"{result.templateId}"</span>,</p>
                    <p>  <span className="text-creative">"hero_image"</span>: <span className="text-budget">"{result.heroImageKey}"</span>,</p>
                    <p>  <span className="text-creative">"cta"</span>: <span className="text-budget">"{result.ctaDecision.text}"</span>,</p>
                    <p>  <span className="text-creative">"cta_link"</span>: <span className="text-budget">"{result.ctaDecision.link}"</span>,</p>
                    <p>  <span className="text-creative">"funnel_stage"</span>: <span className="text-budget">"{result.funnelStage}"</span>,</p>
                    <p>  <span className="text-creative">"section_order"</span>: <span className="text-budget">[{result.sectionOrder.map(s => `"${s}"`).join(", ")}]</span>,</p>
                    <p>  <span className="text-creative">"reason"</span>: <span className="text-foreground/70">"{result.reasoning.slice(0, 60)}..."</span></p>
                    <p><span className="text-muted-foreground">{"}"}</span></p>
                  </div>
                </div>
              </div>

              {/* CTA Decision */}
              <div className="flex items-start gap-2">
                <FunnelIcon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    CTA Decision ({result.ctaDecision.priority})
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      result.ctaDecision.priority === "buy" ? "bg-budget/10 text-budget" :
                      result.ctaDecision.priority === "compare" ? "bg-productivity/10 text-productivity" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {result.ctaDecision.priority}
                    </span>
                    <span className="text-foreground font-medium">"{result.ctaDecision.text}"</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono text-primary text-[10px]">{result.ctaDecision.link}</span>
                  </div>
                </div>
              </div>

              {/* Section Order from engine */}
              <div className="flex items-start gap-2">
                <Layers className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Section Order (engine-decided)
                  </p>
                  <div className="flex items-center gap-1.5">
                    {result.sectionOrder.map((section, i) => (
                      <span key={section} className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-secondary text-[10px] font-mono text-foreground">
                          {section}
                        </span>
                        {i < result.sectionOrder.length - 1 && (
                          <span className="text-muted-foreground text-[10px]">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Injection Log (§2.6) */}
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-developer mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Injection Log (§2.6)
                  </p>
                  <div className="space-y-0.5">
                    {result.injectionLog.map((entry, i) => (
                      <p key={i} className="text-[10px] text-developer/80 font-mono leading-relaxed">
                        [{i + 1}] {entry}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="flex items-start gap-2">
                <Brain className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Reasoning
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">
                    {result.reasoning}
                  </p>
                </div>
              </div>

              {/* Behavior Signals */}
              {behavior && (
                <BehaviorPanel
                  signals={behavior.signals}
                  isTracking={behavior.isTracking}
                  trackingComplete={behavior.trackingComplete}
                  scrollDepth={behavior.scrollDepth}
                  clickCount={behavior.clickCount}
                  firstInteractionMs={behavior.firstInteractionMs}
                />
              )}

              {/* Score Breakdown */}
              <div className="flex items-start gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Intent Scores
                  </p>
                  <div className="space-y-1">
                    {Object.entries(result.scoreBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([intent, score]) => {
                        const info = INTENT_LABELS[intent as IntentType];
                        return (
                          <div key={intent} className="flex items-center gap-2">
                            <span className="text-[10px] w-16 shrink-0">
                              {info?.icon} {info?.label}
                            </span>
                            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(score / maxScore) * 100}%` }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className={`h-full rounded-full ${
                                  intent === result.intent ? "bg-primary" : "bg-muted-foreground/30"
                                }`}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                              {score.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* URL Signals */}
              {result.signals.length > 0 && (
                <div className="flex items-start gap-2">
                  <Eye className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      URL Signals ({result.signals.length})
                    </p>
                    <div className="space-y-1.5">
                      {result.signals.map((signal, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-md bg-secondary/50 px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-primary" />
                            <span className="text-[11px] text-foreground font-mono">
                              {signal.source}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono truncate ml-2">
                            "{signal.value}" → <span className="text-primary">{signal.intentMatch}</span>
                            <span className="text-muted-foreground/50 ml-1">w:{signal.weight.toFixed(2)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Edge Cases */}
              {result.edgeCases.length > 0 && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-student mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Edge Cases ({result.edgeCases.length})
                    </p>
                    <div className="space-y-1">
                      {result.edgeCases.map((ec, i) => (
                        <p key={i} className="text-[10px] text-student/80 leading-relaxed">
                          ⚠ {ec}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Safety */}
              <div className="flex items-start gap-2 pt-1 border-t border-border">
                <Shield className="w-3.5 h-3.5 text-budget mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Safety layer active. Ambiguous signals fallback to default. Behavior tracking is read-only (no cookies/PII stored).
                </p>
              </div>

              {/* Test URLs */}
              <div className="pt-1 border-t border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Test URLs
                </p>
                <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                  <p>?utm_campaign=gaming <span className="text-gaming">→ buy · products first</span></p>
                  <p>?ref=linkedin <span className="text-productivity">→ compare · funnel CTA first</span></p>
                  <p>?q=cheap <span className="text-budget">→ buy · products first</span></p>
                  <p>?ref=dribbble <span className="text-creative">→ explore · trust first</span></p>
                  <p>?ref=github <span className="text-developer">→ compare · funnel CTA first</span></p>
                  <p>?q=student <span className="text-student">→ explore · trust first</span></p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DebugOverlay;
