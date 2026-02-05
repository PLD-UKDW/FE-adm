"use client";

import api from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateTestPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    typeName: "",
  });

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      addToast("Token tidak ada / belum login", "error");
      return;
    }
    if (!formData.title || !formData.typeName) {
      addToast("Isi judul dan tipe test", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post(
        "/admin/tests",
        {
          title: formData.title,
          description: formData.description,
          typeName: formData.typeName,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log("Create test response:", res.data);
      addToast("Test berhasil dibuat!", "success");

      // Redirect ke halaman pmjd setelah 1 detik
      setTimeout(() => {
        router.push("/api/admin/dashboard/input/pmjd");
      }, 1000);
    } catch (err) {
      console.error("Create test error:", err);
      addToast("Gagal membuat test", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-black">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/dashboard/input/pmjd" className="text-blue-600 hover:underline">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold">Buat Test Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Judul Test</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border rounded p-2" placeholder="contoh: Digital Literacy Test" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded p-2" rows={3} placeholder="Deskripsi singkat tentang test ini..." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipe Test</label>
            <input type="text" value={formData.typeName} onChange={(e) => setFormData({ ...formData, typeName: e.target.value })} className="w-full border rounded p-2" placeholder="contoh: DIGITAL_LITERACY, COLLEGE_READINESS" />
          </div>

          <div className="flex gap-2 pt-4">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Menyimpan..." : "Buat Test"}
            </button>
            <Link href="/admin/dashboard/input/pmjd" className="px-4 py-2 bg-gray-300 text-gray-700 rounded shadow hover:bg-gray-400">
              Batal
            </Link>
          </div>
        </div>
      </form>

      {toast && <div className={`fixed right-4 bottom-4 px-4 py-2 rounded shadow text-white ${toast.type === "error" ? "bg-red-500" : toast.type === "success" ? "bg-green-600" : "bg-gray-700"}`}>{toast.message}</div>}
    </div>
  );
}
