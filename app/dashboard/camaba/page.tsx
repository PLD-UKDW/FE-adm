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
          }),
          fetch("http://localhost:4000/api/test/status", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // kalau token invalid
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

  const checkStatus = (testType: string) => {
    if (!status) return "Belum mengerjakan";
    return status.doneTypes?.includes(testType)
      ? "Sudah mengerjakan"
      : "Belum mengerjakan";
  };

  const imgs: Record<string, string> = {
    DIGITAL_LITERACY: "/digital.png",
    COLLEGE_READINESS: "/college.png",
    DEFAULT: "/test.png",
  };

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Pilihan Test</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {tests.map((t) => {
          const testStatus = checkStatus(t.type);
          const imgSrc = imgs[t.type] ?? imgs.DEFAULT;

          return (
            <div
              key={t.id}
              className="border rounded-xl shadow-sm p-6 hover:shadow-md transition bg-white"
            >
              <img
                src={imgSrc}
                alt={t.title}
                className="w-full h-48 object-contain mb-4"
              />

              <h2 className="text-xl font-semibold">{t.title}</h2>
              <p className="text-gray-600 mt-1">{t.description}</p>

              {/* Status Badge */}
              <p
                className={`mt-3 inline-block px-3 py-1 text-sm rounded-full 
                ${
                  testStatus === "Sudah mengerjakan"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {testStatus}
              </p>

              {/* Tombol aksi */}
              <button
                onClick={() => router.push(`/test/${t.id}`)}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {testStatus === "Sudah mengerjakan"
                  ? "Lihat Hasil"
                  : "Mulai Test"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
