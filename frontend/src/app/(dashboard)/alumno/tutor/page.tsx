"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Plus, MessageSquare, Sparkles, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

interface Chat {
  id: string;
  title: string;
  created_at: string;
  messages_count?: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function TutorPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [subjects, setSubjects] = useState<string[]>([]);
  const token = typeof window !== "undefined" ? getTokens().access : null;

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch<Chat[]>("/alumno/tutor/chats", { token }).then(setChats)
        .catch((err: any) => setErrorMsg(err.message || "Error al cargar conversaciones")),
      apiFetch<any[]>("/alumno/sections", { token }).then((secs) => {
        const names = (secs || []).map((s: any) => s.subject_name).filter(Boolean);
        setSubjects([...new Set(names)]);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChat = async (chatId: string) => {
    setActiveChat(chatId);
    setShowSidebar(false);
    try {
      const data = await apiFetch<any>(`/alumno/tutor/chats/${chatId}`, { token: token! });
      setMessages(data.messages || []);
    } catch {
      setMessages([{ id: "err", role: "assistant", content: "Error al cargar la conversación.", created_at: new Date().toISOString() }]);
    }
  };

  const createChat = async () => {
    try {
      const formData = new FormData();
      formData.append("title", "Nueva conversación");
      const chat = await apiFetch<any>("/alumno/tutor/chats", {
        method: "POST", token: token!, body: formData,
      });
      setChats((prev) => [chat, ...prev]);
      setActiveChat(chat.id);
      setMessages([]);
      setShowSidebar(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al crear conversación");
    }
  };

  const sendMessage = async (overrideText?: string) => {
    const text = overrideText || input;
    if (!text.trim() || sending) return;
    const chatId = activeChat;
    if (!chatId) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const formData = new FormData();
      formData.append("content", userMsg.content);
      const data = await apiFetch<any>(`/alumno/tutor/chats/${chatId}/message`, {
        method: "POST", token: token!, body: formData,
      });
      const aiMsg: Message = { id: data.id || (Date.now() + 1).toString(), role: "assistant", content: data.content || data.message || "Sin respuesta", created_at: new Date().toISOString() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, { id: "err", role: "assistant", content: "Error al obtener respuesta. Intenta de nuevo.", created_at: new Date().toISOString() }]);
    }
    setSending(false);
  };

  const defaultSuggestions = [
    "¿Cómo resuelvo una ecuación de segundo grado?",
    "Explícame la fotosíntesis paso a paso",
    "¿Cuáles son las causas de la independencia del Perú?",
    "Ayúdame a entender las fracciones",
  ];
  const subjectSuggestions = subjects.length > 0
    ? [
        `Ayúdame a estudiar para mi examen de ${subjects[0]}`,
        `Explícame el tema más difícil de ${subjects[0]}`,
        ...(subjects[1] ? [`¿Qué temas son clave en ${subjects[1]}?`] : []),
        "Dame ejercicios de práctica para mi próximo examen",
      ]
    : defaultSuggestions;
  const suggestions = subjectSuggestions;

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-6">
      {/* Chat list sidebar */}
      <div className={`${showSidebar ? "flex" : "hidden"} lg:flex w-full lg:w-80 flex-col border-r bg-white dark:bg-slate-900`}>
        <div className="p-4 border-b">
          <Button onClick={createChat} className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />Nueva conversación
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-slate-400 text-sm">Cargando chats...</div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center">
              <Brain className="h-10 w-10 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No tienes conversaciones</p>
              <p className="text-xs text-slate-400 mt-1">Crea una para empezar a aprender</p>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                className={`w-full text-left px-4 py-3 border-b hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                  activeChat === chat.id ? "bg-indigo-50 dark:bg-indigo-950/30 border-l-2 border-l-indigo-600" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{chat.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(chat.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`${!showSidebar || !activeChat ? "flex" : "hidden"} lg:flex flex-1 flex-col bg-slate-50 dark:bg-slate-800/50`}>
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-400">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-red-600">&#x2715;</button>
          </div>
        )}
        {!activeChat ? (
          /* Welcome state */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-lg">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Tutor IA</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                Tu asistente personal de estudio. Pregúntame sobre cualquier tema y te ayudo a aprender paso a paso.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={async () => {
                      const formData = new FormData();
                      formData.append("title", s.slice(0, 50));
                      try {
                        const chat = await apiFetch<any>("/alumno/tutor/chats", {
                          method: "POST", token: token!, body: formData,
                        });
                        setChats((prev) => [chat, ...prev]);
                        setActiveChat(chat.id);
                        setMessages([]);
                        setShowSidebar(false);
                        // Send the suggestion message immediately using the new chat id
                        const userMsg: Message = { id: Date.now().toString(), role: "user", content: s, created_at: new Date().toISOString() };
                        setMessages([userMsg]);
                        setSending(true);
                        const fd = new FormData();
                        fd.append("content", s);
                        const data = await apiFetch<any>(`/alumno/tutor/chats/${chat.id}/message`, {
                          method: "POST", token: token!, body: fd,
                        });
                        const aiMsg: Message = { id: data.id || (Date.now() + 1).toString(), role: "assistant", content: data.content || data.message || "Sin respuesta", created_at: new Date().toISOString() };
                        setMessages((prev) => [...prev, aiMsg]);
                      } catch (err: any) {
                        setErrorMsg(err.message || "Error al crear conversacion");
                      }
                      setSending(false);
                    }}
                    className="text-left p-4 rounded-xl border bg-white dark:bg-slate-900 hover:border-indigo-300 hover:shadow-sm transition-all text-sm text-slate-700 dark:text-slate-300"
                  >
                    <Sparkles className="h-4 w-4 text-indigo-500 mb-2" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-white dark:bg-slate-900">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowSidebar(true)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Brain className="h-5 w-5 text-indigo-600" />
              <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                {chats.find((c) => c.id === activeChat)?.title || "Conversación"}
              </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    ¡Hola! Soy tu tutor IA
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-5">
                    Pregúntame sobre cualquier tema de tus materias. Estoy aquí para ayudarte a aprender paso a paso.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestions.slice(0, 2).map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border hover:border-indigo-300 text-slate-600 dark:text-slate-300">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-white dark:bg-slate-900 border shadow-sm rounded-bl-md"
                  }`}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Brain className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-600">Tutor IA</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-indigo-200" : "text-slate-400"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-900 border shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-white dark:bg-slate-900 p-4">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  disabled={sending}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" disabled={!input.trim() || sending} className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
