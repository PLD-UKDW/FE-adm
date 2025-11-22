"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Question = { id: number; text: string; options: any; answer?: string; questionType?: string };
type Test = { id: number; title: string; type: string; description?: string; questions?: Question[] };

export default function TestDetail() {
  const params = useParams();
  const testId = params?.testId;
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // form
  const [text, setText] = useState("");
  const [questionType, setQuestionType] = useState("MULTIPLE_CHOICE");
  const [options, setOptions] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!testId) return;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/admin/tests/${testId}`);
        if (!res.ok) throw new Error(await safeText(res));
        const data = await res.json();
        // controller returns test with included questions
        setTest(data);
        setQuestions(Array.isArray(data.questions) ? data.questions : (data.questions ?? []));
      } catch (err) {
        console.error("load test error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [testId, API]);

  async function addQuestion() {
    if (!testId || !text.trim()) return alert("Teks pertanyaan diperlukan.");
    setSubmitting(true);
    try {
      const body = {
        text,
        questionType,
        options: options ? options.split("|").map(s => s.trim()) : [],
        answer: answer || null
      };
      const res = await fetch(`${API}/api/admin/tests/${testId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await safeText(res));
      const created = await res.json();
      setQuestions(prev => [...prev, created]);
      setText(""); setOptions(""); setAnswer("");
    } catch (err) {
      console.error("addQuestion error:", err);
      alert("Gagal menambahkan soal. Cek console.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteQuestion(questionId: number) {
    if (!confirm("Hapus soal ini?")) return;
    try {
      const res = await fetch(`${API}/api/admin/questions/${questionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await safeText(res));
      setQuestions(qs => qs.filter(q => q.id !== questionId));
    } catch (err) {
      console.error("deleteQuestion error:", err);
      alert("Gagal menghapus soal. Cek console.");
    }
  }

  if (loading) return <div className="p-6">Loading test...</div>;
  if (!test) return <div className="p-6">Test tidak ditemukan.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">{test.title}</h1>
      <p className="text-gray-600 mb-4">{test.description ?? test.type}</p>

      <h2 className="font-semibold mb-2">List Soal</h2>
      {questions.length === 0 && <p className="text-gray-500 mb-4">Belum ada soal.</p>}
      <div className="space-y-3 mb-6">
        {questions.map(q => (
          <div key={q.id} className="p-3 border rounded">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{q.text}</p>
                {Array.isArray(q.options) && q.options.length > 0 && (
                  <ul className="list-disc ml-5 text-sm mt-2">
                    {q.options.map((o: any, i: number) => <li key={i}>{String(o)}</li>)}
                  </ul>
                )}
                <p className="text-sm text-green-600 mt-2">Jawaban: {q.answer ?? "-"}</p>
              </div>
              <div>
                <button className="text-red-600" onClick={() => deleteQuestion(q.id)}>Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border rounded">
        <h3 className="font-semibold mb-3">Tambah Soal</h3>
        <input className="border p-2 w-full mb-2" placeholder="Teks pertanyaan" value={text} onChange={e => setText(e.target.value)} />
        <select className="border p-2 w-full mb-2" value={questionType} onChange={e => setQuestionType(e.target.value)}>
          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
          <option value="ESSAY">Essay</option>
          <option value="TRUE_FALSE">True/False</option>
        </select>
        <input className="border p-2 w-full mb-2" placeholder="Options dipisah dengan | (opsi1|opsi2)" value={options} onChange={e => setOptions(e.target.value)} />
        <input className="border p-2 w-full mb-3" placeholder="Jawaban (kosong jika essay)" value={answer} onChange={e => setAnswer(e.target.value)} />

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={addQuestion} disabled={submitting}>
          {submitting ? "Menyimpan..." : "Tambah Soal"}
        </button>
      </div>
    </div>
  );
}

async function safeText(res: Response) {
  try { return await res.text(); } catch { return `HTTP ${res.status}`; }
}
