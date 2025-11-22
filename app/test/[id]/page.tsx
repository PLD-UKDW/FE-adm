"use client";

import React, { useEffect, useState } from "react";

export default function CamabaTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitMessage, setSubmitMessage] = useState("");

  // Load test
  useEffect(() => {
    async function loadTest() {
      try {
        const res = await fetch(`http://localhost:4000/api/public/tests/${id}`);

        if (!res.ok) {
          throw new Error("Gagal memuat test");
        }

        const data = await res.json();
        setTest(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTest();
  }, [id]);

  // Handle pilih jawaban
  const handleSelect = (questionId: number, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  // Submit jawaban
  const handleSubmit = async () => {
    setSubmitMessage("");

    try {
      const res = await fetch(`http://localhost:4000/api/test/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"), // WAJIB
        },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitMessage(data.message || "Gagal submit");
        return;
      }

      setSubmitMessage("Berhasil submit! Nilai: " + data.score);
    } catch (err: any) {
      setSubmitMessage("Terjadi error saat submit");
    }
  };

  if (loading) return <p className="p-6">Loading soal...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!test) return <p className="p-6">Test tidak ditemukan</p>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{test.title}</h1>
      <p className="text-gray-500 mb-6">{test.description}</p>

      <div className="space-y-6">
        {test.questions.map((q: any, idx: number) => (
          <div key={q.id} className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-semibold mb-2">
              {idx + 1}. {q.text}
            </h3>

            {q.options.map((op: string, i: number) => (
              <label key={i} className="flex items-center gap-2 mb-1">
                <input type="radio" name={`q-${q.id}`} value={op} checked={answers[q.id] === op} onChange={() => handleSelect(q.id, op)} />
                {op}
              </label>
            ))}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        Submit Jawaban
      </button>

      {submitMessage && <p className="mt-4 font-medium text-green-600">{submitMessage}</p>}
    </div>
  );
}
