"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function AdminDashboard() {
  const [tests, setTests] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  async function fetchAll() {
    try {
      const [tRes, aRes] = await Promise.all([api.get("/admin/tests"), api.get("/admin/attempts")]);

      setTests(tRes.data);
      setAttempts(aRes.data);
    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading)
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );

  return (
    <div className="p-8 space-y-10 text-black">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* ============================
          SECTION: TEST LIST
      ============================= */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-semibold">Daftar Test</h2>
{/* 
          <Link href="/admin/tests/create" className="px-4 py-2 bg-blue-600 text-white rounded shadow">
            + Buat Test Baru
          </Link> */}
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
              {tests.map((t: any) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{t.id}</td>
                  <td className="p-3">{t.title}</td>
                  <td className="p-3">{t.type}</td>
                  <td className="p-3">{t.questions?.length} soal</td>
                  <td className="p-3">
                    <Link href={`/admin/tests/${t.id}`} className="text-blue-600 underline">
                      Detail
                    </Link>
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
          SECTION: ATTEMPT LIST
      ============================= */}
      <section>
        <div className="p-8 space-y-8">
          <h1 className="text-3xl font-bold">Daftar Attempt Peserta</h1>

          {/* =============================
          SUMMARY CARDS
      ============================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tests.map((t: any) => {
              const testAttempts = attempts.filter((a: any) => a.testId === t.id);
              const pending = testAttempts.filter((a: any) => !a.passStatus).length;

              return (
                <div key={t.id} className="p-4 border rounded-lg shadow-sm bg-white">
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

                  <button onClick={() => setActiveTab(tests.indexOf(t))} className="mt-3 text-blue-600 underline text-sm">
                    Lihat Attempt
                  </button>
                </div>
              );
            })}
          </div>

          {/* =============================
          TABS
      ============================== */}
          <div className="border-b">
            <div className="flex space-x-4 overflow-x-auto">
              {tests.map((t: any, idx: number) => (
                <button key={t.id} onClick={() => setActiveTab(idx)} className={`px-4 py-2 border-b-2 transition-all ${activeTab === idx ? "border-blue-600 text-blue-600 font-semibold" : "border-transparent text-gray-600"}`}>
                  {t.title}
                </button>
              ))}
            </div>
          </div>
          {/* =============================
    TABLE PER TEST (PER TAB)
============================== */}
          {tests.map((t: any, idx: number) => {
            if (idx !== activeTab) return null; // Hanya tampil tab aktif

            const testAttempts = attempts.filter((a: any) => a.testId === t.id);

            return (
              <div key={t.id} className="mt-6">
                <h2 className="text-xl font-semibold mb-2">{t.title} - Attempt Peserta</h2>

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
                      {testAttempts.map((a: any) => (
                        <tr key={a.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{a.user?.name}</td>
                          <td className="p-3">{a.autoScore ?? "-"}</td>
                          <td className="p-3">{a.manualScore ?? "-"}</td>
                          <td className="p-3">{a.finalScore ?? "-"}</td>
                          <td className="p-3">{a.passStatus ?? <span className="text-orange-500">Pending</span>}</td>
                          <td className="p-3">
                            <Link href={`/admin/attempts/${a.id}`} className="text-blue-600 underline text-sm">
                              Review / Nilai
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {testAttempts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-500">
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
