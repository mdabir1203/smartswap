import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, ChevronDown, ChevronUp, Zap, Eye, Brain, Shield } from "lucide-react";
import type { IntentResult, IntentType } from "@/lib/personalization-engine";

interface DebugOverlayProps {
  result: IntentResult;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-budget",       // Green
  medium: "text-primary",    // Amber
  low: "text-destructive",   // Red
};

const INTENT_LABELS: Record<IntentType, { icon: string; label: string }> = {
  gaming: { icon: "🎮", label: "Gaming" },
  productivity: { icon: "💼", label: "Productivity" },
  budget: { icon: "💰", label: "Budget" },
  default: { icon: "🏠", label: "Default" },
};

const DebugOverlay = ({ result }: DebugOverlayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const intentInfo = INTENT_LABELS[result.intent];
  const confidenceColor = CONFIDENCE_COLORS[result.confidence];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1, duration: 0.4 }}
      className="fixed bottom-4 right-4 z-[100] w-80 glass-panel rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header — Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-primary" />
          <span className="text-xs font-display font-semibold text-foreground tracking-wide">
            AI PERSONALIZATION DEBUG
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Quick Status Bar */}
      <div className="px-4 pb-3 flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">
          Intent: <span className="text-foreground font-medium">{intentInfo.icon} {intentInfo.label}</span>
        </span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">
          Confidence: <span className={`font-semibold uppercase ${confidenceColor}`}>{result.confidence}</span>
        </span>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border"
          >
            <div className="px-4 py-3 space-y-3">
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

              {/* Signals */}
              {result.signals.length > 0 && (
                <div className="flex items-start gap-2">
                  <Eye className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Detected Signals ({result.signals.length})
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
                          <span className="text-[10px] text-muted-foreground font-mono">
                            "{signal.value}" → <span className="text-primary">{signal.intentMatch}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Safety Notice */}
              <div className="flex items-start gap-2 pt-1 border-t border-border">
                <Shield className="w-3.5 h-3.5 text-budget mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Safety layer active. Ambiguous signals always fallback to default variant.
                </p>
              </div>

              {/* Try It */}
              <div className="pt-1 border-t border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Try these URLs
                </p>
                <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                  <p>?utm_campaign=gaming</p>
                  <p>?ref=linkedin</p>
                  <p>?q=cheap</p>
                  <p>?intent=budget</p>
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
