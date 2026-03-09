"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { speak, getSpeedLabel } from "@/components/TTSControl";

/* =====================================================
   DO TEST PAGE – SCREEN READER FIRST
===================================================== */

export default function DoTestPage() {
  const { id } = useParams();
  const router = useRouter();

  /* ==========================
     DATA STATE
  ========================== */
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  /* ==========================
     ACCESSIBILITY
  ========================== */
  const [useTTS, setUseTTS] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [optionIndex, setOptionIndex] = useState(0);
  const [isTypingEssay, setIsTypingEssay] = useState(false);
  const [lastArrowLeftTime, setLastArrowLeftTime] = useState(0);
  const [lastSpaceTime, setLastSpaceTime] = useState(0);
  const essayRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);
  const showConfirmRef = useRef(false);
  const arrowLeftTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spaceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const introSpokenRef = useRef(false);

  /* ==========================
     HELPER: GET LETTER LABEL
  ========================== */
  const getLetter = useCallback((index: number, uppercase = true) => {
    const letter = String.fromCharCode(65 + index); // A=65, B=66, etc.
    return uppercase ? letter : letter.toLowerCase();
  }, []);

  /* ==========================
     HELPER: SPEAK SINGLE CHAR
  ========================== */
  const speakChar = (char: string) => {
    if (!useTTS) return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    // Map special characters to readable text
    const charMap: Record<string, string> = {
      " ": "spasi",
      ".": "titik",
      ",": "koma",
      "!": "tanda seru",
      "?": "tanda tanya",
      ":": "titik dua",
      ";": "titik koma",
      "'": "kutip satu",
      '"': "kutip dua",
      "(": "kurung buka",
      ")": "kurung tutup",
      "-": "strip",
      _: "garis bawah",
      "/": "garis miring",
      "\\": "backslash",
      "@": "at",
      "#": "hashtag",
      $: "dollar",
      "%": "persen",
      "&": "dan",
      "*": "bintang",
      "+": "tambah",
      "=": "sama dengan",
      "<": "kurang dari",
      ">": "lebih dari",
      "\n": "enter",
    };

    const text = charMap[char] || char;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    // Gunakan rate yang tersimpan
    u.rate = Number(localStorage.getItem("tts:rate") || 1);
    window.speechSynthesis.speak(u);
  };

  // Sync ref dengan state
  useEffect(() => {
    isTypingRef.current = isTypingEssay;
  }, [isTypingEssay]);

  /* =====================================================
     CHANGE SPEECH SPEED
  ===================================================== */
  const changeSpeed = (delta: number) => {
    setCurrentSpeed((prev) => {
      const next = Math.min(2, Math.max(0.5, prev + delta));
      localStorage.setItem("tts:rate", String(next));

      // Speak feedback
      if (useTTS && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u1 = new SpeechSynthesisUtterance("Kecepatan suara diubah.");
        u1.lang = "id-ID";
        u1.rate = next;
        const u2 = new SpeechSynthesisUtterance(`Kecepatan sekarang ${next.toFixed(1)}`);
        u2.lang = "id-ID";
        u2.rate = next;
        window.speechSynthesis.speak(u1);
        window.speechSynthesis.speak(u2);
      }

      return next;
    });
  };

  useEffect(() => {
    showConfirmRef.current = showConfirmPopup;
  }, [showConfirmPopup]);

  /* =====================================================
     🔊 SPEECH ENGINE
  ===================================================== */
  const speakQueue = (texts: string[]) => {
    if (!useTTS) return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    // Gunakan rate yang tersimpan
    const savedRate = Number(localStorage.getItem("tts:rate") || 1);

    texts.forEach((text) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "id-ID";
      u.rate = savedRate;
      window.speechSynthesis.speak(u);
    });
  };

  /* =====================================================
     🔊 SPEECH QUEUE WITH PROMISE (WAIT UNTIL FINISH)
  ===================================================== */
  const speakQueueAndWait = useCallback(
    (texts: string[]): Promise<void> => {
      return new Promise((resolve) => {
        if (!useTTS || !("speechSynthesis" in window)) {
          resolve();
          return;
        }

        window.speechSynthesis.cancel();

        // Gunakan rate yang tersimpan
        const savedRate = Number(localStorage.getItem("tts:rate") || 1);

        if (texts.length === 0) {
          resolve();
          return;
        }

        texts.forEach((text, index) => {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "id-ID";
          u.rate = savedRate;

          // Resolve when the last utterance ends
          if (index === texts.length - 1) {
            u.onend = () => resolve();
            u.onerror = () => resolve();
          }

          window.speechSynthesis.speak(u);
        });
      });
    },
    [useTTS],
  );

  /* ==========================
     FETCH TEST
  ========================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setUseTTS(localStorage.getItem("accessMode") !== "no-tts");

    // Load saved speed preference
    const savedSpeed = Number(localStorage.getItem("tts:rate") || 1);
    setCurrentSpeed(savedSpeed);

    api
      .get(`/api/test/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((r) => {
        setTest(r.data);
        setQuestions(r.data.questions || []);
      })
      .catch((err) => {
        console.error("Gagal mengambil data tes:", err);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  /* =====================================================
     READ QUESTION (defined before useEffect that uses it)
  ===================================================== */
  const readQuestion = useCallback(
    async (index: number, questionsData?: any[]) => {
      const questionsToUse = questionsData || questions;
      const q = questionsToUse[index];
      if (!q) return;

      const queue: string[] = [`Soal ${index + 1}. ...`, `${q.text} ...`];

      if (q.questionType === "MULTIPLE_CHOICE") {
        q.options.forEach((opt: string, i: number) => {
          const label = getLetter(i);
          queue.push(`Pilihan ${label}. ... ${opt} ...`);
        });

        queue.push("Gunakan panah atas dan bawah untuk memilih jawaban. ... Tekan enter untuk memilih.");
      } else if (q.questionType === "CHECKBOX") {
        q.options.forEach((opt: string, i: number) => {
          const label = getLetter(i);
          queue.push(`Pilihan ${label}. ... ${opt} ...`);
        });

        queue.push("Soal checklist. ... Gunakan panah atas dan bawah untuk navigasi. ... Tekan enter untuk mencentang atau menghapus centang.");
      } else {
        queue.push("Soal esai. ... Tekan enter untuk mengetik jawaban Anda. ... Tekan escape untuk keluar dari mode mengetik.");
      }

      await speakQueueAndWait(queue);
    },
    [questions, speakQueueAndWait, getLetter],
  );

  /* =====================================================
     INTRO + SOAL PERTAMA
  ===================================================== */
  useEffect(() => {
    if (loading || !test || !questions.length || !useTTS) return;

    // Prevent multiple intro reads due to dependency changes
    if (introSpokenRef.current) return;

    // Delay untuk memastikan TTS halaman sebelumnya sudah selesai
    const timeout = setTimeout(async () => {
      // Mark as spoken INSIDE timeout so it's set after timeout runs
      introSpokenRef.current = true;

      // Pastikan tidak ada TTS yang berjalan dari halaman sebelumnya
      window.speechSynthesis.cancel();

      // Gabungkan intro DAN soal pertama dalam satu queue agar tidak ada cancel
      const q = questions[0];
      const introAndFirstQuestion: string[] = [
        `Anda mengerjakan ${test.title}.`,
        `Ada ${questions.length} soal.`,
        "Panah kiri atau kanan untuk pindah soal.",
        "Panah atas atau bawah untuk pilih jawaban.",
        "Tekan enter untuk memilih.",
        "Tekan F untuk membaca ulang soal.",
        "Tekan panah kiri dua kali untuk ulang instruksi.",
        "Gunakan Shift panah atas untuk mempercepat suara, atau Shift panah bawah untuk memperlambat.",
        "Soal pertama.",
        `Soal 1. ...`,
        `${q.text} ...`,
      ];

      // Tambahkan opsi soal pertama
      if (q.questionType === "MULTIPLE_CHOICE") {
        q.options.forEach((opt: string, i: number) => {
          const label = getLetter(i);
          introAndFirstQuestion.push(`Pilihan ${label}. ... ${opt} ...`);
        });
        introAndFirstQuestion.push("Gunakan panah atas dan bawah untuk memilih jawaban. ... Tekan enter untuk memilih.");
      } else if (q.questionType === "CHECKBOX") {
        q.options.forEach((opt: string, i: number) => {
          const label = getLetter(i);
          introAndFirstQuestion.push(`Pilihan ${label}. ... ${opt} ...`);
        });
        introAndFirstQuestion.push("Soal checklist. ... Gunakan panah atas dan bawah untuk navigasi. ... Tekan enter untuk mencentang atau menghapus centang.");
      } else {
        introAndFirstQuestion.push("Soal esai. ... Tekan enter untuk mengetik jawaban Anda. ... Tekan escape untuk keluar dari mode mengetik.");
      }

      await speakQueueAndWait(introAndFirstQuestion);
    }, 500);

    return () => clearTimeout(timeout);
  }, [loading, test, questions, useTTS, getLetter, speakQueueAndWait]);

  /* =====================================================
     KEYBOARD NAVIGATION (TTS MODE)
  ===================================================== */
  useEffect(() => {
    if (!useTTS || !questions.length) return;

    const handler = (e: KeyboardEvent) => {
      // Jika popup konfirmasi muncul, abaikan keyboard navigation
      if (showConfirmRef.current) return;

      // Jika sedang mengetik essay, abaikan keyboard navigation
      if (isTypingRef.current) return;

      /* SPEED CONTROL - Shift + Arrow Up/Down */
      if (e.shiftKey && e.code === "ArrowUp") {
        e.preventDefault();
        changeSpeed(0.1);
        return;
      }

      if (e.shiftKey && e.code === "ArrowDown") {
        e.preventDefault();
        changeSpeed(-0.1);
        return;
      }

      const q = questions[current];

      // Deteksi double left arrow untuk mengulang instruksi
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        const now = Date.now();

        if (now - lastArrowLeftTime < 500) {
          // Double press detected - ulang instruksi
          // Batalkan timeout navigasi jika ada
          if (arrowLeftTimeoutRef.current) {
            clearTimeout(arrowLeftTimeoutRef.current);
            arrowLeftTimeoutRef.current = null;
          }

          speakQueue([
            "Instruksi penggunaan. ...",
            `Anda sedang mengerjakan soal ${current + 1} dari ${questions.length}. ...`,
            "Gunakan panah kiri dan kanan untuk berpindah soal. ...",
            "Gunakan panah atas dan bawah untuk berpindah jawaban. ...",
            "Tekan enter untuk memilih jawaban. ...",
            "Tekan F untuk membaca ulang soal. ...",
            "Tekan panah kiri dua kali untuk mengulang instruksi ini. ...",
            "Pada soal esai, tekan escape untuk keluar dari mode mengetik. ...",
            "Gunakan Shift panah atas untuk mempercepat suara, atau Shift panah bawah untuk memperlambat.",
          ]);
          setLastArrowLeftTime(0);
          return;
        }

        setLastArrowLeftTime(now);

        // Set timeout untuk navigasi setelah 500ms jika tidak ada double press
        if (arrowLeftTimeoutRef.current) {
          clearTimeout(arrowLeftTimeoutRef.current);
        }

        arrowLeftTimeoutRef.current = setTimeout(() => {
          if (current > 0) {
            // Jika soal sekarang adalah essay dan ada jawaban, bacakan dulu
            if (q.questionType === "ESSAY") {
              const essayAnswer = (answers[q.id] as string) ?? "";
              if (essayAnswer.trim()) {
                speakQueue(["Jawaban essay Anda: ...", essayAnswer]);
                setTimeout(() => {
                  setCurrent((c) => {
                    const prev = c - 1;
                    setOptionIndex(0);
                    setIsTypingEssay(false);
                    setTimeout(() => readQuestion(prev), 2000);
                    return prev;
                  });
                }, 1500);
                return;
              }
            }

            setCurrent((c) => {
              const prev = c - 1;
              setOptionIndex(0);
              setIsTypingEssay(false);
              readQuestion(prev);
              return prev;
            });
          } else {
            // Soal pertama, kembali ke dashboard
            speakQueueAndWait(["Kembali ke halaman utama. ..."]).then(() => {
              router.push("/dashboard/camaba");
            });
          }
          arrowLeftTimeoutRef.current = null;
        }, 500);

        return;
      }

      // PINDAH SOAL
      if (e.code === "ArrowRight") {
        e.preventDefault();

        if (current < questions.length - 1) {
          setCurrent((c) => {
            const next = c + 1;
            setOptionIndex(0);
            setIsTypingEssay(false);
            readQuestion(next);
            return next;
          });
        } else {
          // Soal terakhir, tampilkan popup submit
          setShowConfirmPopup(true);
          speakQueue(["Ini adalah soal terakhir. ...", "Apakah Anda yakin ingin mengirim jawaban? ...", "Tekan Spasi untuk konfirmasi. ...", "Tekan Escape untuk batal."]);
        }
      }

      // Tekan F untuk baca ulang soal
      if (e.code === "KeyF") {
        e.preventDefault();
        readQuestion(current);
        return;
      }

      // MULTIPLE CHOICE
      if (q.questionType === "MULTIPLE_CHOICE") {
        if (e.code === "ArrowDown" || e.code === "ArrowUp") {
          e.preventDefault();

          setOptionIndex((prev) => {
            const next = e.code === "ArrowDown" ? (prev + 1) % q.options.length : (prev - 1 + q.options.length) % q.options.length;

            speakQueue([`Saat ini anda berada di opsi ${next + 1} dari ${q.options.length}. ...`, `Pilihan ${getLetter(next)}. ...`, q.options[next]]);

            return next;
          });
        }

        // Enter untuk memilih jawaban
        if (e.code === "Enter") {
          e.preventDefault();
          const key = getLetter(optionIndex, false);
          setAnswers((prev) => ({ ...prev, [q.id]: key }));
          speakQueue(["Jawaban dipilih. ...", `Pilihan ${getLetter(optionIndex)}.`]);
        }
      }

      // CHECKBOX
      if (q.questionType === "CHECKBOX") {
        if (e.code === "ArrowDown" || e.code === "ArrowUp") {
          e.preventDefault();

          setOptionIndex((prev) => {
            const next = e.code === "ArrowDown" ? (prev + 1) % q.options.length : (prev - 1 + q.options.length) % q.options.length;

            const selected = (answers[q.id] as string[]) || [];
            const isChecked = selected.includes(getLetter(next, false));
            speakQueue([`Saat ini anda berada di opsi ${next + 1} dari ${q.options.length}. ...`, `Pilihan ${getLetter(next)}. ...`, q.options[next], isChecked ? "Sudah dicentang." : "Belum dicentang."]);

            return next;
          });
        }

        // Enter untuk toggle centang
        if (e.code === "Enter") {
          e.preventDefault();
          const key = getLetter(optionIndex, false);
          setAnswers((prev) => {
            const currentAnswers = (prev[q.id] as string[]) || [];
            if (currentAnswers.includes(key)) {
              speakQueue(["Centang dihapus. ...", `Pilihan ${getLetter(optionIndex)}.`]);
              return { ...prev, [q.id]: currentAnswers.filter((k) => k !== key) };
            } else {
              speakQueue(["Dicentang. ...", `Pilihan ${getLetter(optionIndex)}.`]);
              return { ...prev, [q.id]: [...currentAnswers, key] };
            }
          });
        }
      }

      // ESSAY - tekan enter untuk mulai mengetik
      if (q.questionType === "ESSAY" && !isTypingRef.current) {
        // Enter untuk mulai mengetik
        if (e.code === "Enter") {
          e.preventDefault();
          setIsTypingEssay(true);
          speakQueue(["Mode mengetik aktif. ...", "Ketik jawaban Anda. ...", "Tekan Escape untuk keluar dari mode mengetik."]);
          setTimeout(() => {
            essayRef.current?.focus();
          }, 100);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [useTTS, questions, current, optionIndex, answers, lastArrowLeftTime, readQuestion, speakQueueAndWait, getLetter, router]);

  /* ==========================
     SUBMIT
  ========================== */
  const handleSubmit = useCallback(async () => {
    const token = localStorage.getItem("token");

    setSubmitting(true);

    try {
      const res = await api.post(
        `/api/test/${id}/submit`,
        { answers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const attemptId = res.data.attempt?.id;
      if (!attemptId) return;

      await speakQueueAndWait(["Jawaban berhasil dikirim. ... Membuka hasil tes."]);
      router.push(`/test/${id}/result?attemptId=${attemptId}`);
    } catch (err) {
      console.error("Gagal submit jawaban:", err);
    } finally {
      setSubmitting(false);
    }
  }, [id, answers, router]);

  /* ==========================
     POPUP KEYBOARD NAVIGATION
  ========================== */
  useEffect(() => {
    if (!showConfirmPopup) return;

    const handler = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        setShowConfirmPopup(false);
        speakQueue(["Pengiriman dibatalkan. ..."]);
      }

      if (e.code === "Space") {
        e.preventDefault();
        setShowConfirmPopup(false);
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showConfirmPopup, handleSubmit]);

  /* ==========================
     UI
  ========================== */
  if (loading) return <p className="p-6 text-xl">Memuat soal...</p>;
  if (!test) return <p className="p-6 text-xl">Test tidak ditemukan.</p>;

  const q = questions[current];

  return (
    <div className="max-w-3xl mx-auto p-8 text-black">
      <h1 className="text-4xl font-bold mb-3">{test.title}</h1>
      <p className="text-gray-500 text-xl mb-6">{test.description}</p>

      <div className="border rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold mb-5">
          Soal {current + 1} dari {questions.length}
        </h2>

        <p className="text-xl mb-5">{q.text}</p>

        {q.questionType === "MULTIPLE_CHOICE" && (
          <div className="space-y-4">
            {q.options.map((opt: string, i: number) => {
              const key = getLetter(i, false);
              const isKeyboardFocused = useTTS && optionIndex === i;

              return (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg text-lg cursor-pointer transition-colors ${answers[q.id] === key ? "border-green-500 bg-green-50" : isKeyboardFocused ? "border-green-800 bg-green-50" : "border-green-200 hover:bg-green-50 hover:border-green-400"}`}
                >
                  <input type="radio" name={String(q.id)} checked={answers[q.id] === key} onChange={() => setAnswers((p) => ({ ...p, [q.id]: key }))} className="w-5 h-5" />
                  {opt}
                </label>
              );
            })}
          </div>
        )}

        {q.questionType === "CHECKBOX" && (
          <div className="space-y-4">
            {q.options.map((opt: string, i: number) => {
              const key = getLetter(i, false);
              const selected = (answers[q.id] as string[]) || [];
              const isKeyboardFocused = useTTS && optionIndex === i;

              return (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg text-lg cursor-pointer transition-colors ${selected.includes(key) ? "border-green-500 bg-green-50" : isKeyboardFocused ? "border-green-800 bg-green-50" : "border-green-200 hover:bg-green-50 hover:border-green-400"}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(key)}
                    onChange={(e) => {
                      setAnswers((p) => {
                        const prev = (p[q.id] as string[]) || [];
                        if (e.target.checked) {
                          return { ...p, [q.id]: [...prev, key] };
                        } else {
                          return { ...p, [q.id]: prev.filter((k) => k !== key) };
                        }
                      });
                    }}
                    className="w-5 h-5"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        )}

        {q.questionType === "ESSAY" && (
          <div className="space-y-3">
            {!isTypingEssay && useTTS && <p className="text-lg text-blue-600 font-medium">Tekan Enter untuk mulai mengetik jawaban</p>}
            <textarea
              ref={essayRef}
              className={`w-full border rounded-lg p-4 text-lg ${isTypingEssay ? "border-blue-500 ring-2 ring-blue-300" : ""}`}
              rows={6}
              value={(answers[q.id] as string) ?? ""}
              onChange={(e) => {
                const oldValue = (answers[q.id] as string) ?? "";
                const newValue = e.target.value;

                // Detect what character was typed
                if (newValue.length > oldValue.length) {
                  const newChar = newValue[newValue.length - 1];
                  speakChar(newChar);
                } else if (newValue.length < oldValue.length) {
                  // Character was deleted
                  speakChar("hapus");
                }

                setAnswers((p) => ({ ...p, [q.id]: newValue }));
              }}
              onKeyDown={(e) => {
                if (e.code === "Escape") {
                  e.preventDefault();
                  setIsTypingEssay(false);
                  essayRef.current?.blur();

                  const essayAnswer = (answers[q.id] as string) ?? "";
                  if (essayAnswer.trim()) {
                    speakQueue(["Keluar dari mode mengetik. ...", "Jawaban Anda: ...", essayAnswer, "Gunakan panah kiri kanan untuk navigasi soal."]);
                  } else {
                    speakQueue(["Keluar dari mode mengetik. ...", "Gunakan panah kiri kanan untuk navigasi soal."]);
                  }
                }
              }}
              onBlur={() => {
                if (useTTS) setIsTypingEssay(false);
              }}
              placeholder={useTTS && !isTypingEssay ? "Tekan Enter untuk mengetik..." : "Ketik jawaban Anda di sini..."}
              readOnly={useTTS && !isTypingEssay}
            />
            {isTypingEssay && <p className="text-sm text-gray-500">Tekan Escape untuk keluar dari mode mengetik</p>}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={() => (current === 0 ? router.push("/dashboard/camaba") : setCurrent((c) => c - 1))} className="px-5 py-3 border rounded-lg text-lg font-semibold">
          {current === 0 ? "← Kembali" : "← Sebelumnya"}
        </button>

        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)} className="px-5 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold">
            Selanjutnya →
          </button>
        ) : (
          <button
            onClick={() => {
              setShowConfirmPopup(true);
              speakQueue(["Apakah Anda yakin ingin mengirim jawaban? ...", "Tekan Spasi untuk konfirmasi. ...", "Tekan Escape untuk batal."]);
            }}
            disabled={submitting}
            className="px-5 py-3 bg-green-600 text-white rounded-lg text-lg font-semibold"
          >
            {submitting ? "Mengirim..." : "Kirim Jawaban"}
          </button>
        )}
      </div>

      {/* ================= POPUP KONFIRMASI SUBMIT ================= */}
      {showConfirmPopup && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-center">Konfirmasi Pengiriman</h2>
            <p className="text-lg text-center mb-6">Apakah Anda yakin ingin mengirim jawaban Anda?</p>
            <p className="text-center text-gray-600 mb-6">Jawaban yang sudah dikirim tidak dapat diubah.</p>
            <p className="text-center text-blue-600 font-medium mb-6">Escape = Batal | Spasi = Kirim</p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowConfirmPopup(false);
                  speakQueue(["Pengiriman dibatalkan. ..."]);
                }}
                className="flex-1 px-5 py-3 bg-gray-300 text-gray-800 rounded-lg text-lg font-semibold hover:bg-gray-400 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowConfirmPopup(false);
                  handleSubmit();
                }}
                disabled={submitting}
                className="flex-1 px-5 py-3 bg-green-600 text-white rounded-lg text-lg font-semibold hover:bg-green-700 transition"
              >
                {submitting ? "Mengirim..." : "Ya, Kirim"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SPEED CONTROL */}
      {useTTS && !showConfirmPopup && (
        <div className="fixed bottom-6 right-6 bg-white shadow-xl border rounded-xl p-4 flex flex-col gap-3 items-center">
          <p className="text-sm font-semibold text-black">Kecepatan Suara</p>

          <div className="flex items-center gap-3">
            <button onClick={() => changeSpeed(-0.1)} className="px-3 py-2 bg-gray-200 rounded-lg text-lg font-bold">
              −
            </button>

            <span className="text-lg font-semibold w-12 text-center">{currentSpeed.toFixed(1)}</span>

            <button onClick={() => changeSpeed(0.1)} className="px-3 py-2 bg-gray-200 rounded-lg text-lg font-bold">
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
