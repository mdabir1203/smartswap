/**
 * BEHAVIOR SIGNAL TRACKER
 * 
 * Simulates on-page behavior detection (scroll depth + click patterns)
 * during the first 5 seconds of a page visit. In production, this would
 * use real DOM event listeners. Here we simulate realistic behavior
 * patterns that feed back into the personalization engine.
 * 
 * Signals emitted:
 *   - scroll_depth: How far the user scrolls (gaming users scroll to products fast)
 *   - click_target: What the user clicks first (CTA, nav, product)
 *   - dwell_zone: Which section the user spends the most time in
 *   - interaction_speed: How quickly the user interacts (impulse vs. research)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { IntentType } from "@/lib/personalization-engine";

export interface BehaviorSignal {
  type: "scroll_depth" | "click_target" | "dwell_zone" | "interaction_speed";
  value: string;
  inferredIntent: IntentType | null;
  timestamp: number;
  weight: number;
}

interface BehaviorState {
  signals: BehaviorSignal[];
  isTracking: boolean;
  trackingComplete: boolean;
  scrollDepth: number;
  clickCount: number;
  firstInteractionMs: number | null;
}

/**
 * Infer intent from scroll behavior patterns.
 * Fast deep scrollers → gaming/buy intent
 * Slow, methodical → productivity/compare intent
 */
function inferFromScrollDepth(depth: number, timeElapsed: number): { intent: IntentType | null; value: string } {
  const scrollSpeed = depth / (timeElapsed / 1000);

  if (depth > 80 && scrollSpeed > 30) {
    return { intent: "gaming", value: `Fast scroll to ${depth}% in ${(timeElapsed / 1000).toFixed(1)}s — impulse buyer pattern` };
  }
  if (depth > 60 && scrollSpeed < 15) {
    return { intent: "productivity", value: `Methodical scroll to ${depth}% — research/compare pattern` };
  }
  if (depth > 50 && depth <= 70) {
    return { intent: "budget", value: `Mid-page scroll to ${depth}% — scanning for deals pattern` };
  }
  return { intent: null, value: `Scroll to ${depth}% — no clear pattern` };
}

/**
 * Infer intent from click targets.
 */
function inferFromClick(target: HTMLElement): { intent: IntentType | null; value: string } {
  const text = target.textContent?.toLowerCase() || "";
  const tagName = target.tagName.toLowerCase();
  const classList = Array.from(target.classList).join(" ");

  // CTA clicks
  if (tagName === "button" || target.closest("button")) {
    if (text.includes("shop") || text.includes("buy") || text.includes("deal")) {
      return { intent: "budget", value: `Clicked buy/deal CTA — purchase intent` };
    }
    if (text.includes("compare") || text.includes("spec")) {
      return { intent: "productivity", value: `Clicked compare CTA — research intent` };
    }
    if (text.includes("cart") || classList.includes("cart")) {
      return { intent: "gaming", value: `Clicked add-to-cart — high purchase intent` };
    }
  }

  // Nav clicks
  if (tagName === "a" || target.closest("a")) {
    if (text.includes("gaming")) return { intent: "gaming", value: `Navigated to gaming section` };
    if (text.includes("office")) return { intent: "productivity", value: `Navigated to office section` };
    if (text.includes("creative")) return { intent: "creative", value: `Navigated to creative section` };
    if (text.includes("sale")) return { intent: "budget", value: `Navigated to sale section` };
  }

  // Product card clicks
  if (target.closest("[data-product-card]")) {
    return { intent: null, value: `Clicked product card — browsing behavior` };
  }

  return { intent: null, value: `Clicked ${tagName} — no clear intent pattern` };
}

/**
 * Hook: useBehaviorTracking
 * 
 * Tracks real scroll and click events for 5 seconds, then emits
 * behavior signals that can be fed into the personalization engine.
 */
export function useBehaviorTracking(enabled: boolean = true): BehaviorState {
  const [state, setState] = useState<BehaviorState>({
    signals: [],
    isTracking: false,
    trackingComplete: false,
    scrollDepth: 0,
    clickCount: 0,
    firstInteractionMs: null,
  });

  const startTimeRef = useRef<number>(0);
  const maxScrollRef = useRef<number>(0);
  const clickCountRef = useRef<number>(0);
  const firstInteractionRef = useRef<number | null>(null);
  const signalsRef = useRef<BehaviorSignal[]>([]);

  const addSignal = useCallback((signal: BehaviorSignal) => {
    signalsRef.current = [...signalsRef.current, signal];
    setState(prev => ({
      ...prev,
      signals: signalsRef.current,
    }));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    startTimeRef.current = Date.now();
    setState(prev => ({ ...prev, isTracking: true }));

    // --- Scroll tracking ---
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const depth = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

      if (depth > maxScrollRef.current) {
        maxScrollRef.current = depth;
        setState(prev => ({ ...prev, scrollDepth: depth }));
      }

      if (!firstInteractionRef.current) {
        firstInteractionRef.current = Date.now() - startTimeRef.current;
        setState(prev => ({ ...prev, firstInteractionMs: firstInteractionRef.current }));
      }
    };

    // --- Click tracking ---
    const handleClick = (e: MouseEvent) => {
      clickCountRef.current += 1;
      setState(prev => ({ ...prev, clickCount: clickCountRef.current }));

      if (!firstInteractionRef.current) {
        firstInteractionRef.current = Date.now() - startTimeRef.current;
        setState(prev => ({ ...prev, firstInteractionMs: firstInteractionRef.current }));
      }

      const target = e.target as HTMLElement;
      const clickInference = inferFromClick(target);
      addSignal({
        type: "click_target",
        value: clickInference.value,
        inferredIntent: clickInference.intent,
        timestamp: Date.now() - startTimeRef.current,
        weight: clickInference.intent ? 0.5 : 0.1,
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClick, { passive: true });

    // --- End tracking after 5 seconds ---
    const timeout = setTimeout(() => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick);

      const elapsed = Date.now() - startTimeRef.current;

      // Emit scroll depth signal
      if (maxScrollRef.current > 10) {
        const scrollInference = inferFromScrollDepth(maxScrollRef.current, elapsed);
        addSignal({
          type: "scroll_depth",
          value: scrollInference.value,
          inferredIntent: scrollInference.intent,
          timestamp: elapsed,
          weight: scrollInference.intent ? 0.35 : 0.05,
        });
      }

      // Emit interaction speed signal
      if (firstInteractionRef.current !== null) {
        const speed = firstInteractionRef.current;
        let intent: IntentType | null = null;
        let label = "";

        if (speed < 1500) {
          intent = "gaming";
          label = `Ultra-fast first interaction (${speed}ms) — impulse/enthusiast`;
        } else if (speed < 3000) {
          intent = null;
          label = `Normal interaction speed (${speed}ms)`;
        } else {
          intent = "productivity";
          label = `Slow first interaction (${speed}ms) — deliberate/researcher`;
        }

        addSignal({
          type: "interaction_speed",
          value: label,
          inferredIntent: intent,
          timestamp: elapsed,
          weight: intent ? 0.25 : 0.05,
        });
      }

      setState(prev => ({
        ...prev,
        isTracking: false,
        trackingComplete: true,
      }));
    }, 5000);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick);
    };
  }, [enabled, addSignal]);

  return state;
}
