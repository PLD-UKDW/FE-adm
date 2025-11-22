"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState({
    totalTests: 0,
    totalAttempts: 0,
    ungradedAttempts: 0,
  });

  const [loading, setLoading] = useState(true);

  // 🔐 Cek token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, [router]);

  // 📊 Fetch Dashboard Data
  useEffect(() => {
    async function load() {
      try {
        const [testsRes, attemptsRes, ungradedRes] = await Promise.all([
          api.get("/admin/tests"),
          api.get("/admin/attempts"),
          api.get("/admin/attempts?ungraded=1"),
        ]);

        setStats({
          totalTests: testsRes.data.length,
          totalAttempts: attemptsRes.data.length,
          ungradedAttempts: ungradedRes.data.length,
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="p-8 space-y-8">

      {/* Title */}
      <h1 className="text-3xl font-bold">Dashboard Admin</h1>

      {/* Statistic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Total Tests */}
        <div className="p-6 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600 transition">
          <p className="text-xl font-semibold">Total Test</p>
          <p className="text-4xl font-bold mt-2">{stats.totalTests}</p>
        </div>

        {/* Total Attempts */}
        <div className="p-6 bg-purple-500 text-white rounded-xl shadow hover:bg-purple-600 transition">
          <p className="text-xl font-semibold">Total Attempt</p>
          <p className="text-4xl font-bold mt-2">{stats.totalAttempts}</p>
        </div>

        {/* Ungraded Attempts */}
        <div className="p-6 bg-red-500 text-white rounded-xl shadow hover:bg-red-600 transition">
          <p className="text-xl font-semibold">Belum Dinilai</p>
          <p className="text-4xl font-bold mt-2">{stats.ungradedAttempts}</p>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="space-y-4 mt-10">
        <h2 className="text-2xl font-bold">Menu Cepat</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <Link
            href="/admin/tests"
            className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition border"
          >
            <h3 className="text-xl font-semibold">Kelola Semua Test</h3>
            <p className="text-gray-600 mt-2">
              Lihat, tambah, dan kelola test
            </p>
          </Link>

          <Link
            href="/admin/tests/add"
            className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition border"
          >
            <h3 className="text-xl font-semibold">Tambah Test Baru</h3>
            <p className="text-gray-600 mt-2">
              Buat test baru untuk peserta
            </p>
          </Link>

          <Link
            href="/admin/attempts"
            className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition border"
          >
            <h3 className="text-xl font-semibold">Lihat Attempt</h3>
            <p className="text-gray-600 mt-2">
              Periksa attempt peserta
            </p>
          </Link>

        </div>
      </div>
    </div>
  );
}
