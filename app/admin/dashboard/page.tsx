"use client";

import UnderDevelopment from "@/components/UnderDevelopment";
import api from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Question {
  id: string;
}

interface Test {
  id: string;
  title: string;
  type: string;
  questions?: Question[];
}

interface User {
  name: string;
}

interface Attempt {
  id: string;
  user?: User;
  test?: { title: string };
  score?: number;
  passStatus?: string;
}

const UNDER_MAINTENANCE = true;

export default function AdminDashboard() {
  const [tests, setTests] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // state FORM CREATE TEST
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTest, setNewTest] = useState({
    title: "",
    type: "",
    description: "",
  });

  async function fetchAll() {
    try {
      const [tRes, aRes] = await Promise.all([
        api.get("/admin/tests"),
        api.get("/admin/attempts"),
      ]);

      setTests(tRes.data);
      setAttempts(aRes.data);
    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!UNDER_MAINTENANCE) {
      fetchAll();
    }
  }, []);

  if (UNDER_MAINTENANCE) {
    return <UnderDevelopment />;
  // =============================
  // CREATE TEST HANDLER
  // =============================
  async function handleCreateTest(e: any) {
    e.preventDefault();
    try {
      await api.post("/admin/tests", newTest);
      setShowCreateModal(false);
      setNewTest({ title: "", type: "", description: "" });
      fetchAll();
    } catch (err) {
      console.error("CREATE TEST ERROR:", err);
    }
  }

  // =============================
  // DELETE TEST HANDLER
  // =============================
  async function handleDeleteTest(id: number) {
    const yes = confirm("Yakin ingin menghapus test ini beserta seluruh soalnya?");
    if (!yes) return;

    try {
      await api.delete(`/admin/tests/${id}`);
      fetchAll();
    } catch (err) {
      console.error("DELETE ERROR:", err);
    }
  }

  if (loading)
    return (
      <div className="p-6">
        <p className="text-black">Loading dashboard...</p>
      </div>
    );

  return (
    <div className="p-8 space-y-10 text-black">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* ============================
          CREATE TEST MODAL
      ============================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] space-y-4">
            <h2 className="text-xl font-bold">Buat Test Baru</h2>

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="text-sm">Judul</label>
                <input
                  type="text"
                  value={newTest.title}
                  onChange={(e) =>
                    setNewTest({ ...newTest, title: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="text-sm">Tipe (contoh: DIGITAL_LITERACY)</label>
                <input
                  type="text"
                  value={newTest.type}
                  onChange={(e) =>
                    setNewTest({ ...newTest, type: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="text-sm">Deskripsi</label>
                <textarea
                  value={newTest.description}
                  onChange={(e) =>
                    setNewTest({ ...newTest, description: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================
          SECTION: TEST LIST
      ============================= */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-semibold">Daftar Test</h2>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded shadow"
          >
            + Buat Test Baru
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Judul</th>
                <th className="p-3 text-left">Tipe</th>
                <th className="p-3 text-left">Jumlah Soal</th>
                <th className="p-3 text-left">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {tests.map((t: Test) => (
              {tests.map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{t.id}</td>
                  <td className="p-3">{t.title}</td>
                  <td className="p-3">{t.type}</td>
                  <td className="p-3">{t.questions?.length} soal</td>

                  <td className="p-3 flex gap-4">
                    <Link
                      href={`/admin/tests/${t.id}`}
                      className="text-blue-600 underline text-sm"
                    >
                      Detail
                    </Link>

                    <button
                      onClick={() => handleDeleteTest(t.id)}
                      className="text-red-600 underline text-sm"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}

              {tests.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    Tidak ada test.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================
          ATTEMPT LIST
      ============================= */}
      <section>
        <div className="p-8 space-y-8">
          <h1 className="text-3xl font-bold">Daftar Attempt Peserta</h1>

          {/* Card Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tests.map((t) => {
              const testAttempts = attempts.filter((a) => a.testId === t.id);
              const pending = testAttempts.filter((a) => !a.passStatus).length;

            <tbody>
              {attempts.map((a: Attempt) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{a.id}</td>
                  <td className="p-3">{a.user?.name}</td>
                  <td className="p-3">{a.test?.title}</td>
                  <td className="p-3">{a.score ?? "-"}</td>
                  <td className="p-3">
                    {a.passStatus ?? (
                      <span className="text-gray-500">Belum dinilai</span>
              return (
                <div
                  key={t.id}
                  className="p-4 border rounded-lg shadow-sm bg-white"
                >
                  <h3 className="font-semibold text-lg">{t.title}</h3>
                  <p className="text-gray-600">{t.type}</p>

                  <div className="mt-3 space-y-1">
                    <p className="text-sm">
                      Total attempt: <b>{testAttempts.length}</b>
                    </p>
                    {t.type === "COLLEGE_READINESS" && (
                      <p className="text-sm text-red-600">
                        Perlu dinilai: <b>{pending}</b>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab(tests.indexOf(t))}
                    className="mt-3 text-blue-600 underline text-sm"
                  >
                    Lihat Attempt
                  </button>
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="border-b mt-6">
            <div className="flex space-x-4 overflow-x-auto">
              {tests.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(idx)}
                  className={`px-4 py-2 border-b-2 transition-all ${
                    activeTab === idx
                      ? "border-blue-600 text-blue-600 font-semibold"
                      : "border-transparent text-gray-600"
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* Attempt Table */}
          {tests.map((t, idx) => {
            if (idx !== activeTab) return null;

            const testAttempts = attempts.filter((a) => a.testId === t.id);

            return (
              <div key={t.id} className="mt-6">
                <h2 className="text-xl font-semibold mb-2">
                  {t.title} - Attempt Peserta
                </h2>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="p-3 text-left">Peserta</th>
                        <th className="p-3 text-left">Auto Score</th>
                        <th className="p-3 text-left">Manual Score</th>
                        <th className="p-3 text-left">Final Score</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Aksi</th>
                      </tr>
                    </thead>

                    <tbody>
                      {testAttempts.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3">{a.user?.name}</td>
                          <td className="p-3">{a.autoScore ?? "-"}</td>
                          <td className="p-3">{a.manualScore ?? "-"}</td>
                          <td className="p-3">{a.finalScore ?? "-"}</td>
                          <td className="p-3">
                            {a.passStatus ?? (
                              <span className="text-orange-500">Pending</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Link
                              href={`/admin/scoring?id=${a.id}&test=${t.id}`}
                              className="text-blue-600 underline text-sm"
                            >
                              Review / Nilai
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {testAttempts.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-4 text-center text-gray-500"
                          >
                            Belum ada attempt untuk test ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
