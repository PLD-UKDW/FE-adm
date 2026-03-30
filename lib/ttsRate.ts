"use client";

import { useCallback, useEffect, useState } from "react";

const TTS_RATE_KEY = "tts:rate";
const TTS_SPEED_EVENT = "tts:speedchange";

function clampRate(rate: number): number {
  return Math.min(2, Math.max(0.5, rate));
}

export function getStoredTtsRate(defaultRate = 1): number {
  if (typeof window === "undefined") return clampRate(defaultRate);

  const raw = Number(localStorage.getItem(TTS_RATE_KEY));
  if (!Number.isFinite(raw)) return clampRate(defaultRate);

  return clampRate(raw);
}

export function setStoredTtsRate(rate: number): number {
  if (typeof window === "undefined") return clampRate(rate);

  const next = clampRate(rate);
  localStorage.setItem(TTS_RATE_KEY, String(next));
  window.dispatchEvent(new CustomEvent(TTS_SPEED_EVENT, { detail: { rate: next } }));

  return next;
}

export function subscribeTtsRate(onRateChange: (rate: number) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onSpeedChange = (event: Event) => {
    const customEvent = event as CustomEvent<{ rate?: number }>;
    const rateFromEvent = Number(customEvent.detail?.rate);

    if (Number.isFinite(rateFromEvent)) {
      onRateChange(clampRate(rateFromEvent));
      return;
    }

    onRateChange(getStoredTtsRate());
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== TTS_RATE_KEY) return;
    onRateChange(getStoredTtsRate());
  };

  window.addEventListener(TTS_SPEED_EVENT, onSpeedChange as EventListener);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(TTS_SPEED_EVENT, onSpeedChange as EventListener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useTtsRate(initialRate = 1): [number, (next: number | ((prev: number) => number)) => number] {
  // Keep first render deterministic for SSR hydration.
  const [rate, setRate] = useState<number>(() => clampRate(initialRate));

  useEffect(() => {
    setRate(getStoredTtsRate(initialRate));

    return subscribeTtsRate((nextRate) => {
      setRate(nextRate);
    });
  }, [initialRate]);

  const setSharedRate = useCallback(
    (next: number | ((prev: number) => number)) => {
      const current = getStoredTtsRate(initialRate);
      const nextValue = typeof next === "function" ? (next as (prev: number) => number)(current) : next;
      const persisted = setStoredTtsRate(nextValue);
      setRate(persisted);
      return persisted;
    },
    [initialRate],
  );

  return [rate, setSharedRate];
}
