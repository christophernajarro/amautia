
"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, Plus, MessageCircle } from "lucide-react";

export default function TutorPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getTokens().access;
    if (token) apiFetch("/alumno/tutor/chats", { token }).then((data) => setChats(data as any[]));
  }, []);

  const loadChat = async (chatId: string) => {
    const token = getTokens().access;
    const data = await apiFetch<any>(`/alumno/tutor/chats/${chatId}`, { token: token! });
    setActiveChatId(chatId);
    setMessages(data.messages || []);
  };

  const newChat = async () => {
    const token = getTokens().access;
    const formData = new FormData();
    formData.append("title", "Nueva conversación");
    const resp = await fetch("http://localhost:8000/api/v1/alumno/tutor/chats", {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
    });
    const data = await resp.json();
    setActiveChatId(data.id);
    setMessages([]);
    setChats((prev) => [{ id: data.id, title: data.title }, ...prev]);
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeChatId) return;
    const userMsg = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      const token = getTokens().access;
      const formData = new FormData();
      formData.append("content", userMsg.content);
      const resp = await fetch(`http://localhost:8000/api/v1/alumno/tutor/chats/${activeChatId}/message`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await resp.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error al obtener respuesta." }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)]">
      {/* Sidebar */}
      <Card className="w-64 flex-shrink-0">
        <CardHeader className="p-3">
          <Button onClick={newChat} className="w-full bg-indigo-600 hover:bg-indigo-700" size="sm">
            <Plus className="h-4 w-4 mr-2" />Nuevo chat
          </Button>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-[calc(100vh-240px)]">
            {chats.map((c) => (
              <button key={c.id} onClick={() => loadChat(c.id)}
                className={`w-full text-left p-2 rounded-lg text-sm mb-1 transition-colors ${
                  activeChatId === c.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"}`}>
                <MessageCircle className="h-3 w-3 inline mr-2" />{c.title}
              </button>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col">
        {!activeChatId ? (
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            <Brain className="h-16 w-16 text-indigo-200 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tutor IA de Amautia</h3>
            <p className="text-slate-500 text-center max-w-md mb-6">
              Tu asistente de estudio personalizado. Pregunta sobre cualquier tema, pide explicaciones o genera ejercicios.
            </p>
            <Button onClick={newChat} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />Iniciar conversación
            </Button>
          </CardContent>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-2xl mx-auto">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-900"}`}>
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex gap-2 max-w-2xl mx-auto">
                <Input placeholder="Escribe tu pregunta..." value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={loading} />
                <Button onClick={sendMessage} disabled={loading || !message.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
