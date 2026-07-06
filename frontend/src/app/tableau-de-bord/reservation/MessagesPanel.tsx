"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken() {
  try { return localStorage.getItem("token") || sessionStorage.getItem("token") || null; } catch { return null; }
}

interface Props {
  myId: string | null;
  autoOpenConvId?: string | null;
}

export default function MessagesPanel({ myId, autoOpenConvId }: Props) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [convLoading, setConvLoading] = useState(false);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async (autoOpen?: string) => {
    const token = getToken();
    if (!token) return;
    setConvLoading(true);
    try {
      const res = await fetch(`${API}/messages/reservation-conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        // Auto-open specific conversation if provided
        const targetId = autoOpen || autoOpenConvId;
        if (targetId && data.find((c: any) => c.id === targetId)) {
          openConv(targetId);
        } else if (targetId && data.length > 0) {
          // Fallback: open most recent conversation
          openConv(data[0].id);
        }
      }
    } catch { /* ignore */ }
    setConvLoading(false);
  }, [autoOpenConvId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Read pending auto-open from sessionStorage (set by contact-host flow)
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("open_conv_id");
      if (pending) {
        sessionStorage.removeItem("open_conv_id");
        fetchConversations(pending);
      } else {
        fetchConversations();
      }
    } catch {
      fetchConversations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openConv = async (id: string) => {
    setActiveConvId(id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c));
    const token = getToken();
    if (!token) return;
    setMsgsLoading(true);
    try {
      const res = await fetch(`${API}/messages/conversations/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages(await res.json());
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch { /* ignore */ }
    setMsgsLoading(false);
  };

  const send = async () => {
    if (!input.trim() || !activeConvId || sending) return;
    const token = getToken();
    if (!token) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/messages/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setInput("");
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        fetchConversations();
      }
    } catch { /* ignore */ }
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden" style={{ height: "600px" }}>
      <div className="flex h-full">

        {/* Conversations sidebar */}
        <div className={`flex flex-col border-r border-gray-100 dark:border-gray-800 ${activeConvId ? "hidden md:flex w-72" : "flex w-full md:w-72"}`}>
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">Conversations</h2>
            <button onClick={fetchConversations} className="text-gray-400 hover:text-gray-600 text-xs">↻</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convLoading && (
              <div className="flex items-center justify-center py-10 text-gray-400 text-sm">Chargement…</div>
            )}
            {!convLoading && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-400">
                <ChatBubbleLeftRightIcon className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Aucun message</p>
                <p className="text-xs mt-1">Les conversations apparaîtront ici.</p>
              </div>
            )}
            {!convLoading && conversations.map(c => (
              <button
                key={c.id}
                onClick={() => openConv(c.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-50 dark:border-gray-800 ${activeConvId === c.id ? "bg-rose-50 dark:bg-rose-900/10" : ""}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {String(c.other_name?.[0] || "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.other_name}</p>
                    {c.unread_count > 0 && (
                      <span className="bg-rose-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{c.unread_count}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.property_title || "Réservation"}</p>
                  {c.last_message && <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex flex-col flex-1 ${!activeConvId ? "hidden md:flex" : "flex"}`}>
          {!activeConvId && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <ChatBubbleLeftRightIcon className="w-14 h-14 mb-3 opacity-20" />
              <p className="text-sm">Sélectionnez une conversation</p>
            </div>
          )}
          {activeConvId && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <button onClick={() => setActiveConvId(null)} className="md:hidden text-gray-400 hover:text-gray-600">
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                {activeConv && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                      {String(activeConv.other_name?.[0] || "?")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{activeConv.other_name}</p>
                      <p className="text-xs text-gray-500">{activeConv.property_title}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgsLoading && (
                  <div className="flex items-center justify-center py-10 text-gray-400 text-sm">Chargement…</div>
                )}
                {!msgsLoading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p className="text-sm">Aucun message pour l&apos;instant</p>
                  </div>
                )}
                {!msgsLoading && messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === myId ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs rounded-2xl px-4 py-2 ${m.sender_id === myId ? "bg-rose-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"}`}>
                      {m.sender_id !== myId && (
                        <p className="text-xs font-semibold mb-0.5 opacity-70">{m.sender_name}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      <p className={`text-xs mt-1 ${m.sender_id === myId ? "text-rose-200" : "text-gray-400"}`}>
                        {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-2">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Tapez votre message… (Entrée pour envoyer)"
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none resize-none max-h-32 overflow-y-auto placeholder-gray-400"
                  />
                  <button
                    onClick={send}
                    disabled={!input.trim() || sending}
                    className="w-8 h-8 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
