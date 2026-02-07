/**
 * REACT HOOK: useSmartListener
 * 
 * Bridges the framework-agnostic SmartListener + EventLedger
 * with the React component tree. Provides real-time state
 * updates for the debug overlay.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  SmartListener,
  createSmartListener,
  type EventPayload,
  type SmartListenerConfig,
} from "@/lib/smart-listener";
import {
  EventLedger,
  createEventLedger,
  type EventBatch,
  type LedgerStats,
  type LedgerConfig,
} from "@/lib/event-ledger";

export interface SmartListenerState {
  /** All captured events (capped at 50) */
  events: EventPayload[];
  /** Latest event */
  latestEvent: EventPayload | null;
  /** Frustration events */
  frictionEvents: EventPayload[];
  /** Session metrics */
  metrics: {
    sessionId: string;
    eventCount: number;
    sessionScore: number;
    isInitialized: boolean;
    middlewareCount: number;
    frustrationBufferSize: number;
  };
  /** Ledger stats */
  ledgerStats: LedgerStats;
  /** Flushed batches */
  batches: EventBatch[];
  /** Current queue size */
  queueSize: number;
  /** Manual flush function */
  flushNow: () => void;
  /** Plugin.use() pass-through */
  listener: SmartListener | null;
}

interface UseSmartListenerOptions {
  enabled?: boolean;
  listenerConfig?: Partial<SmartListenerConfig>;
  ledgerConfig?: Partial<LedgerConfig>;
}

export function useSmartListener(options: UseSmartListenerOptions = {}): SmartListenerState {
  const { enabled = true, listenerConfig = {}, ledgerConfig = {} } = options;

  const [events, setEvents] = useState<EventPayload[]>([]);
  const [latestEvent, setLatestEvent] = useState<EventPayload | null>(null);
  const [frictionEvents, setFrictionEvents] = useState<EventPayload[]>([]);
  const [metrics, setMetrics] = useState({
    sessionId: "",
    eventCount: 0,
    sessionScore: 0,
    isInitialized: false,
    middlewareCount: 0,
    frustrationBufferSize: 0,
  });
  const [ledgerStats, setLedgerStats] = useState<LedgerStats>({
    total_events_received: 0,
    total_events_flushed: 0,
    total_batches_sent: 0,
    total_duplicates_dropped: 0,
    queue_size: 0,
    last_flush_at: null,
    last_flush_trigger: null,
  });
  const [batches, setBatches] = useState<EventBatch[]>([]);
  const [queueSize, setQueueSize] = useState(0);

  const listenerRef = useRef<SmartListener | null>(null);
  const ledgerRef = useRef<EventLedger | null>(null);

  const handleEvent = useCallback((payload: EventPayload) => {
    setEvents(prev => {
      const next = [...prev, payload];
      return next.length > 50 ? next.slice(-50) : next;
    });
    setLatestEvent(payload);

    // Push to ledger
    ledgerRef.current?.push(payload);
    setQueueSize(ledgerRef.current?.currentQueue.length ?? 0);
    setLedgerStats(ledgerRef.current?.getStats() ?? ledgerStats);

    // Update metrics
    if (listenerRef.current) {
      setMetrics(listenerRef.current.metrics);
    }
  }, []);

  const handleFrustration = useCallback((payload: EventPayload) => {
    setFrictionEvents(prev => [...prev, payload].slice(-10));
  }, []);

  const handleFlush = useCallback((batch: EventBatch) => {
    setBatches(prev => [...prev, batch].slice(-10));
    setQueueSize(0);
    if (ledgerRef.current) {
      setLedgerStats(ledgerRef.current.getStats());
    }
  }, []);

  const flushNow = useCallback(() => {
    ledgerRef.current?.flush("manual");
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Create instances
    const listener = createSmartListener({
      ...listenerConfig,
      onEvent: handleEvent,
      onFrustration: handleFrustration,
    });

    const ledger = createEventLedger({
      ...ledgerConfig,
      onFlush: handleFlush,
    });

    listenerRef.current = listener;
    ledgerRef.current = ledger;

    // Initialize both
    listener.init();
    ledger.init();

    // Update initial metrics
    setMetrics(listener.metrics);

    return () => {
      listener.destroy();
      ledger.destroy();
      listenerRef.current = null;
      ledgerRef.current = null;
    };
  }, [enabled]);

  return {
    events,
    latestEvent,
    frictionEvents,
    metrics,
    ledgerStats,
    batches,
    queueSize,
    flushNow,
    listener: listenerRef.current,
  };
}
