// "use client";
// import { useState } from "react";
// import api from "@/lib/api";

// export default function AddTestPage() {
//   const [title, setTitle] = useState("");
//   const [type, setType] = useState("PILGAN");
//   const [description, setDescription] = useState("");

//   const handleSubmit = async () => {
//     try {
//       await api.post("/admin/tests", {
//         title,
//         type,
//         description,
//       });

//       window.location.href = "/admin/tests";
//     } catch (err: any) {
//       console.error("Error:", err.response?.data || err);
//       alert("Gagal menambahkan test. Cek backend route.");
//     }
//   };

//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Tambah Test</h1>

//       <div className="flex flex-col gap-3">
//         <input
//           className="input"
//           placeholder="Judul Test"
//           onChange={(e) => setTitle(e.target.value)}
//         />

// <select className="input" onChange={(e) => setType(e.target.value)}>
//   <option value="DIGITAL_LITERACY">Digital Literacy</option>
//   <option value="COLLEGE_READINESS">College Readiness</option>
// </select>


//         <textarea
//           className="input"
//           placeholder="Deskripsi"
//           onChange={(e) => setDescription(e.target.value)}
//         />

//         <button
//           onClick={handleSubmit}
//           className="px-4 py-2 bg-blue-600 text-white rounded"
//         >
//           Simpan
//         </button>
//       </div>
//     </div>
//   );
// }
