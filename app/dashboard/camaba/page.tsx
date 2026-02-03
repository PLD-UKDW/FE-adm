"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { LogOut } from "lucide-react";

/* =====================================================
   DASHBOARD CAMABA – ACCESSIBILITY & SCREEN READER FIRST
===================================================== */

export default function CamabaDashboardPage() {
  const router = useRouter();

  /* ==========================
     DATA STATE
  ========================== */
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ==========================
     ACCESSIBILITY STATE
  ========================== */
  const [useTTS, setUseTTS] = useState(true);
  const [showAccessPopup, setShowAccessPopup] = useState(false);

  /* ==========================
     NAVIGATION STATE
  ========================== */
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [accessIndex, setAccessIndex] = useState(0);

  /* ==========================
     ACCESS OPTIONS
  ========================== */
  const accessOptions = [
    {
      id: "tts",
      label: "Gunakan Text to Speech",
      description: "Navigasi menggunakan keyboard dan sistem membacakan seluruh informasi",
    },
    {
      id: "no-tts",
      label: "Tanpa Text to Speech",
      description: "Navigasi menggunakan tampilan visual dan tombol",
    },
  ];

  /* =====================================================
     🔊 SPEECH QUEUE ENGINE
  ===================================================== */
  const speakQueue = (texts: string[]) => {
    if (!useTTS) return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    texts.forEach((text) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "id-ID";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    });
  };

  /* ==========================
     AUTH + FETCH TEST
  ========================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    api
      .get("/test", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((r) => {
        setTests(r.data);
      })
      .catch((err) => {
        console.error("Gagal mengambil data tes:", err);
      })
      .finally(() => setLoading(false));
  }, [router]);

  /* =====================================================
     INTRO + POPUP (SELALU MUNCUL SETELAH LOGIN)
  ===================================================== */
  useEffect(() => {
    if (loading) return;

    setUseTTS(true);
    setShowAccessPopup(true);

    speakQueue([
      "Selamat datang di dashboard calon mahasiswa.",
      "Sistem ini mendukung aksesibilitas untuk pengguna disabilitas.",
      "Silakan tentukan mode aksesibilitas Anda.",
      "Gunakan panah atas dan bawah untuk memilih.",
      "Tekan Enter untuk konfirmasi.",
      "Ini adalah opsi pertama:",
      `${accessOptions[0].label}. ${accessOptions[0].description}.`,
      "Ini adalah opsi kedua:",
      `${accessOptions[1].label}. ${accessOptions[1].description}.`,
    ]);
  }, [loading]);

  /* =====================================================
     POPUP KEYBOARD NAVIGATION
  ===================================================== */
  useEffect(() => {
    if (!showAccessPopup) return;

    const handler = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.code === "ArrowUp") {
        e.preventDefault();

        setAccessIndex((prev) => {
          const next = e.code === "ArrowDown" ? (prev + 1) % accessOptions.length : (prev - 1 + accessOptions.length) % accessOptions.length;

          speakQueue([accessOptions[next].label, accessOptions[next].description]);

          return next;
        });
      }

      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();

        const selected = accessOptions[accessIndex];

        if (selected.id === "tts") {
          setUseTTS(true);
          speakQueue(["Mode text to speech diaktifkan.", `Terdapat ${tests.length} tes yang tersedia.`, "Gunakan panah kanan dan kiri untuk memilih tes.", "Tekan spasi atau enter untuk membuka tes atau melihat hasil."]);
        } else {
          window.speechSynthesis.cancel();
          setUseTTS(false);
        }

        setShowAccessPopup(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showAccessPopup, accessIndex, tests]);

  /* =====================================================
     DASHBOARD KEYBOARD NAV (TTS MODE)
  ===================================================== */
  useEffect(() => {
    if (!useTTS || showAccessPopup || !tests.length) return;

    const handler = (e: KeyboardEvent) => {
      if (e.code === "ArrowRight" || e.code === "ArrowLeft") {
        e.preventDefault();

        setSelectedIndex((prev) => {
          const next = e.code === "ArrowRight" ? (prev + 1) % tests.length : (prev - 1 + tests.length) % tests.length;

          const t = tests[next];

          speakQueue(["Tes dipilih.", t.title, t.completed ? "Status: sudah dikerjakan. Tekan spasi untuk melihat hasil tes." : "Status: belum dikerjakan. Tekan spasi untuk memulai tes."]);

          return next;
        });
      }

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        const t = tests[selectedIndex];

        if (t.completed) {
          speakQueue([`Membuka hasil ${t.title}.`]);
          setTimeout(() => {
            router.push(`/test/${t.id}/result?attemptId=${t.latestAttemptId}`);
          }, 600);
        } else {
          speakQueue([`Memulai ${t.title}.`]);
          setTimeout(() => {
            router.push(`/test/${t.id}`);
          }, 600);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [useTTS, tests, selectedIndex, showAccessPopup]);

  /* ==========================
     UI
  ========================== */
  if (loading) return <p className="p-6 text-black">Memuat...</p>;

  return (
    <div className="min-h-screen max-w-5xl mx-auto p-6 text-black">
      {/* ================= POPUP ================= */}
      {showAccessPopup && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Pengaturan Aksesibilitas</h2>

            <ul className="space-y-3">
              {accessOptions.map((opt, idx) => (
                <li key={opt.id} className={`p-3 border rounded-lg ${idx === accessIndex ? "outline outline-2 outline-green-600" : ""}`}>
                  <p className="font-semibold">{opt.label}</p>
                  <p className="text-sm text-green-700">{opt.description}</p>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-sm text-green-600">Gunakan ↑ ↓ lalu Enter</p>
          </div>
        </div>
      )}

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard Calon Mahasiswa</h1>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            router.push("/login");
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {!useTTS && <p className="mb-4 text-black">Klik tombol pada kartu tes untuk memulai atau melihat hasil.</p>}

      {/* ================= LIST TES ================= */}
      <div className="grid md:grid-cols-2 gap-6">
        {tests.map((t, idx) => (
          <div key={t.id} className={`border rounded-xl p-6 bg-white shadow ${useTTS && idx === selectedIndex ? "outline outline-2 outline-green-600" : ""}`}>
            <h2 className="text-xl font-semibold">{t.title}</h2>
            <p className="text-green-700 mt-1">{t.description}</p>

            <span className={`inline-block mt-3 px-3 py-1 text-sm rounded-full ${t.completed ? "bg-green-100 text-green-700" : "bg-green-50 text-green-800"}`}>{t.completed ? "Sudah mengerjakan" : "Belum mengerjakan"}</span>

            {!useTTS && (
              <button onClick={() => router.push(t.completed ? `/test/${t.id}/result?attemptId=${t.latestAttemptId}` : `/test/${t.id}`)} className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg">
                {t.completed ? "Lihat Hasil" : "Mulai Mengerjakan"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
