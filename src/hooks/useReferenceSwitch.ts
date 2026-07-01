import { useReferenceStore } from "@/stores/referenceStore";
import {
  type SchemaReference,
  dataUrlForReference,
  referenceSearchParam,
  resolveSchemaReference,
} from "@/utils/dataUrl";
import { preloadSchemaData } from "@/utils/schemaCache";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";

/** Spring pill duration fallback when layout animation callbacks do not fire. */
const PILL_ANIMATION_MS = 420;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Optimistic interem/release switch: animate the toggle immediately, preload schema
 * in the background, then commit URL + persisted reference once the pill animation ends.
 */
export function useReferenceSwitch() {
  const navigate = useNavigate();
  const urlReference = useSearch({ strict: false, select: (s) => s.reference });
  const persistedReference = useReferenceStore((s) => s.reference);
  const setPersistedReference = useReferenceStore((s) => s.setReference);
  const pendingReference = useReferenceStore((s) => s.pendingReference);
  const setPendingReference = useReferenceStore((s) => s.setPendingReference);
  const setReferencePreloading = useReferenceStore((s) => s.setReferencePreloading);

  const committedReference = resolveSchemaReference(urlReference, persistedReference);
  const displayReference = pendingReference ?? committedReference;

  const targetRef = useRef<SchemaReference | null>(null);
  const animationDoneRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const tryCommit = useCallback(() => {
    const target = targetRef.current;
    if (!target || !animationDoneRef.current) return;

    clearFallbackTimer();
    setPendingReference(null);
    setReferencePreloading(false);
    targetRef.current = null;
    animationDoneRef.current = false;

    void navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        reference: referenceSearchParam(target),
        dataUrl: undefined,
      }),
    })
      .then(() => {
        setPersistedReference(target);
      })
      .catch(() => {
        setPendingReference(null);
        setReferencePreloading(false);
        targetRef.current = null;
        animationDoneRef.current = false;
      });
  }, [
    clearFallbackTimer,
    navigate,
    setPendingReference,
    setPersistedReference,
    setReferencePreloading,
  ]);

  const select = useCallback(
    (next: SchemaReference) => {
      if (next === committedReference && !pendingReference) return;
      if (next === pendingReference) return;

      clearFallbackTimer();
      targetRef.current = next;
      animationDoneRef.current = prefersReducedMotion();
      setPendingReference(next);
      setReferencePreloading(true);

      void preloadSchemaData(dataUrlForReference(next));

      if (prefersReducedMotion()) {
        tryCommit();
      } else {
        fallbackTimerRef.current = setTimeout(() => {
          if (targetRef.current !== next) return;
          animationDoneRef.current = true;
          tryCommit();
        }, PILL_ANIMATION_MS);
      }
    },
    [
      clearFallbackTimer,
      committedReference,
      pendingReference,
      setPendingReference,
      setReferencePreloading,
      tryCommit,
    ],
  );

  const onPillAnimationComplete = useCallback(() => {
    if (!targetRef.current) return;
    animationDoneRef.current = true;
    tryCommit();
  }, [tryCommit]);

  useEffect(() => () => clearFallbackTimer(), [clearFallbackTimer]);

  // Drop optimistic UI if the hook unmounts mid-switch (e.g. navigation away).
  useEffect(() => {
    return () => {
      if (useReferenceStore.getState().pendingReference !== null) {
        setPendingReference(null);
        setReferencePreloading(false);
      }
    };
  }, [setPendingReference, setReferencePreloading]);

  return {
    committedReference,
    displayReference,
    isSwitching: pendingReference !== null,
    select,
    onPillAnimationComplete,
  };
}
