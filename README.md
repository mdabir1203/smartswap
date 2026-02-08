# SmartSwap — AI Personalization Layer for E-Commerce

> Drop-in AI personalization engine that transforms static storefronts into dynamic, intent-driven experiences using URL signals and on-page behavior. Zero backend required.

**Live Demo:** [smartswap.lovable.app](https://smartswap.lovable.app)

---

## How It Works

```
Visitor arrives → URL signals collected → Intent scored → Persona resolved → Content swapped
```

1. Visitor lands with URL params (e.g. `?utm_campaign=gaming&ref=twitch`)
2. Signals are weighted and scored against 7 intent profiles
3. Hero image, headline, CTA, and section order update instantly
4. Behavior tracking begins (scroll patterns, click semantics, frustration detection)

---

## Personas

| Persona | Example Triggers | CTA |
|---------|-----------------|-----|
| 🎮 Gaming | `?utm_campaign=gaming`, `?ref=twitch` | "Shop Gaming Monitors" |
| 💼 Productivity | `?ref=linkedin`, `?q=office` | "Explore Office Displays" |
| 💰 Budget | `?q=cheap`, `?q=deal` | "See Today's Deals" |
| 🎨 Creative | `?ref=dribbble`, `?q=color accurate` | "Shop Creator Monitors" |
| 🎓 Student | `?q=student`, `?ref=unidays` | "Student Deals" |
| ⌨️ Developer | `?ref=github`, `?q=coding` | "Dev Setup Bundles" |
| ✨ Default | No signals | "Browse All Monitors" |

---

## URL Signal Weights

| Parameter | Weight | Example |
|-----------|--------|---------|
| `?intent=` | 1.0 | Direct override |
| `?utm_campaign=` | 0.95 | Campaign tracking |
| `?category=` | 0.85 | Collection page |
| `?q=` | 0.80 | Search query |
| `?ref=` | 0.75 | Referrer domain |
| `?utm_source=` | 0.70 | Traffic source |
| `?tag=` | 0.70 | CMS tag |

---

## Core Modules

| Module | File | Purpose |
|--------|------|---------|
| **Personalization Engine** | `src/lib/personalization-engine.ts` | Signal collection → intent scoring → variant selection |
| **Template Registry** | `src/lib/template-registry.ts` | 3 hero layouts (centered, split, minimal) mapped to intents |
| **Smart Listener** | `src/lib/smart-listener.ts` | Semantic click tracking, frustration detection, middleware hooks |
| **Event Ledger** | `src/lib/event-ledger.ts` | Client-side event batching, dedup, localStorage persistence |
| **Behavior Tracker** | `src/hooks/use-behavior-tracking.ts` | 5-second scroll/click observation for intent inference |

---

## Decision Object

Every personalization outputs a structured JSON (accessible via `window.__SMARTSWAP_DECISION__`):

```json
{
  "intent": "GAMING",
  "template": "hero_centered",
  "cta": "Shop Gaming Monitors",
  "funnel_stage": "BUY",
  "confidence": "high",
  "signals": [{ "source": "utm_campaign", "value": "gaming", "weight": 0.95 }]
}
```

---

## Quick Start

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install && npm run dev
```

Then try: `http://localhost:8080/?utm_campaign=gaming`

---

## Tech Stack

React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · shadcn/ui · Vitest

---

## Testing

```bash
npm test
```

Covers: intent resolution, compound signals, confidence thresholds, semantic scoring, frustration detection.

---

Built with [Lovable](https://lovable.dev)
