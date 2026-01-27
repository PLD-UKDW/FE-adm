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

import api from "@/lib/api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

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

      if (res.data.message === "OTP sent") {
        document.cookie = `authStage=otp; path=/; max-age=600`; // 10 min
        document.cookie = `pendingRegNumber=${registrationNumber}; path=/; max-age=600`;
        router.push(`/otp?registrationNumber=${registrationNumber}`);
        return;
      }

      if (res.data.token) {
        const role = res.data.user?.role;

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        // Set cookies for middleware
        document.cookie = `authToken=${res.data.token}; path=/; max-age=86400`; // 1 day
        document.cookie = `role=${role}; path=/; max-age=86400`;

        if (role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          // Redirect non-admin users back to FrontEnd Digital Literacy Test
          window.location.href = "http://localhost:3000/dashboard/camaba";
        }
        return;
      }

      setError("Unexpected response from server");
    } catch (err: unknown) {
      let message = "Login failed";
      if (typeof err === "object" && err !== null) {
        const maybeResp = err as { response?: { data?: { message?: string } } };
        message = maybeResp.response?.data?.message || (err instanceof Error ? err.message : message);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#8db93f] min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#108607] rounded-2xl shadow-xl p-10">
        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <Image src="/logo/logould.png" width={120} height={120} alt="Logo" className="invert brightness-0" />
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-2">Welcome Back!</h1>

        <p className="text-white/90 text-center mb-8 px-4">Please sign in to your account by completing the necessary fields below</p>

        {/* FORM LOGIN */}
        <form onSubmit={handleLogin} className="mt-4">
          <label className="text-white text-sm mb-2 block">Nomor Registrasi</label>
          <input
            type="text"
            name="registrationNumber"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="Masukkan Nomor Registrasi Anda"
            className="w-full px-4 py-3 mb-6 rounded-lg border border-white/60 bg-white/10 text-white placeholder-white/70 focus:border-white"
          />

          {error && <p className="mb-3 text-center text-sm text-red-300">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-white text-[#108607] py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-70 flex items-center justify-center gap-2">
            Sign In
            {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#108607] border-t-transparent" />}
          </button>

          <button
            type="button"
            onClick={() => {
              // clear pending cookies if any
              document.cookie = "authStage=; Max-Age=0; path=/";
              document.cookie = "pendingRegNumber=; Max-Age=0; path=/";
              window.location.href = FRONTEND_URL;
            }}
            className="mt-3 w-full border border-white/60 text-white py-3 rounded-lg font-semibold hover:bg-white/10 transition"
          >
            Kembali ke Halaman Utama
          </button>
        </form>
      </div>
    </div>
  );
}
