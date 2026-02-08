import MermaidDiagram from "./MermaidDiagram";

/**
 * ================================================================
 * DATA FLOW DIAGRAMS — Rigorous Mermaid.js architecture diagrams
 * derived directly from the SmartSwap codebase.
 *
 * Every label, value, and flow maps to actual source code:
 *   - src/lib/smart-listener.ts  (571 LOC)
 *   - src/lib/event-ledger.ts    (424 LOC)
 *   - src/hooks/use-smart-listener.ts (React bridge)
 *   - src/lib/personalization-engine.ts (741 LOC)
 * ================================================================
 */

// ─────────────────────────────────────────────────────────────────
// LAYER 1: SmartListener — "The Minimalist Observer"
//
// Source: src/lib/smart-listener.ts
// Init: requestIdleCallback (timeout: 2000ms) → fallback setTimeout(0)
// Binding: document.addEventListener("click", handler, { passive: true, capture: true })
// ─────────────────────────────────────────────────────────────────
const FRONTEND_OBSERVER_CHART = `flowchart TD
  INIT["⏳ requestIdleCallback\\n<i>timeout: 2000ms · fallback: setTimeout(0)</i>"]
  BIND["document.addEventListener\\n<b>'click'</b>, handler\\n<i>passive: true, capture: true</i>"]
  INIT -->|"Non-blocking · no LCP impact"| BIND

  BIND --> CLICK{"🖱️ Click Event\\nMouseEvent"}

  CLICK --> WALK["findActionElement()\\n<i>Walk up ≤5 levels</i>\\nbutton · a · role=button · data-product-card"]
  WALK -->|"null → exit"| SKIP["🚫 Ignored\\n<i>Non-interactive element</i>"]
  WALK -->|"HTMLElement found"| SCORE

  SCORE["📊 scoreElement()\\n<b>Semantic Scoring Engine</b>"]
  SCORE --> TXT["TEXT_SCORES\\nadd to cart: 10 · buy now: 10\\ncheckout: 10 · compare: 10\\nshop: 7 · sale: 6"]
  SCORE --> CLS["CLASS_SCORES\\nadd-to-cart: 8 · cta: 5\\nhero-cta: 5 · compare: 6\\nproduct-card: 4 · nav-link: 2"]
  SCORE --> ARIA["ARIA_SCORES\\nadd to cart: 8 · checkout: 8\\nbuy: 7 · compare: 6\\ncart: 5 · shop: 5"]
  TXT --> TOTAL["total = text + class + aria"]
  CLS --> TOTAL
  ARIA --> TOTAL

  TOTAL -->|"total < 2"| SKIP2["🚫 Low-signal click\\n<i>Dropped — not actionable</i>"]
  TOTAL -->|"total ≥ 2"| CLASSIFY

  CLASSIFY["classifyEvent()\\n<b>Event Classifier</b>"]
  CLASSIFY --> CT1["CTA_CLICK\\n<i>score ≥ 5 + button</i>"]
  CLASSIFY --> CT2["CART_ACTION\\n<i>text: cart · buy · checkout</i>"]
  CLASSIFY --> CT3["COMPARE_CLICK\\n<i>text: compare · spec</i>"]
  CLASSIFY --> CT4["NAV_CLICK\\n<i>tag: a · closest: nav</i>"]
  CLASSIFY --> CT5["PRODUCT_CLICK\\n<i>closest: data-product-card</i>"]

  CLASSIFY --> MW["🔌 Middleware Pipeline\\n<b>listener.use(fn)</b>\\n<i>First match wins · break</i>"]
  MW --> FRUST

  FRUST["🔴 FrustrationDetector\\n<b>Click Buffer</b>\\n<i>Map＜elementId, timestamps[]＞</i>"]
  FRUST -->|"3+ clicks in 1000ms\\nsame element"| FRICTION["⚠️ UX_FRICTION\\n<i>Overrides event_type</i>\\n<i>Buffer reset after fire</i>"]
  FRUST -->|"Normal"| PAYLOAD

  FRICTION --> PAYLOAD
  PAYLOAD["📦 EventPayload\\n<i>Type-safe contract</i>"]

  style INIT fill:#1e293b,stroke:#f97316,color:#f8fafc
  style BIND fill:#1e293b,stroke:#3b82f6,color:#f8fafc
  style CLICK fill:#0f172a,stroke:#f97316,color:#f8fafc
  style WALK fill:#1e293b,stroke:#6b7280,color:#f8fafc
  style SKIP fill:#0f172a,stroke:#6b7280,color:#6b7280
  style SKIP2 fill:#0f172a,stroke:#6b7280,color:#6b7280
  style SCORE fill:#1e293b,stroke:#a855f7,color:#f8fafc
  style TXT fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style CLS fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style ARIA fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style TOTAL fill:#0f172a,stroke:#fbbf24,color:#fbbf24
  style CLASSIFY fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style CT1 fill:#0f172a,stroke:#22c55e,color:#86efac
  style CT2 fill:#0f172a,stroke:#22c55e,color:#86efac
  style CT3 fill:#0f172a,stroke:#22c55e,color:#86efac
  style CT4 fill:#0f172a,stroke:#22c55e,color:#86efac
  style CT5 fill:#0f172a,stroke:#22c55e,color:#86efac
  style MW fill:#1e293b,stroke:#06b6d4,color:#f8fafc
  style FRUST fill:#1e293b,stroke:#ef4444,color:#f8fafc
  style FRICTION fill:#451a03,stroke:#ef4444,color:#fbbf24
  style PAYLOAD fill:#0f172a,stroke:#f97316,stroke-width:3px,color:#f97316`;

// ─────────────────────────────────────────────────────────────────
// LAYER 2: EventLedger — "The Scalable Ledger"
//
// Source: src/lib/event-ledger.ts
// Queue: in-memory array + localStorage ("pv_event_ledger", cap 50)
// Dedup: seenEventIds Map<event_id, timestamp>, window: 5000ms
// Flush: batch_full(20) | page_transition | idle(rIC 60s) | interval(30s) | manual
// ─────────────────────────────────────────────────────────────────
const EVENT_LEDGER_CHART = `flowchart TD
  EP["📦 EventPayload\\n<i>From SmartListener</i>"]
  EP --> PUSH["ledger.push()\\n<i>stats.total_events_received++</i>"]

  PUSH --> DEDUP["🔍 isDuplicate()\\n<i>seenEventIds: Map＜event_id, timestamp＞</i>"]
  DEDUP -->|"Same event_id within 5000ms"| DROP["🗑️ Dropped\\n<i>stats.total_duplicates_dropped++</i>"]
  DEDUP -->|"New or expired"| RECORD["Record event_id → Date.now()"]

  RECORD --> QUEUE["💾 In-Memory Queue\\n<i>this.queue: EventPayload[]</i>"]
  QUEUE --> PERSIST["📀 localStorage.setItem\\n<i>key: 'pv_event_ledger'</i>\\n<i>Cap: 50 events · silent fail</i>"]

  QUEUE --> TRIGGER{"Flush Trigger?"}
  TRIGGER -->|"queue.length ≥ 20"| FLUSH["📤 flush('batch_full')"]
  TRIGGER -->|"visibilitychange → hidden"| FLUSH2["📤 flush('page_transition')"]
  TRIGGER -->|"beforeunload"| FLUSH2
  TRIGGER -->|"requestIdleCallback\\ntimeout: 60000ms"| FLUSH3["📤 flush('idle')"]
  TRIGGER -->|"setInterval — 30s"| FLUSH4["📤 flush('interval')"]
  TRIGGER -->|"User / debug action"| FLUSH5["📤 flush('manual')"]

  FLUSH --> BATCH
  FLUSH2 --> BATCH
  FLUSH3 --> BATCH
  FLUSH4 --> BATCH
  FLUSH5 --> BATCH

  BATCH["📋 EventBatch\\nbatch_id · session_id\\nevent_count · flush_trigger\\ndedup_stats { received, dropped, unique }"]
  BATCH --> PRUNE["pruneDeduplicationCache()\\n<i>Remove entries older than 10s</i>"]
  BATCH --> CLEAR["localStorage.removeItem()"]
  BATCH --> SEND["🌐 simulateBackendSend()\\n<i>Production: sendBeacon / fetch(keepalive)</i>"]

  SEND --> SCHEMA["🗄️ EventRecord — JSONB Schema"]
  SCHEMA --> S1["event_type — VARCHAR(50)"]
  SCHEMA --> S2["variant_id — VARCHAR(100)"]
  SCHEMA --> S3["session_score — DECIMAL(4,3)"]
  SCHEMA --> S4["path_url — TEXT"]
  SCHEMA --> S5["is_friction_event — BOOLEAN"]
  SCHEMA --> S6["session_id — VARCHAR(100)"]
  SCHEMA --> S7["metadata — JSONB\\n<i>semantic_scores + element_meta + middleware_data</i>"]

  style EP fill:#0f172a,stroke:#f97316,stroke-width:3px,color:#f97316
  style PUSH fill:#1e293b,stroke:#3b82f6,color:#f8fafc
  style DEDUP fill:#1e293b,stroke:#a855f7,color:#f8fafc
  style DROP fill:#451a03,stroke:#ef4444,color:#fca5a5
  style RECORD fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style QUEUE fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style PERSIST fill:#0f172a,stroke:#22c55e,color:#86efac
  style TRIGGER fill:#0f172a,stroke:#fbbf24,color:#fbbf24
  style FLUSH fill:#1e293b,stroke:#06b6d4,color:#f8fafc
  style FLUSH2 fill:#1e293b,stroke:#06b6d4,color:#f8fafc
  style FLUSH3 fill:#1e293b,stroke:#06b6d4,color:#f8fafc
  style FLUSH4 fill:#1e293b,stroke:#06b6d4,color:#f8fafc
  style FLUSH5 fill:#1e293b,stroke:#06b6d4,color:#f8fafc
  style BATCH fill:#1e293b,stroke:#f97316,color:#f8fafc
  style PRUNE fill:#0f172a,stroke:#6b7280,color:#9ca3af
  style CLEAR fill:#0f172a,stroke:#6b7280,color:#9ca3af
  style SEND fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style SCHEMA fill:#1e293b,stroke:#f97316,color:#f8fafc
  style S1 fill:#0f172a,stroke:#6b7280,color:#d1d5db
  style S2 fill:#0f172a,stroke:#6b7280,color:#d1d5db
  style S3 fill:#0f172a,stroke:#6b7280,color:#d1d5db
  style S4 fill:#0f172a,stroke:#6b7280,color:#d1d5db
  style S5 fill:#0f172a,stroke:#6b7280,color:#d1d5db
  style S6 fill:#0f172a,stroke:#6b7280,color:#d1d5db
  style S7 fill:#0f172a,stroke:#6b7280,color:#d1d5db`;

// ─────────────────────────────────────────────────────────────────
// LAYER 3: React Bridge — useSmartListener Hook
//
// Source: src/hooks/use-smart-listener.ts
// Bridges SmartListener + EventLedger into React state
// ─────────────────────────────────────────────────────────────────
const REACT_BRIDGE_CHART = `flowchart TD
  HOOK["⚛️ useSmartListener()\\n<i>src/hooks/use-smart-listener.ts</i>"]

  HOOK --> CREATE["useEffect — enabled"]
  CREATE --> SL["createSmartListener()\\nonEvent: handleEvent\\nonFrustration: handleFrustration"]
  CREATE --> EL["createEventLedger()\\nonFlush: handleFlush"]

  SL -->|"listener.init()"| LIVE["🟢 Listening\\n<i>Document-level click capture</i>"]
  EL -->|"ledger.init()"| READY["🟢 Ledger Active\\n<i>localStorage restored · timers set</i>"]

  LIVE --> EVT["handleEvent(payload)"]
  EVT --> STATE1["setEvents()\\n<i>Cap: 50 events</i>"]
  EVT --> STATE2["setLatestEvent()"]
  EVT --> STATE3["ledgerRef.push(payload)\\n<i>Into ledger queue</i>"]
  EVT --> STATE4["setMetrics()\\n<i>sessionId · eventCount · sessionScore</i>"]

  LIVE --> FRIC["handleFrustration(payload)"]
  FRIC --> STATE5["setFrictionEvents()\\n<i>Cap: 10 events</i>"]

  READY --> FLSH["handleFlush(batch)"]
  FLSH --> STATE6["setBatches()\\n<i>Cap: 10 batches</i>"]
  FLSH --> STATE7["setLedgerStats()"]

  HOOK --> RETURN["Return SmartListenerState"]
  RETURN --> R1["events · latestEvent · frictionEvents"]
  RETURN --> R2["metrics · ledgerStats · batches"]
  RETURN --> R3["queueSize · flushNow() · listener"]

  CREATE -->|"Cleanup"| DESTROY["listener.destroy()\\nledger.destroy()\\n<i>Refs set to null</i>"]

  style HOOK fill:#1e293b,stroke:#f97316,stroke-width:2px,color:#f8fafc
  style CREATE fill:#1e293b,stroke:#3b82f6,color:#f8fafc
  style SL fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style EL fill:#0f172a,stroke:#22c55e,color:#86efac
  style LIVE fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style READY fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style EVT fill:#1e293b,stroke:#f97316,color:#f8fafc
  style STATE1 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style STATE2 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style STATE3 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style STATE4 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style FRIC fill:#1e293b,stroke:#ef4444,color:#f8fafc
  style STATE5 fill:#0f172a,stroke:#ef4444,color:#fca5a5
  style FLSH fill:#1e293b,stroke:#06b6d4,color:#f8fafc
  style STATE6 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style STATE7 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style RETURN fill:#1e293b,stroke:#f97316,stroke-width:2px,color:#f97316
  style R1 fill:#0f172a,stroke:#f97316,color:#fb923c
  style R2 fill:#0f172a,stroke:#f97316,color:#fb923c
  style R3 fill:#0f172a,stroke:#f97316,color:#fb923c
  style DESTROY fill:#0f172a,stroke:#6b7280,color:#9ca3af`;

// ─────────────────────────────────────────────────────────────────
// LAYER 4: Middleware Hooks — plugin.use() System
//
// Source: src/lib/smart-listener.ts lines 86–103, 454–466
// ─────────────────────────────────────────────────────────────────
const MIDDLEWARE_CHART = `flowchart LR
  USE["listener.use(fn)\\n<i>Push to this.middlewares[]</i>"]
  USE --> LOOP{"for (mw of middlewares)"}

  LOOP --> MW1["mw(element, MouseEvent)"]
  MW1 -->|"Returns object"| HIT["✅ Match Found\\nevent_type + label? + data?"]
  MW1 -->|"Returns null"| NEXT["Next middleware →"]
  NEXT --> LOOP

  HIT -->|"First match wins — break"| OVERRIDE["Overrides classifyEvent()\\nmiddleware_data merged"]

  subgraph EXAMPLES["Example Middleware Implementations"]
    EX1["element.closest\\('[data-newsletter]'\\)\\n→ CUSTOM · newsletter_signup"]
    EX2["element.closest\\('[data-video-play]'\\)\\n→ CUSTOM · video_play"]
    EX3["element.closest\\('[data-share]'\\)\\n→ CUSTOM · social_share"]
  end

  OVERRIDE --> PAYLOAD["📦 EventPayload\\n<i>middleware_data: Record＜string, unknown＞</i>"]

  style USE fill:#1e293b,stroke:#f97316,stroke-width:2px,color:#f8fafc
  style LOOP fill:#0f172a,stroke:#fbbf24,color:#fbbf24
  style MW1 fill:#1e293b,stroke:#06b6d4,color:#f8fafc
  style HIT fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style NEXT fill:#0f172a,stroke:#6b7280,color:#9ca3af
  style OVERRIDE fill:#1e293b,stroke:#a855f7,color:#f8fafc
  style EXAMPLES fill:#0f172a,stroke:#334155,color:#f8fafc
  style EX1 fill:#0f172a,stroke:#22c55e,color:#86efac
  style EX2 fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style EX3 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style PAYLOAD fill:#0f172a,stroke:#f97316,stroke-width:3px,color:#f97316`;

// ─────────────────────────────────────────────────────────────────
// WIDGET ARCHITECTURE — How the SmartSwap widget fits any store
//
// Source: personalization-engine.ts (signal collection + resolution)
// ─────────────────────────────────────────────────────────────────
const WIDGET_ARCHITECTURE_CHART = `flowchart TD
  SIGNALS["📡 URL Signal Sources"]
  SIGNALS --> S1["?intent= — weight: 1.0"]
  SIGNALS --> S2["?utm_campaign= — weight: 0.95"]
  SIGNALS --> S3["?category= — weight: 0.85"]
  SIGNALS --> S4["?q= / ?query= — weight: 0.80"]
  SIGNALS --> S5["?ref= / referrer — weight: 0.75"]
  SIGNALS --> S6["?utm_source= — weight: 0.70"]
  SIGNALS --> S7["Implicit referrers — weight: 0.75\\n<i>github→developer · twitch→gaming\\nbehance→creative · slickdeals→budget</i>"]

  S1 --> COLLECT["collectSignals()\\n<i>Keyword matching · compound detection</i>\\n<i>Signal decay: ×0.7 for duplicate sources</i>"]
  S2 --> COLLECT
  S3 --> COLLECT
  S4 --> COLLECT
  S5 --> COLLECT
  S6 --> COLLECT
  S7 --> COLLECT

  COLLECT --> RESOLVE["resolveIntent()\\n<i>Weighted score aggregation per intent</i>\\n<i>Δ < 0.15 → priority matrix tiebreaker</i>"]

  RESOLVE --> DECISION["🧠 IntentResult — Structured Decision"]

  subgraph WIDGETBOX["⚡ SmartSwap Widget — < 15KB gzip"]
    COLLECT
    RESOLVE
    DECISION
  end

  DECISION --> INTENT["intent: IntentType\\n<i>gaming · productivity · budget\\ncreative · student · developer · default</i>"]
  DECISION --> TMPL["templateId: string\\n<i>hero_centered · hero_split · hero_minimal</i>"]
  DECISION --> FUNNEL["funnelStage: FunnelStage"]
  DECISION --> ORDER["sectionOrder: SectionId[]"]
  DECISION --> CTA["ctaDecision: { text, link, priority }"]

  FUNNEL --> F1["buy → products, trust, funnel"]
  FUNNEL --> F2["compare → funnel, products, trust"]
  FUNNEL --> F3["explore → trust, funnel, products"]

  subgraph STOREBOX["🏪 Host Store — Shopify / Webflow / Custom"]
    HERO["#hero-container\\n<i>Hero swapped via template</i>"]
    CTAEL[".hero-cta\\n<i>Text + href replaced</i>"]
    REST["Everything else\\n<i>Untouched ✓</i>"]
  end

  ORDER --> HERO
  CTA --> CTAEL

  style SIGNALS fill:#1e293b,stroke:#3b82f6,color:#f8fafc
  style S1 fill:#0f172a,stroke:#3b82f6,color:#93c5fd
  style S2 fill:#0f172a,stroke:#3b82f6,color:#93c5fd
  style S3 fill:#0f172a,stroke:#3b82f6,color:#93c5fd
  style S4 fill:#0f172a,stroke:#3b82f6,color:#93c5fd
  style S5 fill:#0f172a,stroke:#3b82f6,color:#93c5fd
  style S6 fill:#0f172a,stroke:#3b82f6,color:#93c5fd
  style S7 fill:#0f172a,stroke:#3b82f6,color:#93c5fd
  style WIDGETBOX fill:#0f172a,stroke:#f97316,color:#f8fafc
  style COLLECT fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style RESOLVE fill:#1e293b,stroke:#a855f7,color:#f8fafc
  style DECISION fill:#1e293b,stroke:#f97316,stroke-width:2px,color:#f97316
  style INTENT fill:#0f172a,stroke:#f97316,color:#fb923c
  style TMPL fill:#0f172a,stroke:#f97316,color:#fb923c
  style FUNNEL fill:#0f172a,stroke:#fbbf24,color:#fbbf24
  style ORDER fill:#0f172a,stroke:#fbbf24,color:#fbbf24
  style CTA fill:#0f172a,stroke:#f97316,color:#fb923c
  style F1 fill:#0f172a,stroke:#22c55e,color:#86efac
  style F2 fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style F3 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style STOREBOX fill:#0f172a,stroke:#6b7280,color:#f8fafc
  style HERO fill:#1e293b,stroke:#06b6d4,color:#67e8f9
  style CTAEL fill:#1e293b,stroke:#06b6d4,color:#67e8f9
  style REST fill:#1e293b,stroke:#22c55e,color:#86efac`;

const DataFlowDiagrams = () => {
  return (
    <div className="space-y-12">
      {/* Layer 1: Frontend Observer */}
      <section>
        <div className="flex items-start gap-3 mb-5">
          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">1</span>
          <div>
            <h3 className="text-base font-display font-bold text-foreground leading-snug">
              SmartListener — Semantic Event Delegation
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              <code className="text-primary text-xs bg-primary/5 px-1.5 py-0.5 rounded">smart-listener.ts</code> — Non-blocking init via <code className="text-primary text-xs">requestIdleCallback</code>, 
              single document-level click handler with weighted semantic scoring and frustration detection.
            </p>
          </div>
        </div>
        <MermaidDiagram chart={FRONTEND_OBSERVER_CHART} id="frontend-observer" />
      </section>

      {/* Connector */}
      <div className="flex items-center justify-center py-1">
        <div className="flex items-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/30" />
          <span className="text-xs font-mono text-primary font-semibold px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            EventPayload → ledger.push()
          </span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/30" />
        </div>
      </div>

      {/* Layer 2: Event Ledger */}
      <section>
        <div className="flex items-start gap-3 mb-5">
          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">2</span>
          <div>
            <h3 className="text-base font-display font-bold text-foreground leading-snug">
              EventLedger — Client-Side Batching &amp; Persistence
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              <code className="text-primary text-xs bg-primary/5 px-1.5 py-0.5 rounded">event-ledger.ts</code> — Deduplication by event_id (5s window), localStorage crash-safe queue, 
              5 flush triggers, JSONB-compatible backend schema.
            </p>
          </div>
        </div>
        <MermaidDiagram chart={EVENT_LEDGER_CHART} id="event-ledger" />
      </section>

      {/* Connector */}
      <div className="flex items-center justify-center py-1">
        <div className="flex items-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/30" />
          <span className="text-xs font-mono text-primary font-semibold px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            React State ← useSmartListener()
          </span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/30" />
        </div>
      </div>

      {/* Layer 3: React Bridge */}
      <section>
        <div className="flex items-start gap-3 mb-5">
          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">3</span>
          <div>
            <h3 className="text-base font-display font-bold text-foreground leading-snug">
              useSmartListener — React Bridge Hook
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              <code className="text-primary text-xs bg-primary/5 px-1.5 py-0.5 rounded">use-smart-listener.ts</code> — Creates &amp; manages SmartListener + EventLedger instances, 
              exposes real-time state to the component tree with proper cleanup.
            </p>
          </div>
        </div>
        <MermaidDiagram chart={REACT_BRIDGE_CHART} id="react-bridge" />
      </section>

      {/* Layer 4: Middleware Hooks */}
      <section>
        <div className="flex items-start gap-3 mb-5">
          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">4</span>
          <div>
            <h3 className="text-base font-display font-bold text-foreground leading-snug">
              Middleware — plugin.use() Extensibility
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              <code className="text-primary text-xs bg-primary/5 px-1.5 py-0.5 rounded">IntentDetectorMiddleware</code> — Functions receive (element, MouseEvent) and return 
              a custom event classification or null to pass through. First match wins.
            </p>
          </div>
        </div>
        <MermaidDiagram chart={MIDDLEWARE_CHART} id="middleware-hooks" />
      </section>
    </div>
  );
};

export const WidgetArchitectureDiagram = () => {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        <code className="text-primary text-xs bg-primary/5 px-1.5 py-0.5 rounded">personalization-engine.ts</code> — Weighted signal collection from 7 URL param types, 
        intent resolution with compound signal handling, funnel-driven section reordering.
      </p>
      <MermaidDiagram chart={WIDGET_ARCHITECTURE_CHART} id="widget-architecture" />
    </div>
  );
};

export default DataFlowDiagrams;
