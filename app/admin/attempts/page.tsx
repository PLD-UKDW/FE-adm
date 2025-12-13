// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";

// export default function AttemptListPage() {
//   const [attempts, setAttempts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function fetchAttempts() {
//       const res = await fetch("http://localhost:4000/api/admin/attempts");
//       const data = await res.json();
//       setAttempts(data);
//       setLoading(false);
//     }
//     fetchAttempts();
//   }, []);

//   if (loading) return <p className="p-6">Loading...</p>;

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <h1 className="text-2xl font-bold mb-6">Daftar Attempt</h1>

//       <div className="space-y-4">
//         {attempts.map((a: any) => (
//           <div key={a.id} className="border p-4 rounded-xl shadow-sm">
//             <div className="font-semibold text-lg">
//               {a.user?.name} ({a.user?.registrationNumber})
//             </div>
//             <div className="text-gray-600 text-sm">{a.test?.title}</div>
//             <div className="mt-2 text-sm">
//               Score: <b>{a.score ?? "Belum dinilai"}</b>
//             </div>

//             <Link
//               href={`/dashboard/admin/attempts/${a.id}`}
//               className="mt-3 inline-block text-blue-600 underline"
//             >
//               Lihat Detail Attempt →
//             </Link>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }



// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";

// type Attempt = { id: number; user: { id: number; name: string }; test: { id: number; title: string }; score?: number | null; completedAt?: string | null };

// export default function Attempts() {
//   const [attempts, setAttempts] = useState<Attempt[]>([]);
//   const [loading, setLoading] = useState(true);
//   const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

//   useEffect(() => {
//     async function load() {
//       try {
//         const res = await fetch(`${API}/api/admin/attempts`);
//         if (!res.ok) throw new Error(await safeText(res));
//         const data = await res.json();
//         setAttempts(Array.isArray(data) ? data : []);
//       } catch (err) {
//         console.error("load attempts error:", err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, [API]);

//   if (loading) return <div className="p-6">Loading attempts...</div>;

//   return (
//     <div className="p-6">
//       <h1 className="text-xl font-bold mb-4">Daftar Attempts</h1>

//       {attempts.length === 0 && <p className="text-gray-500">Belum ada attempt.</p>}
//       <div className="space-y-2">
//         {attempts.map(a => (
//           <Link key={a.id} href={`/admin/attempts/${a.id}`} className="block p-4 border rounded hover:bg-gray-50">
//             <p className="font-bold">{a.user.name}</p>
//             <p className="text-sm">{a.test.title}</p>
//             <p className="text-sm text-gray-600">Score: {a.score ?? "Belum dinilai"}</p>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// }

// async function safeText(res: Response) {
//   try { return await res.text(); } catch { return `HTTP ${res.status}`; }
// }
