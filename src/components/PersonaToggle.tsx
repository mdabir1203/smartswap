/**
 * PERSONA TOGGLE — Floating intent switcher for the store page
 * 
 * Allows demo users and store owners to manually trigger different
 * visitor personas and verify personalization variants in real-time.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronUp, ChevronDown } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { ALL_INTENTS, CONTENT_VARIANTS, type IntentType } from "@/lib/personalization-engine";

const INTENT_ICONS: Record<IntentType, string> = {
  gaming: "🎮",
  productivity: "💼",
  budget: "💰",
  creative: "🎨",
  student: "🎓",
  developer: "⌨️",
  default: "🏠",
};

const PersonaToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentIntent = searchParams.get("utm_campaign") || searchParams.get("intent") || "default";

  const switchPersona = (intent: IntentType) => {
    const newParams = new URLSearchParams();
    if (intent === "default") {
      // Clear all intent params
      setSearchParams(newParams);
    } else {
      newParams.set("utm_campaign", intent);
      setSearchParams(newParams);
    }
    setIsOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.5, duration: 0.4 }}
      className="fixed bottom-4 left-4 z-[100]"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full glass-panel shadow-lg hover:bg-secondary/70 transition-all"
      >
        <Users className="w-4 h-4 text-primary" />
        <span className="text-xs font-display font-semibold text-foreground">
          Persona: {INTENT_ICONS[currentIntent as IntentType] || "🏠"} 
          <span className="capitalize ml-1">{currentIntent}</span>
        </span>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-2 w-64 rounded-xl glass-panel shadow-2xl overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Switch Visitor Persona
              </p>
            </div>
            <div className="p-1.5 max-h-[50vh] overflow-y-auto">
              {ALL_INTENTS.map((intent) => {
                const variant = CONTENT_VARIANTS[intent];
                const isActive = currentIntent === intent || (intent === "default" && !ALL_INTENTS.includes(currentIntent as IntentType));
                return (
                  <button
                    key={intent}
                    onClick={() => switchPersona(intent)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      isActive
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    <span className="text-lg">{INTENT_ICONS[intent]}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold capitalize ${isActive ? "text-primary" : "text-foreground"}`}>
                        {intent}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {variant.headline}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      variant.funnelStage === "buy" ? "bg-budget/10 text-budget" :
                      variant.funnelStage === "compare" ? "bg-productivity/10 text-productivity" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {variant.funnelStage}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PersonaToggle;
