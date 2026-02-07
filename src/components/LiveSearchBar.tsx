import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTION_CHIPS = [
  { label: "Gaming", query: "gaming monitor 144hz" },
  { label: "Budget", query: "cheap affordable monitor" },
  { label: "Creative", query: "color accurate design" },
  { label: "Developer", query: "ultrawide coding setup" },
  { label: "Student", query: "student dorm study" },
  { label: "Office", query: "productivity ergonomic 4k" },
];

const TYPING_PHRASES = [
  "gaming monitor 144hz",
  "cheap affordable monitor",
  "color accurate design",
  "ultrawide coding setup",
  "student dorm study",
  "productivity ergonomic 4k",
];

const useTypewriter = (phrases: string[], enabled: boolean) => {
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayText("");
      return;
    }

    const currentPhrase = phrases[phraseIndex];

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          // Typing forward
          setDisplayText(currentPhrase.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);

          if (charIndex + 1 === currentPhrase.length) {
            // Pause at end before deleting
            setTimeout(() => setIsDeleting(true), 1800);
          }
        } else {
          // Deleting
          setDisplayText(currentPhrase.slice(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);

          if (charIndex <= 1) {
            setIsDeleting(false);
            setCharIndex(0);
            setPhraseIndex((prev) => (prev + 1) % phrases.length);
          }
        }
      },
      isDeleting ? 35 : 70
    );

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex, phrases, enabled]);

  return displayText;
};

const LiveSearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Typewriter effect when input is empty and open
  const typewriterText = useTypewriter(TYPING_PHRASES, isOpen && query === "");

  // Sync input with current URL q param on mount
  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (currentQ) {
      setQuery(currentQ);
      setIsOpen(true);
    }
  }, []);

  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce URL update for smooth typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateSearch(value), 300);
  };

  const handleChipClick = (chipQuery: string) => {
    setQuery(chipQuery);
    updateSearch(chipQuery);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery("");
    updateSearch("");
    inputRef.current?.focus();
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    updateSearch("");
  };

  const handleOpen = () => {
    setIsOpen(true);
    // Focus after animation
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleClose();
  };

  // Detect which intent is currently active from the query
  const activeChip = SUGGESTION_CHIPS.find((chip) =>
    query.toLowerCase().includes(chip.label.toLowerCase())
  );

  return (
    <div className="relative flex items-center">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="search-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleOpen}
              aria-label="Open search"
            >
              <Search className="w-5 h-5" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="search-input"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col"
          >
            {/* Input row */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card/80 backdrop-blur-sm px-3 py-1.5 focus-within:ring-1 focus-within:ring-ring">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="relative w-[200px] md:w-[280px]">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder=""
                  className="bg-transparent border-none outline-none text-sm text-foreground w-full relative z-10"
                />
                {/* Typewriter overlay when input is empty */}
                {!query && (
                  <div className="absolute inset-0 flex items-center pointer-events-none">
                    <span className="text-sm text-muted-foreground">
                      {typewriterText}
                    </span>
                    <span className="w-[2px] h-4 bg-primary/70 ml-[1px] animate-pulse" />
                  </div>
                )}
              </div>
              {query && (
                <button
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>



          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveSearchBar;
