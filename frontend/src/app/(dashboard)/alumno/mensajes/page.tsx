"use client";

import { useState, useRef, useEffect } from "react";
import { useConversations, useMessages, useSendMessage, useAnnouncements } from "@/lib/api-hooks";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Megaphone, AlertCircle, User, Pin } from "lucide-react";
import { toast } from "sonner";

export default function AlumnoMensajesPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"mensajes" | "anuncios">("mensajes");
  const [selectedConv, setSelectedConv] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingConvs } = useConversations();
  const { data: messages, isLoading: loadingMsgs } = useMessages(selectedConv);
  const sendMessage = useSendMessage(selectedConv);
  const { data: announcements, isLoading: loadingAnn } = useAnnouncements();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || !selectedConv) return;
    try {
      await sendMessage.mutateAsync({ content: messageText });
      setMessageText("");
    } catch (err: any) {
      toast.error(err.message || "Error al enviar mensaje");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedConversation = conversations?.find((c: any) => c.id === selectedConv);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mensajes</h1>
        <p className="text-slate-500 dark:text-slate-400">Comunicación con tus profesores</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2">
        <Button
          variant={tab === "mensajes" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("mensajes")}
          className={tab === "mensajes" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
        >
          <MessageCircle className="h-4 w-4 mr-2" />Mensajes
        </Button>
        <Button
          variant={tab === "anuncios" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("anuncios")}
          className={tab === "anuncios" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
        >
          <Megaphone className="h-4 w-4 mr-2" />Anuncios
        </Button>
      </div>

      {tab === "mensajes" ? (
        <div className="grid gap-4 lg:grid-cols-3" style={{ minHeight: "500px" }}>
          {/* Conversations list */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Conversaciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingConvs ? (
                <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
              ) : conversations && conversations.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="divide-y">
                    {conversations.map((conv: any) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConv(conv.id)}
                        className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                          selectedConv === conv.id ? "bg-indigo-50 dark:bg-indigo-950/30 border-l-2 border-indigo-600" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{conv.participant_name || conv.title || "Conversación"}</p>
                            <p className="text-xs text-slate-400 truncate">{typeof conv.last_message === "object" && conv.last_message !== null ? String(conv.last_message.content || "") : String(conv.last_message || "Sin mensajes")}</p>
                          </div>
                          {conv.unread_count > 0 && (
                            <Badge className="bg-indigo-600 text-white text-xs shrink-0">{conv.unread_count}</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-8 text-center">
                  <MessageCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Sin conversaciones</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message thread */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConv ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedConversation?.participant_name || "Conversación"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col">
                  <ScrollArea className="flex-1 p-4 h-80">
                    {loadingMsgs ? (
                      <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                    ) : messages && messages.length > 0 ? (
                      <div className="space-y-3">
                        {messages.map((msg: any) => {
                          const isOwn = msg.sender_id === user?.id;
                          return (
                            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                isOwn ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              }`}>
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${isOwn ? "text-indigo-200" : "text-slate-400"}`}>
                                  {new Date(msg.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <p className="text-center text-slate-400 py-8">Sin mensajes aún. Envía el primero.</p>
                    )}
                  </ScrollArea>
                  <div className="p-4 border-t flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escribe un mensaje..."
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                      onClick={handleSend}
                      disabled={sendMessage.isPending || !messageText.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-full py-16">
                <MessageCircle className="h-12 w-12 text-slate-200 dark:text-slate-600 mb-3" />
                <p className="text-slate-400">Selecciona una conversación</p>
              </CardContent>
            )}
          </Card>
        </div>
      ) : (
        /* Announcements */
        <div className="space-y-3">
          {loadingAnn ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          ) : announcements && announcements.length > 0 ? (
            announcements.map((ann: any) => (
              <Card key={ann.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                      <Megaphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{ann.title}</h3>
                        {ann.is_pinned && <Pin className="h-3 w-3 text-amber-500" />}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{ann.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>{ann.author_name || "Profesor"}</span>
                        <span>{new Date(ann.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Megaphone className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No hay anuncios</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
