"use client";

import React, { useEffect, useState, useCallback } from "react";

const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
const synth = hasSpeech && typeof window !== "undefined" ? ((window as any).speechSynthesis as SpeechSynthesis) : null;

// ============================================
// SPEED PRESETS DAN HELPER FUNCTIONS
// ============================================

// Preset kecepatan untuk kemudahan akses
export const SPEED_PRESETS = {
  "sangat-lambat": { rate: 0.5, label: "Sangat Lambat" },
  lambat: { rate: 0.75, label: "Lambat" },
  normal: { rate: 1.0, label: "Normal" },
  cepat: { rate: 1.25, label: "Cepat" },
  "sangat-cepat": { rate: 1.5, label: "Sangat Cepat" },
} as const;

export type SpeedPreset = keyof typeof SPEED_PRESETS;

// Fungsi untuk mendapatkan label kecepatan berdasarkan nilai rate
export function getSpeedLabel(rate: number): string {
  if (rate <= 0.6) return "Sangat Lambat";
  if (rate <= 0.85) return "Lambat";
  if (rate <= 1.1) return "Normal";
  if (rate <= 1.35) return "Cepat";
  return "Sangat Cepat";
}

// Fungsi untuk mendapatkan preset terdekat
export function getNearestPreset(rate: number): SpeedPreset {
  if (rate <= 0.6) return "sangat-lambat";
  if (rate <= 0.85) return "lambat";
  if (rate <= 1.1) return "normal";
  if (rate <= 1.35) return "cepat";
  return "sangat-cepat";
}

// ============================================
// SPEECH FUNCTIONS
// ============================================

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

// Fungsi untuk mengubah kecepatan dan memberikan feedback audio
export function setSpeed(rate: number, announceFeedback = true) {
  if (typeof window === "undefined") return;
  localStorage.setItem("tts:rate", String(rate));
  window.dispatchEvent(new CustomEvent("tts:speedchange", { detail: { rate } }));
  
  if (announceFeedback && synth) {
    const label = getSpeedLabel(rate);
    // Feedback audio dengan kecepatan baru
    setTimeout(() => {
      speak(`Kecepatan ${label}`, { rate });
    }, 100);
  }
}

// Fungsi untuk menaikkan kecepatan
export function increaseSpeed() {
  if (typeof window === "undefined") return;
  const currentRate = Number(localStorage.getItem("tts:rate") || 1);
  const newRate = Math.min(2, currentRate + 0.25);
  setSpeed(newRate);
  return newRate;
}

// Fungsi untuk menurunkan kecepatan
export function decreaseSpeed() {
  if (typeof window === "undefined") return;
  const currentRate = Number(localStorage.getItem("tts:rate") || 1);
  const newRate = Math.max(0.5, currentRate - 0.25);
  setSpeed(newRate);
  return newRate;
}

// ============================================
// TTS CONTROL COMPONENT
// ============================================

export default function TTSControl() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<string>("TTS siap.");
  const [activePreset, setActivePreset] = useState<SpeedPreset>("normal");

  // Handle speed preset change
  const handlePresetChange = useCallback((preset: SpeedPreset) => {
    const { rate: newRate } = SPEED_PRESETS[preset];
    setRate(newRate);
    setActivePreset(preset);
    localStorage.setItem("tts:rate", String(newRate));
    // Berikan feedback audio
    speak(`Kecepatan ${SPEED_PRESETS[preset].label}`, { rate: newRate });
  }, []);

  // Handle manual rate change
  const handleRateChange = useCallback((newRate: number) => {
    setRate(newRate);
    setActivePreset(getNearestPreset(newRate));
    localStorage.setItem("tts:rate", String(newRate));
  }, []);

  useEffect(() => {
    if (!synth) return;

    const initRate = typeof window !== "undefined" ? Number(localStorage.getItem("tts:rate") || 1) : 1;
    const initPitch = typeof window !== "undefined" ? Number(localStorage.getItem("tts:pitch") || 1) : 1;
    const initVoice = typeof window !== "undefined" ? localStorage.getItem("tts:voice") : null;
    setRate(initRate);
    setPitch(initPitch);
    setActivePreset(getNearestPreset(initRate));
    if (initVoice) setSelected(initVoice);

    const load = () => {
      const allVoices = synth.getVoices();
      // Prioritaskan suara Indonesia, lalu urutkan berdasarkan nama
      const indonesianVoices = allVoices.filter((v) => v.lang.startsWith("id"));
      const otherVoices = allVoices.filter((v) => !v.lang.startsWith("id"));
      const sortedVoices = [...indonesianVoices, ...otherVoices];
      setVoices(sortedVoices);

      // Auto-select suara Indonesia jika tersedia dan belum ada pilihan
      if (sortedVoices.length && !selected && !initVoice) {
        const indonesianVoice = sortedVoices.find((v) => v.lang.startsWith("id"));
        const defaultVoice = indonesianVoice ?? sortedVoices[0];
        setSelected(defaultVoice.voiceURI || defaultVoice.name);
        localStorage.setItem("tts:voice", defaultVoice.voiceURI || defaultVoice.name);
      }
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

  // Cek apakah ada suara Indonesia yang tersedia
  const hasIndonesianVoice = voices.some((v) => v.lang.startsWith("id"));

  if (!synth) return <div className="p-2 text-sm text-gray-600">TTS tidak tersedia di browser ini.</div>;

  return (
    <div className="p-3 border rounded-md bg-white shadow-sm w-full max-w-sm" aria-live="polite">
      <div className="text-sm text-gray-700 mb-1">Pengaturan TTS</div>
      {!hasIndonesianVoice && <div className="text-xs text-amber-600 mb-2 p-2 bg-amber-50 rounded">💡 Suara bahasa Indonesia tidak tersedia di browser ini. Untuk dialek Indonesia yang lebih baik, gunakan browser Chrome atau Edge.</div>}
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
        {voices.length > 0 && voices.some((v) => v.lang.startsWith("id")) && (
          <optgroup label="🇮🇩 Suara Indonesia">
            {voices
              .filter((v) => v.lang.startsWith("id"))
              .map((v) => (
                <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                  {v.name}
                </option>
              ))}
          </optgroup>
        )}
        {voices.length > 0 && voices.some((v) => !v.lang.startsWith("id")) && (
          <optgroup label="Suara Lainnya">
            {voices
              .filter((v) => !v.lang.startsWith("id"))
              .map((v) => (
                <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                  {v.name} — {v.lang}
                </option>
              ))}
          </optgroup>
        )}
      </select>

      {/* ============================================
          KONTROL KECEPATAN SUARA - AKSESIBEL
          ============================================ */}
      <fieldset className="mt-4 p-3 border rounded-lg bg-blue-50">
        <legend className="text-sm font-semibold text-blue-800 px-2">🎚️ Kecepatan Suara</legend>
        
        {/* Preset Buttons untuk akses cepat */}
        <div className="mt-2">
          <div className="text-xs text-gray-600 mb-2">Pilih kecepatan cepat:</div>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Pilih kecepatan suara">
            {(Object.entries(SPEED_PRESETS) as [SpeedPreset, typeof SPEED_PRESETS[SpeedPreset]][]).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={activePreset === key}
                onClick={() => handlePresetChange(key)}
                className={`px-2 py-1 text-xs rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activePreset === key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
                aria-label={`Kecepatan ${label}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tombol +/- untuk penyesuaian halus */}
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => {
              const newRate = Math.max(0.5, rate - 0.1);
              handleRateChange(newRate);
              speak("Lebih lambat", { rate: newRate });
            }}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-xl font-bold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Kurangi kecepatan suara"
          >
            −
          </button>
          
          <div className="flex-1 text-center">
            <div className="text-lg font-semibold text-blue-800" aria-live="polite" aria-atomic="true">
              {getSpeedLabel(rate)}
            </div>
            <div className="text-xs text-gray-500">{rate.toFixed(1)}x</div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              const newRate = Math.min(2, rate + 0.1);
              handleRateChange(newRate);
              speak("Lebih cepat", { rate: newRate });
            }}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-xl font-bold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Tambah kecepatan suara"
          >
            +
          </button>
        </div>

        {/* Slider untuk kontrol presisi */}
        <div className="mt-3">
          <label htmlFor="speed-slider" className="text-xs text-gray-600 block mb-1">
            Atur kecepatan manual (0.5x - 2x):
          </label>
          <input
            id="speed-slider"
            aria-label={`Kecepatan bicara, saat ini ${getSpeedLabel(rate)}, ${rate.toFixed(1)}x`}
            aria-valuemin={0.5}
            aria-valuemax={2}
            aria-valuenow={rate}
            aria-valuetext={`${getSpeedLabel(rate)}, ${rate.toFixed(1)}x`}
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => handleRateChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0.5x</span>
            <span>1x</span>
            <span>2x</span>
          </div>
        </div>

        {/* Tombol test kecepatan */}
        <button
          type="button"
          onClick={() => speak(`Ini adalah contoh suara dengan kecepatan ${getSpeedLabel(rate)}`, { voiceURI: selected ?? undefined, rate })}
          className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={`Test suara dengan kecepatan ${getSpeedLabel(rate)}`}
        >
          🔊 Test Kecepatan Suara
        </button>
      </fieldset>

      <div className="flex items-center gap-2 mt-3">
        <label className="text-sm text-gray-600">Nada Suara</label>
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
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <div className="text-sm w-8 text-center">{pitch.toFixed(1)}</div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={() => speak("Halo, ini adalah contoh suara bahasa Indonesia.", { voiceURI: selected ?? undefined })} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label="Test suara Indonesia">
          🔊 Test Suara
        </button>
        <button onClick={() => resume()} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Lanjutkan pembacaan">
          ▶️ Resume
        </button>
        <button onClick={() => pause()} className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" aria-label="Jeda pembacaan">
          ⏸️ Pause
        </button>
        <button onClick={() => stop()} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Hentikan pembacaan">
          ⏹️ Stop
        </button>
      </div>

      {/* Tips aksesibilitas */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
        <div className="font-semibold mb-1">💡 Tips Aksesibilitas:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Gunakan tombol preset untuk memilih kecepatan cepat</li>
          <li>Tombol + dan − untuk menyesuaikan kecepatan secara halus</li>
          <li>Pada halaman tes: tekan <kbd className="px-1 py-0.5 bg-gray-200 rounded">-</kbd> untuk lambat, <kbd className="px-1 py-0.5 bg-gray-200 rounded">=</kbd> untuk cepat</li>
          <li>Tekan <kbd className="px-1 py-0.5 bg-gray-200 rounded">0</kbd> untuk kecepatan normal</li>
          <li>Pengaturan kecepatan akan tersimpan otomatis</li>
        </ul>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>
    </div>
  );
}
