/**
 * SMART LISTENER & EVENT LEDGER — Unit Tests
 * 
 * Tests cover:
 *   1. Semantic scoring engine accuracy
 *   2. Event classification
 *   3. Frustration detection (click buffer)
 *   4. Middleware pipeline (plugin.use())
 *   5. Event ledger deduplication
 *   6. Batch flush triggers
 *   7. EventPayload type safety
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  scoreElement,
  classifyEvent,
  FrustrationDetector,
  SmartListener,
  type EventPayload,
  type SemanticScore,
} from "@/lib/smart-listener";
import {
  EventLedger,
  toEventRecord,
} from "@/lib/event-ledger";

// ---------------------
// HELPERS
// ---------------------

function createMockElement(overrides: {
  tag?: string;
  text?: string;
  classes?: string[];
  id?: string;
  ariaLabel?: string;
  dataAttrs?: Record<string, string>;
} = {}): HTMLElement {
  const el = document.createElement(overrides.tag || "button");
  if (overrides.text) el.textContent = overrides.text;
  if (overrides.classes) overrides.classes.forEach(c => el.classList.add(c));
  if (overrides.id) el.id = overrides.id;
  if (overrides.ariaLabel) el.setAttribute("aria-label", overrides.ariaLabel);
  if (overrides.dataAttrs) {
    for (const [key, val] of Object.entries(overrides.dataAttrs)) {
      el.setAttribute(key, val);
    }
  }
  return el;
}

function createMockPayload(overrides: Partial<EventPayload> = {}): EventPayload {
  return {
    event_id: `evt_test_${Math.random().toString(36).slice(2, 6)}`,
    event_type: "CTA_CLICK",
    variant_id: "gaming",
    session_score: 0.1,
    path_url: "/?utm_campaign=gaming",
    is_friction_event: false,
    timestamp: new Date().toISOString(),
    session_id: "pv_test_session",
    semantic_scores: {
      text_score: 5,
      class_score: 3,
      aria_score: 0,
      total: 8,
      intent_match: "gaming",
    },
    element_meta: {
      tag: "button",
      text: "Shop Gaming",
      classes: ["btn-primary"],
      aria_label: null,
      data_attrs: {},
    },
    middleware_data: {},
    ...overrides,
  };
}

// =====================
// §1: SEMANTIC SCORING ENGINE
// =====================

describe("Semantic Scoring Engine", () => {
  it("scores 'Add to Cart' button with high text score", () => {
    const el = createMockElement({ text: "Add to Cart", tag: "button" });
    const score = scoreElement(el);
    
    expect(score.text_score).toBeGreaterThanOrEqual(10); // "add" (+5) + "cart" (+8)
    expect(score.total).toBeGreaterThan(0);
  });

  it("scores 'Compare Specs' button with productivity intent", () => {
    const el = createMockElement({ text: "Compare Specs", tag: "button" });
    const score = scoreElement(el);
    
    expect(score.text_score).toBeGreaterThanOrEqual(10); // "compare" (+10)
    expect(score.intent_match).toBe("productivity");
  });

  it("scores CSS class 'btn-primary' correctly", () => {
    const el = createMockElement({ text: "Click me", classes: ["btn-primary"] });
    const score = scoreElement(el);
    
    expect(score.class_score).toBeGreaterThanOrEqual(3);
  });

  it("scores aria-label containing 'cart'", () => {
    const el = createMockElement({ text: "🛒", ariaLabel: "Shopping cart" });
    const score = scoreElement(el);
    
    expect(score.aria_score).toBeGreaterThanOrEqual(5);
  });

  it("returns zero scores for generic div with no signals", () => {
    const el = createMockElement({ tag: "div", text: "Hello world" });
    const score = scoreElement(el);
    
    expect(score.total).toBe(0);
    expect(score.intent_match).toBeNull();
  });

  it("infers gaming intent from text content", () => {
    const el = createMockElement({ text: "Shop Gaming Monitors" });
    const score = scoreElement(el);
    
    expect(score.intent_match).toBe("gaming");
  });

  it("infers budget intent from deal/sale text", () => {
    const el = createMockElement({ text: "Today's Best Deals" });
    const score = scoreElement(el);
    
    expect(score.intent_match).toBe("budget");
  });
});

// =====================
// §1: EVENT CLASSIFICATION
// =====================

describe("Event Classification", () => {
  it("classifies cart-related text as CART_ACTION", () => {
    const el = createMockElement({ text: "Add to Cart" });
    const scores = scoreElement(el);
    
    expect(classifyEvent(el, scores)).toBe("CART_ACTION");
  });

  it("classifies compare text as COMPARE_CLICK", () => {
    const el = createMockElement({ text: "Compare specifications" });
    const scores = scoreElement(el);
    
    expect(classifyEvent(el, scores)).toBe("COMPARE_CLICK");
  });

  it("classifies anchor elements as NAV_CLICK", () => {
    const el = createMockElement({ tag: "a", text: "Home" });
    const scores = scoreElement(el);
    
    expect(classifyEvent(el, scores)).toBe("NAV_CLICK");
  });

  it("classifies high-score buttons as CTA_CLICK", () => {
    const el = createMockElement({ text: "Shop Now", tag: "button" });
    const scores = scoreElement(el);
    
    expect(classifyEvent(el, scores)).toBe("CTA_CLICK");
  });
});

// =====================
// §1: FRUSTRATION DETECTION
// =====================

describe("Frustration Detector (Click Buffer)", () => {
  let detector: FrustrationDetector;

  beforeEach(() => {
    detector = new FrustrationDetector(3, 1000);
  });

  it("does not trigger on 1-2 clicks", () => {
    expect(detector.recordClick("btn-1")).toBe(false);
    expect(detector.recordClick("btn-1")).toBe(false);
  });

  it("triggers UX_FRICTION on 3 rapid clicks (same element)", () => {
    detector.recordClick("btn-1");
    detector.recordClick("btn-1");
    const isFriction = detector.recordClick("btn-1");
    
    expect(isFriction).toBe(true);
  });

  it("does NOT trigger for clicks on different elements", () => {
    detector.recordClick("btn-1");
    detector.recordClick("btn-2");
    const result = detector.recordClick("btn-3");
    
    expect(result).toBe(false);
  });

  it("resets after friction detection", () => {
    detector.recordClick("btn-1");
    detector.recordClick("btn-1");
    detector.recordClick("btn-1"); // Triggers

    // Should NOT trigger again immediately  
    expect(detector.recordClick("btn-1")).toBe(false);
  });

  it("clears buffer correctly", () => {
    detector.recordClick("btn-1");
    detector.clear();
    
    expect(detector.size).toBe(0);
  });
});

// =====================
// §4: MIDDLEWARE PIPELINE
// =====================

describe("Middleware Pipeline (plugin.use())", () => {
  it("allows adding custom intent detectors", () => {
    const listener = new SmartListener();
    
    listener.use((el) => {
      if (el.getAttribute("data-newsletter")) {
        return { event_type: "CUSTOM", label: "newsletter_signup" };
      }
      return null;
    });

    expect(listener.metrics.middlewareCount).toBe(1);
    listener.destroy();
  });

  it("supports chained .use() calls", () => {
    const listener = new SmartListener();
    
    listener
      .use(() => null)
      .use(() => null)
      .use(() => null);

    expect(listener.metrics.middlewareCount).toBe(3);
    listener.destroy();
  });
});

// =====================
// §2: EVENT LEDGER — DEDUPLICATION
// =====================

describe("Event Ledger — Deduplication", () => {
  let ledger: EventLedger;

  beforeEach(() => {
    ledger = new EventLedger({
      maxBatchSize: 100,
      flushIntervalMs: 0, // Disable auto-flush for tests
      enablePersistence: false,
      deduplicationWindowMs: 5000,
    });
  });

  it("accepts unique events", () => {
    const event1 = createMockPayload({ event_id: "evt_1" });
    const event2 = createMockPayload({ event_id: "evt_2" });

    expect(ledger.push(event1)).toBe(true);
    expect(ledger.push(event2)).toBe(true);
    expect(ledger.getStats().queue_size).toBe(2);
  });

  it("drops duplicate events within dedup window", () => {
    const event = createMockPayload({ event_id: "evt_dup" });

    expect(ledger.push(event)).toBe(true);
    expect(ledger.push(event)).toBe(false); // Duplicate!
    expect(ledger.getStats().total_duplicates_dropped).toBe(1);
  });

  it("tracks deduplication stats correctly", () => {
    const events = [
      createMockPayload({ event_id: "evt_a" }),
      createMockPayload({ event_id: "evt_b" }),
      createMockPayload({ event_id: "evt_a" }), // dup
      createMockPayload({ event_id: "evt_c" }),
      createMockPayload({ event_id: "evt_b" }), // dup
    ];

    events.forEach(e => ledger.push(e));

    const stats = ledger.getStats();
    expect(stats.total_events_received).toBe(5);
    expect(stats.total_duplicates_dropped).toBe(2);
    expect(stats.queue_size).toBe(3);
  });
});

// =====================
// §2: EVENT LEDGER — BATCH FLUSH
// =====================

describe("Event Ledger — Batch Flush", () => {
  let ledger: EventLedger;
  const onFlush = vi.fn();

  beforeEach(() => {
    onFlush.mockClear();
    ledger = new EventLedger({
      maxBatchSize: 3,
      flushIntervalMs: 0,
      enablePersistence: false,
      onFlush,
    });
  });

  it("auto-flushes when batch size is reached", () => {
    ledger.push(createMockPayload({ event_id: "a1" }));
    ledger.push(createMockPayload({ event_id: "a2" }));
    ledger.push(createMockPayload({ event_id: "a3" })); // Triggers flush

    expect(onFlush).toHaveBeenCalledOnce();
    const batch = onFlush.mock.calls[0][0];
    expect(batch.event_count).toBe(3);
    expect(batch.flush_trigger).toBe("batch_full");
  });

  it("manual flush works correctly", () => {
    ledger.push(createMockPayload({ event_id: "m1" }));
    ledger.push(createMockPayload({ event_id: "m2" }));

    const batch = ledger.flush("manual");
    expect(batch).not.toBeNull();
    expect(batch!.event_count).toBe(2);
    expect(batch!.flush_trigger).toBe("manual");
  });

  it("returns null on flush with empty queue", () => {
    const batch = ledger.flush("manual");
    expect(batch).toBeNull();
  });

  it("clears queue after flush", () => {
    ledger.push(createMockPayload({ event_id: "c1" }));
    ledger.flush("manual");

    expect(ledger.getStats().queue_size).toBe(0);
  });

  it("includes dedup stats in batch", () => {
    ledger = new EventLedger({
      maxBatchSize: 100,
      flushIntervalMs: 0,
      enablePersistence: false,
    });

    ledger.push(createMockPayload({ event_id: "d1" }));
    ledger.push(createMockPayload({ event_id: "d1" })); // dup
    ledger.push(createMockPayload({ event_id: "d2" }));

    const batch = ledger.flush("manual");
    expect(batch!.dedup_stats.total_received).toBe(3);
    expect(batch!.dedup_stats.duplicates_dropped).toBe(1);
    expect(batch!.dedup_stats.unique_dispatched).toBe(2);
  });
});

// =====================
// §4: TYPE SAFETY — EventPayload → EventRecord
// =====================

describe("Type Safety — EventPayload to EventRecord", () => {
  it("converts EventPayload to backend-compatible EventRecord", () => {
    const payload = createMockPayload();
    const record = toEventRecord(payload);

    expect(record.event_type).toBe(payload.event_type);
    expect(record.variant_id).toBe(payload.variant_id);
    expect(record.session_score).toBe(payload.session_score);
    expect(record.path_url).toBe(payload.path_url);
    expect(record.is_friction_event).toBe(payload.is_friction_event);
    expect(record.session_id).toBe(payload.session_id);
    expect(record.created_at).toBe(payload.timestamp);
  });

  it("includes semantic_scores in metadata JSONB", () => {
    const payload = createMockPayload();
    const record = toEventRecord(payload);

    expect(record.metadata).toHaveProperty("semantic_scores");
    expect(record.metadata).toHaveProperty("element_meta");
    expect(record.metadata).toHaveProperty("middleware_data");
  });

  it("required fields are never undefined", () => {
    const payload = createMockPayload();
    const record = toEventRecord(payload);

    const requiredFields: (keyof typeof record)[] = [
      "event_type", "variant_id", "session_score", 
      "path_url", "is_friction_event", "session_id", "created_at",
    ];

    requiredFields.forEach(field => {
      expect(record[field]).toBeDefined();
      expect(record[field]).not.toBeNull();
    });
  });
});
