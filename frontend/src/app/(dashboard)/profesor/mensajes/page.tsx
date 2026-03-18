"use client";

import { useState, useRef, useEffect } from "react";
import {
  useConversations, useMessages, useSendMessage, useCreateConversation,
  useAnnouncements, useCreateAnnouncement,
  useForums, useForumPosts, useCreateForumPost,
  useProfesorSubjects,
} from "@/lib/api-hooks";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Megaphone, MessagesSquare, Plus, Pin, User, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ProfesorMensajesPage() {
  const user = useAuthStore((s) => s.user);
  const { data: subjects } = useProfesorSubjects();
  const [tab, setTab] = useState<"mensajes" | "anuncios" | "foros">("mensajes");
  const [selectedConv, setSelectedConv] = useState("");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingConvs } = useConversations();
  const { data: messages, isLoading: loadingMsgs } = useMessages(selectedConv);
  const sendMessage = useSendMessage(selectedConv);
  const { data: announcements, isLoading: loadingAnn } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const { data: forums, isLoading: loadingForums } = useForums();

  const [selectedForum, setSelectedForum] = useState("");
  const { data: forumPosts } = useForumPosts(selectedForum);
  const createPost = useCreateForumPost(selectedForum);

  const [annOpen, setAnnOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annSectionId, setAnnSectionId] = useState("");
  const [annPinned, setAnnPinned] = useState(false);
  const [postText, setPostText] = useState("");

  const sections = (subjects as any[] || []).flatMap((s: any) =>
    (s.sections || []).map((sec: any) => ({ id: sec.id, name: `${s.name} - ${sec.name}` }))
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || !selectedConv) return;
    try {
      await sendMessage.mutateAsync({ content: messageText });
      setMessageText("");
    } catch (err: any) {
      toast.error(err.message || "Error al enviar");
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim() || !annContent.trim()) { toast.error("Completa título y contenido"); return; }
    try {
      await createAnnouncement.mutateAsync({
        title: annTitle,
        content: annContent,
        section_id: annSectionId || undefined,
        is_pinned: annPinned,
      });
      toast.success("Anuncio publicado");
      setAnnOpen(false);
      setAnnTitle(""); setAnnContent(""); setAnnSectionId(""); setAnnPinned(false);
    } catch (err: any) {
      toast.error(err.message || "Error al publicar anuncio");
    }
  };

  const handleCreatePost = async () => {
    if (!postText.trim() || !selectedForum) return;
    try {
      await createPost.mutateAsync({ content: postText });
      setPostText("");
      toast.success("Publicación creada");
    } catch (err: any) {
      toast.error(err.message || "Error al publicar");
    }
  };

  const selectedConversation = conversations?.find((c: any) => c.id === selectedConv);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Centro de Mensajes</h1>
        <p className="text-slate-500 dark:text-slate-400">Comunicación con alumnos y padres</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={tab === "mensajes" ? "default" : "outline"} onClick={() => setTab("mensajes")} className={tab === "mensajes" ? "bg-indigo-600 hover:bg-indigo-700" : ""}>
          <MessageCircle className="h-4 w-4 mr-2" />Mensajes
        </Button>
        <Button size="sm" variant={tab === "anuncios" ? "default" : "outline"} onClick={() => setTab("anuncios")} className={tab === "anuncios" ? "bg-indigo-600 hover:bg-indigo-700" : ""}>
          <Megaphone className="h-4 w-4 mr-2" />Anuncios
        </Button>
        <Button size="sm" variant={tab === "foros" ? "default" : "outline"} onClick={() => setTab("foros")} className={tab === "foros" ? "bg-indigo-600 hover:bg-indigo-700" : ""}>
          <MessagesSquare className="h-4 w-4 mr-2" />Foros
        </Button>
      </div>

      {tab === "mensajes" && (
        <div className="grid gap-4 lg:grid-cols-3" style={{ minHeight: "500px" }}>
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-sm">Conversaciones</CardTitle></CardHeader>
            <CardContent className="p-0">
              {loadingConvs ? (
                <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
              ) : conversations && conversations.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="divide-y">
                    {conversations.map((conv: any) => (
                      <button key={conv.id} onClick={() => setSelectedConv(conv.id)} className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedConv === conv.id ? "bg-indigo-50 dark:bg-indigo-950/30 border-l-2 border-indigo-600" : ""}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0"><User className="h-4 w-4 text-indigo-600" /></div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{conv.participant_name || conv.title || "Conversación"}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{typeof conv.last_message === "object" && conv.last_message !== null ? String(conv.last_message.content || "") : String(conv.last_message || "Sin mensajes")}</p>
                          </div>
                          {conv.unread_count > 0 && <Badge className="bg-indigo-600 text-white text-xs shrink-0">{conv.unread_count}</Badge>}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-8 text-center"><MessageCircle className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" /><p className="text-sm text-slate-400 dark:text-slate-500">Sin conversaciones</p></div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 flex flex-col">
            {selectedConv ? (
              <>
                <CardHeader className="border-b"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" />{selectedConversation?.participant_name || "Chat"}</CardTitle></CardHeader>
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
                              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"}`}>
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${isOwn ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"}`}>{new Date(msg.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <p className="text-center text-slate-400 dark:text-slate-500 py-8">Sin mensajes aún</p>
                    )}
                  </ScrollArea>
                  <div className="p-4 border-t flex gap-2">
                    <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Escribe un mensaje..." className="flex-1" />
                    <Button size="icon" className="bg-indigo-600 hover:bg-indigo-700 shrink-0" onClick={handleSend} disabled={sendMessage.isPending || !messageText.trim()}><Send className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-full py-16"><MessageCircle className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-3" /><p className="text-slate-400 dark:text-slate-500">Selecciona una conversación</p></CardContent>
            )}
          </Card>
        </div>
      )}

      {tab === "anuncios" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setAnnOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Nuevo anuncio
            </Button>
          </div>

          {loadingAnn ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          ) : announcements && announcements.length > 0 ? (
            announcements.map((ann: any) => (
              <Card key={ann.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0"><Megaphone className="h-5 w-5 text-amber-600" /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{ann.title}</h3>
                        {ann.is_pinned && <Pin className="h-3 w-3 text-amber-500" />}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{ann.content}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{new Date(ann.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card><CardContent className="flex flex-col items-center py-12"><Megaphone className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" /><p className="text-slate-500 dark:text-slate-400">No hay anuncios</p></CardContent></Card>
          )}

          <Dialog open={annOpen} onOpenChange={setAnnOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo anuncio</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Sección (opcional)</label>
                  <Select value={annSectionId} onValueChange={setAnnSectionId}>
                    <SelectTrigger><SelectValue placeholder="Todas las secciones" /></SelectTrigger>
                    <SelectContent>
                      {sections.map((sec: any) => (<SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Título</label>
                  <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Título del anuncio" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Contenido</label>
                  <Textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} placeholder="Escribe el contenido..." rows={4} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Fijar anuncio</label>
                  <Switch checked={annPinned} onCheckedChange={setAnnPinned} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAnnOpen(false)}>Cancelar</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCreateAnnouncement} disabled={createAnnouncement.isPending}>
                  {createAnnouncement.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publicando...</> : "Publicar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {tab === "foros" && (
        <div className="grid gap-4 lg:grid-cols-3" style={{ minHeight: "400px" }}>
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-sm">Foros</CardTitle></CardHeader>
            <CardContent className="p-0">
              {loadingForums ? (
                <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : forums && forums.length > 0 ? (
                <div className="divide-y">
                  {forums.map((forum: any) => (
                    <button key={forum.id} onClick={() => setSelectedForum(forum.id)} className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedForum === forum.id ? "bg-indigo-50 dark:bg-indigo-950/30 border-l-2 border-indigo-600" : ""}`}>
                      <p className="text-sm font-medium">{forum.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{forum.post_count || 0} publicaciones</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center"><MessagesSquare className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" /><p className="text-sm text-slate-400 dark:text-slate-500">Sin foros</p></div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 flex flex-col">
            {selectedForum ? (
              <>
                <CardHeader className="border-b"><CardTitle className="text-sm">Publicaciones</CardTitle></CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col">
                  <ScrollArea className="flex-1 p-4 h-80">
                    {forumPosts && forumPosts.length > 0 ? (
                      <div className="space-y-3">
                        {forumPosts.map((post: any) => (
                          <div key={post.id} className="p-3 rounded-lg border">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{post.author_name || "Usuario"}</span>
                              <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(post.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{post.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-slate-400 dark:text-slate-500 py-8">Sin publicaciones</p>
                    )}
                  </ScrollArea>
                  <div className="p-4 border-t flex gap-2">
                    <Input value={postText} onChange={(e) => setPostText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleCreatePost(); } }} placeholder="Escribe una publicación..." className="flex-1" />
                    <Button size="icon" className="bg-indigo-600 hover:bg-indigo-700 shrink-0" onClick={handleCreatePost} disabled={createPost.isPending || !postText.trim()}><Send className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-full py-16"><MessagesSquare className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-3" /><p className="text-slate-400 dark:text-slate-500">Selecciona un foro</p></CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
