/**
 * ============================================================
 * SMART LISTENER — "The Minimalist Observer"
 * ============================================================
 * 
 * A lightweight (<15KB) plugin system using Semantic Event Delegation.
 * 
 * Architecture:
 *   1. Non-Blocking Init via requestIdleCallback (no LCP impact)
 *   2. Semantic Scoring Engine — weighted element analysis (text, class, aria)
 *   3. Frustration Detection — click buffer for UX_FRICTION events
 *   4. Middleware Hooks — plugin.use() for extensibility
 *   5. Type-Safe EventPayload — strict contract between frontend & backend
 * 
 * Performance targets:
 *   - 90% accuracy in event detection
 *   - <15KB JS bundle
 *   - 0ms main-thread blocking time
 * ============================================================
 */

import type { IntentType, FunnelStage } from "./personalization-engine";

// ---------------------
// TYPE DEFINITIONS (§4 — Type Safety)
// ---------------------

/**
 * EventPayload — The strict contract between frontend and backend.
 * Every event dispatched by the Smart Listener conforms to this shape.
 * The backend can rely on these fields being present and correctly typed.
 */
export interface EventPayload {
  /** Unique event identifier (UUID v4 format) */
  event_id: string;
  /** Event classification */
  event_type: SmartEventType;
  /** Active variant ID when event occurred */
  variant_id: string;
  /** Cumulative session intent score (0–1) */
  session_score: number;
  /** Current page URL path */
  path_url: string;
  /** Whether this event signals UX friction */
  is_friction_event: boolean;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Session identifier for deduplication */
  session_id: string;
  /** Semantic scoring breakdown for the interacted element */
  semantic_scores: SemanticScore;
  /** Raw element metadata */
  element_meta: ElementMeta;
  /** Optional: custom data from middleware */
  middleware_data: Record<string, unknown>;
}

export type SmartEventType =
  | "CTA_CLICK"
  | "NAV_CLICK"
  | "PRODUCT_CLICK"
  | "COMPARE_CLICK"
  | "CART_ACTION"
  | "UX_FRICTION"
  | "SCROLL_MILESTONE"
  | "CUSTOM";

export interface SemanticScore {
  text_score: number;
  class_score: number;
  aria_score: number;
  total: number;
  intent_match: IntentType | null;
}

export interface ElementMeta {
  tag: string;
  text: string;
  classes: string[];
  aria_label: string | null;
  data_attrs: Record<string, string>;
}

// ---------------------
// MIDDLEWARE SYSTEM (§4 — plugin.use())
// ---------------------

/**
 * IntentDetectorMiddleware — A function that receives an element + event
 * and can return a custom event type. Return null to skip.
 * 
 * Usage:
 *   smartListener.use((element, event) => {
 *     if (element.closest('[data-newsletter]')) {
 *       return { event_type: "CUSTOM", label: "newsletter_signup" };
 *     }
 *     return null;
 *   });
 */
export type IntentDetectorMiddleware = (
  element: HTMLElement,
  event: MouseEvent
) => { event_type: SmartEventType; label?: string; data?: Record<string, unknown> } | null;

// ---------------------
// SEMANTIC SCORING ENGINE
// ---------------------

/** Text content scoring weights */
const TEXT_SCORES: Record<string, number> = {
  "add to cart": 10,
  "add": 5,
  "buy now": 10,
  "buy": 8,
  "shop": 7,
  "compare": 10,
  "spec": 8,
  "cart": 8,
  "checkout": 10,
  "deal": 7,
  "sale": 6,
  "save": 6,
  "get started": 5,
  "learn more": 3,
  "view": 3,
  "explore": 4,
  "try": 4,
};

/** CSS class/ID scoring weights */
const CLASS_SCORES: Record<string, number> = {
  "btn-primary": 3,
  "btn-cta": 5,
  "cta": 5,
  "add-to-cart": 8,
  "cart": 5,
  "product-card": 4,
  "hero-cta": 5,
  "compare": 6,
  "nav-link": 2,
};

/** Aria attribute scoring weights */
const ARIA_SCORES: Record<string, number> = {
  "cart": 5,
  "add to cart": 8,
  "compare": 6,
  "navigation": 2,
  "buy": 7,
  "shop": 5,
  "checkout": 8,
};

/**
 * Score an element semantically using weighted text/class/aria analysis.
 * This replaces heavy regex with a fast O(n) lookup system.
 */
export function scoreElement(element: HTMLElement): SemanticScore {
  const text = (element.textContent || "").toLowerCase().trim().slice(0, 100);
  const classes = Array.from(element.classList);
  const id = element.id?.toLowerCase() || "";
  const ariaLabel = (element.getAttribute("aria-label") || "").toLowerCase();

  let text_score = 0;
  let class_score = 0;
  let aria_score = 0;

  // Text scoring
  for (const [keyword, weight] of Object.entries(TEXT_SCORES)) {
    if (text.includes(keyword)) {
      text_score += weight;
    }
  }

  // Class/ID scoring
  const classString = [...classes, id].join(" ").toLowerCase();
  for (const [keyword, weight] of Object.entries(CLASS_SCORES)) {
    if (classString.includes(keyword)) {
      class_score += weight;
    }
  }

  // Aria scoring
  for (const [keyword, weight] of Object.entries(ARIA_SCORES)) {
    if (ariaLabel.includes(keyword)) {
      aria_score += weight;
    }
  }

  // Intent inference from scores
  let intent_match: IntentType | null = null;
  const total = text_score + class_score + aria_score;

  if (text.includes("gaming") || text.includes("game")) intent_match = "gaming";
  else if (text.includes("compare") || text.includes("spec")) intent_match = "productivity";
  else if (text.includes("deal") || text.includes("sale") || text.includes("cheap")) intent_match = "budget";
  else if (text.includes("creative") || text.includes("design")) intent_match = "creative";
  else if (text.includes("student") || text.includes("campus")) intent_match = "student";
  else if (text.includes("dev") || text.includes("code")) intent_match = "developer";

  return { text_score, class_score, aria_score, total, intent_match };
}

/**
 * Classify an event type from semantic scores and element context.
 */
export function classifyEvent(element: HTMLElement, scores: SemanticScore): SmartEventType {
  const tag = element.tagName.toLowerCase();
  const text = (element.textContent || "").toLowerCase();

  // Cart actions
  if (text.includes("cart") || text.includes("buy") || text.includes("checkout")) {
    return "CART_ACTION";
  }

  // Compare actions
  if (text.includes("compare") || text.includes("spec")) {
    return "COMPARE_CLICK";
  }

  // Navigation
  if (tag === "a" || element.closest("nav") || element.closest("[role='navigation']")) {
    return "NAV_CLICK";
  }

  // Product cards
  if (element.closest("[data-product-card]") || element.closest("[data-product]")) {
    return "PRODUCT_CLICK";
  }

  // High-score CTAs
  if (scores.total >= 5 && (tag === "button" || element.closest("button"))) {
    return "CTA_CLICK";
  }

  return "CTA_CLICK";
}

// ---------------------
// FRUSTRATION DETECTION (Click Buffer)
// ---------------------

interface ClickBufferEntry {
  elementId: string;
  timestamps: number[];
}

/**
 * Low-memory click buffer for frustration detection.
 * Tracks click frequency per element ID within a sliding 1000ms window.
 * If an element receives 3+ clicks in 1000ms → UX_FRICTION event.
 */
export class FrustrationDetector {
  private buffer: Map<string, ClickBufferEntry> = new Map();
  private readonly threshold: number;
  private readonly windowMs: number;

  constructor(threshold = 3, windowMs = 1000) {
    this.threshold = threshold;
    this.windowMs = windowMs;
  }

  /**
   * Record a click and check for frustration.
   * Returns true if frustration is detected (3+ clicks in 1s).
   */
  recordClick(elementId: string): boolean {
    const now = Date.now();
    const entry = this.buffer.get(elementId);

    if (!entry) {
      this.buffer.set(elementId, {
        elementId,
        timestamps: [now],
      });
      return false;
    }

    // Prune old timestamps outside the window
    entry.timestamps = entry.timestamps.filter(t => now - t < this.windowMs);
    entry.timestamps.push(now);

    // Check threshold
    if (entry.timestamps.length >= this.threshold) {
      // Reset after detection to avoid repeat fires
      entry.timestamps = [];
      return true;
    }

    return false;
  }

  /** Clear the buffer (for testing/reset) */
  clear(): void {
    this.buffer.clear();
  }

  /** Get current buffer size (for debug display) */
  get size(): number {
    return this.buffer.size;
  }
}

// ---------------------
// SMART LISTENER CLASS
// ---------------------

export interface SmartListenerConfig {
  /** Active variant ID */
  variantId: string;
  /** Current funnel stage */
  funnelStage: FunnelStage;
  /** Enable frustration detection */
  enableFrustrationDetection: boolean;
  /** Frustration click threshold (default: 3) */
  frustrationThreshold: number;
  /** Frustration time window in ms (default: 1000) */
  frustrationWindowMs: number;
  /** Callback when frustration is detected */
  onFrustration?: (payload: EventPayload) => void;
  /** Callback for all events */
  onEvent?: (payload: EventPayload) => void;
}

const DEFAULT_CONFIG: SmartListenerConfig = {
  variantId: "default",
  funnelStage: "explore",
  enableFrustrationDetection: true,
  frustrationThreshold: 3,
  frustrationWindowMs: 1000,
};

/**
 * SmartListener — The core plugin class.
 * 
 * Initializes via requestIdleCallback (non-blocking).
 * Intercepts clicks at document level using event delegation.
 * Runs semantic scoring + middleware pipeline per click.
 * Dispatches typed EventPayloads to the event ledger.
 */
export class SmartListener {
  private config: SmartListenerConfig;
  private middlewares: IntentDetectorMiddleware[] = [];
  private frustrationDetector: FrustrationDetector;
  private sessionId: string;
  private sessionScore: number = 0;
  private eventCount: number = 0;
  private isInitialized: boolean = false;
  private clickHandler: ((e: MouseEvent) => void) | null = null;
  private _events: EventPayload[] = [];

  constructor(config: Partial<SmartListenerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.frustrationDetector = new FrustrationDetector(
      this.config.frustrationThreshold,
      this.config.frustrationWindowMs
    );
    this.sessionId = this.generateSessionId();
  }

  /**
   * plugin.use() — Add a middleware intent detector.
   * 
   * Middleware functions are called in order for each click event.
   * If a middleware returns a result, it overrides the default classification.
   * 
   * Example:
   *   listener.use((el, e) => {
   *     if (el.closest('[data-video-play]')) {
   *       return { event_type: "CUSTOM", label: "video_play" };
   *     }
   *     return null;
   *   });
   */
  use(middleware: IntentDetectorMiddleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Non-blocking initialization via requestIdleCallback.
   * This ensures the listener doesn't compete with LCP.
   */
  init(): void {
    if (this.isInitialized) return;

    const setup = () => {
      this.clickHandler = this.handleClick.bind(this);
      document.addEventListener("click", this.clickHandler, { passive: true, capture: true });
      this.isInitialized = true;
    };

    // Use requestIdleCallback for non-blocking init
    if ("requestIdleCallback" in window) {
      (window as Window).requestIdleCallback(setup, { timeout: 2000 });
    } else {
      // Fallback: setTimeout with 0 delay (still non-blocking)
      setTimeout(setup, 0);
    }
  }

  /**
   * Teardown — remove event listeners and clear state.
   */
  destroy(): void {
    if (this.clickHandler) {
      document.removeEventListener("click", this.clickHandler, true);
      this.clickHandler = null;
    }
    this.frustrationDetector.clear();
    this.middlewares = [];
    this.isInitialized = false;
  }

  /**
   * Get all captured events (for debug display).
   */
  get events(): EventPayload[] {
    return [...this._events];
  }

  /**
   * Get session metrics.
   */
  get metrics() {
    return {
      sessionId: this.sessionId,
      eventCount: this.eventCount,
      sessionScore: this.sessionScore,
      isInitialized: this.isInitialized,
      middlewareCount: this.middlewares.length,
      frustrationBufferSize: this.frustrationDetector.size,
    };
  }

  // ---------------------
  // PRIVATE METHODS
  // ---------------------

  private handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target || target === document.documentElement) return;

    // Walk up to find the most meaningful element (button, anchor, etc.)
    const actionElement = this.findActionElement(target);
    if (!actionElement) return;

    // Run semantic scoring
    const scores = scoreElement(actionElement);

    // Skip low-signal clicks (score < 2 means likely non-actionable)
    if (scores.total < 2 && !actionElement.closest("[data-product-card]")) return;

    // Run middleware pipeline
    let eventType: SmartEventType = classifyEvent(actionElement, scores);
    let middlewareData: Record<string, unknown> = {};

    for (const mw of this.middlewares) {
      const result = mw(actionElement, e);
      if (result) {
        eventType = result.event_type;
        if (result.label) middlewareData.label = result.label;
        if (result.data) middlewareData = { ...middlewareData, ...result.data };
        break; // First matching middleware wins
      }
    }

    // Frustration detection
    const elementId = this.getElementIdentifier(actionElement);
    let isFriction = false;

    if (this.config.enableFrustrationDetection) {
      isFriction = this.frustrationDetector.recordClick(elementId);
      if (isFriction) {
        eventType = "UX_FRICTION";
      }
    }

    // Update session score
    this.sessionScore = Math.min(1, this.sessionScore + (scores.total / 100));
    this.eventCount++;

    // Build payload
    const payload: EventPayload = {
      event_id: this.generateEventId(),
      event_type: eventType,
      variant_id: this.config.variantId,
      session_score: parseFloat(this.sessionScore.toFixed(3)),
      path_url: window.location.pathname + window.location.search,
      is_friction_event: isFriction,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      semantic_scores: scores,
      element_meta: this.extractElementMeta(actionElement),
      middleware_data: middlewareData,
    };

    // Store and dispatch
    this._events.push(payload);
    if (this._events.length > 50) this._events.shift(); // Cap memory

    this.config.onEvent?.(payload);

    if (isFriction) {
      this.config.onFrustration?.(payload);
    }
  }

  private findActionElement(target: HTMLElement): HTMLElement | null {
    // Walk up max 5 levels to find button/link/product-card
    let el: HTMLElement | null = target;
    let depth = 0;

    while (el && depth < 5) {
      const tag = el.tagName?.toLowerCase();
      if (tag === "button" || tag === "a" || el.getAttribute("role") === "button") {
        return el;
      }
      if (el.dataset?.productCard !== undefined || el.dataset?.product !== undefined) {
        return el;
      }
      el = el.parentElement;
      depth++;
    }

    // Fall back to original target if it's interactive
    const targetTag = target.tagName?.toLowerCase();
    if (targetTag === "button" || targetTag === "a" || targetTag === "input") {
      return target;
    }

    return null;
  }

  private getElementIdentifier(element: HTMLElement): string {
    return element.id || element.getAttribute("data-testid") || 
           `${element.tagName}-${(element.textContent || "").slice(0, 20).trim()}`;
  }

  private extractElementMeta(element: HTMLElement): ElementMeta {
    const dataAttrs: Record<string, string> = {};
    for (const attr of Array.from(element.attributes)) {
      if (attr.name.startsWith("data-")) {
        dataAttrs[attr.name] = attr.value;
      }
    }

    return {
      tag: element.tagName.toLowerCase(),
      text: (element.textContent || "").trim().slice(0, 100),
      classes: Array.from(element.classList).slice(0, 10),
      aria_label: element.getAttribute("aria-label"),
      data_attrs: dataAttrs,
    };
  }

  private generateSessionId(): string {
    return `pv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }
}

/**
 * Factory function for creating a pre-configured SmartListener.
 */
export function createSmartListener(config?: Partial<SmartListenerConfig>): SmartListener {
  return new SmartListener(config);
}
