// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useSearchParams } from "next/navigation";

// export default function TestResultPage() {
//   const params = useParams();
//   const searchParams = useSearchParams();

//   const attemptId = searchParams.get("attemptId");
//   const [attempt, setAttempt] = useState<any>(null);
//   const [test, setTest] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//   if (!attemptId) return;

//   const token = localStorage.getItem("token");

//   const fetchResult = async () => {
//     try {
//       const res = await fetch(
//         `http://localhost:4000/api/test/${params.id}/result?attemptId=${attemptId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       const data = await res.json();
//       setAttempt(data.attempt);

//       // ---- FETCH TEST ----
//       const testRes = await fetch(
//         `http://localhost:4000/api/test/${params.id}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       const testData = await testRes.json();
//       setTest(testData);

//     } catch (e) {
//       console.error("Fetch result error:", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchResult();
// }, [attemptId]);

//   if (loading) return <p className="p-6">Memuat hasil...</p>;
//   if (!attempt) return <p className="p-6">Hasil tidak ditemukan</p>;

//   // Tentukan judul berdasarkan tipe tes
//   const title =
//     test?.type === "COLLEGE_READINESS"
//       ? "Hasil Tes College Readiness"
//       : "Hasil Tes Digital Literacy";

//   return (
//     <div className="max-w-2xl mx-auto p-8 text-black">
//       <h1 className="text-3xl font-bold mb-4">{title}</h1>

//       <div className="bg-white border rounded-xl p-6 shadow mb-6">
//         <p className="text-lg">
//           <strong>Skor Otomatis:</strong> {attempt.autoScore}
//         </p>

//         <p className="text-lg">
//           <strong>Final Skor:</strong> {attempt.finalScore ?? "Menunggu penilaian"}
//         </p>

//         {attempt.passStatus && (
//           <p className="text-lg">
//             <strong>Status:</strong>{" "}
//             <span
//               className={
//                 attempt.passStatus === "PASS"
//                   ? "text-green-600 font-bold"
//                   : "text-red-600 font-bold"
//               }
//             >
//               {attempt.passStatus}
//             </span>
//           </p>
//         )}
//       </div>

//       <a
//         href="/dashboard/camaba"
//         className="block mt-6 bg-blue-600 text-white text-center py-2 rounded-lg"
//       >
//         Kembali ke Dashboard
//       </a>
//     </div>
//   );
// }

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function TestResultPage() {
  const { id } = useParams();
  const params = useSearchParams();
  const router = useRouter();
  const attemptId = params.get("attemptId");

  const [attempt, setAttempt] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasSpoken, setHasSpoken] = useState(false);

  /* =====================================================
     🔊 SPEECH ENGINE
  ===================================================== */
  const speakQueue = (texts: string[]) => {
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
      if (!("speechSynthesis" in window)) {
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

  // Fetch result data
  const fetchResult = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !attemptId) return;

    try {
      const res = await fetch(`http://localhost:4000/api/test/${id}/result?attemptId=${attemptId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAttempt(data.attempt);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Fetch result error:", err);
    }
  }, [id, attemptId]);

  // Initial fetch + test info
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchResult();

    fetch(`http://localhost:4000/api/test/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setTest);
  }, [id, attemptId, fetchResult]);

  // Auto-refresh setiap 10 detik untuk live update skor dari admin
  useEffect(() => {
    const interval = setInterval(() => {
      fetchResult();
    }, 10000); // 10 detik

    return () => clearInterval(interval);
  }, [fetchResult]);

  /* =====================================================
     TTS: Bacakan hasil saat data tersedia
  ===================================================== */
  useEffect(() => {
    if (!attempt || !test || hasSpoken) return;

    // Delay untuk memastikan TTS halaman sebelumnya sudah selesai
    const timeout = setTimeout(() => {
      // Pastikan tidak ada TTS yang berjalan dari halaman sebelumnya
      window.speechSynthesis.cancel();

      const texts: string[] = [];

      texts.push(`Hasil Tes ${test.title}. ...`);
      texts.push(`Skor otomatis Anda adalah ${attempt.autoScore}. ...`);

      if (attempt.manualScore !== null) {
        texts.push(`Skor essay adalah ${attempt.manualScore}. ...`);
      }

      if (attempt.finalScore !== null) {
        texts.push(`Skor akhir Anda adalah ${attempt.finalScore}. ...`);
      } else {
        texts.push("Skor akhir sedang menunggu penilaian admin. ...");
      }

      if (attempt.passStatus) {
        texts.push(attempt.passStatus === "PASS" ? "Selamat, Anda dinyatakan lulus. ..." : "Maaf, Anda dinyatakan tidak lulus. ...");
      }

      texts.push("Tekan Spasi untuk kembali ke dashboard.");

      speakQueue(texts);
      setHasSpoken(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, [attempt, test, hasSpoken]);

  /* =====================================================
     KEYBOARD NAVIGATION
  ===================================================== */
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        window.speechSynthesis.cancel();
        await speakQueueAndWait(["Kembali ke dashboard. ..."]);
        router.push("/dashboard/camaba");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  if (!attempt || !test) return <p className="p-8 text-2xl">Memuat...</p>;

  // Cek apakah masih menunggu penilaian essay
  const isPending = attempt.finalScore === null || attempt.passStatus === null;

  return (
    <div className="max-w-2xl mx-auto p-8 text-black">
      <h1 className="text-4xl font-bold mb-6">Hasil Tes {test.title}</h1>

      <div className="bg-white border rounded-xl p-8 shadow space-y-4">
        <p className="text-xl">
          <b>Skor Otomatis:</b> {attempt.autoScore}
        </p>

        {attempt.manualScore !== null && (
          <p className="text-xl">
            <b>Skor Essay (Manual):</b> {attempt.manualScore}
          </p>
        )}

        <p className="text-xl">
          <b>Final Skor:</b> {attempt.finalScore !== null ? <span className="text-2xl font-bold">{attempt.finalScore}</span> : <span className="text-orange-500 italic">Menunggu penilaian admin...</span>}
        </p>

        {attempt.passStatus && (
          <p className="text-2xl">
            <b>Status:</b> <span className={`font-bold ${attempt.passStatus === "PASS" ? "text-green-600" : "text-red-600"}`}>{attempt.passStatus === "PASS" ? "✓ LULUS" : "✗ TIDAK LULUS"}</span>
          </p>
        )}

        {isPending && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-lg text-yellow-800">⏳ Nilai sedang diproses oleh admin. Halaman ini akan otomatis diperbarui.</p>
          </div>
        )}

        {lastUpdated && <p className="text-xs text-gray-400 mt-2">Terakhir diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}</p>}
      </div>

      <p className="mt-4 text-center text-lg text-blue-600 font-medium">Tekan Spasi untuk kembali ke Dashboard</p>

      <a href="/dashboard/camaba" className="block mt-4 bg-blue-600 text-white py-3 text-center rounded-lg text-lg font-semibold">
        Kembali ke Dashboard
      </a>
    </div>
  );
}
