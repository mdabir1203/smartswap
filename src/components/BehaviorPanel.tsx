/**
 * BEHAVIOR SIGNALS PANEL — Sub-component for DebugOverlay
 * 
 * Shows real-time behavior tracking results from the first 5 seconds
 * of a page visit: scroll depth, click targets, interaction speed.
 */

import { motion } from "framer-motion";
import { Activity, MousePointerClick, ArrowDown, Zap } from "lucide-react";
import type { BehaviorSignal } from "@/hooks/use-behavior-tracking";

interface BehaviorPanelProps {
  signals: BehaviorSignal[];
  isTracking: boolean;
  trackingComplete: boolean;
  scrollDepth: number;
  clickCount: number;
  firstInteractionMs: number | null;
}

const SIGNAL_ICONS: Record<string, React.ElementType> = {
  scroll_depth: ArrowDown,
  click_target: MousePointerClick,
  dwell_zone: Activity,
  interaction_speed: Zap,
};

const BehaviorPanel = ({
  signals,
  isTracking,
  trackingComplete,
  scrollDepth,
  clickCount,
  firstInteractionMs,
}: BehaviorPanelProps) => {
  return (
    <div className="flex items-start gap-2">
      <Activity className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Behavior Signals
          </p>
          {isTracking && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-budget uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-budget animate-pulse" />
              Tracking...
            </span>
          )}
          {trackingComplete && (
            <span className="text-[9px] font-bold text-muted-foreground uppercase">
              Complete
            </span>
          )}
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="rounded-md bg-secondary/50 px-2 py-1.5 text-center">
            <p className="text-[10px] text-muted-foreground">Scroll</p>
            <p className="text-xs font-bold text-foreground">{scrollDepth}%</p>
          </div>
          <div className="rounded-md bg-secondary/50 px-2 py-1.5 text-center">
            <p className="text-[10px] text-muted-foreground">Clicks</p>
            <p className="text-xs font-bold text-foreground">{clickCount}</p>
          </div>
          <div className="rounded-md bg-secondary/50 px-2 py-1.5 text-center">
            <p className="text-[10px] text-muted-foreground">1st Act</p>
            <p className="text-xs font-bold text-foreground">
              {firstInteractionMs !== null ? `${(firstInteractionMs / 1000).toFixed(1)}s` : "—"}
            </p>
          </div>
        </div>

        {/* Signal List */}
        {signals.length > 0 && (
          <div className="space-y-1">
            {signals.slice(-4).map((signal, i) => {
              const Icon = SIGNAL_ICONS[signal.type] || Activity;
              return (
                <motion.div
                  key={`${signal.type}-${i}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 rounded-md bg-secondary/30 px-2 py-1"
                >
                  <Icon className="w-2.5 h-2.5 text-primary shrink-0" />
                  <span className="text-[9px] text-muted-foreground truncate flex-1">
                    {signal.value}
                  </span>
                  {signal.inferredIntent && (
                    <span className="text-[8px] font-bold text-primary uppercase">
                      → {signal.inferredIntent}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {!trackingComplete && signals.length === 0 && (
          <p className="text-[10px] text-muted-foreground/60 italic">
            Scroll or click to generate behavior signals (5s window)
          </p>
        )}
      </div>
    </div>
  );
};

export default BehaviorPanel;
