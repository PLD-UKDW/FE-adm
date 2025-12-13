// File: src/app/admin/scoring/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api"; // pastikan ini ada (axios instance dengan Authorization)
import { format } from "date-fns";

type Attempt = {
  id: number;
  userId: number;
  testId: number;
  answers: Record<string, any>;
  autoScore?: number | null;
  manualScore?: number | null;
  finalScore?: number | null;
  passStatus?: string | null;
  completedAt?: string | null;
  gradedAt?: string | null;
  user?: { id: number; name: string; registrationNumber?: string };
  test?: { id: number; title: string; type: string };
};

type Question = {
  id: number;
  text: string;
  options: any;
  answer?: string | null;
  questionType?: string;
  autoScore?: number;
};

export default function AdminScoringPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [manualScoreInput, setManualScoreInput] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [pollToggle, setPollToggle] = useState(0);
  const params = useSearchParams();
  const attemptIdFromURL = params.get("id");
  const testIdFromURL = params.get("test");

  // Fetch attempts
  // const fetchAttempts = useCallback(async () => {
  //   try {
  //     const res = await api.get("/admin/attempts");
  //     setAttempts(res.data || []);
  //   } catch (err) {
  //     console.error("fetchAttempts:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);
  const fetchAttempts = useCallback(async () => {
    try {
      const url = params.get("test") ? `/admin/attempts?testId=${params.get("test")}` : "/admin/attempts";

      const res = await api.get(url);
      setAttempts(res.data || []);
    } catch (err) {
      console.error("fetchAttempts:", err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchAttempts();
    // polling every 5s for simple realtime
    const interval = setInterval(() => setPollToggle((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, [fetchAttempts]);

  useEffect(() => {
    if (attemptIdFromURL) {
      openAttempt(Number(attemptIdFromURL));
    }
  }, [attemptIdFromURL]);

  // refetch on toggle
  useEffect(() => {
    fetchAttempts();
  }, [pollToggle, fetchAttempts]);

  // Open attempt detail: fetch attempt detail + test questions
  async function openAttempt(attemptId: number) {
    try {
      const res = await api.get(`/admin/attempts/${attemptId}`);
      const attempt: Attempt = res.data.attempt || res.data;
      setSelected(attempt);

      // get test with questions
      const testId = attempt.test?.id || attempt.testId;
      if (testId) {
        const t = await api.get(`/admin/tests/${testId}`);
        setQuestions(t.data.questions || []);
      } else {
        setQuestions([]);
      }

      // Pre-fill manual score input
      setManualScoreInput(attempt.manualScore !== null && attempt.manualScore !== undefined ? String(attempt.manualScore) : "");
    } catch (err) {
      console.error("openAttempt:", err);
    }
  }

  function closeDetail() {
    setSelected(null);
    setQuestions([]);
    setManualScoreInput("");
  }

  // Apply manual score
  async function applyManualScore() {
    if (!selected) return;
    setSaving(true);
    try {
      const manualScore = Number(manualScoreInput || 0);
      const res = await api.post(`/admin/attempts/${selected.id}/score`, { manualScore });
      // response includes updated attempt
      console.log("score res:", res.data);
      await fetchAttempts();
      // reopen detail to refresh
      await openAttempt(selected.id);
      alert("Manual score applied.");
    } catch (err: any) {
      console.error("applyManualScore:", err);
      alert(err?.response?.data?.message || "Gagal mengupdate skor");
    } finally {
      setSaving(false);
    }
  }

  // Override pass/fail
  async function setPassStatus(status: "PASS" | "FAIL") {
    if (!selected) return;
    try {
      await api.post(`/admin/attempts/${selected.id}/status`, { status });
      await fetchAttempts();
      await openAttempt(selected.id);
      alert("Status updated.");
    } catch (err) {
      console.error("setPassStatus:", err);
      alert("Gagal update status");
    }
  }

  // helper: render answer (maps key to option text if possible)
  function renderAnswer(answer: any, q?: Question) {
    // for multiple choice, attempt.answers likely stores "a"/"b" etc
    if (!q) return String(answer);
    if (q.questionType === "MULTIPLE_CHOICE") {
      // q.options might be JSON array
      const opts: string[] = Array.isArray(q.options) ? q.options : typeof q.options === "string" ? JSON.parse(q.options) : [];
      const keyToIndex = { a: 0, b: 1, c: 2, d: 3, e: 4 };
      if (typeof answer === "string") {
        const key = answer.toLowerCase() as keyof typeof keyToIndex;
        const idx = keyToIndex[key];
        if (idx !== undefined && opts[idx]) return `${answer.toLowerCase()}. ${opts[idx]}`;
      }
      // maybe answer is index or full text
      if (typeof answer === "number") {
        return opts[answer] ?? String(answer);
      }
      return String(answer);
    }
    // essay
    return String(answer);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto text-black">
      <h1 className="text-3xl font-bold mb-6">Admin — Scoring & Grading</h1>

      <div className="mb-4 flex gap-3 items-center">
        <button onClick={fetchAttempts} className="px-3 py-1 bg-blue-600 text-white rounded">
          Refresh
        </button>
        <div className="text-sm text-gray-600">Polling every 5s (auto refresh)</div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Test</th>
              <th className="p-3 text-left">Auto</th>
              <th className="p-3 text-left">Manual</th>
              <th className="p-3 text-left">Final</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Completed</th>
              <th className="p-3 text-left">Graded At</th>
              <th className="p-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : attempts.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-4 text-center">
                  Tidak ada attempt.
                </td>
              </tr>
            ) : (
              attempts.map((a, idx) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 align-top">{idx + 1}</td>
                  <td className="p-3">
                    <div className="font-medium">{a.user?.name ?? "—"}</div>
                    <div className="text-sm text-gray-500">{a.user?.registrationNumber ?? `id:${a.userId}`}</div>
                  </td>
                  <td className="p-3">
                    <div>{a.test?.title ?? `Test #${a.testId}`}</div>
                    <div className="text-sm text-gray-500">{a.test?.type}</div>
                  </td>
                  <td className="p-3">{a.autoScore ?? "-"}</td>
                  <td className="p-3">{a.manualScore ?? "-"}</td>
                  <td className="p-3">{a.finalScore ?? "-"}</td>
                  <td className="p-3">
                    <span className={a.passStatus === "PASS" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{a.passStatus ?? "PENDING"}</span>
                  </td>
                  <td className="p-3">{a.completedAt ? format(new Date(a.completedAt), "yyyy-MM-dd HH:mm") : "-"}</td>
                  <td className="p-3">{a.gradedAt ? format(new Date(a.gradedAt), "yyyy-MM-dd HH:mm") : "-"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => openAttempt(a.id)} className="px-2 py-1 bg-indigo-600 text-white rounded">
                        Lihat
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full md:w-3/4 max-h-[90vh] overflow-y-auto rounded-xl p-6 relative">
            <button onClick={closeDetail} className="absolute top-4 right-4 text-gray-600">
              ✕
            </button>

            <h2 className="text-2xl font-semibold mb-2">
              Attempt #{selected.id} — {selected.user?.name}
            </h2>
            <div className="text-sm text-gray-600 mb-4">
              Test: {selected.test?.title ?? selected.testId} — {selected.test?.type}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 border rounded">
                <div className="text-sm text-gray-500">Auto Score</div>
                <div className="text-xl font-bold">{selected.autoScore ?? "-"}</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-gray-500">Manual Score</div>
                <div className="text-xl font-bold">{selected.manualScore ?? "-"}</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-gray-500">Final Score</div>
                <div className="text-xl font-bold">{selected.finalScore ?? "-"}</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-gray-500">Status</div>
                <div className="text-xl font-bold">{selected.passStatus ?? "PENDING"}</div>
              </div>
            </div>

            {/* Jawaban & Soal */}
            <h3 className="text-lg font-semibold mb-2">Rincian Soal & Jawaban</h3>

            <div className="space-y-3">
              {questions.length === 0
                ? // fallback: show answers raw
                  Object.entries(selected.answers || {}).map(([qId, ans]) => (
                    <div key={qId} className="border rounded p-3">
                      <div className="text-sm text-gray-500">Soal ID: {qId}</div>
                      <div className="mt-1">
                        <strong>Jawaban:</strong> {String(ans)}
                      </div>
                    </div>
                  ))
                : questions.map((q) => {
                    const ans = (selected.answers || {})[String(q.id)];
                    return (
                      <div key={q.id} className="border rounded p-3">
                        <div className="text-sm text-gray-500">
                          Soal ID: {q.id} • {q.questionType}
                        </div>
                        <div className="mt-2 font-medium">{q.text}</div>

                        {q.questionType === "MULTIPLE_CHOICE" && Array.isArray(q.options) && (
                          <ul className="mt-2 list-decimal ml-4">
                            {q.options.map((opt: any, i: number) => (
                              <li key={i} className={q.answer && q.answer.toLowerCase() === ["a", "b", "c", "d", "e"][i] ? "font-semibold" : ""}>
                                {opt}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-2">
                          <strong>Jawaban Siswa:</strong> {renderAnswer(ans, q)}
                        </div>

                        <div className="mt-1 text-sm text-gray-500">Skor Soal (auto): {q.autoScore ?? "-"}</div>
                      </div>
                    );
                  })}
            </div>

            {/* Manual scoring controls */}
            <div className="mt-6 border-t pt-4 flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Manual Score</label>
                <input type="number" value={manualScoreInput} onChange={(e) => setManualScoreInput(e.target.value)} className="w-full border rounded p-2" placeholder="Masukkan skor manual (mis. 30)" />
                <div className="text-xs text-gray-500 mt-1">Final skor akan dihitung sebagai autoScore + manualScore (backend)</div>
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={applyManualScore} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">
                  {saving ? "Menyimpan..." : "Apply Manual Score"}
                </button>

                <div className="flex gap-2">
                  <button onClick={() => setPassStatus("PASS")} className="px-3 py-2 bg-blue-600 text-white rounded">
                    Set PASS
                  </button>
                  <button onClick={() => setPassStatus("FAIL")} className="px-3 py-2 bg-red-600 text-white rounded">
                    Set FAIL
                  </button>
                </div>npx prisma generate

              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeDetail} className="px-4 py-2 border rounded">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

