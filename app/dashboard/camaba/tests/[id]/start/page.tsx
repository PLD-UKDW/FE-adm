// "use client";

// import { useParams, useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// export default function CamabaTestStart() {
//   const { testId } = useParams();
//   const router = useRouter();

//   const [test, setTest] = useState<any>(null);
//   const [answers, setAnswers] = useState<any>({});
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);

//   // Fetch test detail
//   useEffect(() => {
//     fetch(`http://localhost:4000/api/public/tests/${testId}`)
//       .then(res => res.json())
//       .then(data => {
//         setTest(data);
//         setLoading(false);
//       });
//   }, [testId]);

//   const handleAnswerChange = (questionId: number, value: string) => {
//     setAnswers((prev: any) => ({
//       ...prev,
//       [questionId]: value
//     }));
//   };

//   const handleSubmit = async () => {
//     setSubmitting(true);

//     const payload = {
//       testId: Number(testId),
//       answers: Object.entries(answers).map(([questionId, answer]) => ({
//         questionId: Number(questionId),
//         answer
//       }))
//     };

//     const res = await fetch("http://localhost:4000/api/camaba/submit-test", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload)
//     });

//     const result = await res.json();
//     setSubmitting(false);

//     if (res.ok) {
//       alert("Jawaban berhasil dikumpulkan!");
//       router.push("/dashboard/camaba/tests");
//     } else {
//       alert("Gagal submit: " + result.message);
//     }
//   };

//   if (loading) return <p className="p-6">Memuat...</p>;
//   if (!test) return <p className="p-6">Test tidak ditemukan.</p>;

//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <h1 className="text-3xl font-bold">{test.title}</h1>
//       <p className="text-gray-600 mb-6">{test.description}</p>

//       {test.questions.map((q: any, idx: number) => (
//         <div key={q.id} className="mb-6 p-4 border rounded-lg">
//           <p className="font-semibold mb-2">
//             {idx + 1}. {q.text}
//           </p>

//           {/* MULTIPLE CHOICE */}
//           {q.questionType === "MULTIPLE_CHOICE" && (
//             <div className="space-y-2">
//               {q.options.map((opt: string, i: number) => (
//                 <label key={i} className="flex items-center gap-2">
//                   <input
//                     type="radio"
//                     name={`question-${q.id}`}
//                     value={opt}
//                     onChange={(e) =>
//                       handleAnswerChange(q.id, e.target.value)
//                     }
//                   />
//                   <span>{opt}</span>
//                 </label>
//               ))}
//             </div>
//           )}

//           {/* ESSAY */}
//           {q.questionType === "ESSAY" && (
//             <textarea
//               className="w-full border rounded p-2 mt-2"
//               rows={4}
//               placeholder="Tulis jawaban Anda..."
//               onChange={(e) => handleAnswerChange(q.id, e.target.value)}
//             />
//           )}
//         </div>
//       ))}

//       <button
//         disabled={submitting}
//         onClick={handleSubmit}
//         className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//       >
//         {submitting ? "Mengirim..." : "Kumpulkan Jawaban"}
//       </button>
//     </div>
//   );
// }
