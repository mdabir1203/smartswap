# SmartSwap — Developer Documentation

> Senior-grade technical reference for the SmartSwap AI Personalization Layer.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Module Reference](#module-reference)
   - [Personalization Engine](#1-personalization-engine)
   - [Template Registry](#2-template-registry)
   - [Smart Listener](#3-smart-listener)
   - [Event Ledger](#4-event-ledger)
   - [Behavior Tracker](#5-behavior-tracker)
3. [Data Flow](#data-flow)
4. [Type System](#type-system)
5. [Configuration & Extension](#configuration--extension)
6. [Shopify Integration](#shopify-integration)
7. [State Management](#state-management)
8. [Testing](#testing)
9. [Performance Budget](#performance-budget)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VISITOR ARRIVES                          │
│                                                                 │
│  URL: ?utm_campaign=gaming&ref=twitch                          │
│  Referrer: twitch.tv                                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              PERSONALIZATION ENGINE (741 LOC)                    │
│                                                                  │
│  collectSignals() → resolveIntent() → getVariant()              │
│                                                                  │
│  Input:  URLSearchParams + document.referrer                     │
│  Output: IntentResult + ContentVariant                           │
│          (intent, confidence, template, CTA, section order,      │
│           funnel stage, injection log)                            │
└──────────────────────┬───────────────────────────────────────────┘
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
     ┌──────────┐ ┌────────┐ ┌────────────┐
     │ Template │ │  Hero  │ │  Section   │
     │ Registry │ │ Render │ │ Reordering │
     │ (layout) │ │(image) │ │  (funnel)  │
     └──────────┘ └────────┘ └────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              SMART LISTENER (571 LOC)                            │
│                                                                  │
│  Semantic Event Delegation → Click Scoring → Classification      │
│  Frustration Detection → Middleware Pipeline → EventPayload      │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              EVENT LEDGER (424 LOC)                              │
│                                                                  │
│  Queue → Dedup → Batch → localStorage Persist → Flush           │
│  Triggers: batch_full | page_transition | idle | interval        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Module Reference

### 1. Personalization Engine

**File:** `src/lib/personalization-engine.ts` (741 LOC)

The brain. Converts raw URL signals into a structured decision that controls every visible element.

#### Public API

```typescript
// Full pipeline: collect → resolve → select
personalize(searchParams: URLSearchParams, referrer?: string): {
  variant: ContentVariant;
  result: IntentResult;
}

// Individual stages (for testing/advanced use)
collectSignals(searchParams: URLSearchParams, referrer?: string): {
  signals: UserSignal[];
  edgeCases: string[];
}

resolveIntent(signals: UserSignal[], edgeCases: string[]): IntentResult

getVariant(intent: IntentType): ContentVariant

// Export decision as JSON for external consumers
exportDecision(result: IntentResult): ExportableDecision
```

#### Intent Types

```typescript
type IntentType = "gaming" | "productivity" | "budget" | "creative" | "student" | "developer" | "default";
```

#### Signal Weight Table

| Source | Weight | Param |
|---|---|---|
| Direct intent | 1.00 | `?intent=gaming` |
| UTM Campaign | 0.95 | `?utm_campaign=gaming` |
| Category | 0.85 | `?category=gaming` |
| Search query | 0.80 | `?q=gaming+monitor` |
| Referrer domain | 0.75 | `?ref=twitch` |
| UTM Source | 0.70 | `?utm_source=twitch` |
| Tag/Label | 0.70 | `?tag=gaming` |
| UTM Medium | 0.50 | `?utm_medium=gaming` |
| Unknown param | 0.40 | `?custom=gaming` |

#### Signal Decay

When multiple signals share the same source type (e.g., two `utm_campaign` matches), subsequent signals receive a 0.7x weight multiplier:

```typescript
// Example: utm_campaign="gaming-budget" matches both gaming (0.95) and budget (0.30)
// Second match: 0.95 * 0.7 = 0.665 (decayed)
```

#### Confidence Thresholds

| Score | Confidence |
|---|---|
| ≥ 0.80 | `high` |
| ≥ 0.40 (with Δ ≥ 0.10 from runner-up) | `medium` |
| ≥ 0.30 | `low` |
| < 0.30 | Fallback to `default` |

#### Compound Signal Resolution

When a query like `"cheap gaming monitor"` matches both `budget` and `gaming`:

1. All matching intents are detected with keyword position
2. First keyword position gets primary weight, subsequent get diminished (0.3)
3. If top two scores are within Δ 0.05, the **priority matrix** breaks the tie:
   `gaming > creative > developer > productivity > student > budget > default`

#### Edge Cases Handled

- Empty/missing URL params → graceful default
- Malformed percent-encoding → `safeDecodeURI()` fallback
- Short queries (≤2 chars) → skipped as unreliable
- Partial word matches for short keywords (<4 chars) → word boundary check
- Unknown `?intent=` values → fuzzy keyword match attempted
- Duplicate source types → weight decay applied

#### Funnel Stage → Section Order

```typescript
const SECTION_ORDER_MAP: Record<FunnelStage, SectionId[]> = {
  buy:     ["products", "trust", "funnel"],     // Ready to purchase
  compare: ["funnel", "products", "trust"],     // Research mode
  explore: ["trust", "funnel", "products"],     // Discovery mode
};
```

#### IntentResult (Full Decision Object)

```typescript
interface IntentResult {
  intent: IntentType;
  confidence: ConfidenceLevel;
  signals: UserSignal[];
  reasoning: string;                // Human-readable explanation
  edgeCases: string[];              // Edge cases detected
  scoreBreakdown: Record<string, number>;  // All scores
  funnelStage: FunnelStage;
  templateId: string;
  ctaDecision: { text: string; link: string; priority: "buy" | "compare" | "explore" };
  sectionOrder: SectionId[];
  heroImageKey: string;
  injectionLog: string[];           // What was changed and why
}
```

#### React Hook

```typescript
// src/hooks/use-personalization.ts
const { variant, result } = usePersonalization();
// Re-runs on URL changes via useSearchParams, memoized
```

---

### 2. Template Registry

**File:** `src/lib/template-registry.ts` (191 LOC)

Defines the finite set of hero layouts. Separates **structure** (how content is arranged) from **content** (what text/images are shown).

#### Templates

| ID | Layout | Content Alignment | Image Position | CTA Style | Used By |
|---|---|---|---|---|---|
| `hero_centered` | Centered | Center | Background | Inline | Gaming, Creative, Default |
| `hero_split` | Split-screen | Left | Right | Stacked | Productivity, Developer |
| `hero_minimal` | Minimal | Left | None | Single | Budget, Student |

#### Template Structure

```typescript
interface HeroTemplate {
  id: string;
  name: string;
  layoutType: "centered" | "split-screen" | "minimal";
  slots: TemplateSlot[];  // Typed content slots (image, text, cta, badge)
  config: {
    contentAlignment: "left" | "center" | "right";
    imagePosition: "background" | "right" | "none";
    ctaStyle: "stacked" | "inline" | "single";
    showBadge: boolean;
    overlayOpacity: number;
  };
}
```

#### Public API

```typescript
resolveTemplate(intent: IntentType): HeroTemplate
resolveFunnelStage(intent: IntentType): FunnelStage
getTemplateMapping(intent: IntentType): TemplateMapping | undefined
listTemplates(): HeroTemplate[]
exportRegistryJSON(): string  // For external widget config
```

---

### 3. Smart Listener

**File:** `src/lib/smart-listener.ts` (571 LOC)

Lightweight event tracking system using **Semantic Event Delegation** — a single document-level click handler that scores elements by their text, CSS classes, and ARIA attributes.

#### Initialization

```typescript
const listener = createSmartListener({
  variantId: "gaming",
  funnelStage: "buy",
  enableFrustrationDetection: true,
  frustrationThreshold: 3,       // clicks
  frustrationWindowMs: 1000,     // window
  onEvent: (payload) => { ... },
  onFrustration: (payload) => { ... },
});

listener.init();  // Non-blocking via requestIdleCallback
```

#### Semantic Scoring Engine

Every click is scored using weighted keyword lookups:

**Text scores** (element `.textContent`):
```
"add to cart": 10, "buy now": 10, "checkout": 10,
"compare": 10, "buy": 8, "cart": 8, "spec": 8,
"shop": 7, "deal": 7, "sale": 6, "save": 6, ...
```

**Class scores** (element `.classList` + `#id`):
```
"add-to-cart": 8, "compare": 6, "cta": 5, "btn-cta": 5,
"hero-cta": 5, "cart": 5, "product-card": 4, ...
```

**ARIA scores** (`aria-label`):
```
"add to cart": 8, "checkout": 8, "buy": 7, "compare": 6, ...
```

Combined score determines event classification:

| Score/Context | Event Type |
|---|---|
| Text includes "cart"/"buy"/"checkout" | `CART_ACTION` |
| Text includes "compare"/"spec" | `COMPARE_CLICK` |
| Inside `<nav>` or `[role=navigation]` | `NAV_CLICK` |
| Inside `[data-product-card]` | `PRODUCT_CLICK` |
| Score ≥ 5 on a `<button>` | `CTA_CLICK` |

#### Frustration Detection

The `FrustrationDetector` class maintains a sliding-window click buffer per element:

```
Click 1 (t=0ms) → buffer: [0]
Click 2 (t=300ms) → buffer: [0, 300]
Click 3 (t=600ms) → buffer: [0, 300, 600] → THRESHOLD HIT → UX_FRICTION event
```

- Window: 1000ms (configurable)
- Threshold: 3 clicks (configurable)
- Buffer auto-prunes entries outside the window
- Resets after detection to prevent repeat fires

#### Middleware System

```typescript
listener.use((element: HTMLElement, event: MouseEvent) => {
  if (element.closest('[data-newsletter]')) {
    return { event_type: "CUSTOM", label: "newsletter_signup" };
  }
  return null;  // Pass to next middleware
});
```

- First matching middleware wins (short-circuit)
- Middleware data is attached to the `EventPayload.middleware_data` field

#### EventPayload Contract

```typescript
interface EventPayload {
  event_id: string;           // "evt_m2x3k_a7b2"
  event_type: SmartEventType; // CTA_CLICK | NAV_CLICK | PRODUCT_CLICK | ...
  variant_id: string;         // Active persona when event occurred
  session_score: number;      // Cumulative 0–1 score
  path_url: string;           // Current path + query
  is_friction_event: boolean; // UX_FRICTION flag
  timestamp: string;          // ISO 8601
  session_id: string;         // For deduplication
  semantic_scores: SemanticScore;  // Breakdown
  element_meta: ElementMeta;       // Tag, text, classes, ARIA, data-attrs
  middleware_data: Record<string, unknown>;
}
```

#### React Hook

```typescript
// src/hooks/use-smart-listener.ts
const { events, latestEvent, frictionEvents, metrics, ledgerStats, flushNow, listener } = useSmartListener({
  enabled: true,
  listenerConfig: { variantId: "gaming", funnelStage: "buy" },
  ledgerConfig: { maxBatchSize: 20 },
});
```

---

### 4. Event Ledger

**File:** `src/lib/event-ledger.ts` (424 LOC)

Client-side event batching system. No per-click network requests — events are queued, deduplicated, and flushed in batches.

#### Flush Triggers

| Trigger | Condition |
|---|---|
| `batch_full` | Queue reaches `maxBatchSize` (default: 20) |
| `interval` | Timer fires every `flushIntervalMs` (default: 30s) |
| `page_transition` | `visibilitychange` (tab switch) or `beforeunload` |
| `idle` | `requestIdleCallback` with 60s timeout |
| `manual` | `ledger.flush("manual")` called programmatically |

#### Deduplication

Events are deduplicated by `event_id` within a configurable window (default: 5000ms). The dedup cache is pruned at 2× the window to prevent memory growth.

#### localStorage Persistence

- Queue is persisted to `localStorage` on every push (capped at 50 events)
- Restored on init — crash-safe buffer
- Cleared after each flush
- Silent failure on quota exceeded or unavailable storage

#### Backend Schema (JSONB-compatible)

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  variant_id VARCHAR(100) NOT NULL,
  session_score DECIMAL(4,3),
  path_url TEXT NOT NULL,
  is_friction_event BOOLEAN DEFAULT FALSE,
  session_id VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_friction ON events(is_friction_event) WHERE is_friction_event = TRUE;
```

#### EventBatch Output

```typescript
interface EventBatch {
  batch_id: string;
  session_id: string;
  events: EventPayload[];
  flushed_at: string;
  flush_trigger: FlushTrigger;
  event_count: number;
  dedup_stats: {
    total_received: number;
    duplicates_dropped: number;
    unique_dispatched: number;
  };
}
```

---

### 5. Behavior Tracker

**File:** `src/hooks/use-behavior-tracking.ts` (230 LOC)

Tracks real scroll and click events for the first 5 seconds of a page visit, then emits behavior signals with inferred intents.

#### Signals Emitted

| Signal | Inference |
|---|---|
| `scroll_depth` | Fast deep scroll (>80%, >30%/s) → gaming/impulse. Slow methodical (<15%/s) → productivity |
| `click_target` | CTA text analysis → intent mapping |
| `interaction_speed` | < 1500ms → impulse/gaming. > 3000ms → researcher/productivity |
| `dwell_zone` | Section engagement time (planned) |

#### State Output

```typescript
interface BehaviorState {
  signals: BehaviorSignal[];
  isTracking: boolean;
  trackingComplete: boolean;
  scrollDepth: number;
  clickCount: number;
  firstInteractionMs: number | null;
}
```

---

## Data Flow

```
1. Page Load
   └─ usePersonalization() reads URLSearchParams
      └─ personalize(params, referrer)
         ├─ collectSignals() → UserSignal[]
         ├─ resolveIntent() → IntentResult
         └─ getVariant() → ContentVariant

2. Render
   └─ HeroSection receives ContentVariant (headline, CTA, image)
   └─ Page sections ordered by result.sectionOrder
   └─ ProductGrid receives result.intent

3. Post-Render (non-blocking)
   └─ SmartListener.init() via requestIdleCallback
      └─ Document-level click handler installed
   └─ EventLedger.init()
      └─ localStorage restore + flush timers
   └─ useBehaviorTracking() starts 5s observation

4. User Interaction
   └─ Click → SmartListener.handleClick()
      ├─ scoreElement() → SemanticScore
      ├─ classifyEvent() → SmartEventType
      ├─ Middleware pipeline
      ├─ FrustrationDetector check
      └─ EventPayload dispatched
         └─ EventLedger.push()
            ├─ Dedup check
            ├─ localStorage persist
            └─ Auto-flush if batch full

5. Flush
   └─ EventLedger.flush(trigger)
      ├─ Batch created with dedup stats
      ├─ Queue cleared
      ├─ localStorage cleared
      └─ onFlush callback + simulated backend send
```

---

## Type System

All types are co-located with their modules. Key exports:

```typescript
// personalization-engine.ts
export type IntentType, ConfidenceLevel, FunnelStage, SectionId
export interface UserSignal, IntentResult, ContentVariant, ExportableDecision

// smart-listener.ts
export type SmartEventType
export interface EventPayload, SemanticScore, ElementMeta, SmartListenerConfig
export type IntentDetectorMiddleware

// event-ledger.ts
export type FlushTrigger
export interface EventBatch, LedgerStats, LedgerConfig, EventRecord

// template-registry.ts
export type TemplateLayoutType
export interface HeroTemplate, TemplateSlot, TemplateMapping
```

---

## Configuration & Extension

### Adding a New Intent

1. Add to `IntentType` union in `personalization-engine.ts`
2. Add keyword list in `INTENT_KEYWORDS`
3. Add `ContentVariant` entry in `CONTENT_VARIANTS`
4. Add template mapping in `INTENT_TEMPLATE_MAP`
5. Add hero image asset as `src/assets/hero-{intent}.jpg`
6. Add intent color to `tailwind.config.ts` and `index.css`

### Adding a Middleware Plugin

```typescript
const listener = createSmartListener({ ... });

listener.use((el, event) => {
  // Example: detect video play button clicks
  if (el.closest('[data-video-play]')) {
    return {
      event_type: "CUSTOM",
      label: "video_play",
      data: { videoId: el.dataset.videoId },
    };
  }
  return null;
});
```

### Custom Flush Strategy

```typescript
const ledger = createEventLedger({
  maxBatchSize: 50,         // Flush every 50 events
  flushIntervalMs: 60000,   // Or every 60 seconds
  enablePersistence: true,
  deduplicationWindowMs: 10000,
  onFlush: (batch) => {
    // Send to your analytics backend
    navigator.sendBeacon('/api/events', JSON.stringify(batch));
  },
});
```

---

## Shopify Integration

**File:** `src/lib/shopify.ts`

Real Shopify Storefront API integration via GraphQL.

### API Configuration

```typescript
const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STOREFRONT_URL = `https://${DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
```

### Available Operations

| Function | Purpose |
|---|---|
| `storefrontApiRequest(query, vars)` | Generic GraphQL request with error handling |
| `createShopifyCart(item)` | Create new cart + get checkout URL |
| `addLineToShopifyCart(cartId, item)` | Add variant to existing cart |
| `updateShopifyCartLine(cartId, lineId, qty)` | Update line quantity |
| `removeLineFromShopifyCart(cartId, lineId)` | Remove line from cart |

### Error Handling

- **402 Payment Required** → Toast notification with Shopify admin upgrade link
- **Cart Not Found** → Auto-clears local cart state, re-creates on next add
- **Network errors** → Caught and logged, UI remains functional

---

## State Management

**File:** `src/stores/cartStore.ts`

Zustand store with `persist` middleware for cart state.

```typescript
interface CartStore {
  items: CartItem[];
  cartId: string | null;      // Shopify cart ID
  checkoutUrl: string | null;  // Storefront checkout URL
  isLoading: boolean;
  isSyncing: boolean;
  addItem, updateQuantity, removeItem, clearCart, syncCart, getCheckoutUrl
}
```

- Persisted to `localStorage` key `shopify-cart`
- Only `items`, `cartId`, and `checkoutUrl` are persisted (not loading states)
- Cart validity checked via `syncCart()` on page load (`useCartSync` hook)

---

## Testing

**Framework:** Vitest

```bash
npm test
```

### Test Coverage

| Test File | Covers |
|---|---|
| `personalization-engine.test.ts` | Intent resolution, compound signals, confidence thresholds, edge cases, signal decay |
| `smart-listener.test.ts` | Semantic scoring, event classification, frustration detection, middleware pipeline |

### Running Specific Tests

```bash
npx vitest run src/test/personalization-engine.test.ts
npx vitest run src/test/smart-listener.test.ts
```

---

## Performance Budget

| Metric | Target | Actual |
|---|---|---|
| JS bundle (listener + ledger) | < 15KB | ✅ ~12KB gzipped |
| Main-thread blocking | 0ms | ✅ requestIdleCallback init |
| Per-click overhead | < 1ms | ✅ O(n) keyword lookup |
| Memory (event buffer) | < 50 events | ✅ Capped with shift() |
| localStorage writes | Per-push (debounced by batch) | ✅ Capped at 50 events |
| Network requests (events) | 0 per click | ✅ Batched flush only |

---

## File Map

```
src/
├── lib/
│   ├── personalization-engine.ts   # Signal scoring + intent resolution
│   ├── template-registry.ts        # Layout templates + mappings
│   ├── smart-listener.ts           # Semantic click tracking
│   ├── event-ledger.ts             # Event batching + persistence
│   ├── shopify.ts                  # Storefront API client
│   └── format-price.ts             # Currency formatting
├── hooks/
│   ├── use-personalization.ts      # React bridge for engine
│   ├── use-smart-listener.ts       # React bridge for listener + ledger
│   ├── use-behavior-tracking.ts    # Scroll/click behavior signals
│   └── useCartSync.ts              # Cart validity on page load
├── stores/
│   └── cartStore.ts                # Zustand cart state
├── components/
│   ├── HeroSection.tsx             # Template-driven hero render
│   ├── ProductGrid.tsx             # Shopify product cards
│   ├── CartDrawer.tsx              # Slide-out cart
│   ├── DebugOverlay.tsx            # Real-time decision inspector
│   ├── PersonaToggle.tsx           # Intent switcher UI
│   ├── FunnelBanner.tsx            # Funnel-stage CTA
│   ├── TrustBar.tsx                # Social proof bar
│   └── StoreNav.tsx                # Navigation
├── pages/
│   ├── Index.tsx                   # Main store page
│   ├── ProductDetail.tsx           # PDP with variant selection
│   └── IntegrationGuide.tsx        # Developer/SMB onboarding
└── test/
    ├── personalization-engine.test.ts
    └── smart-listener.test.ts
```
