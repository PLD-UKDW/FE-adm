"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useParams } from "next/navigation";

export default function TestDetailPage() {
  const params = useParams();
  const id = params.id;

  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Form state
  const [text, setText] = useState("");
  const [questionType, setQuestionType] = useState("MULTIPLE_CHOICE");
  const [options, setOptions] = useState<string[]>([""]);
  const [answer, setAnswer] = useState("");

  async function fetchTest() {
    try {
      const res = await api.get(`/admin/tests/${id}`);
      setTest(res.data);
    } catch (err) {
      console.error("Fetch detail test error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTest();
  }, []);

  // =======================
  // ADD QUESTION
  // =======================
  async function handleAddQuestion() {
    setAdding(true);
    try {
      await api.post(`/admin/tests/${id}/questions`, {
        text,
        questionType,
        options: JSON.stringify(options),
        answer: questionType === "MULTIPLE_CHOICE" ? answer : null,
      });

      setText("");
      setOptions([""]);
      setAnswer("");
      setQuestionType("MULTIPLE_CHOICE");

      await fetchTest();
    } catch (err) {
      console.error("Add question error:", err);
    } finally {
      setAdding(false);
    }
  }

  // =======================
  // DELETE SINGLE QUESTION
  // =======================
  async function deleteQuestion(qid: number) {
    await api.delete(`/admin/questions/${qid}`);
    await fetchTest();
  }

  // =======================
  // DELETE ALL QUESTION
  // =======================
  async function deleteAll() {
    if (confirm("Yakin ingin menghapus semua soal?")) {
      await api.delete(`/admin/tests/${id}/questions`);
      await fetchTest();
    }
  }

  if (loading) return <p className="p-6">Loading...</p>;
  if (!test) return <p className="p-6 text-red-600">Test tidak ditemukan.</p>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Detail Test</h1>

      {/* ============================
          TEST INFO
      ============================= */}
      <div className="p-6 border rounded-lg bg-gray-50">
        <h2 className="text-2xl font-semibold">{test.title}</h2>
        <p className="text-gray-700">{test.description}</p>
        <p className="mt-2">
          <span className="font-semibold">Type:</span> {test.type}
        </p>
      </div>

      {/* ============================
          ADD QUESTION FORM
      ============================= */}
      <div className="p-6 border rounded-lg bg-white space-y-4">
        <h2 className="text-xl font-semibold">Tambah Soal</h2>

        <div className="space-y-2">
          <label className="font-medium">Teks Soal</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full border p-2 rounded" rows={3}></textarea>
        </div>

        <div className="space-y-2">
          <label className="font-medium">Tipe Soal</label>
          <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="border p-2 rounded">
            <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
            <option value="ESSAY">Essay</option>
          </select>
        </div>

        {/* Multiple Choice options */}
        {questionType === "MULTIPLE_CHOICE" && (
          <div className="space-y-3">
            <label className="font-medium">Pilihan Jawaban</label>

            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={opt}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[idx] = e.target.value;
                    setOptions(updated);
                  }}
                  className="border p-2 rounded w-full"
                  placeholder={`Pilihan ${idx + 1}`}
                />

                <button
                  onClick={() => {
                    setOptions(options.filter((_, i) => i !== idx));
                  }}
                  className="px-2 bg-red-500 text-white rounded"
                >
                  X
                </button>
              </div>
            ))}

            <button onClick={() => setOptions([...options, ""])} className="px-3 py-1 bg-gray-300 rounded">
              + Tambah Pilihan
            </button>

            <div>
              <label className="font-medium">Jawaban Benar</label>
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="border p-2 rounded w-full" placeholder="Isi jawaban yang benar" />
            </div>
          </div>
        )}

        <button onClick={handleAddQuestion} disabled={adding} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow">
          {adding ? "Menambahkan..." : "Tambah Soal"}
        </button>
      </div>

      {/* ============================
          QUESTION LIST
      ============================= */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Daftar Soal</h2>

          <button onClick={deleteAll} className="px-4 py-2 bg-red-600 text-white rounded">
            Hapus Semua Soal
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Soal</th>
                <th className="p-3 text-left">Tipe</th>
                <th className="p-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {test.questions?.map((q: any) => (
                <tr key={q.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{q.id}</td>
                  <td className="p-3">{q.text}</td>
                  <td className="p-3">{q.questionType}</td>
                  <td className="p-3">
                    <button onClick={() => deleteQuestion(q.id)} className="text-red-600 underline">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}

              {test.questions?.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    Tidak ada soal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
