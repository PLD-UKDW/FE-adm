"use client";
declare global {
    interface Window {
        XLSX: unknown;
    }
}
import api from "@/lib/api";
import { useCallback, useEffect, useState } from 'react';

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
    'Banten',
    'Jawa Barat',
    'Jawa Tengah',
    'DI Yogyakarta',
    'Jawa Timur',
    'Bali',
    'Nusa Tenggara Barat',
    'Nusa Tenggara Timur',
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
    'Irian Jaya Barat',
    'Irian Jaya Tengah',
    'Irian Jaya Timur',
];

const JALUR_OPTIONS = ['Mandiri', 'SNMPTN', 'SBMPTN', 'Undangan'];
const STATUS_OPTIONS = ['aktif', 'undur diri', 'lulus'];
const ASAL_SEKOLAH_OPTIONS = ['SLB', 'NonSLB', 'HomeSchooling', 'Paket C', 'Sarjana'];
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
    const [kategoriOptions, setKategoriOptions] = useState<string[]>([]);
    const [angkatanList, setAngkatanList] = useState<number[]>([]);
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
    const [filterAngkatan, setFilterAngkatan] = useState<string>('');
    const [filterFakultasId, setFilterFakultasId] = useState<number | ''>('');
    const [filterProdiId, setFilterProdiId] = useState<number | ''>('');
    const [filterProdiList, setFilterProdiList] = useState<Prodi[]>([]);
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

    // Filter Prodi loader (depends on filterFakultasId)
    const fetchFilterProdi = useCallback(
        async (fId: number) => {
            try {
                const res = await api.get(`/api/prodi?fakultasId=${fId}`);
                setFilterProdiList(res.data);
            } catch {
                addToast("Gagal memuat prodi (filter)", "error");
            }
        }, []);

    useEffect(() => {
        if (filterFakultasId) {
            fetchFilterProdi(Number(filterFakultasId));
        } else {
            setFilterProdiList([]);
            setFilterProdiId('');
        }
    }, [filterFakultasId, fetchFilterProdi]);

    const fetchKategori = useCallback(async () => {
        if (!token) return;
        try {
            const res = await api.get("/api/kategori-disabilitas", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setKategoriOptions(res.data || []);
        } catch {
            addToast("Gagal memuat kategori disabilitas", "error");
        }
    }, [token]);

    useEffect(() => {
        fetchKategori();
    }, [fetchKategori]);

    const fetchAngkatan = useCallback(async () => {
        if (!token) return;
        try {
            const res = await api.get("/api/angkatan", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAngkatanList(res.data || []);
        } catch {
            addToast("Gagal memuat daftar angkatan", "error");
        }
    }, [token]);

    useEffect(() => {
        fetchAngkatan();
    }, [fetchAngkatan]);

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
        if(!token) {
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterStatus) params.append('status', filterStatus);
            if (filterAngkatan) params.append('angkatan', String(filterAngkatan));
            if (filterFakultasId) params.append('fakultasId', String(filterFakultasId));
            if (filterProdiId) params.append('prodiId', String(filterProdiId));
            const url = `http://localhost:4000/api/mahasiswa?${params.toString()}`;
            const res = await fetch(url, {headers: { Authorization: `Bearer ${token}`,},});
            if (!res.ok) {
                let body: { message?: string } = {};
                try { body = await res.json(); } catch {}
                console.error('FETCH mahasiswa failed', res.status, body);
                addToast(body.message ? `${body.message} (status ${res.status})` : `Gagal memuat mahasiswa (status ${res.status})`, 'error');
                return;
            }
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
    }, [token, search, filterStatus, filterAngkatan, filterFakultasId, filterProdiId]);
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
            if (!form.kategoriDisabilitas || form.kategoriDisabilitas.length === 0) {
                addToast("Kategori disabilitas wajib dipilih", "error");
                setSaving(false);
                return;
            }
            const payload = {
                // kirim field sesuai ekspektasi backend
                nama: form.nama,
                nim: form.nim,
                provinsi: form.provinsi,
                angkatan: form.angkatan,
                jalur_masuk: form.jalur_masuk,
                status: form.status,
                jenjang: form.jenjang,
                gender: form.gender,
                asal_sekolah: form.asal_sekolah,
                ipk: Number(form.ipk),
                fakultas_id: Number(form.fakultas_id),
                prodi_id: Number(form.prodi_id),
                kategori: form.kategoriDisabilitas,
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
            const res = await fetch(`http://localhost:4000/api/mahasiswa/${row.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();

            setEditingId(row.id);

            // Load prodi list if fakultas is selected
            if (data.fakultas_id) {
                const prodiRes = await fetch(`http://localhost:4000/api/prodi?fakultas_id=${data.fakultas_id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const prodiData = await prodiRes.json();
                setProdiList(Array.isArray(prodiData) ? prodiData : []);
            } else {
                setProdiList([]);
            }

            console.log('Data from backend:', data);
            console.log('Provinsi value:', data.provinsi);

            setForm({
                nama: data.nama || '',
                nim: data.nim || '',
                provinsi: data.provinsi || '',
                angkatan: data.angkatan || new Date().getFullYear(),
                jalur_masuk: data.jalur_masuk || '',
                status: data.status || 'aktif',
                jenjang: data.jenjang || 'S1',
                gender: data.gender || 'P',
                asal_sekolah: data.asal_sekolah || 'NonSLB',
                ipk: data.ipk || '',
                fakultas_id: data.fakultas_id || '',
                prodi_id: data.prodi_id || '',
                kategoriDisabilitas: data.kategoriDisabilitas || [],
            });

            console.log('Form after setForm:', form);

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
            const jenisDisabilitas = r.jenisDisabilitas || '';
            const kategoriDisabilitasStr = (r.kategoriDisabilitas || []).join(';');
            lines.push([r.nim, r.nama, r.gender, jenisDisabilitas, `"${kategoriDisabilitasStr}"`, r.fakultas, r.prodi, r.angkatan, r.status].join(','));
        }
        return lines.join('\n');
    };

    const exportExcel = () => {
        // Attempt to use SheetJS if available on the project. If not, fallback to CSV with .xlsx extension (not ideal).
        if (typeof window === "undefined") return;

    const XLSXAny = window.XLSX as { utils?: any; writeFile?: any };

        if (XLSXAny?.utils && XLSXAny?.writeFile) {
            const ws_data: (string | number)[][] = [];

            // Header row - include all visible columns
            ws_data.push([
            'NIM', 'Nama', 'Gender', 'Provinsi', 'Jenis Disabilitas', 'Kategori Disabilitas',
            'Fakultas', 'Prodi', 'Angkatan', 'Status'
            ]);

            // Data rows - use filtered/displayed rows
            for (const r of rows) {
                ws_data.push([
                    r.nim,
                    r.nama,
                    r.gender,
                    r.provinsi || '',
                    r.jenisDisabilitas || '',
                    (r.kategoriDisabilitas || []).join('; '),
                    r.fakultas,
                    r.prodi,
                    r.angkatan,
                    r.status,
                ]);
            }

            const wb = XLSXAny.utils.book_new();
            const ws = XLSXAny.utils.aoa_to_sheet(ws_data);

            // Add borders to all cells
            const range = XLSXAny.utils.decode_range(ws['!ref']);
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSXAny.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellAddress]) continue;
                    
                    if (!ws[cellAddress].s) ws[cellAddress].s = {};
                    ws[cellAddress].s.border = {
                        top: { style: 'thin', color: { rgb: '000000' } },
                        bottom: { style: 'thin', color: { rgb: '000000' } },
                        left: { style: 'thin', color: { rgb: '000000' } },
                        right: { style: 'thin', color: { rgb: '000000' } }
                    };

                    // Bold header row
                    if (R === 0) {
                        if (!ws[cellAddress].s.font) ws[cellAddress].s.font = {};
                        ws[cellAddress].s.font.bold = true;
                    }
                }
            }

            // Set column widths
            ws['!cols'] = [
                { wch: 15 }, // NIM
                { wch: 35 }, // Nama
                { wch: 10 }, // Gender
                { wch: 20 }, // Provinsi
                { wch: 20 }, // Jenis Disabilitas
                { wch: 30 }, // Kategori Disabilitas
                { wch: 25 }, // Fakultas
                { wch: 30 }, // Prodi
                { wch: 10 }, // Angkatan
                { wch: 15 }, // Status
            ];

            XLSXAny.utils.book_append_sheet(wb, ws, 'Mahasiswa');
            XLSXAny.writeFile(wb, `mahasiswa_export_${Date.now()}.xlsx`);
            addToast(`Berhasil export ${rows.length} data mahasiswa`, 'success');
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

    // jenisDisabilitas ditentukan oleh backend; tidak perlu compute di frontend

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
                            {Array.isArray(prodiList) && prodiList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium">kategoriDisabilitas Disabilitas (pilih satu atau lebih)</label>
                        <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                            {kategoriOptions.map((k) => (
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
                <div className="flex items-center gap-2 flex-wrap">
                    <input placeholder="Cari nama atau NIM" value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded p-2" />

                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded p-2">
                        <option value="">Semua status</option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select value={filterAngkatan} onChange={(e) => setFilterAngkatan(e.target.value)} className="border rounded p-2">
                        <option value="">Semua Angkatan</option>
                        {angkatanList.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>

                    <select value={filterFakultasId} onChange={(e) => setFilterFakultasId(e.target.value ? Number(e.target.value) : '')} className="border rounded p-2">
                        <option value="">Semua Fakultas</option>
                        {fakultasList.map((f) => <option key={f.id} value={f.id}>{f.nama}</option>)}
                    </select>

                    <select value={filterProdiId} onChange={(e) => setFilterProdiId(e.target.value ? Number(e.target.value) : '')} className="border rounded p-2">
                        <option value="">Semua Prodi</option>
                        {filterProdiList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>
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
                            <th className="px-4 py-2">Provinsi</th>
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
                            <tr><td colSpan={11} className="p-4">Memuat...</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={11} className="p-4">Tidak ada data</td></tr>
                        ) : rows.map((r) => (
                            <tr key={r.id} className="border-t">
                                <td className="px-4 py-2">{r.nim}</td>
                                <td className="px-4 py-2">{r.nama}</td>
                                <td className="px-4 py-2">{r.gender}</td>
                                <td className="px-4 py-2">{r.provinsi || ''}</td>
                                <td className="px-4 py-2">{r.jenisDisabilitas || ''}</td>
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
