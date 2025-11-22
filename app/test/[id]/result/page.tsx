"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResultPage() {
  const params = useSearchParams();
  const score = params.get("score") ?? "0";
  const pathname = usePathname();
  const id = pathname?.split("/")[2] ?? "";
  const router = useRouter();

  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("No token found");
      return;
    }

    let mounted = true;
    setLoading(true);

    const fetchAttempt = async () => {
      try {
        const url = id ? `http://localhost:4000/api/test/status?testId=${id}` : `http://localhost:4000/api/test/status`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted) setAttempt(data);
      } catch (err: any) {
        if (mounted) setError(err?.message ?? "Failed to fetch attempt");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAttempt();
    return () => {
      mounted = false;
    };
  }, [id]);

  const downloadPDF = async () => {
    try {
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule?.default ?? jsPDFModule;
      const doc = new jsPDF();
      doc.text("Hasil Test", 10, 10);
      doc.text("Score: " + score, 10, 20);
      doc.save("hasil-test.pdf");
    } catch (err) {
      console.error("Failed to generate PDF", err);
    }
  };

  const goBackDashboard = () => {
    router.push("/dashboard/camaba"); // arahkan sesuai rute dashboard kamu
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Score Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <p className="text-lg font-semibold text-gray-600">Skor Anda</p>
        <p className="text-6xl font-extrabold mt-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-transparent bg-clip-text">{score}</p>

        {loading ? (
          <p className="mt-4 text-gray-600">Loading...</p>
        ) : error ? (
          <p className="mt-4 text-red-600 font-medium">{error}</p>
        ) : attempt ? (
          <div className="mt-6 space-y-3">
            <p className="text-gray-700">
              <span className="font-semibold">Attempt ID:</span> {attempt.id ?? attempt.attemptId ?? "-"}
            </p>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Status:</span>

              <span className={`px-3 py-1 text-sm font-medium rounded-full ${attempt.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{attempt.status ?? "-"}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Download PDF Button */}
      <button onClick={downloadPDF} className="mt-8 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all">
        Download PDF Hasil
      </button>

      {/* Back to Dashboard Button */}
      <button onClick={goBackDashboard} className="mt-4 w-full py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow-sm hover:bg-gray-300 transition-all">
        Kembali ke Dashboard Camaba
      </button>
    </div>
  );
}
