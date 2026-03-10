"use client";

import { useEffect, useState } from "react";
import { User } from "@/types/user";
import { ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

interface NavbarProps {
  user: User;
  onMenuClick: () => void;
}

export function Navbar({ user, onMenuClick }: NavbarProps) {
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    apiFetch("/notifications/unread-count", { token })
      .then((data: any) => setUnread(data.count || 0))
      .catch(() => {});
  }, []);

  const loadNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setShowPanel(!showPanel);
    if (!showPanel) {
      const data = await apiFetch("/notifications?limit=10", { token }) as any;
      setNotifications(data || []);
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    await apiFetch("/notifications/read-all", { token, method: "PATCH" });
    setUnread(0);
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="flex h-16 items-center gap-4 px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1" />

        {/* Notifications Bell */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative" onClick={loadNotifications}>
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>

          {showPanel && (
            <div className="absolute right-0 top-12 w-80 bg-white border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center p-3 border-b">
                <h3 className="font-semibold text-sm">Notificaciones</h3>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-800">
                    Marcar todo leído
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No hay notificaciones
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 border-b last:border-0 ${n.is_read ? "bg-white" : "bg-indigo-50"}`}
                  >
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    {n.message && <p className="text-xs text-gray-500 mt-1">{n.message}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString("es-PE", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
