"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface ExamResult {
  id: string;
  exam_title: string;
  subject_name: string;
  total_score: number | null;
  percentage: number | null;
  status: string;
  corrected_at: string | null;
}

interface ResultDetail {
  exam_title: string;
  total_score: number | null;
  total_points: number;
  percentage: number | null;
  general_feedback: string;
  corrected_at: string | null;
  answers: {
    question_number: number | null;
    question_text: string | null;
    score: number;
    max_score: number;
    is_correct: boolean;
    feedback: string;
  }[];
}

export default function CalificacionesPage() {
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [detail, setDetail] = useState<ResultDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    apiFetch("/alumno/exams", { token })
      .then((data: any) => setExams(data))
      .finally(() => setLoading(false));
  }, []);

  const viewDetail = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSelectedId(id);
    const data = await apiFetch(`/alumno/exams/${id}/resultado`, { token }) as any;
    setDetail(data);
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📊 Mis Calificaciones</h1>

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          <p className="text-lg mb-2">No tienes exámenes calificados aún</p>
          <p className="text-sm">Cuando tu profesor corrija un examen, aparecerá aquí</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className={`bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition-shadow ${
                selectedId === exam.id ? "ring-2 ring-indigo-500" : ""
              }`}
              onClick={() => exam.status === "corrected" && viewDetail(exam.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{exam.exam_title}</h3>
                  <p className="text-sm text-gray-500">{exam.subject_name}</p>
                </div>
                <div className="text-right">
                  {exam.status === "corrected" ? (
                    <>
                      <span className={`text-2xl font-bold ${
                        (exam.percentage || 0) >= 60 ? "text-green-600" : "text-red-600"
                      }`}>
                        {exam.percentage?.toFixed(0)}%
                      </span>
                      <p className="text-sm text-gray-500">{exam.total_score?.toFixed(1)} pts</p>
                    </>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {exam.status === "pending" ? "Pendiente" : exam.status}
                    </span>
                  )}
                </div>
              </div>
              {exam.corrected_at && (
                <p className="text-xs text-gray-400 mt-2">
                  Corregido: {new Date(exam.corrected_at).toLocaleDateString("es-PE")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {detail && (
        <div className="mt-8 bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{detail.exam_title}</h2>
            <div className="text-right">
              <span className={`text-3xl font-bold ${
                (detail.percentage || 0) >= 60 ? "text-green-600" : "text-red-600"
              }`}>
                {detail.total_score?.toFixed(1)}/{detail.total_points}
              </span>
              <p className="text-sm text-gray-500">{detail.percentage?.toFixed(0)}%</p>
            </div>
          </div>

          {detail.general_feedback && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm font-medium text-indigo-800">💬 Retroalimentación general:</p>
              <p className="text-sm text-indigo-700 mt-1">{detail.general_feedback}</p>
            </div>
          )}

          <h3 className="font-semibold text-gray-700 mb-4">Detalle por pregunta:</h3>
          <div className="space-y-3">
            {detail.answers.map((a, i) => (
              <div key={i} className={`p-4 rounded-lg border-l-4 ${
                a.is_correct ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
              }`}>
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-gray-900">
                    {a.question_number ? `Pregunta ${a.question_number}` : `Pregunta ${i + 1}`}
                    {a.question_text && <span className="text-gray-500 font-normal">: {a.question_text}</span>}
                  </p>
                  <span className={`text-sm font-bold ${a.is_correct ? "text-green-700" : "text-red-700"}`}>
                    {a.score}/{a.max_score}
                  </span>
                </div>
                {a.feedback && (
                  <p className="text-sm text-gray-600 mt-2">💡 {a.feedback}</p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => { setDetail(null); setSelectedId(null); }}
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Volver a la lista
          </button>
        </div>
      )}
    </div>
  );
}
