// // AdminDashboard.tsx
// "use client";
// import Link from "next/link";
// import { useEffect, useState } from "react";

// export default function AdminDashboard() {
//   const [tests, setTests] = useState([]);
//   const [attempts, setAttempts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   async function fetchData() {
//     try {
//       const t = await fetch("http://localhost:4000/api/admin/tests").then((r) => r.json());
//       const a = await fetch("http://localhost:4000/api/admin/attempts").then((r) => r.json());
//       setTests(t);
//       setAttempts(a);
//     } catch (err) {
//       console.error(err);
//     }
//     setLoading(false);
//   }

//   useEffect(() => {
//     fetchData();
//   }, []);

//   if (loading) return <p className="p-4">Loading...</p>;

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-2xl font-bold">Admin Dashboard</h1>

//       {/* SECTION: Actions */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <Link href="/dashboard/admin/tests/add" className="p-4 border rounded-xl shadow hover:bg-gray-50">
//           ➕ Tambah Test
//         </Link>

//         <Link href="/dashboard/admin/tests" className="p-4 border rounded-xl shadow hover:bg-gray-50">
//           📚 List Test
//         </Link>

//         <Link href="/dashboard/admin/attempts" className="p-4 border rounded-xl shadow hover:bg-gray-50">
//           🧪 Lihat Attempt
//         </Link>
//       </div>

//       {/* SECTION: Tests */}
//       <div className="mt-10">
//         <h2 className="text-xl font-semibold mb-3">📚 Daftar Test</h2>
//         <div className="space-y-3">
//           {tests.map((t: any) => (
//             <div key={t.id} className="border p-4 rounded-xl">
//               <div className="font-bold">{t.title}</div>
//               <div className="text-sm text-gray-600">{t.description}</div>

//               <div className="flex gap-4 mt-3">
//                 <Link href={`/dashboard/admin/tests/${t.id}`} className="text-blue-600 underline">
//                   Detail & Soal
//                 </Link>
//                 <Link href={`/dashboard/admin/tests/${t.id}/questions/add`} className="text-green-600 underline">
//                   Tambah Soal
//                 </Link>
//                 <Link href={`/dashboard/admin/tests/${t.id}/delete`} className="text-red-600 underline">
//                   Hapus Test
//                 </Link>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* SECTION: Attempts */}
//       {/* <div className="mt-16">
//         <h2 className="text-xl font-semibold mb-3">🧪 Attempt Peserta</h2>
//         <div className="space-y-3">
//           {attempts.map((a: any) => (
//             <div key={a.id} className="border p-4 rounded-xl">
//               <div className="font-bold">Attempt ID #{a.id}</div>
//               <div className="text-sm">User ID: {a.userId}</div>
//               <div className="text-sm">Test ID: {a.testId}</div>
//               <div className="text-sm">Score: {a.score ?? "Belum dinilai"}</div>

//               <div className="flex gap-4 mt-3">
//                 <Link href={`/admin/attempts/${a.id}`} className="text-blue-600 underline">
//                   Detail Attempt
//                 </Link>
//                 <Link href={`/admin/attempts/${a.id}/score`} className="text-green-600 underline">
//                   Nilai Essay
//                 </Link>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div> */}

//       {/* SECTION: Attempts */}
//       <div className="mt-16">
//         <h2 className="text-xl font-semibold mb-3">🧪 Attempt Peserta</h2>

//         <div className="grid grid-cols-1 gap-4">
//           <Link href="/dashboard/admin/attempts" className="p-4 border rounded-xl shadow hover:bg-gray-50 block">
//             🔍 Lihat Semua Attempt
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }

