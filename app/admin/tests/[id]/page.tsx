"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function TestDetailPage() {
  const params = useParams();
  const id = params.id;

  const [token, setToken] = useState<string | null>(null);
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Form state
  const [text, setText] = useState("");
  const [questionType, setQuestionType] = useState("MULTIPLE_CHOICE");
  const [options, setOptions] = useState<string[]>([""]);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]); // untuk CHECKBOX (multi-select)
  const [autoScore, setAutoScore] = useState<string>("");

  // =======================
  // EDIT FORM STATE
  // =======================
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editType, setEditType] = useState("MULTIPLE_CHOICE");
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editAnswer, setEditAnswer] = useState("");
  const [editAnswers, setEditAnswers] = useState<string[]>([]); // untuk CHECKBOX edit
  const [editScore, setEditScore] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const fetchTest = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await api.get(`/api/admin/tests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTest(res.data);
    } catch (err: any) {
      console.error("Fetch detail test error:", err.response?.status, err.response?.data);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchTest();
  }, [fetchTest]);

  function openEditModal(q: any) {
    setEditId(q.id);
    setEditText(q.text);
    setEditType(q.questionType);
    setEditOptions(Array.isArray(q.options) ? q.options : []);
    setEditAnswer(q.answer || "");
    setEditAnswers(Array.isArray(q.answers) ? q.answers : []);
    setEditScore(String(q.autoScore || ""));
    setEditing(true);
  }

  // =======================
  // ADD QUESTION
  // =======================

  async function handleUpdateQuestion() {
    if (!token) return;
    try {
      const isChoice = editType === "MULTIPLE_CHOICE" || editType === "CHECKBOX";
      await api.put(
        `/api/admin/questions/${editId}`,
        {
          text: editText,
          questionType: editType,
          options: isChoice ? editOptions : [],
          answer: editType === "MULTIPLE_CHOICE" ? editAnswer : null,
          answers: editType === "CHECKBOX" ? editAnswers : [],
          autoScore: isChoice ? Number(editScore || 1) : 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setEditing(false);
      await fetchTest();
    } catch (err: any) {
      console.error("Update question error:", err.response?.status, err.response?.data);
    }
  }

  async function handleAddQuestion() {
    if (!token) return;
    setAdding(true);
    try {
      const isChoice = questionType === "MULTIPLE_CHOICE" || questionType === "CHECKBOX";
      await api.post(
        `/api/admin/tests/${id}/questions`,
        {
          text,
          questionType,
          options: isChoice ? options : [],
          answer: questionType === "MULTIPLE_CHOICE" ? answer : null,
          answers: questionType === "CHECKBOX" ? answers : [],
          autoScore: isChoice ? Number(autoScore || 1) : 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // reset form
      setText("");
      setOptions([""]);
      setAnswer("");
      setAnswers([]);
      setAutoScore("");
      setQuestionType("MULTIPLE_CHOICE");

      await fetchTest();
    } catch (err: any) {
      console.error("Add question error:", err.response?.status, err.response?.data);
    } finally {
      setAdding(false);
    }
  }

  // =======================
  // DELETE SINGLE QUESTION
  // =======================
  async function deleteQuestion(qid: number) {
    if (!token) return;
    try {
      await api.delete(`/api/admin/questions/${qid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchTest();
    } catch (err: any) {
      console.error("Delete question error:", err.response?.status, err.response?.data);
    }
  }

  // =======================
  // DELETE ALL QUESTION
  // =======================
  async function deleteAll() {
    if (!token) return;
    if (!confirm("Yakin ingin menghapus semua soal?")) return;

    try {
      await api.delete(`/api/admin/tests/${id}/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchTest();
    } catch (err: any) {
      console.error("Delete all questions error:", err.response?.status, err.response?.data);
    }
  }

  if (loading) return <p className="p-6">Loading...</p>;
  if (!test) return <p className="p-6 text-red-600">Test tidak ditemukan.</p>;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 text-black">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <Link href="/admin/dashboard/input/pmjd" className="text-blue-600 hover:underline text-sm sm:text-base">
          ← Kembali
        </Link>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Detail Test</h1>
      </div>

      {/* ============================
          TEST INFO
      ============================= */}
      <div className="p-4 sm:p-6 border rounded-lg bg-gray-50">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">{test.title}</h2>
        <p className="text-sm sm:text-base text-gray-700">{test.description}</p>
        <p className="mt-2">
          <span className="font-semibold">Type:</span> {test.type}
        </p>
      </div>

      {/* ============================
          ADD QUESTION FORM
      ============================= */}
      <div className="p-4 sm:p-6 border rounded-lg bg-white space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold">Tambah Soal</h2>

        <div className="space-y-2">
          <label className="font-medium">Teks Soal</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full border p-2 rounded" rows={3}></textarea>
        </div>

        <div className="space-y-2">
          <label className="font-medium text-sm sm:text-base">Tipe Soal</label>
          <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="border p-2 rounded w-full sm:w-auto text-sm sm:text-base">
            <option value="MULTIPLE_CHOICE">Pilihan Ganda (Radio)</option>
            <option value="CHECKBOX">Pilihan Ganda (Checklist)</option>
            <option value="ESSAY">Essay</option>
          </select>
        </div>

        {/* Multiple Choice options */}
        {questionType === "MULTIPLE_CHOICE" && (
          <div className="space-y-3">
            {/* Tambah Skor Otomatis */}
            <div>
              <label className="font-medium">Skor </label>
              <input type="number" className="border p-2 rounded w-full" value={autoScore} onChange={(e) => setAutoScore(e.target.value)} placeholder="Contoh: 10" />
            </div>

            <label className="font-medium">Pilihan Jawaban</label>

            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {/* Radio Button */}
                <input
                  type="radio"
                  name="correctAnswer"
                  value={String.fromCharCode(97 + idx)} // 'a', 'b', 'c', 'd'
                  checked={answer === String.fromCharCode(97 + idx)}
                  onChange={() => setAnswer(String.fromCharCode(97 + idx))}
                />

                {/* Input Text */}
                <input
                  value={opt}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[idx] = e.target.value;
                    setOptions(updated);
                  }}
                  className="border p-2 rounded w-full"
                  placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                />

                {/* Button Hapus */}
                <button
                  onClick={() => {
                    const updated = options.filter((_, i) => i !== idx);
                    setOptions(updated);
                  }}
                  className="px-2 bg-red-500 text-white rounded"
                >
                  X
                </button>
              </div>
            ))}

            {/* Add Option */}
            <button onClick={() => setOptions([...options, ""])} className="px-3 py-1 bg-gray-300 rounded">
              + Tambah Pilihan
            </button>
          </div>
        )}

        {/* Checkbox options (multi-select) */}
        {questionType === "CHECKBOX" && (
          <div className="space-y-3">
            {/* Tambah Skor Otomatis */}
            <div>
              <label className="font-medium">Skor </label>
              <input type="number" className="border p-2 rounded w-full" value={autoScore} onChange={(e) => setAutoScore(e.target.value)} placeholder="Contoh: 10" />
            </div>

            <label className="font-medium">Pilihan Jawaban (centang jawaban yang benar)</label>

            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={answers.includes(String.fromCharCode(97 + idx))}
                  onChange={(e) => {
                    const key = String.fromCharCode(97 + idx);
                    if (e.target.checked) {
                      setAnswers([...answers, key]);
                    } else {
                      setAnswers(answers.filter((a) => a !== key));
                    }
                  }}
                />

                {/* Input Text */}
                <input
                  value={opt}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[idx] = e.target.value;
                    setOptions(updated);
                  }}
                  className="border p-2 rounded w-full"
                  placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                />

                {/* Button Hapus */}
                <button
                  onClick={() => {
                    const updated = options.filter((_, i) => i !== idx);
                    setOptions(updated);
                    // Remove from answers if deleted
                    const key = String.fromCharCode(97 + idx);
                    setAnswers(answers.filter((a) => a !== key));
                  }}
                  className="px-2 bg-red-500 text-white rounded"
                >
                  X
                </button>
              </div>
            ))}

            {/* Add Option */}
            <button onClick={() => setOptions([...options, ""])} className="px-3 py-1 bg-gray-300 rounded">
              + Tambah Pilihan
            </button>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold">Daftar Soal</h2>

          <button onClick={deleteAll} className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded text-sm sm:text-base">
            Hapus Semua Soal
          </button>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Soal</th>
                <th className="p-3 text-left">Tipe</th>
                <th className="p-3 text-left">Skor</th>
                <th className="p-3 text-left">Hapus</th>
              </tr>
            </thead>
            <tbody>
              {test.questions?.map((q: any, idx: number) => (
                <tr key={q.id} className="border-b hover:bg-gray-50">
                  {/* Nomor Soal */}
                  <td className="p-3">{idx + 1}</td>

                  {/* Soal */}
                  <td className="p-3">{q.text}</td>

                  {/* Tipe */}
                  <td className="p-3">{q.questionType}</td>

                  {/* Skor */}
                  <td className="p-3">{q.autoScore}</td>
                  <td className="p-3 space-x-3">
                    <button onClick={() => openEditModal(q)} className="text-blue-600 underline">
                      Edit
                    </button>

                    <button onClick={() => deleteQuestion(q.id)} className="text-red-600 underline">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}

              {test.questions?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    Tidak ada soal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {editing && (
<div className="fixed inset-0 bg-black/60 flex justify-center items-start p-4 z-50 overflow-y-auto">
              <div className="bg-white w-full max-w-[95%] sm:max-w-lg p-4 sm:p-6 rounded-lg space-y-4 shadow-xl my-4">
                <h2 className="text-lg sm:text-xl font-semibold">Edit Soal</h2>

                {/* TEXT */}
                <div>
                  <label className="font-medium">Teks Soal</label>
                  <textarea className="w-full border p-2 rounded" value={editText} onChange={(e) => setEditText(e.target.value)} />
                </div>

                {/* TYPE */}
                <div>
                  <label className="font-medium">Tipe Soal</label>
                  <select value={editType} onChange={(e) => setEditType(e.target.value)} className="border p-2 rounded w-full">
                    <option value="MULTIPLE_CHOICE">Pilihan Ganda (Radio)</option>
                    <option value="CHECKBOX">Pilihan Ganda (Checklist)</option>
                    <option value="ESSAY">Essay</option>
                  </select>
                </div>

                {/* OPTIONS - MULTIPLE CHOICE */}
                {editType === "MULTIPLE_CHOICE" && (
                  <div className="space-y-3">
                    <label className="font-medium">Pilihan Jawaban</label>

                    {editOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="radio" name="editCorrect" value={String.fromCharCode(97 + idx)} checked={editAnswer === String.fromCharCode(97 + idx)} onChange={() => setEditAnswer(String.fromCharCode(97 + idx))} />

                        <input
                          className="border p-2 rounded w-full"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...editOptions];
                            updated[idx] = e.target.value;
                            setEditOptions(updated);
                          }}
                        />

                        <button
                          onClick={() => {
                            const updated = editOptions.filter((_, i) => i !== idx);
                            setEditOptions(updated);
                          }}
                          className="px-2 bg-red-500 text-white rounded"
                        >
                          X
                        </button>
                      </div>
                    ))}

                    <button onClick={() => setEditOptions([...editOptions, ""])} className="px-3 py-1 bg-gray-300 rounded">
                      + Tambah Pilihan
                    </button>

                    {/* SCORE */}
                    <div>
                      <label className="font-medium">Skor</label>
                      <input type="number" className="border p-2 rounded w-full" value={editScore} onChange={(e) => setEditScore(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* OPTIONS - CHECKBOX */}
                {editType === "CHECKBOX" && (
                  <div className="space-y-3">
                    <label className="font-medium">Pilihan Jawaban (centang jawaban yang benar)</label>

                    {editOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editAnswers.includes(String.fromCharCode(97 + idx))}
                          onChange={(e) => {
                            const key = String.fromCharCode(97 + idx);
                            if (e.target.checked) {
                              setEditAnswers([...editAnswers, key]);
                            } else {
                              setEditAnswers(editAnswers.filter((a) => a !== key));
                            }
                          }}
                        />

                        <input
                          className="border p-2 rounded w-full"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...editOptions];
                            updated[idx] = e.target.value;
                            setEditOptions(updated);
                          }}
                        />

                        <button
                          onClick={() => {
                            const updated = editOptions.filter((_, i) => i !== idx);
                            setEditOptions(updated);
                            const key = String.fromCharCode(97 + idx);
                            setEditAnswers(editAnswers.filter((a) => a !== key));
                          }}
                          className="px-2 bg-red-500 text-white rounded"
                        >
                          X
                        </button>
                      </div>
                    ))}

                    <button onClick={() => setEditOptions([...editOptions, ""])} className="px-3 py-1 bg-gray-300 rounded">
                      + Tambah Pilihan
                    </button>

                    {/* SCORE */}
                    <div>
                      <label className="font-medium">Skor</label>
                      <input type="number" className="border p-2 rounded w-full" value={editScore} onChange={(e) => setEditScore(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                  <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-300 rounded text-sm sm:text-base">
                    Batal
                  </button>
                  <button onClick={handleUpdateQuestion} className="px-4 py-2 bg-blue-600 text-white rounded text-sm sm:text-base">
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
