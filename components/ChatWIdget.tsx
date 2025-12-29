"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { dbClient } from "../libs/firebase-client";
import { useAuthStore } from "@/store/useAppStore";

type Message = {
  sender: "user" | "admin";
  text: string;
};

export default function ChatWidget() {
  const { user, isAuthenticated, authInitialized } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatReady, setChatReady] = useState(false);

  // UI
  const [minimized, setMinimized] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const firstLoadRef = useRef(true);
  const initializedChatIdRef = useRef<string | null>(null);

  /* ---------------- Chat ID ---------------- */

  const chatId =
    isAuthenticated && user?.phone
      ? `chat_${user.phone.replace(/\D/g, "")}`
      : null;

  /* ---------------- Auto-create chat ---------------- */

  useEffect(() => {
    if (
      !authInitialized ||
      !isAuthenticated ||
      !chatId ||
      initializedChatIdRef.current === chatId
    )
      return;

    initializedChatIdRef.current = chatId;

    const initChat = async () => {
      const ref = doc(dbClient, "chats", chatId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          status: "open",
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastMessageAt: serverTimestamp(),
          lastSender: "user",
          user: {
            firstName: user?.firstName,
            lastName: user?.lastName,
            phone: user?.phone,
          },
        });
      }

      setChatReady(true);
    };

    initChat();
  }, [authInitialized, isAuthenticated, chatId, user]);

  /* ---------------- Messages listener ---------------- */

  useEffect(() => {
    if (!chatReady || !chatId) return;

    const q = query(
      collection(dbClient, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => d.data() as Message);
      setMessages(msgs);

      const last = msgs[msgs.length - 1];
      if (last?.sender === "admin" && minimized) {
        setHasUnread(true);
      }
    });
  }, [chatReady, chatId, minimized]);

  /* ---------------- Scroll ---------------- */

  useEffect(() => {
    if (!bottomRef.current) return;

    bottomRef.current.scrollIntoView({
      behavior: firstLoadRef.current ? "auto" : "smooth",
    });

    firstLoadRef.current = false;
  }, [messages]);

  /* ---------------- Send ---------------- */

  const send = async () => {
    if (!input.trim() || !chatId || !chatReady) return;

    const text = input.trim();
    setInput("");
    setHasUnread(false);

    await addDoc(collection(dbClient, "chats", chatId, "messages"), {
      sender: "user",
      text,
      createdAt: serverTimestamp(),
    });

    await setDoc(
      doc(dbClient, "chats", chatId),
      {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastSender: "user",
      },
      { merge: true }
    );
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="fixed bottom-6 right-6 z-50">

      {/* Floating Button */}
      {minimized && (
        <button
          onClick={() => {
            setMinimized(false);
            setHasUnread(false);
          }}
          className="relative w-14 h-14 rounded-full
                     bg-gradient-to-br from-yellow-400 to-yellow-500
                     flex items-center justify-center shadow-lg"
        >
          💬
          {hasUnread && (
            <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      )}

      {/* Chat Window */}
      {!minimized && (
        <div
          className="w-80 rounded-xl shadow-xl overflow-hidden"
          style={{
            background: "var(--chat-bg)",
            border: "1px solid var(--chat-border)",
            color: "var(--fg)",
          }}
        >
          {/* Header */}
          <div
            className="p-3 flex justify-between items-center"
            style={{
              borderBottom: "1px solid var(--chat-border)",
            }}
          >
            <span className="font-medium">Chat with us</span>
            <button
              onClick={() => setMinimized(true)}
              style={{ color: "var(--chat-muted)" }}
            >
              —
            </button>
          </div>

          {/* AUTH / CONTENT */}
          {!authInitialized ? (
            <div className="p-4 text-sm" style={{ color: "var(--chat-muted)" }}>
              Loading chat…
            </div>
          ) : !isAuthenticated ? (
            <div className="p-4 space-y-3 text-sm">
              <p>Please login to start chatting.</p>
              <button
                onClick={() => (window.location.href = "/login")}
                className="w-full bg-yellow-500 text-black py-2 rounded font-medium"
              >
                Login
              </button>
            </div>
          ) : !chatReady ? (
            <div className="p-4 text-sm" style={{ color: "var(--chat-muted)" }}>
              Initializing chat…
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="p-3 h-64 overflow-y-auto space-y-2 text-sm">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      m.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className="px-3 py-2 rounded-2xl max-w-[75%]"
                      style={{
                        background:
                          m.sender === "user"
                            ? "rgb(234 179 8)" // yellow
                            : "var(--chat-admin-bg)",
                        color:
                          m.sender === "user"
                            ? "#000"
                            : "var(--fg)",
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div
                className="p-3 flex gap-2"
                style={{
                  borderTop: "1px solid var(--chat-border)",
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type your message…"
                  className="flex-1 px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--input-text)] placeholder-[var(--input-placeholder)] text-sm focus:outline-none focus:border-[rgb(var(--gold-rgb))] focus:ring-1 focus:ring-[rgb(var(--gold-rgb))] transition-all"
                />
                <button
                  onClick={send}
                  className="bg-yellow-500 px-3 rounded text-sm font-medium text-black"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
