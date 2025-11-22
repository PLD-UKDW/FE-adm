// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function TestListPage() {
//   const [tests, setTests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) return router.push("/login");

//     fetch("http://localhost:4000/api/test", {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then((data) => setTests(data))
//       .finally(() => setLoading(false));
//   }, [router]);

//   if (loading) return <p className="p-6">Memuat...</p>;

//   return (
//     <div className="p-6">
//       <h1 className="text-xl font-semibold mb-4">Daftar Tes</h1>
//       <ul className="space-y-3">
//         {tests.map((t: any) => (
//           <li
//             key={t.id}
//             className="border p-4 rounded hover:bg-gray-50 cursor-pointer"
//             onClick={() => router.push(`/test/${t.id}`)}
//           >
//             <h2 className="font-medium">{t.title}</h2>
//             <p className="text-sm text-gray-600">{t.description}</p>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
