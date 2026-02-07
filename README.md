# PixelVue — AI Personalization Layer for E-Commerce

> **Plug-and-play AI personalization engine** that transforms a static e-commerce storefront into a dynamic, intent-driven experience — all from URL signals, referrer data, and on-page behavior. Zero backend required for the demo; Lovable Cloud ready for production.

**Live Demo:** [smartswap.lovable.app](https://smartswap.lovable.app)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Systems](#core-systems)
  - [1. Personalization Engine](#1-personalization-engine)
  - [2. Template Registry](#2-template-registry)
  - [3. Smart Listener](#3-smart-listener)
  - [4. Event Ledger](#4-event-ledger)
  - [5. Behavior Tracker](#5-behavior-tracker)
- [Persona Catalog](#persona-catalog)
- [Decision Object (§2.5 Spec)](#decision-object-25-spec)
- [How It Works](#how-it-works)
- [URL Signal Reference](#url-signal-reference)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Integration Guide](#integration-guide)

---

## Overview

PixelVue is a **proof-of-concept AI personalization layer** designed for SMB e-commerce stores. It demonstrates how a single `<script>` tag could bring enterprise-level dynamic content to any storefront by:

1. **Detecting visitor intent** from URL parameters, referrers, and search queries
2. **Resolving a persona** (Gaming, Budget, Creative, Developer, Student, Productivity)
3. **Injecting personalized content** — hero images, headlines, CTAs, section ordering
4. **Tracking behavior** — semantic click scoring, frustration detection, scroll depth
5. **Batching events** — client-side ledger with deduplication and flush strategies

The philosophy: **"Drop in and forget."** Safe DOM surgery on specific sections (Hero, CTA, Trust), not full-page generation or chatbot interfaces.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VISITOR ARRIVES                        │
│  URL: ?utm_campaign=gaming&ref=twitch                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              1. SIGNAL COLLECTION                           │
│  utm_campaign, utm_source, utm_medium, ?q=, ?ref=,         │
│  ?intent=, ?category=, ?tag=, referrer domain               │
│  + Compound signal handling + URL decoding                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              2. INTENT RESOLUTION (The Brain)               │
│  Weighted scoring → Priority tiebreaking → Confidence       │
│  Signal decay for duplicate sources                         │
│  Output: intent + confidence + funnel stage                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              3. DECISION ENGINE (§2.5 Output)               │
│  Template selection → CTA decision → Section ordering       │
│  Hero image → Injection log → Exportable JSON               │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────┴─────┐
                    ▼          ▼
            ┌──────────┐ ┌──────────────┐
            │ TEMPLATE │ │ SMART        │
            │ REGISTRY │ │ LISTENER     │
            │ (Layout) │ │ (Tracking)   │
            └──────────┘ └──────┬───────┘
                                │
                                ▼
                        ┌──────────────┐
                        │ EVENT LEDGER │
                        │ (Batching)   │
                        └──────────────┘
```

---

## Core Systems

### 1. Personalization Engine

**File:** `src/lib/personalization-engine.ts` (741 lines)

The "Brain" of the system. Runs a 3-stage pipeline:

| Stage | Function | Description |
|-------|----------|-------------|
| **Collect** | `collectSignals()` | Extracts signals from URL params, referrers, and search queries |
| **Resolve** | `resolveIntent()` | Weighted scoring with tiebreaking, confidence levels, and edge case detection |
| **Select** | `getVariant()` | Maps resolved intent to content variant (headline, CTA, hero image) |

**Key features:**
- **7 intents:** Gaming, Productivity, Budget, Creative, Student, Developer, Default
- **Compound signals:** `?q=cheap gaming monitor` resolves both budget + gaming
- **Signal decay:** Duplicate source types get diminishing weight (×0.7)
- **Priority matrix:** Tiebreaking order when scores are within 0.05
- **Confidence levels:** High (≥0.8), Medium (≥0.4 + gap ≥0.1), Low (≥0.3)
- **Funnel stages:** Buy → Products first, Compare → Funnel first, Explore → Trust first

### 2. Template Registry

**File:** `src/lib/template-registry.ts` (191 lines)

Defines 3 hero layout templates:

| Template | Layout | Best For | Image Position |
|----------|--------|----------|----------------|
| `hero_centered` | Full-bleed background | Gaming, Creative, Default | Background overlay |
| `hero_split` | 50/50 text + image | Productivity, Developer | Right side |
| `hero_minimal` | Text-dominant, no image | Budget, Student | None |

Each template specifies content slots, alignment, CTA style, and badge visibility.

### 3. Smart Listener

**File:** `src/lib/smart-listener.ts` (571 lines)

Lightweight (<15KB) semantic event tracking system:

- **Non-blocking init** via `requestIdleCallback` (zero LCP impact)
- **Semantic scoring engine:** Weighted text/class/aria analysis of clicked elements
- **Event classification:** CTA_CLICK, NAV_CLICK, PRODUCT_CLICK, COMPARE_CLICK, CART_ACTION, UX_FRICTION
- **Frustration detection:** 3+ clicks on same element within 1000ms → `UX_FRICTION` event
- **Middleware system:** `listener.use()` for custom intent detectors

```ts
// Example: Custom middleware
listener.use((element, event) => {
  if (element.closest('[data-newsletter]')) {
    return { event_type: "CUSTOM", label: "newsletter_signup" };
  }
  return null;
});
```

### 4. Event Ledger

**File:** `src/lib/event-ledger.ts` (424 lines)

Client-side event batching and deduplication:

- **No per-click server pings** — events queued in memory
- **Flush triggers:** Batch full (20 events), interval (30s), page transition, idle, manual
- **localStorage persistence** — crash-safe buffer between page loads
- **Deduplication** — events within 5s window with same ID are dropped
- **JSONB-compatible schema** for PostgreSQL backend

### 5. Behavior Tracker

**File:** `src/hooks/use-behavior-tracking.ts` (230 lines)

5-second observation window tracking:

| Signal | Inference |
|--------|-----------|
| Fast deep scroll (>80%, >30%/s) | Gaming / impulse buyer |
| Slow methodical scroll | Productivity / researcher |
| Mid-page scan (50-70%) | Budget / deal hunter |
| Ultra-fast first click (<1.5s) | Enthusiast |
| Slow first interaction (>3s) | Deliberate researcher |

---

## Persona Catalog

| Persona | Trigger Examples | Hero Template | Funnel Stage | CTA |
|---------|-----------------|---------------|--------------|-----|
| 🎮 Gaming | `?utm_campaign=gaming`, `?ref=twitch` | Centered | Buy | "Shop Gaming Monitors" |
| 💼 Productivity | `?ref=linkedin`, `?q=office` | Split | Compare | "Explore Office Displays" |
| 💰 Budget | `?q=cheap`, `?q=deal` | Minimal | Buy | "See Today's Deals" |
| 🎨 Creative | `?ref=dribbble`, `?q=color accurate` | Centered | Explore | "Shop Creator Monitors" |
| 🎓 Student | `?q=student`, `?ref=unidays` | Minimal | Explore | "Student Deals" |
| ⌨️ Developer | `?ref=github`, `?q=coding` | Split | Compare | "Dev Setup Bundles" |
| ✨ Default | No signals / organic | Centered | Explore | "Browse All Monitors" |

---

## Decision Object (§2.5 Spec)

Every personalization decision is exportable as a structured JSON object:

```json
{
  "intent": "GAMING",
  "template": "hero_centered",
  "hero_image": "hero-gaming.jpg",
  "cta": "Shop Gaming Monitors",
  "cta_link": "/collections/gaming",
  "funnel_stage": "BUY",
  "section_order": ["products", "trust", "funnel"],
  "confidence": "high",
  "reason": "Detected 'gaming' in utm_campaign. Score: 0.95 (high confidence).",
  "signals": [{ "source": "utm_campaign", "value": "gaming", "intent": "gaming", "weight": 0.95 }],
  "edge_cases": [],
  "injection_log": [
    "Intent resolved: gaming (high)",
    "Template selected: hero_centered",
    "Funnel stage: buy → CTA priority: buy",
    "Hero image: gaming",
    "Section order: products → trust → funnel",
    "Primary CTA: \"Shop Gaming Monitors\" → /collections/gaming"
  ],
  "timestamp": "2026-02-07T22:30:00.000Z"
}
```

**Access methods:**
- **Clipboard:** Copy button in Debug Overlay
- **Download:** `.json` button in Debug Overlay
- **Global API:** `window.__PIXELVUE_DECISION__`
- **Event stream:** `window.addEventListener("pixelvue:decision", (e) => console.log(e.detail))`

---

## How It Works

1. **Visitor arrives** with URL params (e.g., `?utm_campaign=gaming&ref=twitch`)
2. **`usePersonalization` hook** calls `personalize(searchParams, referrer)`
3. **Signal collection** extracts and weights all URL/referrer signals
4. **Intent resolution** scores intents, resolves conflicts, assigns confidence
5. **Template + variant** selected → Hero, CTA, section order all update
6. **Smart Listener** begins tracking clicks via semantic event delegation
7. **Events batched** in the Event Ledger, flushed on page transition or idle
8. **Debug Overlay** shows the full decision pipeline in real-time

### Live Search Preview

Type in the nav search bar to dynamically spoof the `?q=` parameter. The entire page re-personalizes in real-time (hero, CTA, section order, badge). Suggestion chips provide one-click persona switching.

---

## URL Signal Reference

| Parameter | Weight | Example |
|-----------|--------|---------|
| `?intent=gaming` | 1.0 | Direct intent override |
| `?utm_campaign=gaming` | 0.95 | Campaign tracking |
| `?category=gaming` | 0.85 | Collection/category page |
| `?q=gaming monitor` | 0.80 | Search query |
| `?ref=github` | 0.75 | Known referrer domain |
| `?utm_source=twitch` | 0.70 | Traffic source |
| `?tag=developer` | 0.70 | CMS tag/label |
| `?utm_medium=social` | 0.50 | Traffic medium |
| Unknown params | 0.40 | Catch-all keyword scan |

---

## Project Structure

```
src/
├── lib/                          # Framework-agnostic core logic
│   ├── personalization-engine.ts # Intent resolution + decision engine (741 lines)
│   ├── smart-listener.ts         # Semantic click tracking + frustration detection
│   ├── event-ledger.ts           # Event batching, dedup, localStorage persistence
│   ├── template-registry.ts      # Hero layout templates + intent mappings
│   └── utils.ts                  # Tailwind utilities
│
├── hooks/                        # React bridges
│   ├── use-personalization.ts    # URL → intent → variant (memoized)
│   ├── use-smart-listener.ts     # SmartListener + EventLedger lifecycle
│   ├── use-behavior-tracking.ts  # 5s scroll/click observation window
│   └── use-mobile.tsx            # Responsive breakpoint hook
│
├── components/                   # UI layer
│   ├── StoreNav.tsx              # Navigation with intent-aware links
│   ├── HeroSection.tsx           # Dynamic hero (3 template layouts)
│   ├── ProductGrid.tsx           # Intent-filtered product cards
│   ├── FunnelBanner.tsx          # Conversion CTA banner
│   ├── TrustBar.tsx              # Social proof / trust signals
│   ├── LiveSearchBar.tsx         # Real-time persona preview via ?q=
│   ├── PersonaToggle.tsx         # Quick persona switcher UI
│   ├── DebugOverlay.tsx          # Full decision pipeline visualizer
│   ├── BehaviorPanel.tsx         # Behavior signal display
│   ├── SmartListenerPanel.tsx    # Event tracking dashboard
│   ├── DirectorsCutPanel.tsx     # Admin preview tools
│   ├── InstallWizard.tsx         # Shopify/Webflow install flow
│   ├── NavLink.tsx               # Intent-aware nav link
│   └── ui/                       # shadcn/ui primitives
│
├── pages/
│   ├── Index.tsx                 # Main store page (engine-driven layout)
│   ├── IntegrationGuide.tsx      # 4-step integration wizard
│   └── NotFound.tsx              # 404 page
│
├── test/
│   ├── personalization-engine.test.ts  # Engine unit tests
│   ├── smart-listener.test.ts          # Listener unit tests
│   └── setup.ts                        # Test environment config
│
└── assets/                       # Hero images per persona
    ├── hero-gaming.jpg
    ├── hero-productivity.jpg
    ├── hero-budget.jpg
    ├── hero-creative.jpg
    ├── hero-student.jpg
    ├── hero-developer.jpg
    └── hero-default.jpg
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 5 (SWC) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Animation** | Framer Motion |
| **Routing** | React Router v6 |
| **State** | React hooks (no global store) |
| **Data Fetching** | TanStack React Query |
| **Backend** | Lovable Cloud (Supabase) — optional |
| **Testing** | Vitest + Testing Library |

---

## Getting Started

```bash
# Clone and install
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install

# Start dev server
npm run dev
# → http://localhost:8080

# Try different personas
# http://localhost:8080/?utm_campaign=gaming
# http://localhost:8080/?ref=github
# http://localhost:8080/?q=cheap monitor
# http://localhost:8080/?q=student deals
# http://localhost:8080/?ref=dribbble
```

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run specific test file
npx vitest run src/test/personalization-engine.test.ts
```

Tests cover:
- Intent resolution from URL parameters
- Compound signal handling
- Edge cases (malformed URLs, short queries, unknown intents)
- Confidence level thresholds
- Smart Listener semantic scoring
- Frustration detection logic

---

## Integration Guide

Visit `/integrate` in the app to see the full 4-step installation wizard:

1. **Connect** — Add the script tag to your store
2. **Configure** — Set up persona mappings
3. **Activate** — Enable personalization
4. **Done** — Verify with the debug overlay

Platform-specific snippets provided for Shopify, Webflow, and Custom HTML.

---

## License

Built with [Lovable](https://lovable.dev) — AI-powered full-stack development.
