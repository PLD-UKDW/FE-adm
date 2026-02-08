"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function AttemptReview() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id;

  const [token, setToken] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [manualScore, setManualScore] = useState("");
  const [statusOverride, setStatusOverride] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingEssay, setSavingEssay] = useState<number | null>(null);

  // State untuk input nilai essay per pertanyaan (belum disimpan)
  const [essayInputs, setEssayInputs] = useState<Record<number, string>>({});

  const essayScores = attempt?.essayScores || {};
  const answers = attempt?.answers || {};

  // Sync essayInputs dengan essayScores dari server saat data berubah
  useEffect(() => {
    if (attempt?.essayScores) {
      const inputs: Record<number, string> = {};
      Object.entries(attempt.essayScores).forEach(([key, val]) => {
        inputs[Number(key)] = String(val);
      });
      setEssayInputs(inputs);
    }
  }, [attempt?.essayScores]);

  // ===============================
  // LOAD TOKEN
  // ===============================
  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  // ===============================
  // FETCH ATTEMPT DETAIL + TEST QUESTIONS
  // ===============================
  const fetchDetail = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Fetch attempt detail
      const res = await fetch(`http://localhost:4000/api/admin/attempts/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Fetch attempt failed");

      const data = await res.json();
      setAttempt(data);
      setStatusOverride(data.passStatus ?? "");

      // Jika ada questions dari response, gunakan itu
      if (data.test?.questions?.length > 0) {
        setQuestions(data.test.questions);
      } else if (data.testId || data.test?.id) {
        // Fetch test detail untuk mendapatkan questions
        const testId = data.testId || data.test?.id;
        const testRes = await fetch(`http://localhost:4000/api/admin/tests/${testId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (testRes.ok) {
          const testData = await testRes.json();
          setQuestions(testData.questions || []);
        }
      }
    } catch (err) {
      console.error("fetchDetail:", err);
    } finally {
      setLoading(false);
    }
  }, [token, attemptId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // ===============================
  // SAVE ESSAY SCORE PER QUESTION
  // ===============================
  async function saveEssayScore(questionId: number, score: string) {
    if (!token) return;

    setSavingEssay(questionId);

    try {
      await fetch(`http://localhost:4000/api/admin/attempts/${attemptId}/essay-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId,
          score: Number(score),
        }),
      });

      fetchDetail();
    } catch (err) {
      console.error("saveEssayScore:", err);
    } finally {
      setSavingEssay(null);
    }
  }

  // ===============================
  // SUBMIT TOTAL MANUAL SCORE (optional)
  // ===============================
  async function submitManualScore() {
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:4000/api/admin/attempts/${attemptId}/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          manualScore: Number(manualScore),
        }),
      });

      if (!res.ok) throw new Error();

      alert("Manual score saved");
      fetchDetail();
    } catch {
      alert("Gagal menyimpan manual score");
    }
  }

  // ===============================
  // OVERRIDE STATUS
  // ===============================
  async function updatePassStatus() {
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:4000/api/admin/attempts/${attemptId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: statusOverride,
        }),
      });

      if (!res.ok) throw new Error();

      alert("Status updated");
      fetchDetail();
    } catch {
      alert("Gagal update status");
    }
  }

  if (loading) return <p className="p-6">Loading...</p>;
  if (!attempt) return <p className="p-6 text-red-600">Attempt tidak ditemukan</p>;

  // ===============================
  // UI
  // ===============================
  return (
    <div className="p-8 space-y-6 text-black max-w-4xl">
      {/* ===== BACK BUTTON ===== */}
      <button onClick={() => router.push("/admin/dashboard")} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition">
        <ArrowLeft className="w-5 h-5" />
        Kembali ke Dashboard
      </button>

      <h1 className="text-2xl font-bold">Review Attempt #{attempt.id}</h1>

      {/* ===== DETAIL ===== */}
      <div className="p-4 border rounded-lg bg-white shadow space-y-1">
        <p>
          <b>Peserta:</b> {attempt.user?.name}
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

      {/* ===== ANSWERS & ESSAY SCORING ===== */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Jawaban Peserta</h2>

        {questions.length === 0 && <p className="text-gray-500 italic">Tidak ada soal ditemukan</p>}

        {questions.map((q: any, index: number) => {
          const isEssay = q.questionType === "ESSAY";
          const currentInput = essayInputs[q.id] ?? "";
          const savedScore = essayScores[q.id];
          const hasUnsavedChanges = currentInput !== String(savedScore ?? "");
          const studentAnswer = answers[q.id] || answers[String(q.id)];

          return (
            <div key={q.id} className={`p-4 border rounded-lg space-y-2 ${isEssay ? "bg-yellow-50 border-yellow-200" : "bg-gray-50"}`}>
              <div className="flex justify-between items-start">
                <p className="font-medium">
                  <span className="text-gray-500 mr-2">{index + 1}.</span>
                  {q.text}
                </p>
                <span className={`text-xs px-2 py-1 rounded ${isEssay ? "bg-yellow-200 text-yellow-800" : "bg-blue-100 text-blue-800"}`}>{isEssay ? "Essay" : q.questionType || "Pilihan Ganda"}</span>
              </div>

              {/* Tampilkan opsi jika ada (untuk pilihan ganda) */}
              {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                <div className="text-sm text-gray-600 pl-4 space-y-1">
                  {q.options.map((opt: string, i: number) => (
                    <p key={i} className={studentAnswer === opt ? "font-semibold text-blue-700" : ""}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </p>
                  ))}
                </div>
              )}

              <div className="bg-white p-3 rounded border">
                <p className="text-sm font-medium mb-1">Jawaban Mahasiswa:</p>
                {studentAnswer ? (
                  <p className={`text-sm whitespace-pre-wrap ${!isEssay && q.answer && studentAnswer === q.answer ? "text-green-700" : !isEssay && q.answer && studentAnswer !== q.answer ? "text-red-700" : "text-gray-800"}`}>
                    {studentAnswer}
                    {!isEssay && q.answer && <span className="ml-2">{studentAnswer === q.answer ? "✓" : "✗"}</span>}
                  </p>
                ) : (
                  <p className="text-gray-400 italic text-sm">Tidak dijawab</p>
                )}
              </div>

              {/* Kunci jawaban untuk soal non-essay */}
              {!isEssay && q.answer && (
                <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                  <b>Kunci Jawaban:</b> {q.answer}
                </p>
              )}

              {/* Form penilaian essay */}
              {isEssay && (
                <div className="flex items-center gap-3 pt-2 border-t mt-2 flex-wrap">
                  <label className="text-sm font-medium">Nilai Essay:</label>
                  <input
                    type="number"
                    min={0}
                    max={q.autoScore || 100}
                    className="border p-2 rounded w-24 text-center"
                    placeholder="0"
                    value={currentInput}
                    onChange={(e) =>
                      setEssayInputs((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                  />
                  <span className="text-sm text-gray-500">/ {q.autoScore || 100} poin</span>

                  <button
                    onClick={() => saveEssayScore(q.id, currentInput)}
                    disabled={savingEssay === q.id || !currentInput}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                      savingEssay === q.id ? "bg-gray-300 text-gray-500 cursor-not-allowed" : hasUnsavedChanges ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {savingEssay === q.id ? "Menyimpan..." : "Simpan Nilai"}
                  </button>

                  {savedScore !== undefined && !hasUnsavedChanges && <span className="text-sm text-green-600 flex items-center gap-1">✓ Tersimpan</span>}
                  {hasUnsavedChanges && savedScore !== undefined && <span className="text-sm text-orange-500">• Ada perubahan belum disimpan</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== ESSAY SCORING SUMMARY ===== */}
      {(() => {
        const essayQuestions = questions.filter((q: any) => q.questionType === "ESSAY") || [];

        if (essayQuestions.length === 0) return null;

        const gradedCount = essayQuestions.filter((q: any) => essayScores[q.id] !== undefined).length;
        const totalEssayPoints = essayQuestions.reduce((sum: number, q: any) => sum + (q.autoScore || 100), 0);
        const earnedPoints = Object.values(essayScores).reduce((sum: number, score: any) => sum + Number(score || 0), 0);

        return (
          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200 shadow space-y-2">
            <h2 className="font-semibold text-blue-800">Ringkasan Penilaian Essay</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Jumlah Soal Essay:</span> <span className="font-medium">{essayQuestions.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Sudah Dinilai:</span>{" "}
                <span className={`font-medium ${gradedCount === essayQuestions.length ? "text-green-600" : "text-orange-500"}`}>
                  {gradedCount} / {essayQuestions.length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Poin Essay:</span>{" "}
                <span className="font-medium">
                  {earnedPoints} / {totalEssayPoints}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>{" "}
                {gradedCount === essayQuestions.length ? <span className="text-green-600 font-medium">✓ Semua essay sudah dinilai</span> : <span className="text-orange-500 font-medium">⏳ Perlu penilaian</span>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== OPTIONAL MANUAL SCORE OVERRIDE ===== */}
      {attempt.test.type === "COLLEGE_READINESS" && (
        <div className="p-4 border rounded-lg bg-white shadow space-y-3">
          <h2 className="font-semibold">Manual Score (Override)</h2>

          <input type="number" value={manualScore} onChange={(e) => setManualScore(e.target.value)} className="border p-2 rounded w-40" placeholder="Total manual" />

          <button onClick={submitManualScore} className="px-4 py-2 bg-blue-600 text-white rounded">
            Simpan Manual Score
          </button>
        </div>
      )}

      {/* ===== STATUS OVERRIDE ===== */}
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
