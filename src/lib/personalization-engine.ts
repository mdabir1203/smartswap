/**
 * ============================================================
 * PERSONALIZATION ENGINE v2 — "The Brain"
 * ============================================================
 * 
 * v2 Additions:
 *   - 3 new intents: Creative, Student, Developer
 *   - Compound signal handling (e.g., "gaming-budget")
 *   - Conflict resolution for competing intents
 *   - Edge case handling: malformed params, partial matches,
 *     URL-encoded values, empty strings, unknown intents
 *   - Signal decay: duplicate source types get diminishing weight
 * ============================================================
 */

// ---------------------
// TYPE DEFINITIONS
// ---------------------

export type IntentType = 
  | "gaming" 
  | "productivity" 
  | "budget" 
  | "creative" 
  | "student" 
  | "developer" 
  | "default";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface UserSignal {
  source: string;
  value: string;
  intentMatch: IntentType;
  weight: number;
}

export interface IntentResult {
  intent: IntentType;
  confidence: ConfidenceLevel;
  signals: UserSignal[];
  reasoning: string;
  /** Edge cases detected during processing */
  edgeCases: string[];
  /** All score breakdowns for transparency */
  scoreBreakdown: Record<string, number>;
}

export interface ContentVariant {
  intent: IntentType;
  headline: string;
  subhead: string;
  ctaText: string;
  ctaSecondary: string;
  heroImageKey: string;
  accentColor: string;
  badgeText: string;
}

// ---------------------
// DATA STORE (expanded)
// ---------------------

export const CONTENT_VARIANTS: Record<IntentType, ContentVariant> = {
  gaming: {
    intent: "gaming",
    headline: "Dominate the Leaderboard",
    subhead: "144Hz refresh rate. 1ms response time. Zero excuses. Our gaming monitors are built for players who refuse to lose.",
    ctaText: "Shop Gaming Monitors",
    ctaSecondary: "Compare Specs",
    heroImageKey: "gaming",
    accentColor: "--intent-gaming",
    badgeText: "⚡ Gaming Collection",
  },
  productivity: {
    intent: "productivity",
    headline: "Maximize Your Efficiency",
    subhead: "4K clarity. Ergonomic stands. Blue light filters. The workspace upgrade your eyes have been begging for.",
    ctaText: "Explore Office Displays",
    ctaSecondary: "See Ergonomic Options",
    heroImageKey: "productivity",
    accentColor: "--intent-productivity",
    badgeText: "📊 Pro Workspace",
  },
  budget: {
    intent: "budget",
    headline: "Best Value Monitors",
    subhead: "Premium quality doesn't require a premium price. Discover monitors rated 4.5★ and above — all under $300.",
    ctaText: "See Today's Deals",
    ctaSecondary: "Price Match Guarantee",
    heroImageKey: "budget",
    accentColor: "--intent-budget",
    badgeText: "🏷️ Best Sellers Under $300",
  },
  creative: {
    intent: "creative",
    headline: "Color-Accurate Brilliance",
    subhead: "100% DCI-P3 gamut. Factory-calibrated ΔE<2. HDR1000. For designers and photographers who demand pixel-perfect color.",
    ctaText: "Shop Creator Monitors",
    ctaSecondary: "See Color Profiles",
    heroImageKey: "creative",
    accentColor: "--intent-creative",
    badgeText: "🎨 Creator Pro Series",
  },
  student: {
    intent: "student",
    headline: "Smart Screens for Smart Minds",
    subhead: "Eye-care technology. Compact designs. Student-friendly prices. The perfect study companion that won't break your budget.",
    ctaText: "Student Deals",
    ctaSecondary: "Verify Student Discount",
    heroImageKey: "student",
    accentColor: "--intent-student",
    badgeText: "🎓 Student Special",
  },
  developer: {
    intent: "developer",
    headline: "Code in Ultra Definition",
    subhead: "Multi-monitor daisy-chain. 32:9 ultrawide options. Pixel-dense text rendering. Built for developers who live in the terminal.",
    ctaText: "Dev Setup Bundles",
    ctaSecondary: "Multi-Monitor Guide",
    heroImageKey: "developer",
    accentColor: "--intent-developer",
    badgeText: "⌨️ Dev Workstation",
  },
  default: {
    intent: "default",
    headline: "Crystal Clear Displays for Everyone",
    subhead: "From gaming to productivity, find the perfect monitor that matches your world. Trusted by 50,000+ customers.",
    ctaText: "Browse All Monitors",
    ctaSecondary: "Take the Quiz",
    heroImageKey: "default",
    accentColor: "--primary",
    badgeText: "✨ New Arrivals",
  },
};

// ---------------------
// KEYWORD MAPS (expanded with edge cases)
// ---------------------

const INTENT_KEYWORDS: Record<Exclude<IntentType, "default">, string[]> = {
  gaming: [
    "gaming", "game", "gamer", "esports", "fps", "144hz", "240hz", "360hz",
    "1ms", "curved", "rgb", "competitive", "twitch", "stream", "streamer",
    "fortnite", "valorant", "csgo", "moba", "refresh rate", "gsync", "freesync",
    "nvidia", "amd", "rtx", "gpu",
  ],
  productivity: [
    "office", "work", "productivity", "4k", "ergonomic", "usb-c", "thunderbolt",
    "daisy-chain", "color-accurate", "linkedin", "professional", "business",
    "enterprise", "corporate", "workplace", "multitask", "split screen",
    "pivot", "portrait mode", "kvm",
  ],
  budget: [
    "cheap", "budget", "affordable", "deal", "sale", "discount", "clearance",
    "under-300", "under-200", "value", "best-price", "bargain", "savings",
    "coupon", "promo", "refurbished", "renewed", "outlet",
  ],
  creative: [
    "creative", "design", "designer", "photography", "photo editing", "video editing",
    "color accurate", "dci-p3", "adobe rgb", "srgb", "pantone", "calibrate",
    "calibration", "hdr", "hdr1000", "10-bit", "10bit", "illustration",
    "retouching", "cinema", "filmmaker", "animation", "3d modeling",
    "behance", "dribbble", "figma",
  ],
  student: [
    "student", "college", "university", "dorm", "study", "homework", "campus",
    "school", "education", "learning", "lecture", "textbook", "scholarship",
    "backtoschool", "back-to-school", "freshman", "grad", "academic",
  ],
  developer: [
    "developer", "dev", "coding", "code", "programmer", "programming",
    "terminal", "ide", "vscode", "vim", "neovim", "emacs", "github",
    "stackoverflow", "devops", "fullstack", "frontend", "backend",
    "multi monitor", "dual monitor", "triple monitor", "ultrawide dev",
    "32:9", "pixel density", "retina", "hidpi", "ssh",
  ],
};

/**
 * EDGE CASE: Priority matrix for resolving compound/conflicting intents.
 * When two intents are close in score, this defines which one wins.
 * 
 * Why? "cheap gaming monitor" contains both "budget" and "gaming" signals.
 * The first keyword detected in the user's query gets priority boost.
 */
const INTENT_PRIORITY: IntentType[] = [
  "gaming", "creative", "developer", "productivity", "student", "budget", "default"
];

// ---------------------
// SIGNAL DETECTION (v2)
// ---------------------

export function collectSignals(searchParams: URLSearchParams, referrer: string = ""): { signals: UserSignal[]; edgeCases: string[] } {
  const signals: UserSignal[] = [];
  const edgeCases: string[] = [];

  // EDGE CASE: Empty search params
  if ([...searchParams.entries()].length === 0 && !referrer) {
    edgeCases.push("No URL parameters or referrer detected — pure organic visit");
    return { signals, edgeCases };
  }

  // --- UTM Campaign (Highest confidence) ---
  const utmCampaign = searchParams.get("utm_campaign");
  if (utmCampaign) {
    const decoded = safeDecodeURI(utmCampaign);
    const matches = matchAllKeywords(decoded);
    
    if (matches.length === 0) {
      edgeCases.push(`Unknown utm_campaign value: "${decoded}" — no matching intent`);
    } else if (matches.length > 1) {
      edgeCases.push(`Compound signal in utm_campaign: "${decoded}" matches [${matches.map(m => m.intent).join(", ")}]`);
    }
    
    matches.forEach((match, i) => {
      signals.push({
        source: "utm_campaign",
        value: decoded,
        intentMatch: match.intent,
        weight: i === 0 ? 0.95 : 0.3, // First match gets full weight, subsequent get diminished
      });
    });
  }

  // --- UTM Source ---
  const utmSource = searchParams.get("utm_source");
  if (utmSource) {
    const decoded = safeDecodeURI(utmSource);
    const matches = matchAllKeywords(decoded);
    matches.forEach((match, i) => {
      signals.push({
        source: "utm_source",
        value: decoded,
        intentMatch: match.intent,
        weight: i === 0 ? 0.7 : 0.2,
      });
    });
  }

  // --- UTM Medium (new in v2) ---
  const utmMedium = searchParams.get("utm_medium");
  if (utmMedium) {
    const decoded = safeDecodeURI(utmMedium);
    const matches = matchAllKeywords(decoded);
    matches.forEach((match) => {
      signals.push({
        source: "utm_medium",
        value: decoded,
        intentMatch: match.intent,
        weight: 0.5,
      });
    });
  }

  // --- Direct intent param ---
  const intentParam = searchParams.get("intent");
  if (intentParam) {
    const decoded = safeDecodeURI(intentParam);
    // EDGE CASE: Direct intent that doesn't match any known type
    const validIntents: IntentType[] = ["gaming", "productivity", "budget", "creative", "student", "developer"];
    if (validIntents.includes(decoded as IntentType)) {
      signals.push({
        source: "intent",
        value: decoded,
        intentMatch: decoded as IntentType,
        weight: 1.0,
      });
    } else {
      // Try fuzzy match
      const matches = matchAllKeywords(decoded);
      if (matches.length > 0) {
        signals.push({
          source: "intent",
          value: decoded,
          intentMatch: matches[0].intent,
          weight: 0.8,
        });
        edgeCases.push(`Fuzzy-matched intent param "${decoded}" → ${matches[0].intent}`);
      } else {
        edgeCases.push(`Invalid intent param: "${decoded}" — doesn't match any known intent`);
      }
    }
  }

  // --- Search query ---
  const query = searchParams.get("q") || searchParams.get("query") || searchParams.get("search");
  if (query) {
    const decoded = safeDecodeURI(query);
    
    // EDGE CASE: Very short queries (1-2 chars) are unreliable
    if (decoded.length <= 2) {
      edgeCases.push(`Query too short: "${decoded}" — skipping (unreliable signal)`);
    } else {
      const matches = matchAllKeywords(decoded);
      if (matches.length > 1) {
        edgeCases.push(`Multi-intent query: "${decoded}" matches [${matches.map(m => m.intent).join(", ")}]`);
      }
      matches.forEach((match, i) => {
        signals.push({
          source: "search_query",
          value: decoded,
          intentMatch: match.intent,
          weight: i === 0 ? 0.8 : 0.3,
        });
      });
    }
  }

  // --- Referrer analysis ---
  const refParam = searchParams.get("ref") || referrer;
  if (refParam) {
    const decoded = safeDecodeURI(refParam);
    const matches = matchAllKeywords(decoded);
    
    // EDGE CASE: Well-known referrers with implicit intent
    const implicitReferrers: Record<string, IntentType> = {
      "linkedin": "productivity",
      "behance": "creative",
      "dribbble": "creative",
      "github": "developer",
      "stackoverflow": "developer",
      "twitch": "gaming",
      "reddit/r/gaming": "gaming",
      "reddit/r/buildapc": "gaming",
      "reddit/r/frugal": "budget",
      "slickdeals": "budget",
      "studentbeans": "student",
      "unidays": "student",
    };
    
    let foundImplicit = false;
    for (const [domain, intent] of Object.entries(implicitReferrers)) {
      if (decoded.toLowerCase().includes(domain)) {
        signals.push({
          source: "referrer_domain",
          value: domain,
          intentMatch: intent,
          weight: 0.75,
        });
        foundImplicit = true;
      }
    }
    
    if (!foundImplicit) {
      matches.forEach((match) => {
        signals.push({
          source: "referrer",
          value: decoded,
          intentMatch: match.intent,
          weight: 0.6,
        });
      });
    }
  }

  // --- Category param (new: common in Shopify stores) ---
  const category = searchParams.get("category") || searchParams.get("cat") || searchParams.get("collection");
  if (category) {
    const decoded = safeDecodeURI(category);
    const matches = matchAllKeywords(decoded);
    matches.forEach((match) => {
      signals.push({
        source: "category",
        value: decoded,
        intentMatch: match.intent,
        weight: 0.85,
      });
    });
  }

  // --- Tag/label params (new: common in CMS systems) ---
  const tag = searchParams.get("tag") || searchParams.get("label") || searchParams.get("segment");
  if (tag) {
    const decoded = safeDecodeURI(tag);
    const matches = matchAllKeywords(decoded);
    matches.forEach((match) => {
      signals.push({
        source: "tag",
        value: decoded,
        intentMatch: match.intent,
        weight: 0.7,
      });
    });
  }

  // --- Catch-all: scan remaining params ---
  const knownParams = new Set([
    "utm_campaign", "utm_source", "utm_medium", "intent", "q", "query", 
    "search", "ref", "category", "cat", "collection", "tag", "label", "segment"
  ]);
  
  searchParams.forEach((value, key) => {
    if (!knownParams.has(key)) {
      const decoded = safeDecodeURI(`${key} ${value}`);
      const matches = matchAllKeywords(decoded);
      if (matches.length > 0) {
        signals.push({
          source: `param:${key}`,
          value: value || key,
          intentMatch: matches[0].intent,
          weight: 0.4,
        });
      }
    }
  });

  // EDGE CASE: Detect duplicate source types and apply decay
  const sourceCounts: Record<string, number> = {};
  signals.forEach((signal) => {
    const baseSource = signal.source.split(":")[0];
    sourceCounts[baseSource] = (sourceCounts[baseSource] || 0) + 1;
    if (sourceCounts[baseSource] > 1) {
      signal.weight *= 0.7; // Decay for duplicate source types
      edgeCases.push(`Signal decay applied: duplicate ${baseSource} source`);
    }
  });

  return { signals, edgeCases };
}

/**
 * Stage 2: INTENT RESOLUTION (v2 with edge case handling)
 */
export function resolveIntent(signals: UserSignal[], edgeCases: string[]): IntentResult {
  const allIntents: IntentType[] = ["gaming", "productivity", "budget", "creative", "student", "developer"];
  
  if (signals.length === 0) {
    return {
      intent: "default",
      confidence: "low",
      signals: [],
      reasoning: "No personalization signals detected. Showing default experience.",
      edgeCases,
      scoreBreakdown: Object.fromEntries(allIntents.map(i => [i, 0])),
    };
  }

  // Aggregate scores per intent
  const scores: Record<string, number> = {};
  allIntents.forEach(i => { scores[i] = 0; });
  
  signals.forEach((signal) => {
    scores[signal.intentMatch] = (scores[signal.intentMatch] || 0) + signal.weight;
  });

  // Sort by score, then by priority order for tiebreaking
  const sortedIntents = allIntents
    .map(intent => ({ intent, score: scores[intent] || 0 }))
    .sort((a, b) => {
      if (Math.abs(b.score - a.score) < 0.05) {
        // EDGE CASE: Tiebreaker — use priority matrix
        return INTENT_PRIORITY.indexOf(a.intent) - INTENT_PRIORITY.indexOf(b.intent);
      }
      return b.score - a.score;
    });

  const top = sortedIntents[0];
  const second = sortedIntents[1];

  // EDGE CASE: Check if top two are very close (conflict)
  const scoreDiff = top.score - second.score;
  if (scoreDiff > 0 && scoreDiff < 0.15 && top.score >= 0.4) {
    edgeCases.push(
      `Close contest: ${top.intent} (${top.score.toFixed(2)}) vs ${second.intent} (${second.score.toFixed(2)}) — resolved by priority matrix`
    );
  }

  // Confidence calculation
  let confidence: ConfidenceLevel;
  let finalIntent: IntentType;

  if (top.score >= 0.8) {
    confidence = "high";
    finalIntent = top.intent;
  } else if (top.score >= 0.4 && scoreDiff >= 0.1) {
    confidence = "medium";
    finalIntent = top.intent;
  } else if (top.score >= 0.3) {
    confidence = "low";
    finalIntent = top.intent;
    edgeCases.push("Low confidence — showing matched intent but results may be imprecise");
  } else {
    confidence = "low";
    finalIntent = "default";
    edgeCases.push("All scores below threshold — safe fallback to default");
  }

  // Build reasoning
  const topSignal = signals.find((s) => s.intentMatch === finalIntent);
  const reasoning = finalIntent === "default"
    ? "Intent signals too weak or ambiguous. Defaulting to generic experience."
    : `Detected '${topSignal?.value}' in ${topSignal?.source}. Score: ${top.score.toFixed(2)} (${confidence} confidence).${
        scoreDiff < 0.2 ? ` Close runner-up: ${second.intent} at ${second.score.toFixed(2)}.` : ""
      }`;

  return {
    intent: finalIntent,
    confidence,
    signals,
    reasoning,
    edgeCases,
    scoreBreakdown: scores,
  };
}

/**
 * Stage 3: VARIANT SELECTION
 */
export function getVariant(intent: IntentType): ContentVariant {
  return CONTENT_VARIANTS[intent] || CONTENT_VARIANTS.default;
}

// ---------------------
// UTILITY FUNCTIONS (v2)
// ---------------------

/**
 * Returns ALL matching intents for a given input string,
 * sorted by keyword position (earlier = higher priority).
 * This handles compound signals like "gaming budget monitor".
 */
function matchAllKeywords(input: string): { intent: IntentType; position: number }[] {
  const normalized = input.toLowerCase().replace(/[_-]/g, " ");
  const matches: { intent: IntentType; position: number }[] = [];
  const seenIntents = new Set<IntentType>();

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      const pos = normalized.indexOf(keyword);
      if (pos !== -1 && !seenIntents.has(intent as IntentType)) {
        // EDGE CASE: Avoid partial word matches (e.g., "game" in "endgame")
        // Only check word boundaries for short keywords (< 4 chars)
        if (keyword.length < 4) {
          const before = pos > 0 ? normalized[pos - 1] : " ";
          const after = pos + keyword.length < normalized.length ? normalized[pos + keyword.length] : " ";
          if (before.match(/[a-z0-9]/) || after.match(/[a-z0-9]/)) {
            continue; // Skip partial matches for short keywords
          }
        }
        
        matches.push({ intent: intent as IntentType, position: pos });
        seenIntents.add(intent as IntentType);
        break; // One match per intent is enough
      }
    }
  }

  return matches.sort((a, b) => a.position - b.position);
}

/**
 * Safe URI decoding that handles malformed percent-encoding.
 * EDGE CASE: Users sometimes manually type URLs with broken encoding.
 */
function safeDecodeURI(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input; // Return as-is if decoding fails
  }
}

/**
 * Full pipeline: Collect → Resolve → Select
 */
export function personalize(searchParams: URLSearchParams, referrer?: string): {
  variant: ContentVariant;
  result: IntentResult;
} {
  const { signals, edgeCases } = collectSignals(searchParams, referrer);
  const result = resolveIntent(signals, edgeCases);
  const variant = getVariant(result.intent);

  return { variant, result };
}

/**
 * Export all intent types for use in UI components
 */
export const ALL_INTENTS: IntentType[] = [
  "gaming", "productivity", "budget", "creative", "student", "developer", "default"
];
