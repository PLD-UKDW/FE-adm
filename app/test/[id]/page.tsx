"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/* =====================================================
   DO TEST PAGE – SCREEN READER FIRST
===================================================== */

export default function DoTestPage() {
  const { id } = useParams();
  const router = useRouter();

  /* ==========================
     DATA STATE
  ========================== */
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ==========================
     ACCESSIBILITY
  ========================== */
  const [useTTS, setUseTTS] = useState(true);
  const [optionIndex, setOptionIndex] = useState(0);

  /* =====================================================
     🔊 SPEECH ENGINE
  ===================================================== */
  const speakQueue = (texts: string[]) => {
    if (!useTTS) return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    texts.forEach((text) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "id-ID";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    });
  };

  /* ==========================
     FETCH TEST
  ========================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setUseTTS(localStorage.getItem("accessMode") !== "no-tts");

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    fetch(`${API_URL}/test/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setTest(data);
        setQuestions(data.questions || []);
      })
      .catch((err) => {
        console.error("Gagal mengambil data tes:", err);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  /* =====================================================
     INTRO + SOAL PERTAMA
  ===================================================== */
  useEffect(() => {
    if (loading || !test || !questions.length || !useTTS) return;

    speakQueue([
      `Anda sedang mengerjakan ${test.title}.`,
      test.description,
      `Terdapat ${questions.length} soal.`,
      "Gunakan panah kiri dan kanan untuk berpindah soal.",
      "Gunakan panah atas dan bawah untuk memilih jawaban.",
      "Tekan spasi atau enter untuk memilih.",
    ]);

    readQuestion(0);
  }, [loading, test, questions, useTTS]);

  /* =====================================================
     READ QUESTION
  ===================================================== */
  const readQuestion = (index: number) => {
    const q = questions[index];
    if (!q) return;

    const queue: string[] = [`Soal ${index + 1}.`, q.text];

    if (q.questionType === "MULTIPLE_CHOICE") {
      q.options.forEach((opt: string, i: number) => {
        const label = ["A", "B", "C", "D"][i];
        queue.push(`Pilihan ${label}. ${opt}`);
      });

      queue.push("Gunakan panah atas dan bawah untuk memilih jawaban.");
    } else {
      queue.push("Soal esai. Silakan ketik jawaban Anda.");
    }

    speakQueue(queue);
  };

  /* =====================================================
     KEYBOARD NAVIGATION (TTS MODE)
  ===================================================== */
  useEffect(() => {
    if (!useTTS || !questions.length) return;

    const handler = (e: KeyboardEvent) => {
      const q = questions[current];

      // PINDAH SOAL
      if (e.code === "ArrowRight" && current < questions.length - 1) {
        e.preventDefault();
        setCurrent((c) => {
          const next = c + 1;
          setOptionIndex(0);
          readQuestion(next);
          return next;
        });
      }

      if (e.code === "ArrowLeft" && current > 0) {
        e.preventDefault();
        setCurrent((c) => {
          const prev = c - 1;
          setOptionIndex(0);
          readQuestion(prev);
          return prev;
        });
      }

      // MULTIPLE CHOICE
      if (q.questionType === "MULTIPLE_CHOICE") {
        if (e.code === "ArrowDown" || e.code === "ArrowUp") {
          e.preventDefault();

          setOptionIndex((prev) => {
            const next = e.code === "ArrowDown" ? (prev + 1) % q.options.length : (prev - 1 + q.options.length) % q.options.length;

            speakQueue([`Pilihan ${["A", "B", "C", "D"][next]}.`, q.options[next]]);

            return next;
          });
        }

        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();

          const key = ["a", "b", "c", "d"][optionIndex];
          setAnswers((prev) => ({ ...prev, [q.id]: key }));

          speakQueue(["Jawaban dipilih.", `Pilihan ${["A", "B", "C", "D"][optionIndex]}.`]);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [useTTS, questions, current, optionIndex]);

  /* ==========================
     SUBMIT
  ========================== */
const handleSubmit = async () => {
  const token = localStorage.getItem("token");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  setSubmitting(true);

  try {
    const res = await fetch(`${API_URL}/test/${id}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json();
    const attemptId = result.attempt?.id;
    if (!attemptId) return;

    speakQueue(["Jawaban berhasil dikirim. Membuka hasil tes."]);

    setTimeout(() => {
      router.push(`/test/${id}/result?attemptId=${attemptId}`);
    }, 800);
  } catch (err) {
    console.error("Gagal submit jawaban:", err);
  } finally {
    setSubmitting(false);
  }
};


  /* ==========================
     UI
  ========================== */
  if (loading) return <p className="p-6">Memuat soal...</p>;
  if (!test) return <p className="p-6">Test tidak ditemukan.</p>;

  const q = questions[current];

  return (
    <div className="max-w-3xl mx-auto p-8 text-black">
      <h1 className="text-3xl font-bold mb-2">{test.title}</h1>
      <p className="text-gray-500 mb-6">{test.description}</p>

      <div className="border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          Soal {current + 1} dari {questions.length}
        </h2>

        <p className="text-lg mb-4">{q.text}</p>

        {q.questionType === "MULTIPLE_CHOICE" && (
          <div className="space-y-3">
            {q.options.map((opt: string, i: number) => {
              const key = ["a", "b", "c", "d"][i];

              return (
                <label key={i} className={`flex items-center gap-3 p-3 border rounded-lg ${answers[q.id] === key ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}>
                  <input type="radio" name={String(q.id)} checked={answers[q.id] === key} onChange={() => setAnswers((p) => ({ ...p, [q.id]: key }))} />
                  {opt}
                </label>
              );
            })}
          </div>
        )}

        {q.questionType === "ESSAY" && <textarea className="w-full border rounded-lg p-3" rows={6} value={answers[q.id] ?? ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))} />}
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="px-4 py-2 border rounded-lg">
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
