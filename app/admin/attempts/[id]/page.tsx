"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useParams } from "next/navigation";

export default function AttemptReview() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState<any>(null);
  const [manualScore, setManualScore] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchDetail() {
    try {
      const res = await api.get(`/admin/attempts/${id}`);
      setAttempt(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function submitScore() {
    try {
      const res = await api.post(`/admin/attempts/${id}/score`, {
        manualScore: Number(manualScore),
      });

      alert("Nilai berhasil disimpan!");
      fetchDetail();
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan nilai");
    }
  }

  useEffect(() => {
    fetchDetail();
  }, []);

  if (loading) return <p className="p-6">Loading data...</p>;
  if (!attempt) return <p className="p-6 text-red-600">Attempt tidak ditemukan</p>;

  const answers = attempt.answers || {};

  return (
    <div className="p-8 space-y-6 text-black">
      <h1 className="text-2xl font-bold mb-4">
        Review Attempt #{attempt.id}
      </h1>

      <div className="p-4 border rounded-lg bg-white shadow">
        <p><b>Nama Peserta:</b> {attempt.user?.name}</p>
        <p><b>Test:</b> {attempt.test?.title}</p>
        <p><b>Tipe:</b> {attempt.test?.type}</p>
        <p><b>Auto Score:</b> {attempt.autoScore}</p>
        <p><b>Manual Score:</b> {attempt.manualScore ?? "-"}</p>
        <p><b>Final Score:</b> {attempt.finalScore ?? "-"}</p>
        <p><b>Status:</b> {attempt.passStatus ?? "Pending"}</p>
      </div>

      {/* ==========================
          TAMPILKAN JAWABAN USER
      =========================== */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Jawaban Peserta</h2>

        {attempt.test.questions.map((q: any) => (
          <div key={q.id} className="p-4 border rounded-lg bg-gray-50">
            <p className="font-medium mb-2"># {q.text}</p>

            <p className="text-sm text-gray-700">
              <b>Jawaban peserta:</b> {answers[q.id] ?? "-"}
            </p>
          </div>
        ))}
      </div>

      {/* ==========================
          FORM PENILAIAN MANUAL
      =========================== */}
      {attempt.test.type === "COLLEGE_READINESS" && (
        <div className="p-4 border rounded-lg bg-white">
          <h2 className="font-semibold mb-3">Berikan Nilai Manual</h2>

          <input
            type="number"
            value={manualScore}
            onChange={(e) => setManualScore(e.target.value)}
            className="border p-2 rounded w-40"
            placeholder="Nilai"
          />

          <button
            onClick={submitScore}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Simpan
          </button>
        </div>
      )}
    </div>
  );
}
