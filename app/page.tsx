// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import api from "../lib/api";

// export default function LoginPage() {
//   const [registrationNumber, setRegistrationNumber] = useState("");
//   const [error, setError] = useState("");
//   const router = useRouter();

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const res = await api.post("/login", { registrationNumber });
//       const token = res.data.token;
//       localStorage.setItem("token", token);
//       router.push("/dashboard");
//     } catch (err: any) {
//       setError(err.response?.data?.message || "Login gagal, periksa nomor pendaftaran.");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <form
//         onSubmit={handleLogin}
//         className="bg-white p-6 rounded-xl shadow-md w-80"
//       >
//         <h1 className="text-xl font-bold mb-4 text-center">Login Peserta</h1>
//         <input
//           type="text"
//           placeholder="Nomor Pendaftaran"
//           value={registrationNumber}
//           onChange={(e) => setRegistrationNumber(e.target.value)}
//           className="border w-full px-3 py-2 rounded mb-3"
//           required
//         />
//         <button
//           type="submit"
//           className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
//         >
//           Login
//         </button>
//         {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
//       </form>
//     </div>
//   );
// }



"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // 🔹 1. Kirim request login
      const res = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login gagal");

      // 🔹 2. Simpan data ke localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const userRole = data.user?.role;

      // 🔹 3. Jika ADMIN → verifikasi token
      if (userRole === "ADMIN") {
        const verifyRes = await fetch("http://localhost:4000/api/verify-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: data.token }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyData.valid) {
          throw new Error("Token admin tidak valid. Silakan login ulang.");
        }

        router.push("/dashboard/admin");
      } else if (userRole === "PARTICIPANT") {
        // 🔹 4. Jika peserta, langsung ke dashboard mahasiswa
        router.push("/dashboard/camaba");
      } else {
        throw new Error("Role tidak dikenali.");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat login.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-semibold mb-4 text-center">Login</h1>
        {error && (
          <p className="text-red-600 text-sm mb-3 text-center">{error}</p>
        )}
        <input
          type="text"
          placeholder="Nomor Pendaftaran"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          className="w-full text-black p-2 border rounded mb-4"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
