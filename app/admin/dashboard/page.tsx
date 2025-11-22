"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function AdminDashboard() {
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    fetchAll();
  }, []);

  if (loading)
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* ============================
          SECTION: TEST LIST
      ============================= */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-semibold">Daftar Test</h2>

          <Link
            href="/admin/tests/create"
            className="px-4 py-2 bg-blue-600 text-white rounded shadow"
          >
            + Buat Test Baru
          </Link>
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
                    <Link
                      href={`/admin/tests/${t.id}`}
                      className="text-blue-600 underline"
                    >
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
        <h2 className="text-2xl font-semibold mb-3">Daftar Attempt Peserta</h2>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left">Attempt ID</th>
                <th className="p-3 text-left">Peserta</th>
                <th className="p-3 text-left">Test</th>
                <th className="p-3 text-left">Skor</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {attempts.map((a: any) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{a.id}</td>
                  <td className="p-3">{a.user?.name}</td>
                  <td className="p-3">{a.test?.title}</td>
                  <td className="p-3">{a.score ?? "-"}</td>
                  <td className="p-3">
                    {a.passStatus ?? (
                      <span className="text-gray-500">Belum dinilai</span>
                    )}
                  </td>

                  <td className="p-3">
                    <Link
                      href={`/admin/attempts/${a.id}`}
                      className="text-blue-600 underline"
                    >
                      Review / Nilai
                    </Link>
                  </td>
                </tr>
              ))}

              {attempts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    Belum ada attempt peserta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
