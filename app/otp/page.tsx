"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export default function OTPPage() {
  const router = useRouter();
  const params = useSearchParams();

  const registrationNumber = params.get("registrationNumber") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/verify-admin", {
        registrationNumber,
        otp,
      });

      localStorage.setItem("token", res.data.token);

      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (!registrationNumber) return <div>Invalid session.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-xl font-bold mb-6 text-center">Masukkan OTP</h1>

        <p className="mb-4 text-sm text-gray-600 text-center">
          OTP dikirim ke email admin.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            className="w-full p-3 rounded border"
            placeholder="Masukkan 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 transition disabled:bg-gray-400"
          >
            {loading ? "Checking..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
