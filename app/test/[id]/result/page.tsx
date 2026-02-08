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
import { useParams, useSearchParams } from "next/navigation";

export default function TestResultPage() {
  const { id } = useParams();
  const params = useSearchParams();
  const attemptId = params.get("attemptId");

  const [attempt, setAttempt] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  if (!attempt || !test) return <p className="p-6">Memuat...</p>;

  // Cek apakah masih menunggu penilaian essay
  const isPending = attempt.finalScore === null || attempt.passStatus === null;

  return (
    <div className="max-w-2xl mx-auto p-8 text-black">
      <h1 className="text-3xl font-bold mb-4">Hasil Tes {test.type === "COLLEGE_READINESS" ? "College Readiness" : "Digital Literacy"}</h1>

      <div className="bg-white border rounded-xl p-6 shadow space-y-3">
        <p>
          <b>Skor Otomatis:</b> {attempt.autoScore}
        </p>

        {attempt.manualScore !== null && (
          <p>
            <b>Skor Essay (Manual):</b> {attempt.manualScore}
          </p>
        )}

        <p>
          <b>Final Skor:</b> {attempt.finalScore !== null ? <span className="text-xl font-bold">{attempt.finalScore}</span> : <span className="text-orange-500 italic">Menunggu penilaian admin...</span>}
        </p>

        {attempt.passStatus && (
          <p className="text-lg">
            <b>Status:</b> <span className={`font-bold ${attempt.passStatus === "PASS" ? "text-green-600" : "text-red-600"}`}>{attempt.passStatus === "PASS" ? "✓ LULUS" : "✗ TIDAK LULUS"}</span>
          </p>
        )}

        {isPending && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">⏳ Nilai sedang diproses oleh admin. Halaman ini akan otomatis diperbarui.</p>
          </div>
        )}

        {lastUpdated && <p className="text-xs text-gray-400 mt-2">Terakhir diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}</p>}
      </div>

      <a href="/dashboard/camaba" className="block mt-6 bg-blue-600 text-white py-2 text-center rounded-lg">
        Kembali ke Dashboard
      </a>
    </div>
  );
}
