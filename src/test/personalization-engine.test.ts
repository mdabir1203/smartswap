/**
 * PERSONALIZATION ENGINE v3 — TEST SUITE
 * 
 * Tests the three key spec requirements:
 *   §2.5 — Decision Engine outputs structured decision with funnel stage + CTA
 *   §2.6 — Personalization Injection determines section order
 *   Edge cases — compound signals, unknown params, conflicts
 */

import { describe, it, expect } from "vitest";
import {
  personalize,
  collectSignals,
  resolveIntent,
  getVariant,
  CONTENT_VARIANTS,
  SECTION_ORDER_MAP,
  type IntentType,
  type FunnelStage,
} from "@/lib/personalization-engine";

// ==========================================
// §2.5 — DECISION ENGINE: Structured Output
// ==========================================

describe("§2.5 Decision Engine — Structured Decision Object", () => {
  it("outputs a complete decision with intent, template, CTA, funnel stage, and section order", () => {
    const params = new URLSearchParams("utm_campaign=gaming");
    const { result } = personalize(params);

    // All required fields must exist
    expect(result.intent).toBe("gaming");
    expect(result.funnelStage).toBeDefined();
    expect(result.templateId).toBeDefined();
    expect(result.ctaDecision).toBeDefined();
    expect(result.ctaDecision.text).toBeTruthy();
    expect(result.ctaDecision.link).toBeTruthy();
    expect(result.ctaDecision.priority).toBeDefined();
    expect(result.sectionOrder).toBeInstanceOf(Array);
    expect(result.sectionOrder.length).toBe(3);
    expect(result.heroImageKey).toBeTruthy();
    expect(result.injectionLog).toBeInstanceOf(Array);
    expect(result.injectionLog.length).toBeGreaterThan(0);
  });

  it("maps gaming intent → buy funnel → 'Shop Gaming Monitors' CTA", () => {
    const params = new URLSearchParams("utm_campaign=gaming");
    const { result } = personalize(params);

    expect(result.intent).toBe("gaming");
    expect(result.funnelStage).toBe("buy");
    expect(result.ctaDecision.priority).toBe("buy");
    expect(result.ctaDecision.text).toBe("Shop Gaming Monitors");
    expect(result.ctaDecision.link).toBe("/collections/gaming");
  });

  it("maps productivity intent → compare funnel → 'Explore Office Displays' CTA", () => {
    const params = new URLSearchParams("ref=linkedin");
    const { result } = personalize(params);

    expect(result.intent).toBe("productivity");
    expect(result.funnelStage).toBe("compare");
    expect(result.ctaDecision.priority).toBe("compare");
    expect(result.ctaDecision.text).toBe("Explore Office Displays");
  });

  it("maps budget intent → buy funnel → 'See Today\\'s Deals' CTA", () => {
    const params = new URLSearchParams("q=cheap");
    const { result } = personalize(params);

    expect(result.intent).toBe("budget");
    expect(result.funnelStage).toBe("buy");
    expect(result.ctaDecision.priority).toBe("buy");
    expect(result.ctaDecision.text).toBe("See Today's Deals");
  });

  it("maps creative intent → explore funnel → 'Shop Creator Monitors' CTA", () => {
    const params = new URLSearchParams("ref=dribbble");
    const { result } = personalize(params);

    expect(result.intent).toBe("creative");
    expect(result.funnelStage).toBe("explore");
    expect(result.ctaDecision.priority).toBe("explore");
  });

  it("maps developer intent → compare funnel → 'Dev Setup Bundles' CTA", () => {
    const params = new URLSearchParams("ref=github");
    const { result } = personalize(params);

    expect(result.intent).toBe("developer");
    expect(result.funnelStage).toBe("compare");
    expect(result.ctaDecision.priority).toBe("compare");
    expect(result.ctaDecision.text).toBe("Dev Setup Bundles");
  });

  it("maps student intent → explore funnel → 'Student Deals' CTA", () => {
    const params = new URLSearchParams("q=student");
    const { result } = personalize(params);

    expect(result.intent).toBe("student");
    expect(result.funnelStage).toBe("explore");
    expect(result.ctaDecision.priority).toBe("explore");
  });

  it("maps default intent → explore funnel when no signals present", () => {
    const params = new URLSearchParams();
    const { result } = personalize(params);

    expect(result.intent).toBe("default");
    expect(result.funnelStage).toBe("explore");
    expect(result.ctaDecision.priority).toBe("explore");
    expect(result.ctaDecision.text).toBe("Browse All Monitors");
  });

  it("selects correct template per intent", () => {
    const testCases: [string, string][] = [
      ["utm_campaign=gaming", "hero_centered"],
      ["ref=linkedin", "hero_split"],
      ["q=cheap", "hero_minimal"],
      ["ref=dribbble", "hero_centered"],
      ["ref=github", "hero_split"],
      ["q=student", "hero_minimal"],
    ];

    for (const [query, expectedTemplate] of testCases) {
      const params = new URLSearchParams(query);
      const { result } = personalize(params);
      expect(result.templateId).toBe(expectedTemplate);
    }
  });
});

// ==========================================
// §2.6 — SECTION REORDERING
// ==========================================

describe("§2.6 Personalization Injection — Section Reordering", () => {
  it("buy funnel → products first (gaming)", () => {
    const params = new URLSearchParams("utm_campaign=gaming");
    const { result } = personalize(params);

    expect(result.funnelStage).toBe("buy");
    expect(result.sectionOrder).toEqual(["products", "trust", "funnel"]);
  });

  it("compare funnel → funnel CTA first (productivity)", () => {
    const params = new URLSearchParams("ref=linkedin");
    const { result } = personalize(params);

    expect(result.funnelStage).toBe("compare");
    expect(result.sectionOrder).toEqual(["funnel", "products", "trust"]);
  });

  it("explore funnel → trust first (creative)", () => {
    const params = new URLSearchParams("ref=dribbble");
    const { result } = personalize(params);

    expect(result.funnelStage).toBe("explore");
    expect(result.sectionOrder).toEqual(["trust", "funnel", "products"]);
  });

  it("default (no signals) → explore → trust first", () => {
    const params = new URLSearchParams();
    const { result } = personalize(params);

    expect(result.sectionOrder).toEqual(["trust", "funnel", "products"]);
  });

  it("section order map covers all funnel stages", () => {
    const stages: FunnelStage[] = ["buy", "compare", "explore"];
    for (const stage of stages) {
      const order = SECTION_ORDER_MAP[stage];
      expect(order).toBeDefined();
      expect(order).toHaveLength(3);
      expect(order).toContain("trust");
      expect(order).toContain("products");
      expect(order).toContain("funnel");
    }
  });
});

// ==========================================
// §2.6 — INJECTION LOG
// ==========================================

describe("§2.6 Injection Log — 'logs what happened'", () => {
  it("logs intent resolution, template, funnel, hero, section order, and CTA", () => {
    const params = new URLSearchParams("utm_campaign=gaming");
    const { result } = personalize(params);

    expect(result.injectionLog.length).toBeGreaterThanOrEqual(5);
    expect(result.injectionLog.some(l => l.includes("Intent resolved"))).toBe(true);
    expect(result.injectionLog.some(l => l.includes("Template selected"))).toBe(true);
    expect(result.injectionLog.some(l => l.includes("Funnel stage"))).toBe(true);
    expect(result.injectionLog.some(l => l.includes("Section order"))).toBe(true);
    expect(result.injectionLog.some(l => l.includes("Primary CTA"))).toBe(true);
  });

  it("logs hero image key in injection log", () => {
    const params = new URLSearchParams("ref=github");
    const { result } = personalize(params);

    expect(result.injectionLog.some(l => l.includes("Hero image"))).toBe(true);
    expect(result.injectionLog.some(l => l.includes("developer"))).toBe(true);
  });

  it("injection log exists even for default fallback", () => {
    const params = new URLSearchParams();
    const { result } = personalize(params);

    expect(result.injectionLog.length).toBeGreaterThanOrEqual(2);
    expect(result.injectionLog[0]).toContain("default");
  });
});

// ==========================================
// EDGE CASES
// ==========================================

describe("Edge Cases — Compound, Unknown, Conflicts", () => {
  it("handles compound signals (cheap+gaming) → resolves to primary intent", () => {
    const params = new URLSearchParams("q=cheap+gaming+monitor");
    const { result } = personalize(params);

    // Should resolve to one of the two, not crash
    expect(["gaming", "budget"]).toContain(result.intent);
    expect(result.funnelStage).toBeDefined();
    expect(result.sectionOrder.length).toBe(3);
  });

  it("handles unknown UTM campaign → fallback to default", () => {
    const params = new URLSearchParams("utm_campaign=mobilephones");
    const { result } = personalize(params);

    expect(result.intent).toBe("default");
    expect(result.edgeCases.some(e => e.includes("Unknown utm_campaign"))).toBe(true);
  });

  it("handles conflicting signals (gaming UTM + linkedin ref)", () => {
    const params = new URLSearchParams("utm_campaign=gaming&ref=linkedin");
    const { result } = personalize(params);

    // UTM has higher weight (0.95) than referrer (0.75), so gaming wins
    expect(result.intent).toBe("gaming");
    expect(result.funnelStage).toBe("buy");
  });

  it("handles very short query → skipped", () => {
    const params = new URLSearchParams("q=lg");
    const { result } = personalize(params);

    expect(result.edgeCases.some(e => e.includes("too short"))).toBe(true);
  });

  it("all 7 intent variants have ctaLink and funnelStage defined", () => {
    const intents: IntentType[] = ["gaming", "productivity", "budget", "creative", "student", "developer", "default"];
    for (const intent of intents) {
      const variant = CONTENT_VARIANTS[intent];
      expect(variant.ctaLink).toBeTruthy();
      expect(variant.ctaSecondaryLink).toBeTruthy();
      expect(variant.funnelStage).toBeTruthy();
      expect(["buy", "compare", "explore"]).toContain(variant.funnelStage);
    }
  });
});
