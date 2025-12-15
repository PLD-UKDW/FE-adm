"use client";
import api from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export default function KategoriDisabilitasPage() {
    const [token, setToken] = useState<string | null>(null);
    const [jenisOptions, setJenisOptions] = useState<{ id: number; jenis: string }[]>([]);
    const [kategoriList, setKategoriList] = useState<string[]>([]);
    const [newKategori, setNewKategori] = useState<{ kategori: string; jenisId: number | "" }>({ kategori: "", jenisId: "" });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    useEffect(() => {
        setToken(localStorage.getItem("token"));
    }, []);

    const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchJenis = useCallback(async () => {
        if (!token) return;
        try {
            const res = await api.get("/api/jenis-disabilitas", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setJenisOptions(res.data || []);
        } catch {
            addToast("Gagal memuat jenis disabilitas", "error");
        }
    }, [token]);

    const fetchKategori = useCallback(async () => {
        if (!token) return;
        try {
            const res = await api.get("/api/kategori-disabilitas", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setKategoriList(res.data || []);
        } catch {
            addToast("Gagal memuat kategori", "error");
        }
    }, [token]);

    useEffect(() => {
        fetchJenis();
        fetchKategori();
    }, [fetchJenis, fetchKategori]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            addToast("Token tidak ada / belum login", "error");
            return;
        }
        if (!newKategori.kategori || !newKategori.jenisId) {
            addToast("Isi nama kategori dan pilih jenis", "error");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("http://localhost:4000/api/kategori-disabilitas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    kategori: newKategori.kategori,
                    jenis_id: newKategori.jenisId,
                }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                addToast(body?.message || "Gagal menambah kategori", "error");
                return;
            }
            addToast(body?.message || "Kategori ditambahkan", "success");
            setNewKategori({ kategori: "", jenisId: "" });
            fetchKategori();
        } catch {
            addToast("Error saat menambah kategori", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto text-black">
            <h1 className="text-2xl font-bold mb-4">Kategori Disabilitas</h1>

            <form onSubmit={handleSubmit} className="bg-white p-5 rounded-lg shadow mb-6">
                <h2 className="text-lg font-semibold mb-3">Tambah Kategori Baru</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                        <label className="block text-sm font-medium">Nama Kategori</label>
                        <input
                            value={newKategori.kategori}
                            onChange={(e) => setNewKategori({ ...newKategori, kategori: e.target.value })}
                            className="mt-1 block w-full border rounded p-2"
                            placeholder="contoh: Tuli"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Jenis Disabilitas</label>
                        <select
                            value={newKategori.jenisId}
                            onChange={(e) => setNewKategori({ ...newKategori, jenisId: e.target.value ? Number(e.target.value) : "" })}
                            className="mt-1 block w-full border rounded p-2"
                        >
                            <option value="">-- pilih jenis --</option>
                            {jenisOptions.map((j) => (
                                <option key={j.id} value={j.id}>{j.jenis}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded shadow"
                        >
                            {saving ? "Menyimpan..." : "Tambah"}
                        </button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Kategori baru otomatis bisa dipilih di form mahasiswa.</p>
            </form>

            <div className="bg-white p-5 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-3">Daftar Kategori</h2>
                {kategoriList.length === 0 ? (
                    <p className="text-sm text-gray-600">Belum ada kategori.</p>
                ) : (
                    <ul className="list-disc pl-6 space-y-1">
                        {kategoriList.map((k) => (
                            <li key={k}>{k}</li>
                        ))}
                    </ul>
                )}
            </div>

            {toast && (
                <div
                    className={`fixed right-4 bottom-4 px-4 py-2 rounded shadow text-white ${
                        toast.type === "error" ? "bg-red-500" : toast.type === "success" ? "bg-green-600" : "bg-gray-700"
                    }`}
                >
                    {toast.message}
                </div>
            )}
        </div>
    );
}
