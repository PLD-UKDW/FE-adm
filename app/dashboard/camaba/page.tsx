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
  const [lastArrowLeftTime, setLastArrowLeftTime] = useState(0);

  /* ==========================
     ACCESS OPTIONS
  ========================== */
  const accessOptions = [
    {
      id: "tts",
      label: "Gunakan Bantuan Suara",
      description: "Semua informasi akan dibacakan.",
    },
    {
      id: "no-tts",
      label: "Tanpa Bantuan Suara",
      description: "Anda menggunakan tampilan layar seperti biasa.",
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
      u.rate = 0.7;
      window.speechSynthesis.speak(u);
    });
  };

  /* =====================================================
     🔊 SPEECH QUEUE WITH PROMISE (WAIT UNTIL FINISH)
  ===================================================== */
  const speakQueueAndWait = (texts: string[]): Promise<void> => {
    return new Promise((resolve) => {
      if (!useTTS || !("speechSynthesis" in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      if (texts.length === 0) {
        resolve();
        return;
      }

      texts.forEach((text, index) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "id-ID";
        u.rate = 0.7;

        // Resolve when the last utterance ends
        if (index === texts.length - 1) {
          u.onend = () => resolve();
          u.onerror = () => resolve();
        }

        window.speechSynthesis.speak(u);
      });
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
      .get("/api/test", {
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
     INTRO + POPUP (MUNCUL SEKALI PER SESI LOGIN)
  ===================================================== */
  useEffect(() => {
    if (loading) return;

    // Cek apakah popup sudah ditampilkan dalam sesi login ini
    const popupShown = sessionStorage.getItem("popupShown");
    if (popupShown === "true") {
      // Popup sudah ditampilkan, tidak perlu muncul lagi
      return;
    }

    // Tandai popup sudah ditampilkan untuk sesi ini
    sessionStorage.setItem("popupShown", "true");

    setUseTTS(true);
    setShowAccessPopup(true);

    // Delay untuk memastikan TTS halaman sebelumnya sudah selesai
    const timeout = setTimeout(() => {
      window.speechSynthesis.cancel();

      speakQueue([
        "Selamat datang di halaman tes. ...",
        "Silakan pilih cara penggunaan. ...",
        "Gunakan panah atas atau bawah. ...",
        "Tekan spasi untuk memilih. ...",
        `Pilihan satu. ... ${accessOptions[0].label}. ...`,
        `Pilihan dua. ... ${accessOptions[1].label}.`,
      ]);
    }, 500);

    return () => clearTimeout(timeout);
  }, [loading]);

  /* =====================================================
     POPUP KEYBOARD NAVIGATION
  ===================================================== */
  useEffect(() => {
    if (!showAccessPopup) return;

    const handler = async (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.code === "ArrowUp") {
        e.preventDefault();

        setAccessIndex((prev) => {
          const next = e.code === "ArrowDown" ? (prev + 1) % accessOptions.length : (prev - 1 + accessOptions.length) % accessOptions.length;
          speakQueue([`Opsi ${next + 1}. ...`, `${accessOptions[next].label}. ...`, accessOptions[next].description]);
          return next;
        });
      }

      if (e.code === "Space") {
        e.preventDefault();

        const selected = accessOptions[accessIndex];

        if (selected.id === "tts") {
          setUseTTS(true);
          speakQueue([
            "Bantuan suara aktif. ...",
            `Ada ${tests.length} tes tersedia. ...`,
            "Gunakan panah kanan atau kiri untuk memilih. ...",
            "Tekan spasi untuk membuka. ...",
            "Tekan panah kiri dua kali untuk mendengar ulang instruksi. ...",
            "Tekan escape untuk keluar.",
          ]);
        } else {
          window.speechSynthesis.cancel();
          setUseTTS(false);
        }

        setShowAccessPopup(false);
      }

      // Logout dengan Escape
      if (e.code === "Escape") {
        e.preventDefault();
        await speakQueueAndWait(["Anda akan logout. ..."]);
        window.speechSynthesis.cancel();
        localStorage.removeItem("token");
        sessionStorage.removeItem("popupShown");
        window.location.href = "/login";
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

    const handler = async (e: KeyboardEvent) => {
      // Deteksi double left arrow untuk mengulang instruksi
      if (e.code === "ArrowLeft") {
        const now = Date.now();
        if (now - lastArrowLeftTime < 500) {
          // Double press detected - ulang instruksi
          e.preventDefault();
          speakQueue([
            "Instruksi. ...",
            `Anda berada di tes ${selectedIndex + 1} dari ${tests.length}. ...`,
            "Gunakan panah kanan atau kiri untuk memilih. ...",
            "Tekan spasi untuk membuka. ...",
            "Tekan panah kiri dua kali untuk mengulang instruksi. ...",
            "Tekan escape untuk keluar akun.",
          ]);
          setLastArrowLeftTime(0);
          return;
        }
        setLastArrowLeftTime(now);
      }

      if (e.code === "ArrowRight" || e.code === "ArrowLeft") {
        e.preventDefault();

        setSelectedIndex((prev) => {
          const next = e.code === "ArrowRight" ? (prev + 1) % tests.length : (prev - 1 + tests.length) % tests.length;

          const t = tests[next];

          speakQueue([`Tes ${next + 1}. ...`, `${t.title}. ...`, t.completed ? "Sudah dikerjakan. ... Tekan spasi untuk melihat hasil." : "Belum dikerjakan. ... Tekan spasi untuk mulai."]);
          return next;
        });
      }

      if (e.code === "Space") {
        e.preventDefault();
        const t = tests[selectedIndex];

        if (t.completed) {
          await speakQueueAndWait([`Membuka hasil ${t.title}. ...`]);
          router.push(`/test/${t.id}/result?attemptId=${t.latestAttemptId}`);
        } else {
          await speakQueueAndWait([`Memulai ${t.title}. ...`]);
          router.push(`/test/${t.id}`);
        }
      }

      // Logout dengan Escape
      if (e.code === "Escape") {
        e.preventDefault();
        await speakQueueAndWait(["Anda keluar dari akun. ..."]);
        window.speechSynthesis.cancel();
        localStorage.removeItem("token");
        sessionStorage.removeItem("popupShown");
        window.location.href = "/login";
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [useTTS, tests, selectedIndex, showAccessPopup, lastArrowLeftTime]);

  /* ==========================
     UI
  ========================== */
  if (loading) return <p className="p-6 text-black text-xl">Memuat...</p>;

  return (
    <div className="min-h-screen max-w-5xl mx-auto p-6 text-black">
      {/* ================= POPUP ================= */}
      {showAccessPopup && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">Pengaturan Aksesibilitas</h2>

            <ul className="space-y-4">
              {accessOptions.map((opt, idx) => (
                <li key={opt.id} className={`p-4 border rounded-lg ${idx === accessIndex ? "outline outline-2 outline-green-600" : ""}`}>
                  <p className="font-semibold text-xl">{opt.label}</p>
                  <p className="text-lg text-green-700">{opt.description}</p>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-lg text-green-600">Gunakan ↑ ↓ lalu Spasi</p>
          </div>
        </div>
      )}

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Dashboard Calon Mahasiswa</h1>
        <button
          onClick={() => {
            window.speechSynthesis.cancel(); // Hentikan TTS saat logout
            localStorage.removeItem("token");
            sessionStorage.removeItem("popupShown"); // Reset popup flag saat logout
            window.location.href = "/login"; // Gunakan full redirect agar state benar-benar reset
          }}
          className="flex items-center gap-2 px-5 py-3 bg-red-500 text-white text-lg font-semibold rounded-lg hover:bg-red-600 transition"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {!useTTS && <p className="mb-4 text-black text-xl">Klik tombol pada kartu tes untuk memulai atau melihat hasil.</p>}

      {/* ================= LIST TES ================= */}
      <div className="grid md:grid-cols-2 gap-6">
        {tests.map((t, idx) => (
          <div key={t.id} className={`border rounded-xl p-6 bg-white shadow ${useTTS && idx === selectedIndex ? "outline outline-3 outline-green-600" : ""}`}>
            <h2 className="text-2xl font-semibold">{t.title}</h2>
            <p className="text-green-700 mt-2 text-lg">{t.description}</p>

            <span className={`inline-block mt-3 px-4 py-2 text-lg rounded-full ${t.completed ? "bg-green-100 text-green-700" : "bg-green-50 text-green-800"}`}>{t.completed ? "Sudah mengerjakan" : "Belum mengerjakan"}</span>

            {!useTTS && (
              <button onClick={() => router.push(t.completed ? `/test/${t.id}/result?attemptId=${t.latestAttemptId}` : `/test/${t.id}`)} className="mt-4 w-full bg-green-600 text-white py-3 text-lg font-semibold rounded-lg">
                {t.completed ? "Lihat Hasil" : "Mulai Mengerjakan"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
