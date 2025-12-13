"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function TestResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const attemptId = searchParams.get("attemptId");
  const [attempt, setAttempt] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!attemptId) return;

  const token = localStorage.getItem("token");

  const fetchResult = async () => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/test/${params.id}/result?attemptId=${attemptId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setAttempt(data.attempt);

      // ---- FETCH TEST ----
      const testRes = await fetch(
        `http://localhost:4000/api/test/${params.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const testData = await testRes.json();
      setTest(testData);

    } catch (e) {
      console.error("Fetch result error:", e);
    } finally {
      setLoading(false);
    }
  };

  fetchResult();
}, [attemptId]);


  if (loading) return <p className="p-6">Memuat hasil...</p>;
  if (!attempt) return <p className="p-6">Hasil tidak ditemukan</p>;

  // Tentukan judul berdasarkan tipe tes
  const title =
    test?.type === "COLLEGE_READINESS"
      ? "Hasil Tes College Readiness"
      : "Hasil Tes Digital Literacy";

  return (
    <div className="max-w-2xl mx-auto p-8 text-black">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>

      <div className="bg-white border rounded-xl p-6 shadow mb-6">
        <p className="text-lg">
          <strong>Skor Otomatis:</strong> {attempt.autoScore}
        </p>

        <p className="text-lg">
          <strong>Final Skor:</strong> {attempt.finalScore ?? "Menunggu penilaian"}
        </p>

        {attempt.passStatus && (
          <p className="text-lg">
            <strong>Status:</strong>{" "}
            <span
              className={
                attempt.passStatus === "PASS"
                  ? "text-green-600 font-bold"
                  : "text-red-600 font-bold"
              }
            >
              {attempt.passStatus}
            </span>
          </p>
        )}
      </div>

      <a
        href="/dashboard/camaba"
        className="block mt-6 bg-blue-600 text-white text-center py-2 rounded-lg"
      >
        Kembali ke Dashboard
      </a>
    </div>
  );
}
