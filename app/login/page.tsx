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

import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

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
      const res = await api.post("/login", { registrationNumber });

      // --- CASE 1: ADMIN (OTP DIKIRIM)
      if (res.data.message === "OTP sent") {
        router.push(`/otp?registrationNumber=${registrationNumber}`);
        return;
      }

      // --- CASE 2: PESERTA
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        router.push("/dashboard");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Login Peserta / Admin
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-800">Registration Number</label>
            <input
              type="text"
              className="w-full p-3 rounded border"
              placeholder="Contoh: PST-1001"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
