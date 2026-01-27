"use client";

import React, { useEffect, useState } from "react";

const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
const synth = hasSpeech && typeof window !== "undefined" ? (window as any).speechSynthesis as SpeechSynthesis : null;

export function speak(text: string, options?: { lang?: string; rate?: number; pitch?: number; voiceURI?: string }) {
  if (!synth) return;
  synth.cancel();

  const persistedVoice = options?.voiceURI ?? (typeof window !== "undefined" ? localStorage.getItem("tts:voice") : null);
  const persistedRate = options?.rate ?? (typeof window !== "undefined" ? Number(localStorage.getItem("tts:rate") || 1) : 1);
  const persistedPitch = options?.pitch ?? (typeof window !== "undefined" ? Number(localStorage.getItem("tts:pitch") || 1) : 1);

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = options?.lang ?? "id-ID";
  utter.rate = persistedRate;
  utter.pitch = persistedPitch;
  if (persistedVoice) {
    const v = synth.getVoices().find((x) => x.voiceURI === persistedVoice || x.name === persistedVoice);
    if (v) utter.voice = v;
  }

  utter.onstart = () => window.dispatchEvent(new CustomEvent("tts:start", { detail: { text } }));
  utter.onend = () => window.dispatchEvent(new CustomEvent("tts:end", { detail: { text } }));
  utter.onpause = () => window.dispatchEvent(new CustomEvent("tts:pause"));
  utter.onresume = () => window.dispatchEvent(new CustomEvent("tts:resume"));

  synth.speak(utter);
}

export function stop() {
  synth?.cancel();
}

export function pause() {
  if (synth && synth.speaking) synth.pause();
}

export function resume() {
  if (synth && synth.paused) synth.resume();
}

export default function TTSControl() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<string>("TTS siap.");

  useEffect(() => {
    if (!synth) return;

    const initRate = typeof window !== "undefined" ? Number(localStorage.getItem("tts:rate") || 1) : 1;
    const initPitch = typeof window !== "undefined" ? Number(localStorage.getItem("tts:pitch") || 1) : 1;
    const initVoice = typeof window !== "undefined" ? localStorage.getItem("tts:voice") : null;
    setRate(initRate);
    setPitch(initPitch);
    if (initVoice) setSelected(initVoice);

    const load = () => {
      const v = synth.getVoices();
      setVoices(v);
      if (v.length && !selected) setSelected((prev) => prev ?? (v[0].voiceURI || v[0].name));
    };
    load();
    synth.onvoiceschanged = load;

    const onStart = () => setStatusMessage("Membacakan...");
    const onEnd = () => setStatusMessage("Selesai dibacakan.");
    const onPause = () => setStatusMessage("Dijeda.");
    const onResume = () => setStatusMessage("Dilanjutkan.");

    window.addEventListener("tts:start", onStart as EventListener);
    window.addEventListener("tts:end", onEnd as EventListener);
    window.addEventListener("tts:pause", onPause as EventListener);
    window.addEventListener("tts:resume", onResume as EventListener);

    return () => {
      if (synth) synth.onvoiceschanged = null;
      window.removeEventListener("tts:start", onStart as EventListener);
      window.removeEventListener("tts:end", onEnd as EventListener);
      window.removeEventListener("tts:pause", onPause as EventListener);
      window.removeEventListener("tts:resume", onResume as EventListener);
    };
  }, []);

  if (!synth) return <div className="p-2 text-sm text-gray-600">TTS tidak tersedia di browser ini.</div>;

  return (
    <div className="p-3 border rounded-md bg-white shadow-sm w-full max-w-sm" aria-live="polite">
      <div className="text-sm text-gray-700 mb-1">Pengaturan TTS</div>
      <label className="sr-only">Pilih suara</label>
      <select
        className="w-full border px-2 py-1 rounded"
        aria-label="Pilih suara"
        value={selected ?? ""}
        onChange={(e) => {
          setSelected(e.target.value);
          localStorage.setItem("tts:voice", e.target.value);
        }}
      >
        {voices.map((v) => (
          <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
            {v.name} — {v.lang}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2 mt-2">
        <label className="text-sm text-gray-600">Rate</label>
        <input
          aria-label="Kecepatan bicara"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={(e) => {
            const v = Number(e.target.value);
            setRate(v);
            localStorage.setItem("tts:rate", String(v));
          }}
        />
        <div className="text-sm">{rate.toFixed(1)}</div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <label className="text-sm text-gray-600">Pitch</label>
        <input
          aria-label="Nada suara"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={pitch}
          onChange={(e) => {
            const p = Number(e.target.value);
            setPitch(p);
            localStorage.setItem("tts:pitch", String(p));
          }}
        />
        <div className="text-sm">{pitch.toFixed(1)}</div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => resume()}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          aria-label="Lanjutkan pembacaan"
        >
          Resume
        </button>
        <button onClick={() => pause()} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm" aria-label="Jeda pembacaan">
          Pause
        </button>
        <button onClick={() => stop()} className="px-3 py-1 bg-red-600 text-white rounded text-sm" aria-label="Hentikan pembacaan">
          Stop
        </button>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>
    </div>
  );
}
