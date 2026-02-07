/**
 * ============================================================
 * EVENT LEDGER — "The Scalable Ledger"
 * ============================================================
 * 
 * Client-side event batching and deduplication system.
 * 
 * Architecture:
 *   1. Events are queued in memory (not sent immediately)
 *   2. Batched flush on: page transitions, idle time, or buffer full
 *   3. Persisted to localStorage between page loads
 *   4. Deduplication by event_id + session_id
 *   5. JSONB-compatible schema for PostgreSQL/MongoDB backend
 * 
 * Performance:
 *   - No per-click server pings (saves battery + bandwidth)
 *   - localStorage acts as crash-safe buffer
 *   - Configurable flush strategies
 * ============================================================
 */

import type { EventPayload } from "./smart-listener";

// ---------------------
// TYPES
// ---------------------

export interface LedgerConfig {
  /** Maximum events before auto-flush */
  maxBatchSize: number;
  /** Flush interval in ms (0 = only manual/transition flush) */
  flushIntervalMs: number;
  /** localStorage key for persistence */
  storageKey: string;
  /** Backend endpoint URL (simulated) */
  endpointUrl: string;
  /** Enable localStorage persistence */
  enablePersistence: boolean;
  /** Deduplication window in ms (events within this window with same ID are dropped) */
  deduplicationWindowMs: number;
  /** Callback when batch is flushed */
  onFlush?: (batch: EventBatch) => void;
  /** Callback on flush error */
  onError?: (error: Error) => void;
}

export interface EventBatch {
  batch_id: string;
  session_id: string;
  events: EventPayload[];
  flushed_at: string;
  flush_trigger: FlushTrigger;
  event_count: number;
  /** Deduplication stats */
  dedup_stats: {
    total_received: number;
    duplicates_dropped: number;
    unique_dispatched: number;
  };
}

export type FlushTrigger = "batch_full" | "page_transition" | "idle" | "interval" | "manual";

export interface LedgerStats {
  total_events_received: number;
  total_events_flushed: number;
  total_batches_sent: number;
  total_duplicates_dropped: number;
  queue_size: number;
  last_flush_at: string | null;
  last_flush_trigger: FlushTrigger | null;
}

// ---------------------
// JSONB SCHEMA (§2 Backend — Schema Design)
// ---------------------

/**
 * Backend-compatible event record.
 * Maps to a JSONB column in PostgreSQL:
 * 
 *   CREATE TABLE events (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     event_type VARCHAR(50) NOT NULL,
 *     variant_id VARCHAR(100) NOT NULL,
 *     session_score DECIMAL(4,3),
 *     path_url TEXT NOT NULL,
 *     is_friction_event BOOLEAN DEFAULT FALSE,
 *     session_id VARCHAR(100) NOT NULL,
 *     metadata JSONB,
 *     created_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 *   
 *   CREATE INDEX idx_events_session ON events(session_id);
 *   CREATE INDEX idx_events_type ON events(event_type);
 *   CREATE INDEX idx_events_friction ON events(is_friction_event) WHERE is_friction_event = TRUE;
 */
export interface EventRecord {
  event_type: string;
  variant_id: string;
  session_score: number;
  path_url: string;
  is_friction_event: boolean;
  session_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---------------------
// DEFAULT CONFIG
// ---------------------

const DEFAULT_CONFIG: LedgerConfig = {
  maxBatchSize: 20,
  flushIntervalMs: 30000, // 30 seconds
  storageKey: "pv_event_ledger",
  endpointUrl: "/api/events",
  enablePersistence: true,
  deduplicationWindowMs: 5000,
};

// ---------------------
// EVENT LEDGER CLASS
// ---------------------

export class EventLedger {
  private config: LedgerConfig;
  private queue: EventPayload[] = [];
  private seenEventIds: Map<string, number> = new Map(); // event_id → timestamp
  private stats: LedgerStats;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isDestroyed: boolean = false;
  private visibilityHandler: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;
  private _batches: EventBatch[] = [];

  constructor(config: Partial<LedgerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      total_events_received: 0,
      total_events_flushed: 0,
      total_batches_sent: 0,
      total_duplicates_dropped: 0,
      queue_size: 0,
      last_flush_at: null,
      last_flush_trigger: null,
    };
  }

  /**
   * Initialize the ledger — restore from localStorage, set up flush triggers.
   */
  init(): void {
    // Restore persisted events
    if (this.config.enablePersistence) {
      this.restoreFromStorage();
    }

    // Set up interval flush
    if (this.config.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        this.flush("interval");
      }, this.config.flushIntervalMs);
    }

    // Flush on page visibility change (tab switch / minimize)
    this.visibilityHandler = () => {
      if (document.visibilityState === "hidden") {
        this.flush("page_transition");
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);

    // Flush on page unload
    this.beforeUnloadHandler = () => {
      this.flush("page_transition");
    };
    window.addEventListener("beforeunload", this.beforeUnloadHandler);

    // Flush during idle time
    this.scheduleIdleFlush();
  }

  /**
   * Push an event into the ledger queue.
   * Deduplicates events within the configured window.
   */
  push(event: EventPayload): boolean {
    if (this.isDestroyed) return false;

    this.stats.total_events_received++;

    // Deduplication check
    if (this.isDuplicate(event)) {
      this.stats.total_duplicates_dropped++;
      return false;
    }

    // Record for dedup
    this.seenEventIds.set(event.event_id, Date.now());

    // Add to queue
    this.queue.push(event);
    this.stats.queue_size = this.queue.length;

    // Persist to localStorage
    if (this.config.enablePersistence) {
      this.persistToStorage();
    }

    // Auto-flush if batch full
    if (this.queue.length >= this.config.maxBatchSize) {
      this.flush("batch_full");
    }

    return true;
  }

  /**
   * Flush the current queue as a batch.
   */
  flush(trigger: FlushTrigger): EventBatch | null {
    if (this.queue.length === 0) return null;

    const batch: EventBatch = {
      batch_id: `batch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      session_id: this.queue[0]?.session_id || "unknown",
      events: [...this.queue],
      flushed_at: new Date().toISOString(),
      flush_trigger: trigger,
      event_count: this.queue.length,
      dedup_stats: {
        total_received: this.stats.total_events_received,
        duplicates_dropped: this.stats.total_duplicates_dropped,
        unique_dispatched: this.stats.total_events_received - this.stats.total_duplicates_dropped,
      },
    };

    // Update stats
    this.stats.total_events_flushed += this.queue.length;
    this.stats.total_batches_sent++;
    this.stats.last_flush_at = batch.flushed_at;
    this.stats.last_flush_trigger = trigger;

    // Clear queue
    this.queue = [];
    this.stats.queue_size = 0;

    // Clear localStorage
    if (this.config.enablePersistence) {
      this.clearStorage();
    }

    // Prune old dedup entries
    this.pruneDeduplicationCache();

    // Store batch for debug access
    this._batches.push(batch);
    if (this._batches.length > 10) this._batches.shift();

    // Dispatch
    this.config.onFlush?.(batch);

    // Simulate backend send (in production this would be fetch/sendBeacon)
    this.simulateBackendSend(batch);

    return batch;
  }

  /**
   * Get current stats.
   */
  getStats(): LedgerStats {
    return { ...this.stats };
  }

  /**
   * Get all flushed batches (for debug display).
   */
  get batches(): EventBatch[] {
    return [...this._batches];
  }

  /**
   * Get current queue contents (for debug display).
   */
  get currentQueue(): EventPayload[] {
    return [...this.queue];
  }

  /**
   * Teardown — flush remaining events and clean up.
   */
  destroy(): void {
    this.isDestroyed = true;

    // Final flush
    if (this.queue.length > 0) {
      this.flush("manual");
    }

    // Clean up timers and listeners
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
    }
  }

  // ---------------------
  // PRIVATE METHODS
  // ---------------------

  private isDuplicate(event: EventPayload): boolean {
    const existingTimestamp = this.seenEventIds.get(event.event_id);
    if (!existingTimestamp) return false;

    // Within deduplication window?
    return Date.now() - existingTimestamp < this.config.deduplicationWindowMs;
  }

  private pruneDeduplicationCache(): void {
    const now = Date.now();
    const cutoff = now - this.config.deduplicationWindowMs * 2;
    
    for (const [id, timestamp] of this.seenEventIds.entries()) {
      if (timestamp < cutoff) {
        this.seenEventIds.delete(id);
      }
    }
  }

  private persistToStorage(): void {
    try {
      const data = JSON.stringify(this.queue.slice(-50)); // Cap stored events
      localStorage.setItem(this.config.storageKey, data);
    } catch {
      // localStorage full or unavailable — silent fail
    }
  }

  private restoreFromStorage(): void {
    try {
      const data = localStorage.getItem(this.config.storageKey);
      if (data) {
        const events: EventPayload[] = JSON.parse(data);
        if (Array.isArray(events)) {
          this.queue = events;
          this.stats.queue_size = events.length;
        }
      }
    } catch {
      // Corrupted data — silent fail
    }
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem(this.config.storageKey);
    } catch {
      // Silent fail
    }
  }

  private scheduleIdleFlush(): void {
    if (this.isDestroyed) return;

    const doFlush = () => {
      if (this.queue.length > 0) {
        this.flush("idle");
      }
      // Re-schedule
      if (!this.isDestroyed) {
        this.scheduleIdleFlush();
      }
    };

    if ("requestIdleCallback" in window) {
      (window as Window).requestIdleCallback(doFlush, { timeout: 60000 });
    } else {
      setTimeout(doFlush, 60000);
    }
  }

  private simulateBackendSend(batch: EventBatch): void {
    // In production: navigator.sendBeacon() or fetch() with keepalive
    // Here we just log to console for demo purposes
    console.log(
      `[EventLedger] Flushed batch ${batch.batch_id}: ${batch.event_count} events (trigger: ${batch.flush_trigger})`
    );
  }
}

/**
 * Factory function.
 */
export function createEventLedger(config?: Partial<LedgerConfig>): EventLedger {
  return new EventLedger(config);
}

/**
 * Convert EventPayload to backend-compatible EventRecord.
 */
export function toEventRecord(payload: EventPayload): EventRecord {
  return {
    event_type: payload.event_type,
    variant_id: payload.variant_id,
    session_score: payload.session_score,
    path_url: payload.path_url,
    is_friction_event: payload.is_friction_event,
    session_id: payload.session_id,
    metadata: {
      semantic_scores: payload.semantic_scores,
      element_meta: payload.element_meta,
      middleware_data: payload.middleware_data,
    },
    created_at: payload.timestamp,
  };
}
