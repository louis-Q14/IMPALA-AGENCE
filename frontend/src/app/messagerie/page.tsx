"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  UserCircleIcon,
  PhotoIcon,
  PaperClipIcon,
  FaceSmileIcon,
  CheckIcon,
  TrashIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  PlusIcon,
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon as CheckSolid } from "@heroicons/react/24/solid";

/* ─────────── Types ─────────── */

interface UserData {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: "text" | "image" | "system";
}

interface Conversation {
  id: string;
  participants: { id: string; name: string; email: string; avatar?: string }[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  type: "direct" | "support";
}

/* ─────────── Helpers ─────────── */

function sanitize(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function timeAgo(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatFullTime(date: string): string {
  return new Date(date).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─────────── API helpers ─────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetchConversations(currentUserId: string): Promise<Conversation[] | null> {
  try {
    const res = await fetch(`${API_BASE}/messages/conversations`, { headers: authHeaders() });
    if (!res.ok) return null;
    const rows = await res.json();
  return rows.map((r: {
    id: string;
    other_id: string;
    other_name: string;
    other_email: string;
    other_avatar?: string;
    last_message: string | null;
    last_message_time: string | null;
    unread_count: number;
    created_at: string;
  }): Conversation => ({
    id: r.id,
    participants: [
      { id: currentUserId, name: "", email: "" },
      { id: r.other_id, name: r.other_name, email: r.other_email, avatar: r.other_avatar || undefined },
    ],
    lastMessage: r.last_message || "",
    lastMessageTime: r.last_message_time || r.created_at,
    unreadCount: r.unread_count || 0,
    isOnline: false,
    type: "direct",
  }));
  } catch { return null; }
}

async function apiFetchMessages(conversationId: string): Promise<Message[] | null> {
  try {
    const res = await fetch(`${API_BASE}/messages/conversations/${conversationId}/messages`, { headers: authHeaders() });
    if (!res.ok) return null;
    const rows = await res.json();
  return rows.map((r: {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    read: boolean;
    created_at: string;
  }): Message => ({
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    content: r.content,
    timestamp: r.created_at,
    read: r.read,
    type: "text",
  }));
  } catch { return null; }
}

async function apiDeleteMessage(messageId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/messages/messages/${messageId}`, { method: "DELETE", headers: authHeaders() });
    return res.ok;
  } catch { return false; }
}

async function apiForwardMessage(messageId: string, otherUserId: string): Promise<{ conversation_id: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/messages/messages/${messageId}/forward`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function apiSendMessage(conversationId: string, content: string): Promise<Message | null> {
  const res = await fetch(`${API_BASE}/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) return null;
  const r = await res.json();
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    content: r.content,
    timestamp: r.created_at,
    read: r.read,
    type: "text",
  };
}

async function apiSearchUsers(q: string): Promise<{ id: string; full_name: string; email: string }[]> {
  const res = await fetch(`${API_BASE}/messages/users/search?q=${encodeURIComponent(q)}`, { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

async function apiCreateConversation(otherUserId: string): Promise<{ id: string } | null> {
  const res = await fetch(`${API_BASE}/messages/conversations`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ otherUserId }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function apiDeleteConversation(conversationId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/messages/conversations/${conversationId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.ok;
}

/* ─────────── Component ─────────── */

export default function MessagingPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileConv, setShowMobileConv] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showConvMenu, setShowConvMenu] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [msgMenuId, setMsgMenuId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [deleteMsgId, setDeleteMsgId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auth check + initial load
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const a = JSON.parse(localStorage.getItem("archivedConversations") || "[]");
        if (Array.isArray(a)) setArchivedIds(a);
      } catch { /* ignore */ }
    }
    const stored = localStorage.getItem("user");
    if (!stored) { setAuthRequired(true); return; }
    try {
      const raw = JSON.parse(stored);
      const u: UserData = { id: String(raw.id), full_name: raw.full_name, email: raw.email, role: raw.role };
      setUser(u);
      apiFetchConversations(u.id).then((c) => { if (c) setConversations(c); });
    } catch { setAuthRequired(true); }
  }, [router]);

  // Poll conversations + active messages every 5s. Merge messages — never overwrite local list.
  useEffect(() => {
    if (!user) return;
    const tick = async () => {
      const convs = await apiFetchConversations(user.id);
      if (convs) setConversations(convs);
      if (activeConvId) {
        const msgs = await apiFetchMessages(activeConvId);
        if (msgs) {
          setMessages((prev) => {
            const map = new Map<string, Message>();
            prev.forEach((m) => map.set(m.id, m));
            msgs.forEach((m) => {
              const existing = map.get(m.id);
              map.set(m.id, existing ? { ...existing, read: m.read, content: existing.content } : m);
            });
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });
        }
      }
    };
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [user, activeConvId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowConvMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Listen for messaging events (cross-tab sync)
  useEffect(() => {
    if (!user) return;
    const handler = async () => {
      const convs = await apiFetchConversations(user.id);
      if (convs) setConversations(convs);
      if (activeConvId) {
        const m = await apiFetchMessages(activeConvId);
        if (m) {
          setMessages((prev) => {
            const map = new Map<string, Message>();
            prev.forEach((x) => map.set(x.id, x));
            m.forEach((x) => { if (!map.has(x.id)) map.set(x.id, x); else map.set(x.id, { ...map.get(x.id)!, read: x.read }); });
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });
        }
      }
    };
    window.addEventListener("messaging-update", handler);
    return () => window.removeEventListener("messaging-update", handler);
  }, [user, activeConvId]);

  const openConversation = useCallback(async (convId: string) => {
    setActiveConvId(convId);
    setShowMobileConv(true);
    const msgs = await apiFetchMessages(convId);
    if (msgs) setMessages(msgs);
    if (user) {
      const convs = await apiFetchConversations(user.id);
      if (convs) setConversations(convs);
    }
  }, [user]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeConvId || !user) return;
    let cleaned = sanitize(newMessage.trim());
    if (replyTo) {
      const quote = replyTo.content.split("\n").map((l) => `> ${l}`).join("\n");
      cleaned = `${quote}\n\n${cleaned}`;
    }
    if (cleaned.length === 0 || cleaned.length > 5000) return;

    const msg = await apiSendMessage(activeConvId, cleaned);
    if (!msg) return;
    setMessages((prev) => [...prev, msg]);
    const convs = await apiFetchConversations(user.id);
    if (convs) setConversations(convs);
    setNewMessage("");
    setReplyTo(null);
    inputRef.current?.focus();
    window.dispatchEvent(new Event("messaging-update"));
  }, [newMessage, activeConvId, user, replyTo]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewConversation = useCallback(async (targetUser: { id: string; name: string; email: string }) => {
    if (!user) return;
    const existing = conversations.find((c) =>
      c.type === "direct" && c.participants.some((p) => p.id === targetUser.id)
    );
    if (existing) {
      openConversation(existing.id);
      setShowNewConv(false);
      return;
    }
    const conv = await apiCreateConversation(targetUser.id);
    if (!conv) return;
    const convs = await apiFetchConversations(user.id);
    if (convs) setConversations(convs);
    openConversation(conv.id);
    setShowNewConv(false);
    window.dispatchEvent(new Event("messaging-update"));
  }, [user, conversations, openConversation]);

  const deleteConversation = useCallback(async (convId: string) => {
    if (!user) return;
    await apiDeleteConversation(convId);
    const convs = await apiFetchConversations(user.id);
    if (convs) setConversations(convs);
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
      setShowMobileConv(false);
    }
    setShowDeleteConfirm(null);
    setShowConvMenu(null);
    window.dispatchEvent(new Event("messaging-update"));
  }, [user, activeConvId]);

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find((p) => p.id !== user?.id) || conv.participants[0];
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const persistArchived = (next: string[]) => {
    setArchivedIds(next);
    localStorage.setItem("archivedConversations", JSON.stringify(next));
  };

  const toggleArchive = (convId: string) => {
    const isArchived = archivedIds.includes(convId);
    persistArchived(isArchived ? archivedIds.filter((i) => i !== convId) : [...archivedIds, convId]);
    setShowConvMenu(null);
    showToast(isArchived ? "Conversation désarchivée" : "Conversation archivée");
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showToast("Message copié");
    } catch {
      showToast("Impossible de copier");
    }
    setMsgMenuId(null);
  };

  const resendMessage = async (msg: Message) => {
    if (!activeConvId) return;
    const sent = await apiSendMessage(activeConvId, msg.content);
    if (sent) {
      setMessages((prev) => [...prev, sent]);
      showToast("Message renvoyé");
      window.dispatchEvent(new Event("messaging-update"));
    }
    setMsgMenuId(null);
  };

  const deleteMessage = async (messageId: string) => {
    const ok = await apiDeleteMessage(messageId);
    if (ok) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      showToast("Message supprimé");
      window.dispatchEvent(new Event("messaging-update"));
    } else {
      showToast("Suppression impossible");
    }
    setDeleteMsgId(null);
    setMsgMenuId(null);
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const visibleConvs = conversations.filter((c) => showArchived ? archivedIds.includes(c.id) : !archivedIds.includes(c.id));
  const filteredConvs = visibleConvs.filter((c) => {
    if (!searchQuery) return true;
    const other = getOtherParticipant(c);
    return other.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalUnread = conversations.filter((c) => !archivedIds.includes(c.id)).reduce((sum, c) => sum + c.unreadCount, 0);

  if (authRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 shadow-xl text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <ChatBubbleLeftRightIcon className="w-7 h-7 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Compte requis</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Veuillez créer un compte pour utiliser la messagerie.
          </p>
          <div className="flex gap-3">
            <Link
              href="/connexion"
              className="flex-1 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-all"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                Messagerie
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">{totalUnread}</span>
                )}
              </h1>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <LockClosedIcon className="w-3 h-3" /> Chiffrement de bout en bout
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                showArchived
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                  : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              <ArchiveBoxIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{showArchived ? "Actives" : "Archives"}</span>
              {archivedIds.length > 0 && !showArchived && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">{archivedIds.length}</span>
              )}
            </button>
            <button
              onClick={() => setShowNewConv(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau message</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex h-full rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)]">
          {/* Conversations list */}
          <div className={`w-full md:w-96 border-r border-[var(--border-color)] flex flex-col ${showMobileConv ? "hidden md:flex" : "flex"}`}>
            {/* Search */}
            <div className="p-4 border-b border-[var(--border-color)]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Rechercher une conversation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                    text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                    focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {filteredConvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Aucune conversation</p>
                  <p className="text-xs text-[var(--text-muted)]">Commencez une nouvelle conversation</p>
                </div>
              ) : (
                filteredConvs.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const isActive = conv.id === activeConvId;
                  return (
                    <div key={conv.id} className="relative group">
                      <button
                        onClick={() => openConversation(conv.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all
                          ${isActive ? "bg-primary/10 border-r-2 border-primary" : "hover:bg-[var(--bg-hover)]"}`}
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm
                            ${conv.type === "support" ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"}`}>
                            {conv.type === "support" ? (
                              <ShieldCheckIcon className="w-6 h-6" />
                            ) : (
                              other.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                            )}
                          </div>
                          {conv.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[var(--bg-card)]" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className={`text-sm font-semibold truncate ${isActive ? "text-primary" : "text-[var(--text-primary)]"}`}>
                              {other.name}
                            </h4>
                            <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0 ml-2">
                              {conv.lastMessageTime ? timeAgo(conv.lastMessageTime) : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-[var(--text-muted)] truncate pr-2">
                              {conv.lastMessage || "Nouvelle conversation"}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Conv menu */}
                      <div className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity" ref={showConvMenu === conv.id ? menuRef : undefined}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowConvMenu(showConvMenu === conv.id ? null : conv.id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-all"
                        >
                          <EllipsisVerticalIcon className="w-4 h-4 text-[var(--text-muted)]" />
                        </button>
                        {showConvMenu === conv.id && (
                          <div className="absolute right-0 top-8 w-48 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg py-1 z-50">
                            <button
                              onClick={() => toggleArchive(conv.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                            >
                              <ArchiveBoxIcon className="w-4 h-4" />
                              {archivedIds.includes(conv.id) ? "Désarchiver" : "Archiver"}
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(conv.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                            >
                              <TrashIcon className="w-4 h-4" /> Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Security notice */}
            <div className="p-3 border-t border-[var(--border-color)] bg-emerald-50/50 dark:bg-emerald-900/5">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <LockClosedIcon className="w-3 h-3 flex-shrink-0" />
                Messages protégés · Données stockées localement
              </p>
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col ${!showMobileConv ? "hidden md:flex" : "flex"}`}>
            {activeConv ? (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-3 bg-[var(--bg-card)]">
                  <button
                    onClick={() => { setShowMobileConv(false); setActiveConvId(null); }}
                    className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition-all"
                  >
                    <ArrowLeftIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>

                  <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs
                      ${activeConv.type === "support" ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"}`}>
                      {activeConv.type === "support" ? (
                        <ShieldCheckIcon className="w-5 h-5" />
                      ) : (
                        getOtherParticipant(activeConv).name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      )}
                    </div>
                    {activeConv.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[var(--bg-card)]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {getOtherParticipant(activeConv).name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {activeConv.isOnline ? (
                        <span className="text-emerald-500">● En ligne</span>
                      ) : (
                        "Hors ligne"
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 flex items-center gap-1">
                      <LockClosedIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Sécurisé</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[var(--bg-tertiary)]/30">
                  {/* E2E notice */}
                  <div className="flex justify-center mb-4">
                    <div className="px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 flex items-center gap-2">
                      <LockClosedIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs text-amber-700 dark:text-amber-300">
                        Les messages sont chiffrés de bout en bout
                      </span>
                    </div>
                  </div>

                  {messages.map((msg) => {
                    const isMine = msg.senderId === user.id;
                    const isSystem = msg.type === "system";

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <div className="px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                            <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                              <InformationCircleIcon className="w-3 h-3" />
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`group flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] sm:max-w-[65%] relative`}>
                          {!isMine && (
                            <p className="text-[10px] text-[var(--text-muted)] mb-1 ml-1">{msg.senderName}</p>
                          )}
                          <div className={`relative px-4 py-2.5 rounded-2xl ${
                            isMine
                              ? "bg-primary text-white rounded-br-md"
                              : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-bl-md"
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); setMsgMenuId(msgMenuId === msg.id ? null : msg.id); }}
                              className={`absolute -top-2 ${isMine ? "-left-2" : "-right-2"} w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center`}
                              aria-label="Actions du message"
                            >
                              <EllipsisVerticalIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                            </button>
                            {msgMenuId === msg.id && (
                              <div className={`absolute z-50 top-8 ${isMine ? "left-0" : "right-0"} w-48 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl py-1`}
                                onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => { setReplyTo(msg); setMsgMenuId(null); inputRef.current?.focus(); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                                  <ArrowUturnLeftIcon className="w-4 h-4" /> Répondre
                                </button>
                                <button onClick={() => copyMessage(msg.content)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                                  <ClipboardDocumentIcon className="w-4 h-4" /> Copier
                                </button>
                                {isMine && (
                                  <button onClick={() => resendMessage(msg)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                                    <ArrowPathIcon className="w-4 h-4" /> Renvoyer
                                  </button>
                                )}
                                <button onClick={() => { setForwardMsg(msg); setMsgMenuId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                                  <ArrowUturnRightIcon className="w-4 h-4" /> Transférer
                                </button>
                                {isMine && (
                                  <button onClick={() => { setDeleteMsgId(msg.id); setMsgMenuId(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                                    <TrashIcon className="w-4 h-4" /> Supprimer
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                            <span className={`text-[10px] ${isMine ? "text-[var(--text-muted)]" : "text-[var(--text-muted)]"}`}>
                              {formatFullTime(msg.timestamp)}
                            </span>
                            {isMine && (
                              <span className="text-[10px]">
                                {msg.read ? (
                                  <span className="text-blue-500 flex items-center">
                                    <CheckSolid className="w-3 h-3" />
                                    <CheckSolid className="w-3 h-3 -ml-1.5" />
                                  </span>
                                ) : (
                                  <CheckIcon className="w-3 h-3 text-[var(--text-muted)]" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
                  {replyTo && (
                    <div className="mb-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                      <ArrowUturnLeftIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-primary font-semibold mb-0.5">Répondre à {replyTo.senderName}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{replyTo.content}</p>
                      </div>
                      <button onClick={() => setReplyTo(null)} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-[var(--bg-hover)]">
                        <XMarkIcon className="w-4 h-4 text-[var(--text-muted)]" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value.slice(0, 5000))}
                        onKeyDown={handleKeyDown}
                        placeholder="Écrivez votre message..."
                        rows={1}
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                          text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                          focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                        style={{ minHeight: "44px", maxHeight: "120px" }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = "44px";
                          target.style.height = Math.min(target.scrollHeight, 120) + "px";
                        }}
                      />
                      <div className="absolute right-2 bottom-2 flex items-center gap-0.5">
                        <span className={`text-[9px] mr-1 ${newMessage.length > 4500 ? "text-red-500" : "text-[var(--text-muted)]"}`}>
                          {newMessage.length > 0 ? `${newMessage.length}/5000` : ""}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center
                        hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* No conversation selected */
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 flex items-center justify-center mb-6">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Messagerie sécurisée</h3>
                <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">
                  Sélectionnez une conversation ou démarrez un nouveau message pour échanger avec d&apos;autres utilisateurs.
                </p>
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5">
                    <LockClosedIcon className="w-4 h-4 text-emerald-500" /> Chiffré
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheckIcon className="w-4 h-4 text-blue-500" /> Sécurisé
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UserCircleIcon className="w-4 h-4 text-purple-500" /> Privé
                  </span>
                </div>
                <button
                  onClick={() => setShowNewConv(true)}
                  className="mt-8 flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all"
                >
                  <PlusIcon className="w-4 h-4" /> Nouvelle conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New conversation modal */}
      {showNewConv && (
        <NewConversationModal
          currentUser={user}
          onSelect={startNewConversation}
          onClose={() => setShowNewConv(false)}
        />
      )}

      {/* Forward message modal */}
      {forwardMsg && (
        <NewConversationModal
          currentUser={user}
          title="Transférer à"
          onSelect={async (target) => {
            const r = await apiForwardMessage(forwardMsg.id, target.id);
            setForwardMsg(null);
            if (r) {
              showToast("Message transféré");
              const convs = await apiFetchConversations(user.id);
              if (convs) setConversations(convs);
              window.dispatchEvent(new Event("messaging-update"));
            } else {
              showToast("Échec du transfert");
            }
          }}
          onClose={() => setForwardMsg(null)}
        />
      )}

      {/* Delete message confirm */}
      {deleteMsgId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] text-center mb-2">Supprimer ce message ?</h3>
            <p className="text-sm text-[var(--text-muted)] text-center mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteMsgId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                Annuler
              </button>
              <button onClick={() => deleteMessage(deleteMsgId)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl text-sm text-[var(--text-primary)]">
          {toast}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] text-center mb-2">
              Supprimer la conversation ?
            </h3>
            <p className="text-sm text-[var(--text-muted)] text-center mb-6">
              Cette action est irréversible. Tous les messages seront supprimés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(null); setShowConvMenu(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium
                  text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteConversation(showDeleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── New Conversation Modal ─────────── */

function NewConversationModal({
  currentUser,
  onSelect,
  onClose,
  title = "Nouvelle conversation",
}: {
  currentUser: UserData;
  onSelect: (user: { id: string; name: string; email: string }) => void;
  onClose: () => void;
  title?: string;
}) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      apiSearchUsers(search).then((rows) => setUsers(rows.filter((u) => u.id !== currentUser.id)));
    }, 200);
    return () => clearTimeout(t);
  }, [search, currentUser.id]);

  const filtered = users;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition-all">
            <XMarkIcon className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--border-color)]">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* User list */}
        <div className="max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <UserCircleIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--text-muted)]">Aucun résultat</p>
                </div>
              ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelect({ id: u.id, name: u.full_name, email: u.email })}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--bg-hover)] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {u.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{u.full_name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{u.email}</p>
                </div>
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Support contact */}
        <div className="p-3 border-t border-[var(--border-color)]">
          <p className="text-[10px] text-[var(--text-muted)] text-center flex items-center justify-center gap-1">
            <ShieldCheckIcon className="w-3 h-3" />
            Toutes les conversations sont sécurisées et privées
          </p>
        </div>
      </div>
    </div>
  );
}

