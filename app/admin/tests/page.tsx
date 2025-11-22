// "use client";
// import { useEffect, useState } from "react";
// import api from "@/lib/api";

// export default function ListTestPage() {
//   const [tests, setTests] = useState([]);

//   useEffect(() => {
//     api.get("/test")
//       .then(res => setTests(res.data))
//       .catch(err => console.error(err));
//   }, []);

//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">List Test</h1>
//       <a href="/admin/tests/add" className="px-4 py-2 bg-blue-600 text-white rounded">Tambah Test</a>

//       <div className="mt-6 space-y-4">
//         {tests.map((t: any) => (
//           <div key={t.id} className="p-4 border rounded">
//             <h2 className="font-semibold">{t.title}</h2>
//             <p>{t.description}</p>

//             <div className="mt-2 flex gap-2">
//               <a href={`/admin/tests/${t.id}`} className="btn">Detail</a>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

