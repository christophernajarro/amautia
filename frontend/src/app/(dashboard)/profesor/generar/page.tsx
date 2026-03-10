// @ts-nocheck
"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, FileText, CheckCircle } from "lucide-react";

export default function GenerarPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", source_text: "", difficulty: "medium", num_questions: 5, education_level: "secundaria",
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = getTokens().access;
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)));

      const resp = await fetch("http://localhost:8000/api/v1/profesor/generate", {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await resp.json();
      setResult(data);

      // Load detail
      if (data.id) {
        const d = await apiFetch(`/profesor/generated/${data.id}`, { token: token! });
        setDetail(d);
      }
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generar Examen con IA</h1>
        <p className="text-slate-500">Crea un examen nuevo a partir de un tema o material</p>
      </div>

      {!result ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Título del examen</Label>
              <Input placeholder="Ej: Examen de Historia del Perú" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Tema o contenido fuente</Label>
              <Textarea placeholder="Describe el tema, pega un texto de referencia, o indica los conceptos que debe cubrir..."
                rows={5} value={form.source_text}
                onChange={(e) => setForm({ ...form, source_text: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Dificultad</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="medium">Medio</SelectItem>
                    <SelectItem value="hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preguntas</Label>
                <Input type="number" min={1} max={20} value={form.num_questions}
                  onChange={(e) => setForm({ ...form, num_questions: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Nivel</Label>
                <Select value={form.education_level} onValueChange={(v) => setForm({ ...form, education_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primaria">Primaria</SelectItem>
                    <SelectItem value="secundaria">Secundaria</SelectItem>
                    <SelectItem value="universidad">Universidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={loading || !form.source_text}
              className="w-full bg-indigo-600 hover:bg-indigo-700">
              {loading ? (
                <><Sparkles className="h-4 w-4 mr-2 animate-pulse" />Generando con IA...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Generar examen</>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {detail?.title || result.title || "Examen generado"}
                </CardTitle>
                <Badge>{result.status}</Badge>
              </div>
            </CardHeader>
          </Card>

          {detail?.questions?.map((q: any, i: number) => (
            <Card key={q.id || i}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {q.number}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{q.text}</p>
                    <div className="mt-2 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700"><strong>Respuesta:</strong> {q.answer}</p>
                      {q.explanation && <p className="text-xs text-green-600 mt-1">{q.explanation}</p>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{q.type}</Badge>
                      <Badge variant="secondary">{q.points} pts</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setResult(null); setDetail(null); }}>Generar otro</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Guardar como examen</Button>
          </div>
        </div>
      )}
    </div>
  );
}
