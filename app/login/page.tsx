// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function LoginPage() {
//   const [registrationNumber, setRegistrationNumber] = useState("");
//   const [error, setError] = useState("");
//   const router = useRouter();

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const res = await fetch("http://localhost:4000/api/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ registrationNumber }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Login gagal");

//       localStorage.setItem("token", data.token);
//       localStorage.setItem("user", JSON.stringify(data.user));

//       if (data.user.role === "ADMIN") {
//         router.push("/dashboard/admin");
//       } else {
//         router.push("/dashboard/camaba");
//       }
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-50">
//       <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
//         <h1 className="text-2xl font-semibold mb-4 text-center">Login</h1>

//         {error && <p className="text-red-600 text-sm mb-3 text-center">{error}</p>}

//         <input
//           type="text"
//           placeholder="Nomor Pendaftaran"
//           value={registrationNumber}
//           onChange={(e) => setRegistrationNumber(e.target.value)}
//           className="w-full text-black p-2 border rounded mb-4"
//           required
//         />

//         <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
//           Login
//         </button>
//       </form>
//     </div>
//   );
// }

"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/login", { registrationNumber });

      // --- CASE 1: ADMIN (OTP DIKIRIM)
      if (res.data.message === "OTP sent") {
        router.push(`/otp?registrationNumber=${registrationNumber}`);
        return;
      }

      // --- CASE 2: PESERTA
      if (res.data.token) {
        // cek role dari server
        const role = res.data.user?.role;

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        if (role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
        return;
      }

      setError("Unexpected response from server");

    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#8db93f] min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#108607] rounded-2xl shadow-xl p-10">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logo/logould.png"
            width={120}
            height={120}
            alt="Logo"
            className="invert brightness-0"
          />
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Welcome Back!
        </h1>

        <p className="text-white/90 text-center mb-8 px-4">
          Please sign in to your account by completing the necessary fields below
        </p>

        {/* FORM LOGIN */}
        <form onSubmit={handleLogin} className="mt-4">
          <label className="text-white text-sm mb-2 block">
            Nomor Registrasi
          </label>
          <input
            type="text"
            name="registrationNumber"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="Masukkan Nomor Registrasi Anda"
            className="w-full px-4 py-3 mb-6 rounded-lg border border-white/60 bg-white/10 text-white placeholder-white/70 focus:border-white"
          />

          {error && (
            <p className="mb-3 text-center text-sm text-red-300">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-[#108607] py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-70 flex items-center justify-center gap-2"
          >
            Sign In
            {loading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#108607] border-t-transparent" />
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
