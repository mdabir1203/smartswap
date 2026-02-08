import MermaidDiagram from "./MermaidDiagram";

const FRONTEND_OBSERVER_CHART = `flowchart TD
  A["🚀 NON-BLOCKING INIT<br/><i>requestIdleCallback</i>"]
  A -->|"Doesn't compete with LCP"| B["document.addEventListener<br/><b>click</b>, handler, capture: true"]
  B --> C{"Click Event"}
  C --> D["📊 Semantic Scoring Engine"]
  D --> D1["text: +5 to +10"]
  D --> D2["class: +3 to +8"]
  D --> D3["aria: +5 to +8"]
  D --> E["🏷️ Event Classifier"]
  E --> E1["CTA_CLICK"]
  E --> E2["NAV_CLICK"]
  E --> E3["CART_ACTION"]
  E --> E4["COMPARE_CLICK"]
  E --> E5["PRODUCT_CLICK"]
  C --> F["🔴 Frustration Detector<br/><i>Click Buffer</i>"]
  F -->|"3+ clicks in 1000ms"| G["⚠️ UX_FRICTION event"]
  G -->|"Suppresses"| H["Salesy variant overlays"]
  E --> I["🔌 Middleware Pipeline<br/><i>plugin.use\\(\\)</i>"]
  F --> I
  I --> I1["Newsletter Signup → CUSTOM"]
  I --> I2["Video Play → CUSTOM"]
  I --> J["📦 EventPayload<br/><i>type-safe</i>"]

  style A fill:#1e293b,stroke:#f97316,color:#f8fafc
  style B fill:#1e293b,stroke:#3b82f6,color:#f8fafc
  style C fill:#0f172a,stroke:#f97316,color:#f8fafc
  style D fill:#1e293b,stroke:#a855f7,color:#f8fafc
  style E fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style F fill:#1e293b,stroke:#ef4444,color:#f8fafc
  style G fill:#451a03,stroke:#ef4444,color:#fbbf24
  style H fill:#1e293b,stroke:#6b7280,color:#9ca3af
  style I fill:#1e293b,stroke:#06b6d4,color:#f8fafc
  style J fill:#0f172a,stroke:#f97316,stroke-width:3px,color:#f97316
  style D1 fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style D2 fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style D3 fill:#0f172a,stroke:#a855f7,color:#c4b5fd
  style E1 fill:#0f172a,stroke:#22c55e,color:#86efac
  style E2 fill:#0f172a,stroke:#22c55e,color:#86efac
  style E3 fill:#0f172a,stroke:#22c55e,color:#86efac
  style E4 fill:#0f172a,stroke:#22c55e,color:#86efac
  style E5 fill:#0f172a,stroke:#22c55e,color:#86efac
  style I1 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style I2 fill:#0f172a,stroke:#06b6d4,color:#67e8f9`;

const EVENT_LEDGER_CHART = `flowchart TD
  A["📦 EventPayload"] --> B["EventLedger.push\\(\\)"]
  B --> C["🔍 Dedup Check"]
  C -->|"event_id + session_id<br/>5s window"| D{"Duplicate?"}
  D -->|"Yes"| E["🗑️ Dropped"]
  D -->|"No"| F["💾 localStorage Queue"]
  F -->|"Crash-safe<br/>Max 50 events<br/>Auto-restore"| G{"Flush Trigger?"}
  G -->|"Batch full"| H["📤 Batch Flush"]
  G -->|"Page leave"| H
  G -->|"Idle time"| H
  G -->|"30s timer"| H
  H --> I["🗄️ JSONB Schema<br/><i>PostgreSQL</i>"]
  I --> I1["event_type"]
  I --> I2["variant_id"]
  I --> I3["session_score"]
  I --> I4["path_url"]
  I --> I5["is_friction_event"]
  I --> I6["session_id"]
  I --> I7["metadata — JSONB"]

  style A fill:#0f172a,stroke:#f97316,stroke-width:3px,color:#f97316
  style B fill:#1e293b,stroke:#3b82f6,color:#f8fafc
  style C fill:#1e293b,stroke:#a855f7,color:#f8fafc
  style D fill:#0f172a,stroke:#fbbf24,color:#fbbf24
  style E fill:#451a03,stroke:#ef4444,color:#fca5a5
  style F fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style G fill:#0f172a,stroke:#fbbf24,color:#fbbf24
  style H fill:#1e293b,stroke:#06b6d4,color:#f8fafc
  style I fill:#1e293b,stroke:#f97316,color:#f8fafc
  style I1 fill:#0f172a,stroke:#6b7280,color:#d1d5db
  style I2 fill:#0f172a,stroke:#6b7280,color:#d1d5db
  style I3 fill:#0f172a,stroke:#6b7280,color:#d1d5db
  style I4 fill:#0f172a,stroke:#6b7280,color:#d1d5db
  style I5 fill:#0f172a,stroke:#6b7280,color:#d1d5db
  style I6 fill:#0f172a,stroke:#6b7280,color:#d1d5db
  style I7 fill:#0f172a,stroke:#6b7280,color:#d1d5db`;

const DIRECTORS_CUT_CHART = `flowchart TD
  A["🎬 SHADOW DOM ADMIN<br/><i>No CSS leakage into host store</i>"]
  A --> B["Isolated Admin Panel"]
  B --> C["🎭 Persona Spoofer"]
  B --> D["⚡ Simulation States"]
  C --> C1["navigator.conn"]
  C --> C2["navigator.ua"]
  C --> C3["GDPR mode"]
  D --> D1["Fast Desktop — fiber"]
  D --> D2["Slow 3G — budget phone"]
  D --> D3["Screen Reader — NVDA"]
  D --> D4["International — EU/GDPR"]
  B --> E["🎨 Adaptations per Persona"]
  E --> E1["Image quality"]
  E --> E2["Animation toggle"]
  E --> E3["ARIA live regions"]
  E --> E4["Lazy loading"]
  E --> E5["Consent banners"]

  style A fill:#1e293b,stroke:#a855f7,stroke-width:2px,color:#f8fafc
  style B fill:#1e293b,stroke:#f97316,color:#f8fafc
  style C fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style D fill:#1e293b,stroke:#ef4444,color:#f8fafc
  style E fill:#1e293b,stroke:#06b6d4,color:#f8fafc
  style C1 fill:#0f172a,stroke:#22c55e,color:#86efac
  style C2 fill:#0f172a,stroke:#22c55e,color:#86efac
  style C3 fill:#0f172a,stroke:#22c55e,color:#86efac
  style D1 fill:#0f172a,stroke:#ef4444,color:#fca5a5
  style D2 fill:#0f172a,stroke:#ef4444,color:#fca5a5
  style D3 fill:#0f172a,stroke:#ef4444,color:#fca5a5
  style D4 fill:#0f172a,stroke:#ef4444,color:#fca5a5
  style E1 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style E2 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style E3 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style E4 fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style E5 fill:#0f172a,stroke:#06b6d4,color:#67e8f9`;

const MIDDLEWARE_CHART = `flowchart LR
  A["smartListener.use\\(\\)"] --> B{"element.closest?"}
  B -->|"[data-newsletter]"| C["📧 CUSTOM<br/>newsletter_signup"]
  B -->|"[data-video-play]"| D["🎬 CUSTOM<br/>video_play"]
  B -->|"No match"| E["return null<br/><i>Pass to next middleware</i>"]
  E --> F["Next middleware in chain"]
  C --> G["EventPayload dispatched"]
  D --> G

  style A fill:#1e293b,stroke:#f97316,stroke-width:2px,color:#f8fafc
  style B fill:#0f172a,stroke:#fbbf24,color:#fbbf24
  style C fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style D fill:#1e293b,stroke:#a855f7,color:#f8fafc
  style E fill:#0f172a,stroke:#6b7280,color:#9ca3af
  style F fill:#0f172a,stroke:#6b7280,color:#9ca3af
  style G fill:#1e293b,stroke:#f97316,stroke-width:2px,color:#f97316`;

const WIDGET_ARCHITECTURE_CHART = `flowchart TD
  subgraph BROWSER["🌐 VISITOR BROWSER"]
    direction TB
    SIGNALS["📡 URL Signals<br/>utm_campaign • referrer<br/>query params • cookies"]
    SIGNALS --> WIDGET
    subgraph WIDGET["SmartSwap Widget — 12KB gzip"]
      direction LR
      COLLECT["📥 Collect"] --> SCORE["📊 Score"] --> SWAP["🔄 Swap DOM"]
    end
    WIDGET -->|"Safety: Unknown → Default fallback"| STORE
    subgraph STORE["🏪 Host Store — Shopify / Webflow / Custom"]
      HERO["#hero-container ← Only this is modified"]
      CTA[".hero-cta ← Text & href swapped"]
      REST["[everything else] ← Untouched ✓"]
    end
  end

  style BROWSER fill:#0f172a,stroke:#334155,color:#f8fafc
  style SIGNALS fill:#1e293b,stroke:#3b82f6,color:#f8fafc
  style WIDGET fill:#1e293b,stroke:#f97316,color:#f8fafc
  style COLLECT fill:#1e293b,stroke:#22c55e,color:#f8fafc
  style SCORE fill:#1e293b,stroke:#a855f7,color:#f8fafc
  style SWAP fill:#1e293b,stroke:#fbbf24,color:#f8fafc
  style STORE fill:#1e293b,stroke:#6b7280,color:#f8fafc
  style HERO fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style CTA fill:#0f172a,stroke:#06b6d4,color:#67e8f9
  style REST fill:#0f172a,stroke:#22c55e,color:#86efac`;

const DataFlowDiagrams = () => {
  return (
    <div className="space-y-8">
      {/* Layer 1: Frontend Observer */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</span>
          <h3 className="text-sm font-display font-semibold text-foreground">Frontend: "The Minimalist Observer"</h3>
        </div>
        <MermaidDiagram chart={FRONTEND_OBSERVER_CHART} id="frontend-observer" />
      </div>

      {/* Connector */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-border" />
          <span className="text-xs font-mono text-primary font-semibold px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            EventPayload (type-safe)
          </span>
          <div className="h-px w-12 bg-border" />
        </div>
      </div>

      {/* Layer 2: Event Ledger */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</span>
          <h3 className="text-sm font-display font-semibold text-foreground">Backend: "The Scalable Ledger"</h3>
        </div>
        <MermaidDiagram chart={EVENT_LEDGER_CHART} id="event-ledger" />
      </div>

      {/* Layer 3: Director's Cut */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</span>
          <h3 className="text-sm font-display font-semibold text-foreground">Preview: "Director's Cut"</h3>
        </div>
        <MermaidDiagram chart={DIRECTORS_CUT_CHART} id="directors-cut" />
      </div>

      {/* Layer 4: Middleware Hooks */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">4</span>
          <h3 className="text-sm font-display font-semibold text-foreground">Extensibility: Middleware Hooks</h3>
        </div>
        <MermaidDiagram chart={MIDDLEWARE_CHART} id="middleware-hooks" />
      </div>
    </div>
  );
};

export const WidgetArchitectureDiagram = () => {
  return (
    <MermaidDiagram chart={WIDGET_ARCHITECTURE_CHART} id="widget-architecture" />
  );
};

export default DataFlowDiagrams;
