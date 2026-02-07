/**
 * SMART LISTENER PANEL — Sub-component for DebugOverlay
 * 
 * Shows real-time Smart Listener activity:
 *   - Semantic event stream
 *   - Frustration detection alerts
 *   - Event ledger batch status
 *   - Session metrics
 */

import { motion } from "framer-motion";
import {
  Radio, AlertTriangle, Database, Send, Zap,
  MousePointerClick, ShoppingCart, BarChart3, Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SmartListenerState } from "@/hooks/use-smart-listener";
import type { SmartEventType } from "@/lib/smart-listener";

interface SmartListenerPanelProps {
  state: SmartListenerState;
}

const EVENT_TYPE_ICONS: Record<SmartEventType, React.ElementType> = {
  CTA_CLICK: MousePointerClick,
  NAV_CLICK: Navigation,
  PRODUCT_CLICK: ShoppingCart,
  COMPARE_CLICK: BarChart3,
  CART_ACTION: ShoppingCart,
  UX_FRICTION: AlertTriangle,
  SCROLL_MILESTONE: Zap,
  CUSTOM: Radio,
};

const EVENT_TYPE_COLORS: Record<SmartEventType, string> = {
  CTA_CLICK: "text-primary",
  NAV_CLICK: "text-muted-foreground",
  PRODUCT_CLICK: "text-creative",
  COMPARE_CLICK: "text-productivity",
  CART_ACTION: "text-budget",
  UX_FRICTION: "text-destructive",
  SCROLL_MILESTONE: "text-developer",
  CUSTOM: "text-student",
};

const SmartListenerPanel = ({ state }: SmartListenerPanelProps) => {
  const { events, frictionEvents, metrics, ledgerStats, queueSize, flushNow } = state;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-primary shrink-0" />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Smart Listener
        </p>
        {metrics.isInitialized && (
          <span className="flex items-center gap-1 text-[9px] font-bold text-budget uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-budget animate-pulse" />
            Active
          </span>
        )}
      </div>

      {/* Session Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md bg-secondary/50 px-2 py-1.5 text-center">
          <p className="text-[10px] text-muted-foreground">Events</p>
          <p className="text-xs font-bold text-foreground">{metrics.eventCount}</p>
        </div>
        <div className="rounded-md bg-secondary/50 px-2 py-1.5 text-center">
          <p className="text-[10px] text-muted-foreground">Score</p>
          <p className="text-xs font-bold text-foreground">{metrics.sessionScore.toFixed(2)}</p>
        </div>
        <div className="rounded-md bg-secondary/50 px-2 py-1.5 text-center">
          <p className="text-[10px] text-muted-foreground">Friction</p>
          <p className={`text-xs font-bold ${frictionEvents.length > 0 ? "text-destructive" : "text-foreground"}`}>
            {frictionEvents.length}
          </p>
        </div>
      </div>

      {/* Friction Alert */}
      {frictionEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-2.5 py-2"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
          <p className="text-[10px] text-destructive font-medium">
            UX_FRICTION detected — rage click on "{frictionEvents[frictionEvents.length - 1]?.element_meta.text.slice(0, 30)}"
          </p>
        </motion.div>
      )}

      {/* Event Stream (last 5) */}
      {events.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Event Stream
          </p>
          {events.slice(-5).map((event, i) => {
            const Icon = EVENT_TYPE_ICONS[event.event_type] || Radio;
            const color = EVENT_TYPE_COLORS[event.event_type] || "text-muted-foreground";
            return (
              <motion.div
                key={event.event_id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 rounded-md bg-secondary/30 px-2 py-1"
              >
                <Icon className={`w-2.5 h-2.5 shrink-0 ${color}`} />
                <span className={`text-[9px] font-bold uppercase ${color}`}>
                  {event.event_type}
                </span>
                <span className="text-[8px] text-muted-foreground truncate flex-1">
                  {event.element_meta.text.slice(0, 30)}
                </span>
                <span className="text-[8px] font-mono text-muted-foreground">
                  s:{event.semantic_scores.total}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Event Ledger Status */}
      <div className="flex items-start gap-2">
        <Database className="w-3 h-3 text-primary mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Event Ledger
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px]">
            <span className="text-muted-foreground">Queue:</span>
            <span className="text-foreground font-mono">{queueSize} events</span>
            <span className="text-muted-foreground">Batches sent:</span>
            <span className="text-foreground font-mono">{ledgerStats.total_batches_sent}</span>
            <span className="text-muted-foreground">Dedup dropped:</span>
            <span className="text-foreground font-mono">{ledgerStats.total_duplicates_dropped}</span>
            <span className="text-muted-foreground">Last flush:</span>
            <span className="text-foreground font-mono">
              {ledgerStats.last_flush_trigger || "—"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={flushNow}
            className="mt-1.5 h-6 px-2 text-[9px] text-primary hover:text-primary gap-1"
          >
            <Send className="w-2.5 h-2.5" />
            Flush Now
          </Button>
        </div>
      </div>

      {events.length === 0 && (
        <p className="text-[10px] text-muted-foreground/60 italic">
          Click buttons or links to generate semantic events
        </p>
      )}
    </div>
  );
};

export default SmartListenerPanel;
