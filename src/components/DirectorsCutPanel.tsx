/**
 * DIRECTOR'S CUT PANEL — Persona Spoofer & Preview Admin
 * 
 * Simulates:
 *   1. Shadow DOM admin concept (isolated styling)
 *   2. Persona Spoofer — mock navigator.connection / userAgent
 *   3. Network condition simulation states
 * 
 * Note: In production, the actual admin panel would use Shadow DOM
 * to prevent style leakage. Here we demonstrate the concept with
 * a visually isolated panel and the spoofer controls.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Wifi, WifiOff, Smartphone, Monitor, Accessibility, Globe } from "lucide-react";
import type { IntentType } from "@/lib/personalization-engine";

interface PersonaSpoof {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  /** Simulated navigator.connection properties */
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
  /** Simulated user agent snippet */
  userAgentHint: string;
  /** How the variant should adapt */
  adaptations: string[];
}

const PERSONA_SPOOFS: PersonaSpoof[] = [
  {
    id: "fast-desktop",
    label: "Fast Desktop",
    icon: Monitor,
    description: "High-speed desktop on fiber broadband",
    connection: { effectiveType: "4g", downlink: 50, rtt: 20, saveData: false },
    userAgentHint: "Chrome/120 Desktop (macOS 14)",
    adaptations: [
      "Full hero image loaded (no lazy)",
      "All animations enabled",
      "High-resolution product images",
      "Comparison table pre-rendered",
    ],
  },
  {
    id: "slow-3g",
    label: "Slow 3G Mobile",
    icon: WifiOff,
    description: "Budget phone on slow 3G connection",
    connection: { effectiveType: "2g", downlink: 0.4, rtt: 1800, saveData: true },
    userAgentHint: "Mobile Safari (iPhone SE, iOS 15)",
    adaptations: [
      "Hero image replaced with CSS gradient",
      "Animations disabled (prefers-reduced-motion)",
      "Low-res product thumbnails",
      "Comparison table collapsed to accordion",
      "Lazy-load all below-fold content",
    ],
  },
  {
    id: "screen-reader",
    label: "Screen Reader",
    icon: Accessibility,
    description: "VoiceOver / NVDA user",
    connection: { effectiveType: "4g", downlink: 25, rtt: 50, saveData: false },
    userAgentHint: "Firefox/121 + NVDA Screen Reader",
    adaptations: [
      "All images have descriptive alt text",
      "ARIA live regions for dynamic content",
      "Skip-to-content link visible",
      "Focus management on section reorder",
      "No purely visual intent indicators",
    ],
  },
  {
    id: "international",
    label: "International (EU)",
    icon: Globe,
    description: "GDPR-compliant EU visitor",
    connection: { effectiveType: "4g", downlink: 20, rtt: 80, saveData: false },
    userAgentHint: "Chrome/120 (Accept-Language: de-DE)",
    adaptations: [
      "Cookie consent banner shown first",
      "Behavior tracking deferred until consent",
      "Prices shown with VAT included",
      "Privacy-safe analytics mode",
    ],
  },
];

interface DirectorsCutPanelProps {
  currentIntent: IntentType;
}

const DirectorsCutPanel = ({ currentIntent }: DirectorsCutPanelProps) => {
  const [activeSpoof, setActiveSpoof] = useState<string>("fast-desktop");

  const spoof = PERSONA_SPOOFS.find(s => s.id === activeSpoof)!;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Director's Cut — Persona Spoofer
        </p>
      </div>

      {/* Shadow DOM Note */}
      <div className="rounded-md bg-secondary/30 px-2.5 py-2 text-[9px] text-muted-foreground">
        <span className="font-bold text-foreground">Shadow DOM:</span>{" "}
        In production, this admin panel renders inside a Shadow DOM root to prevent
        CSS leakage between the admin UI and the host store's styles.
      </div>

      {/* Persona Selector */}
      <div className="grid grid-cols-2 gap-1.5">
        {PERSONA_SPOOFS.map((p) => {
          const Icon = p.icon;
          const isActive = activeSpoof === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveSpoof(p.id)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left transition-all ${
                isActive
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-secondary/30 border border-transparent hover:border-border"
              }`}
            >
              <Icon className={`w-3 h-3 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[9px] font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                {p.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Spoof Details */}
      <motion.div
        key={activeSpoof}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <p className="text-[10px] text-muted-foreground">{spoof.description}</p>

        {/* Simulated navigator.connection */}
        <div className="rounded-md bg-secondary/30 px-2.5 py-2">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            navigator.connection (mock)
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] font-mono">
            <span className="text-muted-foreground">effectiveType:</span>
            <span className={`${spoof.connection.effectiveType === "2g" ? "text-destructive" : "text-budget"}`}>
              "{spoof.connection.effectiveType}"
            </span>
            <span className="text-muted-foreground">downlink:</span>
            <span className="text-foreground">{spoof.connection.downlink} Mbps</span>
            <span className="text-muted-foreground">rtt:</span>
            <span className={`${spoof.connection.rtt > 500 ? "text-destructive" : "text-foreground"}`}>
              {spoof.connection.rtt}ms
            </span>
            <span className="text-muted-foreground">saveData:</span>
            <span className={spoof.connection.saveData ? "text-student" : "text-foreground"}>
              {String(spoof.connection.saveData)}
            </span>
          </div>
        </div>

        {/* User Agent */}
        <div className="rounded-md bg-secondary/30 px-2.5 py-2">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            navigator.userAgent (mock)
          </p>
          <p className="text-[9px] font-mono text-foreground">{spoof.userAgentHint}</p>
        </div>

        {/* Adaptations */}
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Variant Adaptations for "{currentIntent}"
          </p>
          <div className="space-y-0.5">
            {spoof.adaptations.map((adaptation, i) => (
              <p key={i} className="text-[9px] text-developer/80 font-mono leading-relaxed">
                [{i + 1}] {adaptation}
              </p>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DirectorsCutPanel;
