"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChatBubbleLeftRightIcon, PaperAirplaneIcon, ChevronLeftIcon,
  PaperClipIcon, ArchiveBoxIcon, TrashIcon, ArrowUturnLeftIcon,
  XMarkIcon, DocumentIcon, EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken() {
  try { return localStorage.getItem("token") || sessionStorage.getItem("token") || null; } catch { return null; }
}

interface Msg {
  id: string; sender_id: string; sender_name: string; content: string;
  media_url?: string; media_type?: string; deleted_at?: string;
  reply_to_id?: string; reply_content?: string; reply_media_type?: string;
  reply_sender_name?: string; created_at: string; read: boolean;
}

interface Conv {
  id: string; other_id: string; other_name: string; other_avatar?: string;
  property_title?: string; property_city?: string;
  last_message?: string; last_media_type?: string;
  unread_count: number; archived_by_1: boolean; archived_by_2: boolean;
}

interface Props { myId: string | null; autoOpenConvId?: string | null; onUnreadCount?: (n: number) => void; }

function MediaPreview({ url, type, name }: { url: string; type?: string; name?: string }) {
  const full = url;
  if (type === "image") return <img src={full} alt="photo" className="max-w-[220px] max-h-48 rounded-xl object-cover cursor-pointer" onClick={() => window.open(full, "_blank")} />;
  if (type === "video") return <video src={full} controls className="max-w-[220px] max-h-48 rounded-xl" />;
  if (type === "audio") return <audio src={full} controls className="w-48" />;
  return (
    <a href={full} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline max-w-[200px]">
      <DocumentIcon className="w-5 h-5 shrink-0" />
      <span className="truncate">{name || "Fichier"}</span>
    </a>
  );
}

export default function MessagesPanel({ myId, autoOpenConvId, onUnreadCount }: Props) {
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [convLoading, setConvLoading] = useState(false);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [convMenu, setConvMenu] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchConversations = useCallback(async (autoOpen?: string) => {
    const token = getToken();
    if (!token) return;
    setConvLoading(true);
    try {
      const res = await fetch(`${API}/messages/reservation-conversations`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data: Conv[] = await res.json();
        setConversations(data);
        const total = data.reduce((s, c) => s + (c.unread_count || 0), 0);
        onUnreadCount?.(total);
        const targetId = autoOpen || autoOpenConvId;
        if (targetId) openConvById(data, targetId);
      }
    } catch { /* ignore */ }
    setConvLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenConvId]);

  const openConvById = (convs: Conv[], id: string) => {
    const found = convs.find(c => c.id === id);
    setActiveConvId(found ? id : convs[0]?.id || null);
    loadMessages(found ? id : convs[0]?.id || "");
  };

  const loadMessages = useCallback(async (convId: string) => {
    if (!convId) return;
    const token = getToken();
    if (!token) return;
    setMsgsLoading(true);
    try {
      const res = await fetch(`${API}/messages/conversations/${convId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setMessages(await res.json());
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch { /* ignore */ }
    setMsgsLoading(false);
  }, []);

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("open_conv_id");
      if (pending) { sessionStorage.removeItem("open_conv_id"); fetchConversations(pending); }
      else fetchConversations();
    } catch { fetchConversations(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openConv = (id: string) => {
    setActiveConvId(id);
    setReplyTo(null);
    setConvMenu(null);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c));
    loadMessages(id);
  };

  const sendText = async () => {
    if (!input.trim() || !activeConvId || sending) return;
    const token = getToken();
    if (!token) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/messages/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: input.trim(), reply_to_id: replyTo?.id }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, { ...msg, reply_content: replyTo?.content, reply_sender_name: replyTo?.sender_name }]);
        setInput(""); setReplyTo(null);
        fetchConversations();
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch { /* ignore */ }
    setSending(false);
  };

  const sendMedia = async (file: File) => {
    if (!activeConvId) return;
    const token = getToken();
    if (!token) return;
    setUploadProgress(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (input.trim()) fd.append("caption", input.trim());
      const res = await fetch(`${API}/messages/conversations/${activeConvId}/media`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        setInput(""); setPreviewFile(null);
        fetchConversations();
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch { /* ignore */ }
    setUploadProgress(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewFile({ file, url: URL.createObjectURL(file) });
    e.target.value = "";
  };

  const deleteMessage = async (msgId: string) => {
    const token = getToken();
    if (!token) return;
    await fetch(`${API}/messages/messages/${msgId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: "[Message supprime]", deleted_at: new Date().toISOString(), media_url: undefined } : m));
  };

  const archiveConv = async (convId: string, archive: boolean) => {
    const token = getToken();
    if (!token) return;
    setConvMenu(null);
    await fetch(`${API}/messages/conversations/${convId}/archive`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ archive }),
    });
    fetchConversations();
    if (archive && activeConvId === convId) setActiveConvId(null);
  };

  const deleteConv = async (convId: string) => {
    if (!confirm("Supprimer cette conversation ?")) return;
    const token = getToken();
    if (!token) return;
    setConvMenu(null);
    await fetch(`${API}/messages/conversations/${convId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchConversations();
    if (activeConvId === convId) setActiveConvId(null);
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } };
  const activeConv = conversations.find(c => c.id === activeConvId);
  const filteredConvs = showArchived
    ? conversations.filter(c => c.archived_by_1 || c.archived_by_2)
    : conversations.filter(c => !c.archived_by_1 && !c.archived_by_2);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden" style={{ height: "640px" }}>
      <div className="flex h-full">
        <div className={`flex flex-col border-r border-gray-100 dark:border-gray-800 ${activeConvId ? "hidden md:flex w-72" : "flex w-full md:w-72"}`}>
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">{showArchived ? "Archives" : "Conversations"}</h2>
            <div className="flex items-center gap-1">
              <button onClick={fetchConversations} className="text-gray-400 hover:text-gray-600 text-xs p-1">
                <span>&#8635;</span>
              </button>
              <button onClick={() => { setShowArchived(s => !s); setActiveConvId(null); }}
                className={`p-1 rounded ${showArchived ? "text-rose-500" : "text-gray-400 hover:text-gray-600"}`}>
                <ArchiveBoxIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convLoading && <div className="flex items-center justify-center py-10 text-gray-400 text-sm">Chargement...</div>}
            {!convLoading && filteredConvs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-400">
                <ChatBubbleLeftRightIcon className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">{showArchived ? "Aucune archive" : "Aucun message"}</p>
              </div>
            )}
            {!convLoading && filteredConvs.map(c => (
              <div key={c.id} className="relative group">
                <button onClick={() => openConv(c.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-50 dark:border-gray-800 ${activeConvId === c.id ? "bg-rose-50 dark:bg-rose-900/10" : ""}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {String(c.other_name?.[0] || "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.other_name}</p>
                      {c.unread_count > 0 && <span className="bg-rose-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center shrink-0">{c.unread_count}</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{c.property_title || "Reservation"}</p>
                    {c.last_message && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {c.last_media_type === "image" ? "Photo" : c.last_media_type === "video" ? "Video" : c.last_media_type === "audio" ? "Audio" : c.last_media_type === "file" ? "Fichier" : c.last_message}
                      </p>
                    )}
                  </div>
                </button>
                <div className="absolute right-2 top-3 hidden group-hover:flex">
                  <button onClick={() => setConvMenu(convMenu === c.id ? null : c.id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400">
                    <EllipsisVerticalIcon className="w-4 h-4" />
                  </button>
                </div>
                {convMenu === c.id && (
                  <div className="absolute right-2 top-8 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 w-44">
                    {showArchived ? (
                      <button onClick={() => archiveConv(c.id, false)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                        <ArchiveBoxIcon className="w-4 h-4" /> Désarchiver
                      </button>
                    ) : (
                      <button onClick={() => archiveConv(c.id, true)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                        <ArchiveBoxIcon className="w-4 h-4" /> Archiver
                      </button>
                    )}
                    <button onClick={() => deleteConv(c.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600">
                      <TrashIcon className="w-4 h-4" /> Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`flex flex-col flex-1 ${!activeConvId ? "hidden md:flex" : "flex"}`}>
          {!activeConvId && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <ChatBubbleLeftRightIcon className="w-14 h-14 mb-3 opacity-20" />
              <p className="text-sm">Selectionnez une conversation</p>
            </div>
          )}
          {activeConvId && (
            <div className="flex flex-col h-full">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <button onClick={() => setActiveConvId(null)} className="md:hidden text-gray-400 hover:text-gray-600">
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                {activeConv && (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                      {String(activeConv.other_name?.[0] || "?")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{activeConv.other_name}</p>
                      <p className="text-xs text-gray-500">{activeConv.property_title}</p>
                    </div>
                  </div>
                )}
                <button onClick={() => archiveConv(activeConvId, true)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                  <ArchiveBoxIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2" onClick={() => setConvMenu(null)}>
                {msgsLoading && <div className="flex items-center justify-center py-10 text-gray-400 text-sm">Chargement...</div>}
                {!msgsLoading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p className="text-sm">Aucun message - envoyez le premier !</p>
                  </div>
                )}
                {!msgsLoading && messages.map(m => {
                  const isMine = m.sender_id === myId;
                  const isDeleted = !!m.deleted_at;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
                      <div className="relative max-w-xs">
                        {m.reply_content && !isDeleted && (
                          <div className={`text-xs px-3 py-1.5 rounded-t-xl mb-0.5 opacity-80 ${isMine ? "bg-rose-400 text-white ml-1" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mr-1"}`}>
                            <p className="font-semibold">{m.reply_sender_name}</p>
                            <p className="truncate">{m.reply_media_type ? "Media" : m.reply_content}</p>
                          </div>
                        )}
                        <div className={`rounded-2xl px-3 py-2 ${isDeleted ? "bg-gray-100 dark:bg-gray-800 italic text-gray-400" : isMine ? "bg-rose-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"}`}>
                          {!isMine && !isDeleted && <p className="text-xs font-semibold mb-0.5 opacity-70">{m.sender_name}</p>}
                          {m.media_url && !isDeleted && <div className="mb-1"><MediaPreview url={m.media_url} type={m.media_type} /></div>}
                          {m.content && <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                          <p className={`text-xs mt-1 ${isMine && !isDeleted ? "text-rose-200" : "text-gray-400"}`}>
                            {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {!isDeleted && (
                          <div className={`absolute top-0 ${isMine ? "-left-16" : "-right-16"} hidden group-hover:flex items-center gap-1`}>
                            <button onClick={() => { setReplyTo(m); inputRef.current?.focus(); }} className="p-1 rounded-full bg-white dark:bg-gray-700 shadow text-gray-500 hover:text-indigo-500">
                              <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                            </button>
                            {isMine && (
                              <button onClick={() => deleteMessage(m.id)} className="p-1 rounded-full bg-white dark:bg-gray-700 shadow text-gray-500 hover:text-red-500">
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {previewFile && (
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex items-center gap-3">
                  {previewFile.file.type.startsWith("image/") ? (
                    <img src={previewFile.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <DocumentIcon className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-gray-700 dark:text-gray-300">{previewFile.file.name}</p>
                    <p className="text-xs text-gray-400">{(previewFile.file.size / 1024).toFixed(0)} Ko</p>
                  </div>
                  <button onClick={() => sendMedia(previewFile.file)} disabled={uploadProgress}
                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                    {uploadProgress ? "Envoi..." : "Envoyer"}
                  </button>
                  <button onClick={() => setPreviewFile(null)} className="p-1 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}

              {replyTo && (
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-indigo-50 dark:bg-indigo-900/20 flex items-center gap-2">
                  <ArrowUturnLeftIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{replyTo.sender_name}</p>
                    <p className="text-xs text-gray-500 truncate">{replyTo.media_type ? "Media" : replyTo.content}</p>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2">
                  <button onClick={() => fileRef.current?.click()} className="text-gray-400 hover:text-rose-500 transition-colors shrink-0 pb-0.5">
                    <PaperClipIcon className="w-5 h-5" />
                  </button>
                  <input ref={fileRef} type="file" className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.txt"
                    onChange={handleFileSelect} />
                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                    placeholder="Tapez votre message... (Entree pour envoyer)" rows={1}
                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none resize-none max-h-32 overflow-y-auto placeholder-gray-400" />
                  <button onClick={sendText} disabled={!input.trim() || sending}
                    className="w-8 h-8 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center shrink-0">
                    <PaperAirplaneIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-center">Images - Videos - Audio - PDF - Documents (max 50MB)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
