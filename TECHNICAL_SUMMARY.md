# SmartSwap — Technical Summary

> **One-line pitch:** A zero-backend AI personalization layer that transforms static e-commerce storefronts into intent-driven experiences using only URL signals and on-page behavior — in real time, with one script tag.

---

## The Problem

E-commerce stores show the same hero, CTA, and page layout to every visitor — whether they arrived from a Twitch gaming stream or a LinkedIn productivity article. Conversion suffers because content doesn't match intent.

## The Solution

SmartSwap intercepts visitor arrival signals (UTM params, referrer domains, search queries) and **instantly** rewrites the hero section, CTA copy, page section order, and product prioritization — all client-side, zero-latency, no backend required.

```
Visitor arrives → URL signals weighted → Intent scored → Persona resolved → DOM swapped
```

## Architecture (4 Core Modules)

| Module | Size | Purpose |
|---|---|---|
| **Personalization Engine** | 741 LOC | Weighted signal scoring across 7 URL param types → resolves 1 of 7 personas with confidence level, funnel stage, and section reordering |
| **Template Registry** | 191 LOC | Maps intents to 3 hero layouts (centered, split-screen, minimal) with typed slot definitions |
| **Smart Listener** | 571 LOC | Semantic click tracking via event delegation — weighted text/class/ARIA scoring, frustration detection (3 clicks/1s = UX_FRICTION), middleware plugin system |
| **Event Ledger** | 424 LOC | Client-side event batching with deduplication, localStorage crash-safe persistence, idle-time flush via `requestIdleCallback` |

## Key Technical Decisions

1. **Weighted Signal Scoring** — `?intent=` (1.0) > `?utm_campaign=` (0.95) > `?category=` (0.85) > `?q=` (0.80) > `?ref=` (0.75). Signal decay applied for duplicate source types (×0.7).

2. **Compound Signal Resolution** — "cheap gaming monitor" triggers both `budget` and `gaming`. First keyword position wins priority; close scores (Δ < 0.15) use a priority matrix tiebreaker.

3. **Funnel-Driven Section Reordering** — The engine decides page layout, not the UI:
   - **Buy** → Products first (ready to purchase)
   - **Compare** → Funnel CTA first (research mode)
   - **Explore** → Trust bar first (build confidence)

4. **Non-Blocking Everything** — Smart Listener initializes via `requestIdleCallback`. Event Ledger flushes during browser idle time. Zero main-thread blocking.

5. **Frustration Detection** — A sliding-window click buffer detects rage clicks (3+ clicks in 1000ms on the same element) → fires `UX_FRICTION` event → suppresses aggressive CTAs.

## Structured Decision Object

Every page load produces a transparent, inspectable JSON — accessible via `window.__SMARTSWAP_DECISION__`:

```json
{
  "intent": "GAMING",
  "template": "hero_centered",
  "cta": "Shop Gaming Monitors",
  "funnel_stage": "BUY",
  "section_order": ["products", "trust", "funnel"],
  "confidence": "high",
  "signals": [{ "source": "utm_campaign", "value": "gaming", "weight": 0.95 }],
  "injection_log": ["Intent resolved: gaming (high)", "Template: hero_centered", "Section order: products → trust → funnel"]
}
```

## Live Commerce Integration

Real Shopify Storefront API (GraphQL) integration with a 6-product catalog. Zustand cart store with full CRUD sync, localStorage persistence, and Storefront API checkout URL generation.

## What Makes This Different

- **No backend, no API keys, no build step** — pure client-side intelligence
- **Explainable AI** — every decision logs *why* it happened, not just *what* changed
- **Edge-case hardened** — handles malformed URLs, partial matches, compound signals, short queries, unknown intents, and signal conflicts
- **< 15KB JS footprint** — smaller than most analytics scripts
- **Plugin-extensible** — `listener.use()` middleware for custom intent detection

## Try It

```
https://smartswap.lovable.app/?utm_campaign=gaming
https://smartswap.lovable.app/?ref=dribbble
https://smartswap.lovable.app/?q=cheap
https://smartswap.lovable.app/?ref=github
https://smartswap.lovable.app/?q=student
```

---

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Shopify Storefront API · Zustand · Vitest
