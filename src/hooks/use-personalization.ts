/**
 * React hook that bridges the framework-agnostic personalization 
 * engine with the React component tree.
 * 
 * Why a hook? It re-runs on URL changes (via useSearchParams) and
 * memoizes the result to avoid unnecessary re-renders.
 */

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { personalize, type ContentVariant, type IntentResult } from "@/lib/personalization-engine";

export function usePersonalization(): {
  variant: ContentVariant;
  result: IntentResult;
} {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    return personalize(searchParams, document.referrer);
  }, [searchParams]);
}
