// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function LoginPage() {
//   const [registrationNumber, setRegistrationNumber] = useState("");
//   const [error, setError] = useState("");
//   const router = useRouter();

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const res = await fetch("http://localhost:4000/api/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ registrationNumber }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Login gagal");

//       localStorage.setItem("token", data.token);
//       localStorage.setItem("user", JSON.stringify(data.user));

//       if (data.user.role === "ADMIN") {
//         router.push("/dashboard/admin");
//       } else {
//         router.push("/dashboard/camaba");
//       }
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-50">
//       <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
//         <h1 className="text-2xl font-semibold mb-4 text-center">Login</h1>

//         {error && <p className="text-red-600 text-sm mb-3 text-center">{error}</p>}

//         <input
//           type="text"
//           placeholder="Nomor Pendaftaran"
//           value={registrationNumber}
//           onChange={(e) => setRegistrationNumber(e.target.value)}
//           className="w-full text-black p-2 border rounded mb-4"
//           required
//         />

//         <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
//           Login
//         </button>
//       </form>
//     </div>
//   );
// }

"use client";

import api from "@/lib/api";
import { useTtsRate } from "@/lib/ttsRate";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

export default function LoginPage() {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastCharIndex, setLastCharIndex] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useTtsRate(1);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  /* ==========================
     CHANGE SPEECH SPEED
  ========================== */
  const changeSpeed = (delta: number) => {
    setCurrentSpeed((prev) => {
      const next = Math.min(2, Math.max(0.5, prev + delta));

      // Speak feedback
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u1 = new SpeechSynthesisUtterance("Kecepatan suara diubah.");
        u1.lang = "id-ID";
        u1.rate = next;
        const u2 = new SpeechSynthesisUtterance(`Kecepatan sekarang ${next.toFixed(1)}`);
        u2.lang = "id-ID";
        u2.rate = next;
        window.speechSynthesis.speak(u1);
        window.speechSynthesis.speak(u2);
      }

      return next;
    });
  };

  /* ==========================
     TEXT TO SPEECH WITH PROMISE (WAIT UNTIL FINISH)
  ========================== */
  const speak = (text: string, cancelPrevious: boolean = true) => {
    if (typeof window === "undefined") return;

    if (cancelPrevious) {
      window.speechSynthesis.cancel();
    }

    const savedRate = Number(localStorage.getItem("tts:rate") || 1);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = savedRate;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  };

  /* ==========================
     SPEAK SINGLE CHARACTER
  ========================== */
  const speakChar = (char: string) => {
    if (typeof window === "undefined") return;

    window.speechSynthesis.cancel();

    const savedRate = Number(localStorage.getItem("tts:rate") || 1);
    const utterance = new SpeechSynthesisUtterance(char);
    utterance.lang = "id-ID";
    utterance.rate = savedRate;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  };

  /* ==========================
     SPEAK AND WAIT UNTIL FINISH
  ========================== */
  const speakAndWait = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const savedRate = Number(localStorage.getItem("tts:rate") || 1);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = savedRate;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  };

  /* ==========================
     AUTO SPEAK WHEN PAGE LOAD
  ========================== */
  useEffect(() => {
    // Delay untuk memastikan TTS halaman sebelumnya sudah selesai
    const timeout = setTimeout(() => {
      window.speechSynthesis.cancel();
      speak(
        "Halaman login. ... Tekan Spasi untuk mengetik nomor registrasi. ... Tekan Escape untuk keluar dari mode mengetik. ... Tekan Enter untuk masuk. ... Gunakan Shift panah atas untuk mempercepat suara, atau Shift panah bawah untuk memperlambat.",
      );
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  /* ==========================
     SPEAK EACH CHARACTER WHEN TYPING
  ========================== */
  useEffect(() => {
    if (isTyping && registrationNumber.length > lastCharIndex) {
      // Karakter baru ditambahkan, ucapkan karakter tersebut
      const newChar = registrationNumber[registrationNumber.length - 1];
      speakChar(newChar);
      setLastCharIndex(registrationNumber.length);
    } else if (registrationNumber.length < lastCharIndex) {
      // Karakter dihapus, ucapkan "hapus"
      speakChar("hapus");
      setLastCharIndex(registrationNumber.length);
    }
  }, [registrationNumber, isTyping, lastCharIndex]);

  /* ==========================
     CONVERT KEY TO SPOKEN TEXT
  ========================== */
  const getKeyName = (e: KeyboardEvent): string => {
    const keyMap: Record<string, string> = {
      // Special keys
      Escape: "escape",
      Enter: "enter",
      Backspace: "hapus",
      Delete: "delete",
      Tab: "tab",
      CapsLock: "caps lock",
      Shift: "shift",
      Control: "control",
      Alt: "alt",
      Meta: "command",
      Space: "spasi",
      // Arrow keys
      ArrowUp: "panah atas",
      ArrowDown: "panah bawah",
      ArrowLeft: "panah kiri",
      ArrowRight: "panah kanan",
      // Function keys
      F1: "f 1",
      F2: "f 2",
      F3: "f 3",
      F4: "f 4",
      F5: "f 5",
      F6: "f 6",
      F7: "f 7",
      F8: "f 8",
      F9: "f 9",
      F10: "f 10",
      F11: "f 11",
      F12: "f 12",
      // Other special keys
      Home: "home",
      End: "end",
      PageUp: "page up",
      PageDown: "page down",
      Insert: "insert",
      NumLock: "num lock",
      ScrollLock: "scroll lock",
      Pause: "pause",
      ContextMenu: "menu",
    };

    // Check if key is in the map
    if (keyMap[e.key]) {
      return keyMap[e.key];
    }

    // For single characters (letters, numbers, symbols)
    if (e.key.length === 1) {
      return e.key;
    }

    // Default: return the key name as is
    return e.key;
  };

  /* ==========================
     KEYBOARD CONTROL
  ========================== */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Speak every key pressed (untuk accessibility)
      const keyName = getKeyName(e);

      /* SPEED CONTROL - Shift + Arrow Up/Down */
      if (e.shiftKey && e.code === "ArrowUp") {
        e.preventDefault();
        changeSpeed(0.1);
        return;
      }

      if (e.shiftKey && e.code === "ArrowDown") {
        e.preventDefault();
        changeSpeed(-0.1);
        return;
      }

      // Spasi → mulai mengetik (jika tidak sedang mengetik)
      if (e.code === "Space" && !isTyping) {
        e.preventDefault();
        setIsTyping(true);
        inputRef.current?.focus();
        speak("spasi. Silakan ketik nomor registrasi.");
        return;
      }

      // ESC → keluar dari mode mengetik
      if (e.key === "Escape") {
        e.preventDefault();
        setIsTyping(false);
        inputRef.current?.blur();

        if (registrationNumber.trim()) {
          speak(`escape. Keluar dari mode mengetik. Nomor registrasi Anda adalah ... ${registrationNumber.split("").join(" ... ")}`);
        } else {
          speak("escape. Keluar dari mode mengetik. Nomor registrasi masih kosong.");
        }
        return;
      }

      // Enter → submit login (jika tidak sedang mengetik)
      if (e.key === "Enter" && !isTyping) {
        e.preventDefault();
        speak("enter. Mengirim login.");
        document.querySelector("form")?.requestSubmit();
        return;
      }

      // Ucapkan semua tombol khusus (yang bukan karakter tunggal)
      // Karakter tunggal saat mengetik sudah dihandle oleh useEffect lain
      if (e.key.length > 1) {
        speakChar(keyName);
      } else if (!isTyping) {
        // Jika tidak sedang mengetik, ucapkan karakter tunggal juga
        speakChar(keyName);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTyping, registrationNumber]);

  /* ==========================
     LOGIN FUNCTION
  ========================== */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await speakAndWait("Sedang memproses login. ... Mohon tunggu.");

    try {
      const res = await api.post("/api/login", { registrationNumber });

      if (res.data.message === "OTP sent") {
        document.cookie = `authStage=otp; path=/; max-age=600`;
        document.cookie = `pendingRegNumber=${registrationNumber}; path=/; max-age=600`;
        router.push(`/otp?registrationNumber=${registrationNumber}`);
        return;
      }

      if (res.data.token) {
        const role = res.data.user?.role;

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        document.cookie = `authToken=${res.data.token}; path=/; max-age=86400`;
        document.cookie = `role=${role}; path=/; max-age=86400`;

        if (role === "ADMIN") {
          await speakAndWait("Login berhasil. ... Anda akan dialihkan ke halaman admin.");
          router.push("/admin/dashboard");
        } else {
          await speakAndWait("Login berhasil. ... Anda akan dialihkan ke dashboard.");
          window.location.href = "http://localhost:3001/dashboard/camaba";
        }
        return;
      }

      setError("Unexpected response from server");
      speak("Terjadi kesalahan pada sistem.");
    } catch (err: unknown) {
      let message = "Login gagal";
      if (typeof err === "object" && err !== null) {
        const maybeResp = err as {
          response?: { data?: { message?: string } };
        };
        message = maybeResp.response?.data?.message || (err instanceof Error ? err.message : message);
      }
      setError(message);
      speak("Login gagal. Periksa kembali nomor registrasi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#8db93f] min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#108607] rounded-2xl shadow-xl p-10">
        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <Image src="/logo/logould.png" width={120} height={120} alt="Logo" className="invert brightness-0" />
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-2">Welcome Back!</h1>

        <p className="text-white/90 text-center mb-8 px-4">Please sign in to your account by completing the necessary fields below</p>

        {/* FORM LOGIN */}
        <form onSubmit={handleLogin} className="mt-4">
          <label className="text-white text-sm mb-2 block">Nomor Registrasi</label>

          <input
            ref={inputRef}
            type="text"
            name="registrationNumber"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="Masukkan Nomor Registrasi Anda"
            className="w-full px-4 py-3 mb-6 rounded-lg border border-white/60 bg-white/10 text-white placeholder-white/70 focus:border-white"
          />

          {error && <p className="mb-3 text-center text-sm text-red-300">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-white text-[#108607] py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-70 flex items-center justify-center gap-2">
            Sign In
            {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#108607] border-t-transparent" />}
          </button>

          <button
            type="button"
            onClick={() => {
              document.cookie = "authStage=; Max-Age=0; path=/";
              document.cookie = "pendingRegNumber=; Max-Age=0; path=/";
              window.location.href = FRONTEND_URL;
            }}
            className="mt-3 w-full border border-white/60 text-white py-3 rounded-lg font-semibold hover:bg-white/10 transition"
          >
            Kembali ke Halaman Utama
          </button>
        </form>
      </div>

      {/* FLOATING SPEED CONTROL */}
      <div className="fixed bottom-6 right-6 bg-white shadow-xl border rounded-xl p-4 flex flex-col gap-3 items-center">
        <p className="text-sm font-semibold text-black">Kecepatan Suara</p>

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => changeSpeed(-0.1)} className="px-3 py-2 bg-gray-200 rounded-lg text-lg font-bold text-black">
            −
          </button>

          <span className="text-lg font-semibold w-12 text-center text-black">{currentSpeed.toFixed(1)}</span>

          <button type="button" onClick={() => changeSpeed(0.1)} className="px-3 py-2 bg-gray-200 rounded-lg text-lg font-bold text-black">
            +
          </button>
        </div>
      </div>
    </div>
  );
}
