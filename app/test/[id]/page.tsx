"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DoTestPage() {
  const { id } = useParams();
  const router = useRouter();

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/test/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          return router.push("/login");
        }

        const data = await res.json();

        setTest(data);
        setQuestions(data.questions || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);
  if (loading) return <p className="p-6">Memuat soal...</p>;
  if (!test) return <p className="p-6">Test tidak ditemukan.</p>;

  const q = questions[current];

  const handleChoose = (v: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: v }));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    setSubmitting(true);

    try {
      const res = await fetch(`http://localhost:4000/api/test/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      const result = await res.json();
      console.log("Submit result:", result);

      // ==========================================
      // ⬇⬇ PERBAIKAN: ambil attemptId
      // ==========================================
      const attemptId = result.attempt?.id;
      if (!attemptId) {
        console.error("No attemptId returned");
        return;
      }

      // Redirect ke halaman result dengan attemptId
      router.push(`/test/${id}/result?attemptId=${attemptId}`);
    } catch (e) {
      console.error("Submit error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 text-black">
      <h1 className="text-3xl font-bold mb-2">{test.title}</h1>
      <p className="text-gray-500 mb-6">{test.description}</p>

      <div className="border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          Soal {current + 1} dari {questions.length}
        </h2>

        {/* TEXT SOAL */}
        <p className="text-lg mb-4">{q.text}</p>

        {/* MULTIPLE CHOICE */}
        {q.questionType === "MULTIPLE_CHOICE" && (
          <div className="space-y-3">
            {/* {q.options.map((opt: string, i: number) => (
              <label key={i} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${answers[q.id] === opt ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}>
                <input type="radio" name={String(q.id)} checked={answers[q.id] === opt} onChange={() => handleChoose(opt)} />
                {opt}
              </label>
            ))} */}
            {q.options.map((opt: string, i: number) => {
              const key = ["a", "b", "c", "d"][i];

              return (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer 
      ${answers[q.id] === key ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
                >
                  <input type="radio" name={String(q.id)} checked={answers[q.id] === key} onChange={() => handleChoose(key)} />
                  {opt}
                </label>
              );
            })}
          </div>
        )}

        {/* ESSAY */}
        {q.questionType === "ESSAY" && <textarea className="w-full border rounded-lg p-3" rows={6} value={answers[q.id] ?? ""} onChange={(e) => handleChoose(e.target.value)} />}
      </div>

      {/* Navigasi Soal */}
      <div className="flex justify-between mt-6">
        <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="px-4 py-2 border rounded-lg disabled:opacity-40">
          ← Sebelumnya
        </button>

        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Selanjutnya →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded-lg">
            {submitting ? "Mengirim..." : "Kirim Jawaban"}
          </button>
        )}
      </div>
    </div>
  );
}
