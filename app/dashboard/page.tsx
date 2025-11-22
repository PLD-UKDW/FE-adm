// "use client";

// import { useEffect, useState } from "react";
// import api from "@/lib/api";
// import { useRouter } from "next/navigation";

// interface TestItem {
//   id: number;
//   title: string;
//   description: string;
//   type: string;
// }

// interface StatusItem {
//   testId: number;
//   isCompleted: boolean;
//   score: number | null;
// }

// export default function DashboardPeserta() {
//   const router = useRouter();
//   const [tests, setTests] = useState<TestItem[]>([]);
//   const [status, setStatus] = useState<StatusItem[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       router.push("/login");
//       return;
//     }

//     fetchData(token);
//   }, []);

//   const fetchData = async (token: string) => {
//     try {
//       const [testRes, statusRes] = await Promise.all([
//         api.get("/test", {
//           headers: { Authorization: `Bearer ${token}` },
//         }),
//         api.get("/test/status", {
//           headers: { Authorization: `Bearer ${token}` },
//         }),
//       ]);

//       const testsData = testRes.data;
//       const statusData = statusRes.data;

//       setTests(testsData);

//       // Convert backend status → frontend format
//       const converted = testsData.map((t: TestItem) => ({
//         testId: t.id,
//         isCompleted: statusData.doneTypes.includes(t.type),
//         score: null, // backend belum kirim skor, nanti bisa ditambah
//       }));

//       setStatus(converted);

//     } catch (err) {
//       console.log(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatus = (testId: number) => {
//     return status.find((s) => s.testId === testId) || {
//       isCompleted: false,
//       score: null,
//     };
//   };

//   if (loading)
//     return (
//       <div className="h-screen flex justify-center items-center text-lg">
//         Loading...
//       </div>
//     );

//   return (
//     <div className="min-h-screen bg-gray-100 p-6">
//       <h1 className="text-2xl font-bold mb-6">
//         Selamat Datang di Dashboard Peserta
//       </h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {tests.map((test) => {
//           const s = getStatus(test.id);

//           return (
//             <div
//               key={test.id}
//               className="bg-white p-5 rounded-xl shadow"
//             >
//               <h2 className="text-xl font-semibold">{test.title}</h2>
//               <p className="text-gray-600 mt-1">{test.description}</p>

//               {s.isCompleted ? (
//                 <div className="mt-3 text-green-600 font-medium">
//                   ✔ Sudah dikerjakan  
//                 </div>
//               ) : (
//                 <button
//                   onClick={() => router.push(`/test/${test.id}`)}
//                   className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
//                 >
//                   Kerjakan Sekarang
//                 </button>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
