"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Plus, MessageSquare, Sparkles, ArrowLeft, Copy, Check } from "lucide-react";

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

function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  const lines = text.split("\n");
  let key = 0;

  for (const line of lines) {
    if (parts.length > 0) parts.push(<br key={`br-${key++}`} />);
    // Process inline formatting
    const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;
    const lineNodes: React.ReactNode[] = [];

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        lineNodes.push(line.slice(lastIndex, match.index));
      }
      if (match[2]) {
        lineNodes.push(<strong key={`b-${key++}`} className="font-semibold">{match[2]}</strong>);
      } else if (match[3]) {
        lineNodes.push(<code key={`c-${key++}`} className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono">{match[3]}</code>);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
      lineNodes.push(line.slice(lastIndex));
    }
    parts.push(...lineNodes);
  }
  return parts;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 p-1">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function TutorPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== "undefined" ? getTokens().access : null;

  useEffect(() => {
    if (!token) return;
    apiFetch<Chat[]>("/alumno/tutor/chats", { token })
      .then(setChats)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChat = async (chatId: string) => {
    setActiveChat(chatId);
    setShowSidebar(false);
    const data = await apiFetch<any>(`/alumno/tutor/chats/${chatId}`, { token: token! });
    setMessages(data.messages || []);
  };

  const createChat = async () => {
    const formData = new FormData();
    formData.append("title", "Nueva conversación");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/alumno/tutor/chats`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
    });
    const chat = await res.json();
    setChats((prev) => [chat, ...prev]);
    setActiveChat(chat.id);
    setMessages([]);
    setShowSidebar(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChat || sending) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const formData = new FormData();
      formData.append("content", userMsg.content);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/alumno/tutor/chats/${activeChat}/message`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
      );
      const data = await res.json();
      const aiMsg: Message = { id: data.id || (Date.now() + 1).toString(), role: "assistant", content: data.content || data.message || "Sin respuesta", created_at: new Date().toISOString() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, { id: "err", role: "assistant", content: "Error al obtener respuesta. Intenta de nuevo.", created_at: new Date().toISOString() }]);
    }
    setSending(false);
  };

  const suggestions = [
    "¿Cómo resuelvo una ecuación de segundo grado?",
    "Explícame la fotosíntesis paso a paso",
    "¿Cuáles son las causas de la independencia del Perú?",
    "Ayúdame a entender las fracciones",
  ];

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-6">
      {/* Chat list sidebar */}
      <div className={`${showSidebar ? "flex" : "hidden"} lg:flex w-full lg:w-80 flex-col border-r bg-white`}>
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
              <Brain className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No tienes conversaciones</p>
              <p className="text-xs text-slate-400 mt-1">Crea una para empezar a aprender</p>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                className={`w-full text-left px-4 py-3 border-b hover:bg-slate-50 transition-colors ${
                  activeChat === chat.id ? "bg-indigo-50 border-l-2 border-l-indigo-600" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{chat.title}</p>
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
      <div className={`${!showSidebar || !activeChat ? "flex" : "hidden"} lg:flex flex-1 flex-col bg-slate-50`}>
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-lg">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Tutor IA</h2>
              <p className="text-slate-500 mb-8">
                Tu asistente personal de estudio. Pregúntame sobre cualquier tema y te ayudo a aprender paso a paso.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={async () => {
                      await createChat();
                      setInput(s);
                    }}
                    className="text-left p-4 rounded-xl border bg-white hover:border-indigo-300 hover:shadow-sm transition-all text-sm text-slate-700"
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
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowSidebar(true)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Brain className="h-5 w-5 text-indigo-600" />
              <h3 className="font-medium text-sm text-slate-900">
                {chats.find((c) => c.id === activeChat)?.title || "Conversación"}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">Escribe tu primera pregunta</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {suggestions.slice(0, 2).map((s, i) => (
                      <button key={i} onClick={() => setInput(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white border hover:border-indigo-300 text-slate-600">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 group relative ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-white border shadow-sm rounded-bl-md"
                  }`}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Brain className="h-3.5 w-3.5 text-indigo-600" />
                          <span className="text-xs font-medium text-indigo-600">Tutor IA</span>
                        </div>
                        <CopyButton text={msg.content} />
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                    </div>
                    <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-indigo-200" : "text-slate-400"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Brain className="h-3.5 w-3.5 text-indigo-600" />
                      <span className="text-xs font-medium text-indigo-600">Tutor IA</span>
                    </div>
                    <div className="flex items-center gap-1 py-1">
                      <span className="typing-dot h-2 w-2 rounded-full bg-indigo-400" />
                      <span className="typing-dot h-2 w-2 rounded-full bg-indigo-400" />
                      <span className="typing-dot h-2 w-2 rounded-full bg-indigo-400" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t bg-white p-4">
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
