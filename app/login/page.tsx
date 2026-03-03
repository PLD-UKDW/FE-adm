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

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  /* ==========================
     TEXT TO SPEECH WITH PROMISE (WAIT UNTIL FINISH)
  ========================== */
  const speak = (text: string, cancelPrevious: boolean = true) => {
    if (typeof window === "undefined") return;

    if (cancelPrevious) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.85; // lebih tenang
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

    const utterance = new SpeechSynthesisUtterance(char);
    utterance.lang = "id-ID";
    utterance.rate = 0.8; // lebih jelas untuk angka
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

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 0.85;
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
      speak("Halaman login. ... Tekan panah kanan untuk mengetik nomor registrasi. ... Tekan Escape untuk mendengar ulang. ... Tekan Spasi untuk masuk.");
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
     KEYBOARD CONTROL
  ========================== */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Panah kanan → mulai mengetik
      if (e.key === "ArrowRight") {
        setIsTyping(true);
        inputRef.current?.focus();
        speak("Silakan ketik nomor registrasi.");
      }

      // Panah kiri → ulangi instruksi
      if (e.key === "ArrowLeft") {
        speak("Tekan panah kanan untuk mengetik. ... Tekan Escape untuk mendengar ulang. ... Tekan Spasi untuk masuk.");
      }

      // ESC → keluar dari mode mengetik dan baca seluruh hasil
      if (e.key === "Escape") {
        e.preventDefault();
        setIsTyping(false);
        inputRef.current?.blur();

        if (registrationNumber.trim()) {
          speak(`Nomor registrasi Anda adalah ... ${registrationNumber.split("").join(" ... ")}`);
        } else {
          speak("Nomor registrasi masih kosong.");
        }
      }

      // Spasi → submit login (jika tidak sedang mengetik)
      if (e.code === "Space" && !isTyping) {
        e.preventDefault();
        speak("Mengirim login.");
        document.querySelector("form")?.requestSubmit();
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
    </div>
  );
}
