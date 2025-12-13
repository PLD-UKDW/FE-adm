"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CamabaDashboardPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [tRes, sRes] = await Promise.all([
          fetch("http://localhost:4000/api/test", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch("http://localhost:4000/api/test/status", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ]);

        if (tRes.status === 401 || sRes.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const testList = await tRes.json();
        const stats = await sRes.json();

        setTests(testList);
        setStatus(stats ?? { doneTypes: [] });
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) return <p className="p-6">Memuat...</p>;

  const checkDone = (testType: string) => {
    return status?.doneTypes?.includes(testType);
  };

  const imgs: Record<string, string> = {
    DIGITAL_LITERACY: "/digital-literacy-test.png",
    COLLEGE_READINESS: "/college-readiness-test.png",
    DEFAULT: "/test.png",
  };

  // ====== AMBIL HASIL TEST YANG SUDAH DIKERJAKAN ======
  const finishedTests = tests.filter((t) => checkDone(t.type));

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto text-black">
      <h1 className="text-3xl font-bold mb-6">Pilihan Test</h1>

      {/* ====== DAFTAR TEST ====== */}
      <div className="grid md:grid-cols-2 gap-6">
        {tests.map((t) => {
          const isDone = checkDone(t.type);
          const imgSrc = imgs[t.type] ?? imgs.DEFAULT;

          return (
            <div key={t.id} className="border rounded-xl shadow-sm p-6 hover:shadow-md transition bg-white">
              <img src={imgSrc} alt={t.title} className="w-full h-48 object-contain mb-4" />

              <h2 className="text-xl font-semibold">{t.title}</h2>
              <p className="text-gray-600 mt-1">{t.description}</p>

              {/* BADGE STATUS */}
              <p
                className={`mt-3 inline-block px-3 py-1 text-sm rounded-full 
                ${isDone ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {isDone ? "Sudah mengerjakan" : "Belum mengerjakan"}
              </p>

              {/* TOMBOL MULAI — HILANG SETELAH SELESAI */}
              {!isDone && (
                <button onClick={() => router.push(`/test/${t.id}`)} className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Mulai Mengerjakan
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/*                      BAGIAN HASIL TEST                    */}
      {/* ========================================================= */}
      {finishedTests.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Hasil Test Kamu</h2>

          <div className="space-y-4">
            {finishedTests.map((t) => (
              <div key={t.id} className="border p-4 rounded-lg bg-white shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">{t.title}</p>
                  <p className="text-gray-600 text-sm">Klik untuk melihat nilai & detail jawaban</p>
                </div>

                <button onClick={() => router.push(`/test/${t.id}/result?attemptId=${t.latestAttemptId}`)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Lihat Hasil
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
