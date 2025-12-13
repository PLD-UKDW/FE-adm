// "use client";

// import { useEffect, useState } from "react";
// import api from "@/lib/api";
// import { useParams } from "next/navigation";

// export default function AttemptReview() {
//   const { id } = useParams();
//   const [attempt, setAttempt] = useState<any>(null);
//   const [manualScore, setManualScore] = useState("");
//   const [loading, setLoading] = useState(true);

//   async function fetchDetail() {
//     try {
//       const res = await api.get(`/admin/attempts/${id}`);
//       setAttempt(res.data);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function submitScore() {
//     try {
//       const res = await api.post(`/admin/attempts/${id}/score`, {
//         manualScore: Number(manualScore),
//       });

//       alert("Nilai berhasil disimpan!");
//       fetchDetail();
//     } catch (e) {
//       console.error(e);
//       alert("Gagal menyimpan nilai");
//     }
//   }

//   useEffect(() => {
//     fetchDetail();
//   }, []);

//   if (loading) return <p className="p-6">Loading data...</p>;
//   if (!attempt) return <p className="p-6 text-red-600">Attempt tidak ditemukan</p>;

//   const answers = attempt.answers || {};

//   return (
//     <div className="p-8 space-y-6 text-black">
//       <h1 className="text-2xl font-bold mb-4">
//         Review Attempt #{attempt.id}
//       </h1>

//       <div className="p-4 border rounded-lg bg-white shadow">
//         <p><b>Nama Peserta:</b> {attempt.user?.name}</p>
//         <p><b>Test:</b> {attempt.test?.title}</p>
//         <p><b>Tipe:</b> {attempt.test?.type}</p>
//         <p><b>Auto Score:</b> {attempt.autoScore}</p>
//         <p><b>Manual Score:</b> {attempt.manualScore ?? "-"}</p>
//         <p><b>Final Score:</b> {attempt.finalScore ?? "-"}</p>
//         <p><b>Status:</b> {attempt.passStatus ?? "Pending"}</p>
//       </div>

//       {/* ==========================
//           TAMPILKAN JAWABAN USER
//       =========================== */}
//       <div className="space-y-4">
//         <h2 className="text-xl font-semibold">Jawaban Peserta</h2>

//         {attempt.test.questions.map((q: any) => (
//           <div key={q.id} className="p-4 border rounded-lg bg-gray-50">
//             <p className="font-medium mb-2"># {q.text}</p>

//             <p className="text-sm text-gray-700">
//               <b>Jawaban peserta:</b> {answers[q.id] ?? "-"}
//             </p>
//           </div>
//         ))}
//       </div>

//       {/* ==========================
//           FORM PENILAIAN MANUAL
//       =========================== */}
//       {attempt.test.type === "COLLEGE_READINESS" && (
//         <div className="p-4 border rounded-lg bg-white">
//           <h2 className="font-semibold mb-3">Berikan Nilai Manual</h2>

//           <input
//             type="number"
//             value={manualScore}
//             onChange={(e) => setManualScore(e.target.value)}
//             className="border p-2 rounded w-40"
//             placeholder="Nilai"
//           />

//           <button
//             onClick={submitScore}
//             className="ml-4 px-4 py-2 bg-blue-600 text-white rounded"
//           >
//             Simpan
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useParams } from "next/navigation";

export default function AttemptReview() {
  const params = useParams();
  const attemptId = params.id; // ✔ FIXED

  const [attempt, setAttempt] = useState<any>(null);
  const [manualScore, setManualScore] = useState("");
  const [statusOverride, setStatusOverride] = useState("");
  const [loading, setLoading] = useState(true);

  // ======================================
  // FETCH DETAIL ATTEMPT
  // ======================================
  async function fetchDetail() {
    try {
      const res = await api.get(`/admin/attempts/${attemptId}`);
      setAttempt(res.data);
      setStatusOverride(res.data.passStatus ?? "");
    } catch (err) {
      console.error("fetchDetail:", err);
    } finally {
      setLoading(false);
    }
  }

  // ======================================
  // SUBMIT MANUAL SCORE
  // ======================================
  async function submitManualScore() {
    try {
      await api.post(`/admin/attempts/${attemptId}/score`, {
        manualScore: Number(manualScore),
      });

      alert("Manual score berhasil disimpan!");
      fetchDetail();
    } catch (err) {
      console.error("submitManualScore:", err);
      alert("Gagal menyimpan manual score");
    }
  }

  // ======================================
  // OVERRIDE PASS / FAIL STATUS
  // ======================================
  async function updatePassStatus() {
    try {
      await api.post(`/admin/attempts/${attemptId}/status`, {
        status: statusOverride,
      });

      alert("Status berhasil diperbarui!");
      fetchDetail();
    } catch (err) {
      console.error("updatePassStatus:", err);
      alert("Gagal mengubah status");
    }
  }

  useEffect(() => {
    fetchDetail();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!attempt) return <p className="p-6 text-red-600">Attempt tidak ditemukan.</p>;

  const answers = attempt.answers || {};

  return (
    <div className="p-8 space-y-6 text-black">
      <h1 className="text-2xl font-bold mb-4">Review Attempt #{attempt.id}</h1>

      {/* ====================== DETAIL ====================== */}
      <div className="p-4 border rounded-lg bg-white shadow">
        <p>
          <b>Nama Peserta:</b> {attempt.user?.name}
        </p>
        <p>
          <b>Test:</b> {attempt.test?.title}
        </p>
        <p>
          <b>Tipe:</b> {attempt.test?.type}
        </p>
        <p>
          <b>Auto Score:</b> {attempt.autoScore}
        </p>
        <p>
          <b>Manual Score:</b> {attempt.manualScore ?? "-"}
        </p>
        <p>
          <b>Final Score:</b> {attempt.finalScore ?? "-"}
        </p>
        <p>
          <b>Status:</b> {attempt.passStatus ?? "Pending"}
        </p>
      </div>

      {/* ====================== JAWABAN PESERTA ====================== */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Jawaban Peserta</h2>

        {attempt.test?.questions?.map((q: any) => (
          <div key={q.id} className="p-4 border rounded-lg bg-gray-50">
            <p className="font-medium mb-2">• {q.text}</p>

            <p className="text-sm text-gray-700">
              <b>Jawaban:</b> {answers[q.id] ?? "-"}
            </p>
          </div>
        ))}
      </div>

      {/* ====================== MANUAL SCORE ====================== */}
      {attempt.test.type === "COLLEGE_READINESS" && (
        <div className="p-4 border rounded-lg bg-white shadow space-y-3">
          <h2 className="font-semibold">Input Manual Score</h2>

          <input type="number" value={manualScore} onChange={(e) => setManualScore(e.target.value)} className="border p-2 rounded w-40" placeholder="Nilai manual" />

          <button onClick={submitManualScore} className="px-4 py-2 bg-blue-600 text-white rounded">
            Simpan Manual Score
          </button>
        </div>
      )}

      {/* ====================== OVERRIDE STATUS ====================== */}
      <div className="p-4 border rounded-lg bg-white shadow space-y-3">
        <h2 className="font-semibold">Override Status</h2>

        <select value={statusOverride} onChange={(e) => setStatusOverride(e.target.value)} className="border p-2 rounded w-40">
          <option value="">-- pilih status --</option>
          <option value="PASS">PASS</option>
          <option value="FAIL">FAIL</option>
        </select>

        <button onClick={updatePassStatus} className="px-4 py-2 bg-green-600 text-white rounded">
          Update Status
        </button>
      </div>
    </div>
  );
}
