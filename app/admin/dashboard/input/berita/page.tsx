"use client";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "quill/dist/quill.snow.css";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

const quillModulesConfig = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

const quillFormatsConfig = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "align",
  "list",
  "bullet",
  "indent",
  "color",
  "background",
  "script",
  "blockquote",
  "code-block",
  "link",
  "image",
];

export default function BeritaAdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [categories, setCategories] = useState<Array<{id:number; name:string}>>([]);
  const [newCategory, setNewCategory] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [existingImageErrors, setExistingImageErrors] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "info"|"success"|"error" }[]>([]);
  const [list, setList] = useState<Array<{id:number; title:string; category?:{id:number; name:string}|null; isPublished:boolean; createdAt:string; tanggal?:string|null; lokasi?:string|null; content?:string; content_images?:string}>>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const quillModules = useMemo(() => quillModulesConfig, []);
  const quillFormats = useMemo(() => quillFormatsConfig, []);
  const quillContainerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quillInstanceRef = useRef<any>(null);
  const newImageInputRef = useRef<HTMLInputElement | null>(null);

  const sanitizeHtml = useCallback((html: string) => {
    try {
      if (!html) return html;
      const temp = document.createElement("div");
      temp.innerHTML = html;
      temp.querySelectorAll("svg, figure, path, polygon").forEach((el) => el.remove());
      temp.querySelectorAll("[style]").forEach((el) => {
        const style = (el as HTMLElement).getAttribute("style") || "";
        if (/clip-path|polygon\(/i.test(style)) {
          (el as HTMLElement).style.clipPath = "";
          (el as HTMLElement).style.removeProperty?.("clip-path");
          (el as HTMLElement).setAttribute(
            "style",
            style.replace(/clip-path:[^;]*;?/gi, "")
          );
        }
      });
      return temp.innerHTML;
    } catch {
      return html;
    }
  }, []);

  const addToast = (message:string, type:"info"|"success"|"error"="info") => {
    const id = Date.now();
    setToasts(prev => [...prev, {id,message,type}]);
    setTimeout(()=> setToasts(prev => prev.filter(t=>t.id!==id)), 3500);
  };

  const onNewImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (incoming.length === 0) return;
    setImageFiles((prev) => {
      const byKey = new Map<string, File>();
      const add = (f: File) => {
        const key = `${f.name}-${f.size}-${f.lastModified}`;
        if (!byKey.has(key)) byKey.set(key, f);
      };
      prev.forEach(add);
      incoming.forEach(add);
      return Array.from(byKey.values());
    });
    if (newImageInputRef.current) newImageInputRef.current.value = "";
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    if (newImageInputRef.current) newImageInputRef.current.value = "";
  };

  // Safely parse JSON; fallback to text message to avoid HTML parse errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseJSON = useCallback(async (res: Response): Promise<any> => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try { return await res.json(); } catch { return { message: "Invalid JSON from server" }; }
    }
    try { const text = await res.text(); return { message: text }; } catch { return { message: "Response parse error" }; }
  }, []);

  useEffect(()=>{ setToken(localStorage.getItem("token")); },[]);

  const fetchCategories = useCallback(async()=>{
    try {
      const res = await fetch("http://localhost:4000/api/berita-categories");
      const body = await parseJSON(res);
      console.log("Categories fetched:", body);
      if(!res.ok){ addToast(body?.message||"Gagal memuat kategori", "error"); return; }
      setCategories(Array.isArray(body) ? body : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      addToast("Gagal memuat kategori", "error");
    }
  }, [parseJSON]);

  const fetchList = useCallback(async ()=>{
    if(!token) return;
    try {
      const res = await fetch("http://localhost:4000/api/berita-admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await parseJSON(res);
      if(!res.ok){ addToast(body?.message||"Gagal memuat berita", "error"); return; }
      setList(body.data || []);
    } catch { addToast("Gagal memuat berita", "error"); }
  },[token, parseJSON]);

  useEffect(()=>{
    fetchCategories();
  }, [fetchCategories]);

  useEffect(()=>{
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const QuillModule = (await import("quill")).default;
      if (!mounted || !quillContainerRef.current) return;
      
      if (quillInstanceRef.current) {
        quillInstanceRef.current = null;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = new (QuillModule as any)(quillContainerRef.current, {
        theme: "snow",
        modules: quillModules,
        formats: quillFormats,
        placeholder: "Ketik konten berita di sini...",
      });
      quillInstanceRef.current = q;
      // Sanitize pasted content: drop SVG/FIGURE elements that can render odd shapes
      try {
        const clipboard = q.getModule("clipboard");
        if (clipboard) {
          ["svg", "figure", "path", "polygon"].forEach((tag) => {
            clipboard.addMatcher(tag, () => ({ ops: [] }));
          });
        }
      } catch {}
      
      q.on("text-change", () => {
        setContent(q.root.innerHTML);
      });
    };
    init();
    return () => { mounted = false; };
  }, [quillModules, quillFormats, sanitizeHtml]);

  useEffect(() => {
    if (quillInstanceRef.current && quillInstanceRef.current.root) {
      const current = quillInstanceRef.current.root.innerHTML;
      const next = sanitizeHtml(content || "");
      if (current !== next && editingId) {
        quillInstanceRef.current.root.innerHTML = next;
      }
    }
  }, [content, sanitizeHtml, editingId]);

  const handleCreate = async (e:FormEvent) => {
    e.preventDefault();
    if(!token){ addToast("Belum login", "error"); return; }
    const plain = content.replace(/<[^>]*>/g, "").trim();
    if(!title || !plain || !categoryId){ addToast("Lengkapi title, content, category", "error"); return; }
    
      const hasImages = imageFiles.length > 0 || existingImages.length > 0;
      if (!hasImages) { addToast("Upload minimal 1 gambar", "error"); return; }
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("categoryId", categoryId);
      formData.append("isPublished", String(isPublished));
      if(tanggal) formData.append("tanggal", tanggal);
      if(lokasi) formData.append("lokasi", lokasi);
      
      imageFiles.forEach((file) => {
        formData.append("content_images", file);
      });
      // Provide list of existing images to keep when updating
      if (editingId) {
        formData.append("keep_existing_images", existingImages.join(","));
      }

      const url = editingId 
        ? `http://localhost:4000/api/update-berita/${editingId}` 
        : "http://localhost:4000/api/create-berita";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const body = await parseJSON(res);
      console.log(`${editingId ? 'Update' : 'Create'} berita response:`, body);
      if(!res.ok){ addToast(body?.message||`Gagal ${editingId ? 'mengupdate' : 'membuat'} berita`, "error"); return; }
      addToast(`Berita berhasil ${editingId ? 'diupdate' : 'dibuat'}`, "success");
      resetForm();
      fetchList();
    } catch (err) { 
      console.error(err);
      const error = err as Error;
      addToast(`Error saat ${editingId ? 'mengupdate' : 'membuat'} berita: ${error.message}`, "error"); 
    }
    finally { setSaving(false); }
  };

  const resetForm = () => {
    setTitle(""); 
    setContent(""); 
    setCategoryId(""); 
    setTanggal(""); 
    setLokasi(""); 
    setImageFiles([]); 
      setExistingImages([]);
    setIsPublished(false);
    setEditingId(null);
    if (quillInstanceRef.current) {
      quillInstanceRef.current.root.innerHTML = "";
    }
  };

  const handleEdit = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:4000/api/berita-admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await parseJSON(res);
      if (!res.ok) {
        addToast(body?.message || "Gagal memuat berita", "error");
        return;
      }
      
      // Populate form with existing data
      setEditingId(id);
      setTitle(body.title || "");
      setContent(body.content || "");
      setCategoryId(body.categoryId ? String(body.categoryId) : "");
      setTanggal(body.tanggal ? new Date(body.tanggal).toISOString().split('T')[0] : "");
      setLokasi(body.lokasi || "");
      setIsPublished(body.isPublished || false);
      
            const imgs = body.content_images
              ? body.content_images.split(',').map((img: string) => img.trim()).filter((img: string) => img)
              : [];
            setExistingImages(imgs);
      
      setImageFiles([]);
      
      // Update Quill editor
      if (quillInstanceRef.current) {
        quillInstanceRef.current.root.innerHTML = sanitizeHtml(body.content || "");
      }
      
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      addToast("Mode Edit - Silakan ubah data dan simpan", "info");
    } catch (err) {
      const error = err as Error;
      addToast("Error memuat data berita: " + error.message, "error");
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const getImageSrc = (img: string): string => {
    const trimmed = (img || "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const cleaned = trimmed.replace(/^uploads[\\/]+berita[\\/]+/i, "");
    return `http://localhost:4000/uploads/berita/${encodeURIComponent(cleaned)}`;
  };

  const handleAddCategory = async (e:FormEvent) => {
    e.preventDefault();
    if(!newCategory.trim()) { addToast("Nama kategori wajib diisi", "error"); return; }
    try {
      const res = await fetch("http://localhost:4000/api/berita-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      const body = await parseJSON(res);
      if(!res.ok){ addToast(body?.message||"Gagal menambah kategori", "error"); return; }
      addToast("Kategori ditambahkan", "success");
      setNewCategory("");
      fetchCategories();
    } catch { addToast("Error menambah kategori", "error"); }
  };

  const togglePublish = async (id:number, publish:boolean) => {
    if(!token) return;
    try {
      const url = publish ? `http://localhost:4000/api/publish-berita/${id}` : `http://localhost:4000/api/unpublish-berita/${id}`;
      const res = await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      const body = await parseJSON(res);
      if(!res.ok){ addToast(body?.message||"Gagal update publish", "error"); return; }
      addToast(publish?"Dipublikasikan":"Disembunyikan", "success");
      fetchList();
    } catch { addToast("Error publish/unpublish", "error"); }
  };

  const deleteItem = async (id:number) => {
    if(!token) return;
    if(!confirm("Yakin hapus berita?")) return;
    try {
      const res = await fetch(`http://localhost:4000/api/delete-berita/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok){
        const body = await parseJSON(res);
        addToast(body?.message||"Gagal menghapus", "error");
        return;
      }
      addToast("Berita dihapus", "success");
      fetchList();
    } catch { addToast("Error menghapus", "error"); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto text-black">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>
        <h1 className="text-2xl font-bold">Input Berita</h1>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-5 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit Berita' : 'Buat Berita'}</h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
            >
              Batal Edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Judul</label>
            <input className="mt-1 w-full border rounded p-2" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Kategori</label>
            <select className="mt-1 w-full border rounded p-2" value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
              <option value="">-- pilih kategori --</option>
              {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Tanggal (tgl-bulan-tahun)</label>
            <input type="date" className="mt-1 w-full border rounded p-2" value={tanggal} onChange={e=>setTanggal(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Lokasi</label>
            <input className="mt-1 w-full border rounded p-2" value={lokasi} onChange={e=>setLokasi(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Konten</label>
            <div className="mt-1 bg-white border rounded">
              <div ref={quillContainerRef} className="min-h-[200px]" />
            </div>
          </div>
          {existingImages.length > 0 && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Gambar Saat Ini</label>
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded">
                {existingImages.map((img, idx) => {
                  const fallbackSrc = "/logo/logould.png"; // local placeholder in FE-adm/public/logo
                  const src = existingImageErrors[idx] ? fallbackSrc : getImageSrc(img);
                  return (
                    <div key={idx} className="relative group">
                      <Image
                        src={src}
                        alt={`existing-${idx}`}
                        width={100}
                        height={100}
                        unoptimized
                        className="w-24 h-24 object-cover rounded border-2 border-blue-300"
                        onError={() => {
                          // Swap to fallback once; avoid noisy console errors
                          if (!existingImageErrors[idx]) {
                            setExistingImageErrors(prev => ({ ...prev, [idx]: true }));
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition"
                        title="Ganti gambar (hapus yang lama)"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">Hover & klik × untuk menghapus dan ganti dengan gambar baru</p>
            </div>
          )}

          {/* NEW IMAGES */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Gambar Konten {editingId && existingImages.length === 0 ? "(Wajib - gambar lama akan dihapus)" : "(bisa multiple)"}</label>
            <input 
              ref={newImageInputRef}
              type="file" 
              accept="image/*" 
              multiple
              className="mt-1 w-full" 
              onChange={onNewImagesChange}
            />
            {imageFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-green-600 mb-2">Gambar Baru ({imageFiles.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {imageFiles.map((file, idx) => (
                    <div key={idx} className="relative">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`preview-${idx}`}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded border-2 border-green-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                className="w-5 h-5"
              />
              <span>Publish Langsung</span>
            </label>
          </div>
        </div>
        <div className="mt-4">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">
            {saving ? "Menyimpan..." : editingId ? "Update Berita" : "Simpan"}
          </button>
        </div>
      </form>

      {/* tambah kategori */}
      <form onSubmit={handleAddCategory} className="bg-white p-5 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Tambah Kategori Berita</h2>
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium">Nama Kategori</label>
            <input className="mt-1 w-full border rounded p-2" value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="Mis. Akademik & Penelitian" />
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Tambah</button>
        </div>
      </form>

      <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Daftar Berita</h2>
        {list.length===0 ? (
          <p className="text-sm text-gray-600">Tidak ada berita.</p>
        ) : (
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-3 py-2">Judul</th>
                <th className="px-3 py-2">Kategori</th>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">Lokasi</th>
                <th className="px-3 py-2">Published</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item=> (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">{item.title}</td>
                  <td className="px-3 py-2">{item.category?.name || '-'}</td>
                  <td className="px-3 py-2">{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-3 py-2">{item.lokasi || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.isPublished ? '✓ Yes' : '✗ No'}
                    </span>
                  </td>
                  <td className="px-3 py-2">{item.isPublished?"Published":"Draft"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button 
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600" 
                        onClick={() => handleEdit(item.id)}
                      >
                        Edit
                      </button>
                      {item.isPublished ? (
                        <button className="px-3 py-1 border rounded" onClick={()=>togglePublish(item.id,false)}>Unpublish</button>
                      ) : (
                        <button className="px-3 py-1 border rounded" onClick={()=>togglePublish(item.id,true)}>Publish</button>
                      )}
                      <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600" onClick={()=>deleteItem(item.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="fixed right-4 bottom-4 flex flex-col gap-2">
        {toasts.map(t=> (
          <div key={t.id} className={`px-4 py-2 rounded shadow text-white ${t.type==='error'? 'bg-red-500' : t.type==='success'? 'bg-green-600' : 'bg-gray-700'}`}>{t.message}</div>
        ))}
      </div>
    </div>
  );
}
