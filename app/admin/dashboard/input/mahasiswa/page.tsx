"use client";
declare global {
    interface Window {
        XLSX: any;
    }
}
import api from "@/lib/api";
import { useCallback, useEffect, useState } from 'react';
// import * as XLSX from "xlsx";


// - Form to create / update mahasiswa with dropdowns (provinsi, jalur_masuk, status, asal_sekolah, fakultas, prodi, kategoriDisabilitas)
// - Dependent prodi list based on selected fakultas
// - Categories are multi-select; when saved, table shows BOTH jenisDisabilitas and kategoriDisabilitas (jenisDisabilitas derived from kategoriDisabilitas mapping)
// - Table below shows: nim, nama, gender, jenisDisabilitas (if multiple -> "Ganda" per user's backend), kategoriDisabilitas (comma separated), fakultas, prodi, angkatan, status, actions (update/delete)
// - Search / filter, pagination (server-style placeholders), loading states, toast notifications, export to CSV/Excel
// - Uses simple custom Toast implementation (no external toast lib)
// - Notes: replace placeholder API endpoints with your real backend endpoints.

const kategoriDisabilitas_TO_jenisDisabilitas: Record<string, string> = {
    'Tuna Daksa': 'Fisik',
    'Cerebral Palsy': 'Fisik',
    'Amputasi': 'Fisik',
    'Kelumpuhan': 'Fisik',
    'Low Vision': 'Sensorik (Visual)',
    'Blind': 'Sensorik (Visual)',
    'Hearing Impaired': 'Sensorik (Auditori)',
};

const PROVINSI_OPTIONS = [
    'Aceh',
    'Sumatera Utara',
    'Sumatera Barat',
    'Riau',
    'Jambi',
    'Sumatera Selatan',
    'Bangka Belitung',
    'Bengkulu',
    'Lampung',
    'DKI Jakarta',
    'Jawa Barat',
    'Jawa Tengah',
    'DI Yogyakarta',
    'Jawa Timur',
    'Banten',
    'Bali',
    'NTB',
    'NTT',
    'Kalimantan Barat',
    'Kalimantan Tengah',
    'Kalimantan Selatan',
    'Kalimantan Timur',
    'Kalimantan Utara',
    'Sulawesi Utara',
    'Sulawesi Tengah',
    'Sulawesi Selatan',
    'Sulawesi Tenggara',
    'Gorontalo',
    'Sulawesi Barat',
    'Maluku',
    'Maluku Utara',
    'Papua',
    'Papua Barat',
    'Papua Barat Daya',
    'Papua Selatan',
    'Papua Tengah',
    'Papua Pegunungan',
];

const JALUR_OPTIONS = ['Mandiri', 'SNMPTN', 'SBMPTN', 'Undangan'];
const STATUS_OPTIONS = ['aktif', 'undur diri', 'lulus'];
const ASAL_SEKOLAH_OPTIONS = ['SLB', 'NonSLB', 'HomeSchooling', 'Sarjana'];
const kategoriDisabilitas_OPTIONS = Object.keys(kategoriDisabilitas_TO_jenisDisabilitas);
type Fakultas = {
    id: number;
    nama: string;
};

type Prodi = {
    id: number;
    nama: string;
};

export default function MahasiswaForm() {
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        setToken(storedToken);
    }, []);
    const [fakultasList, setFakultasList] = useState<Fakultas[]>([]);
    const [prodiList, setProdiList] = useState<Prodi[]>([]);
    const [form, setForm] = useState<{
        nama: string;
        nim: string;
        provinsi: string;
        angkatan: number;
        jalur_masuk: string;
        status: string;
        jenjang: string;
        gender: string;
        asal_sekolah: string;
        ipk: string;
        fakultas_id: number | '';
        prodi_id: number | '';
        kategoriDisabilitas: string[];
    }>({
        nama: '',
        nim: '',
        provinsi: '',
        angkatan: new Date().getFullYear(),
        jalur_masuk: '',
        status: 'aktif',
        jenjang: 'S1',
        gender: 'P',
        asal_sekolah: 'NonSLB',
        ipk: '',
        fakultas_id: '',
        prodi_id: '',
        kategoriDisabilitas: [],
    });

    // table data + UI
    const [rows, setRows] = useState<RowData[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    // toast state
    type Toast = {
        id: number;
        message: string;
        type: "info" | "success" | "error";
    };
    const [toasts, setToasts] = useState<Toast[]>([]);
    const addToast = (message: string, type: "info" | "success" | "error" = "info") => {
        const id = Date.now();

        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    const fetchFakultas = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await api.get("/api/fakultas", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setFakultasList(res.data);
        } catch {
            addToast("Gagal memuat fakultas", "error");
        }finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchFakultas();
    }, [fetchFakultas]);

    const fetchProdi = useCallback(
        async (fakultasId: number) => {
            try {
                const res = await api.get(`/api/prodi?fakultasId=${fakultasId}`);
                setProdiList(res.data);
            } catch {
                addToast("Gagal memuat prodi", "error");
            }
        },[]);
        useEffect(() => {
            if (form.fakultas_id) {
                fetchProdi(Number(form.fakultas_id));
            } else {
                setProdiList([]);
            }
        }, [form.fakultas_id, fetchProdi]);

    const fetchRows = useCallback(async () => {
        if(!token) return;
        setLoading(true);
        try {
            const res = await fetch("http://localhost:4000/api/mahasiswa", {headers: { Authorization: `Bearer ${token}`,},});
            const data = await res.json();
            type MahasiswaResponse = {
                id: number;
                nim: string;
                nama: string;
                gender: string;
                kategoriDisabilitas: string[];
                jenisDisabilitas: string;
                fakultas: string;
                prodi: string;
                angkatan: number;
                status: string;
                provinsi: string;
                jalur_masuk: string;
                jenjang: string;
                asal_sekolah: string;
                ipk: number;
                fakultas_id: number;
                prodi_id: number;
            };

            const formatted = data.map((m: MahasiswaResponse) => ({
                id: m.id,
                nim: m.nim,
                nama: m.nama,
                gender: m.gender,
                kategoriDisabilitas: m.kategoriDisabilitas,
                jenisDisabilitas: m.jenisDisabilitas,
                fakultas: m.fakultas,
                prodi: m.prodi,
                angkatan: m.angkatan,
                status: m.status,
                provinsi: m.provinsi,
                jalur_masuk: m.jalur_masuk,
                jenjang: m.jenjang,
                asal_sekolah: m.asal_sekolah,
                ipk: m.ipk,
                fakultas_id: m.fakultas_id,
                prodi_id: m.prodi_id
            }));
            setRows(formatted);
        } catch {
            addToast("Gagal memuat mahasiswa", "error");
        } finally {
            setLoading(false);
        }
    }, [token]);
    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const resetForm = () => {
        setEditingId(null);
        setIsEdit(false);

        setForm({
            nama: "",
            nim: "",
            provinsi: "",
            angkatan: new Date().getFullYear(),
            jalur_masuk: "",
            status: "aktif",
            jenjang: "S1",
            gender: "P",
            asal_sekolah: "NonSLB",
            ipk: "",
            fakultas_id: "",
            prodi_id: "",
            kategoriDisabilitas: [],
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...form,
                ipk: Number(form.ipk),
                fakultas_id: Number(form.fakultas_id),
                prodi_id: Number(form.prodi_id),
            };

            let res;

            if (editingId) {
                res = await fetch(`http://localhost:4000/api/update-mahasiswa/${editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch(`http://localhost:4000/api/create-mahasiswa`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) {
                const error = await res.json();
                addToast(error.message || "Gagal menyimpan", "error");
                return;
            }

            addToast(editingId ? "Berhasil mengupdate" : "Berhasil menyimpan", "success");
            fetchRows();
            resetForm();
        } catch {
            addToast("Error saat menyimpan", "error");
        } finally {
            setSaving(false);
        }
    };

    const [isEdit, setIsEdit] = useState(false);
    type RowData = {
        id: number;
        nim: string;
        nama: string;
        gender: string;
        jenisDisabilitas: string;
        kategoriDisabilitas: string[];
        fakultas: string;
        prodi: string;
        angkatan: number;
        status: string;
        provinsi?: string;
        jalur_masuk?: string;
        jenjang?: string;
        asal_sekolah?: string;
        ipk?: number;
        fakultas_id?: number;
        prodi_id?: number;
    };


    const handleEdit = async (row: RowData) => {
        try {
            const res = await fetch(`http://localhost:4000/api/mahasiswa/${row.id}`);
            const data = await res.json();

            setEditingId(row.id);

            setForm({
                nama: data.nama,
                nim: data.nim,
                provinsi: data.provinsi,
                angkatan: data.angkatan,
                jalur_masuk: data.jalur_masuk,
                status: data.status,
                jenjang: data.jenjang,
                gender: data.gender,
                asal_sekolah: data.asal_sekolah,
                ipk: data.ipk,
                fakultas_id: data.fakultas_id,
                prodi_id: data.prodi_id,
                kategoriDisabilitas: data.kategoriDisabilitas,
            });

            setIsEdit(true);
        } catch {
            addToast("Gagal memuat data mahasiswa", "error");
        }
    };

    const handleCancel = () => {
        setIsEdit(false);
        setEditingId(null);
        setForm({
            nama: '',
            nim: '',
            provinsi: '',
            angkatan: new Date().getFullYear(),
            jalur_masuk: '',
            status: 'aktif',
            jenjang: 'S1',
            gender: 'P',
            asal_sekolah: 'NonSLB',
            ipk: '',
            fakultas_id: '',
            prodi_id: '',
            kategoriDisabilitas: [],
        });
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus?")) return;

        try {
            const res = await fetch(`http://localhost:4000/api/delete-mahasiswa/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                addToast("Gagal menghapus", "error");
                return;
            }

            addToast("Berhasil menghapus", "success");
            fetchRows();
        } catch {
            addToast("Error saat delete", "error");
        }
    };

    const csvFromRows = (inputRows: RowData[]) => {
        const headers = ['nim', 'nama', 'gender', 'jenisDisabilitas', 'kategoriDisabilitas', 'fakultas', 'prodi', 'angkatan', 'status'];
        const lines = [headers.join(',')];
        for (const r of inputRows) {
            const jenisDisabilitas = computejenisDisabilitasFromkategoriDisabilitas(r.kategoriDisabilitas);
            const kategoriDisabilitasStr = (r.kategoriDisabilitas || []).join(';');
            lines.push([r.nim, r.nama, r.gender, jenisDisabilitas, `"${kategoriDisabilitasStr}"`, r.fakultas, r.prodi, r.angkatan, r.status].join(','));
        }
        return lines.join('\n');
    };

    const exportExcel = () => {
        // Attempt to use SheetJS if available on the project. If not, fallback to CSV with .xlsx extension (not ideal).
        if (typeof window === "undefined") return;

    const XLSX = window.XLSX;

        if (XLSX?.utils && XLSX?.writeFile) {
            const ws_data: (string | number)[][] = [];

            ws_data.push([
            'nim', 'nama', 'gender', 'jenisDisabilitas', 'kategoriDisabilitas',
            'fakultas', 'prodi', 'angkatan', 'status'
            ]);

            for (const r of rows) {
                ws_data.push([
                    r.nim,
                    r.nama,
                    r.gender,
                    computejenisDisabilitasFromkategoriDisabilitas(r.kategoriDisabilitas),
                    (r.kategoriDisabilitas || []).join(';'),
                    r.fakultas,
                    r.prodi,
                    r.angkatan,
                    r.status,
                ]);
            }

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            XLSX.utils.book_append_sheet(wb, ws, 'mahasiswa');
            XLSX.writeFile(wb, `mahasiswa_export_${Date.now()}.xlsx`);
        } else {
            addToast(
                'SheetJS tidak ditemukan, mengekspor sebagai CSV (bisa dibuka di Excel)',
                'info'
            );
            const csv = csvFromRows(rows);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mahasiswa_export_${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const computejenisDisabilitasFromkategoriDisabilitas = (kategoriDisabilitasArray: string[] = []) => {
        if (!kategoriDisabilitasArray || kategoriDisabilitasArray.length === 0) return '';
        if (kategoriDisabilitasArray.length > 1) return 'Ganda';
        const k = kategoriDisabilitasArray[0];
        return kategoriDisabilitas_TO_jenisDisabilitas[k] || 'Lainnya';
    };

    return (
        <div className="p-6 max-w-6xl mx-auto text-black">
            <h1 className="text-2xl font-bold mb-4">Form Data Mahasiswa</h1>

            {/* Form */}
            <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Nama</label>
                        <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="mt-1 block w-full border rounded p-2" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">NIM</label>
                        <input value={form.nim} onChange={(e) => setForm({ ...form, nim: e.target.value })} className="mt-1 block w-full border rounded p-2" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">jenisDisabilitas Kelamin</label>
                        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-1 block w-full border rounded p-2">
                            <option value="P">Perempuan</option>
                            <option value="L">Laki-laki</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Provinsi</label>
                        <select value={form.provinsi} onChange={(e) => setForm({ ...form, provinsi: e.target.value })} className="mt-1 block w-full border rounded p-2">
                            <option value="">-- pilih provinsi --</option>
                            {PROVINSI_OPTIONS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Angkatan</label>
                        <input type="number" value={form.angkatan} onChange={(e) => setForm({ ...form, angkatan: Number(e.target.value) })} className="mt-1 block w-full border rounded p-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Jalur Masuk</label>
                        <select value={form.jalur_masuk} onChange={(e) => setForm({ ...form, jalur_masuk: e.target.value })} className="mt-1 block w-full border rounded p-2">
                            <option value="">-- pilih jalur --</option>
                            {JALUR_OPTIONS.map((j) => <option key={j}>{j}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Status</label>
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 block w-full border rounded p-2">
                            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Asal Sekolah</label>
                        <select value={form.asal_sekolah} onChange={(e) => setForm({ ...form, asal_sekolah: e.target.value })} className="mt-1 block w-full border rounded p-2">
                            {ASAL_SEKOLAH_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">IPK</label>
                        <input type="number" step="0.01" value={form.ipk} onChange={(e) => setForm({ ...form, ipk: e.target.value })} className="mt-1 block w-full border rounded p-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Jenjang</label>
                        <input value={form.jenjang} onChange={(e) => setForm({ ...form, jenjang: e.target.value })} className="mt-1 block w-full border rounded p-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Fakultas</label>
                        <select value={form.fakultas_id} onChange={(e) => setForm({ ...form, fakultas_id: Number(e.target.value), prodi_id: '' })} className="mt-1 block w-full border rounded p-2">
                            <option value="">-- pilih fakultas --</option>
                            {fakultasList.map((f) => <option key={f.id} value={f.id}>{f.nama}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Prodi</label>
                        <select value={form.prodi_id} onChange={(e) => setForm({ ...form, prodi_id: Number(e.target.value) })} className="mt-1 block w-full border rounded p-2">
                            <option value="">-- pilih prodi --</option>
                            {prodiList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium">kategoriDisabilitas Disabilitas (pilih satu atau lebih)</label>
                        <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                            {kategoriDisabilitas_OPTIONS.map((k) => (
                                <label key={k} className="inline-flex items-center">
                                    <input type="checkbox" checked={form.kategoriDisabilitas.includes(k)} onChange={(e) => {
                                        const checked = e.target.checked;
                                        setForm((f) => ({ ...f, kategoriDisabilitas: checked ? [...f.kategoriDisabilitas, k] : f.kategoriDisabilitas.filter(x => x !== k) }));
                                    }} className="mr-2" />
                                    <span>{k}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Catatan: Pilih kategoriDisabilitas yang sesuai. Sistem akan menyimpan kategoriDisabilitas, lalu menurunkan jenisDisabilitas berdasarkan mapping saat ditampilkan di tabel.</p>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded shadow"
                    >
                        {saving ? 'Menyimpan...' : (editingId ? 'Update' : 'Simpan')}
                    </button>

                    <button type="button" onClick={() => { setForm({ nama: '', nim: '', provinsi: '', angkatan: new Date().getFullYear(), jalur_masuk: '', status: 'aktif', jenjang: 'S1', gender: 'P', asal_sekolah: 'NonSLB', ipk: '', fakultas_id: '', prodi_id: '', kategoriDisabilitas: [] }); setEditingId(null); }} className="px-4 py-2 border rounded">Reset</button>
                </div>
                {isEdit && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="bg-gray-300 text-black px-4 py-2 rounded ml-2"
                    >
                        Cancel
                    </button>
                )}

            </form>

            {/* Controls: search / filters / export */}
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2">
                    <input placeholder="Cari nama atau NIM" value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded p-2" />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded p-2">
                        <option value="">Semua status</option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => { setCurrentPage(1); fetchRows(); }} className="px-3 py-2 border rounded">Filter</button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={exportExcel} className="px-3 py-2 border rounded">Export Excel</button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded shadow overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="px-4 py-2">NIM</th>
                            <th className="px-4 py-2">Nama</th>
                            <th className="px-4 py-2">Gender</th>
                            <th className="px-4 py-2">jenisDisabilitas</th>
                            <th className="px-4 py-2">kategoriDisabilitas</th>
                            <th className="px-4 py-2">Fakultas</th>
                            <th className="px-4 py-2">Prodi</th>
                            <th className="px-4 py-2">Angkatan</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={10} className="p-4">Memuat...</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={10} className="p-4">Tidak ada data</td></tr>
                        ) : rows.map((r) => (
                            <tr key={r.id} className="border-t">
                                <td className="px-4 py-2">{r.nim}</td>
                                <td className="px-4 py-2">{r.nama}</td>
                                <td className="px-4 py-2">{r.gender}</td>
                                <td className="px-4 py-2">{computejenisDisabilitasFromkategoriDisabilitas(r.kategoriDisabilitas)}</td>
                                <td className="px-4 py-2">{(r.kategoriDisabilitas || []).join(', ')}</td>
                                <td className="px-4 py-2">{r.fakultas}</td>
                                <td className="px-4 py-2">{r.prodi}</td>
                                <td className="px-4 py-2">{r.angkatan}</td>
                                <td className="px-4 py-2">{r.status}</td>
                                <td className="px-4 py-2">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(r)} className="px-2 py-1 border rounded">Update</button>
                                        <button onClick={() => handleDelete(r.id)} className="px-2 py-1 border rounded">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination (simple) */}
            <div className="mt-4 flex items-center justify-between">
                <div>Page {currentPage} of {totalPages}</div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Prev</button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded">Next</button>
                </div>
            </div>

            {/* Toasts */}
            <div className="fixed right-4 bottom-4 flex flex-col gap-2">
                {toasts.map(t => (
                    <div key={t.id} className={`px-4 py-2 rounded shadow text-white ${t.type === 'error' ? 'bg-red-500' : t.type === 'success' ? 'bg-green-500' : 'bg-gray-700'}`}>
                        {t.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
