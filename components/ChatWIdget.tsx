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

type Message = {
  sender: "user" | "admin";
  text: string;
};

export default function ChatWidget() {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  // pre-chat
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [started, setStarted] = useState(false);

  // ui
  const [minimized, setMinimized] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const firstLoadRef = useRef(true);
  const initializedRef = useRef(false);

  /* ---------------- Restore chat ---------------- */

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const storedId = localStorage.getItem("chatId");
    if (!storedId) return;

    getDoc(doc(dbClient, "chats", storedId)).then((snap) => {
      if (snap.exists()) {
        setChatId(storedId);
        setStarted(true);
      } else {
        localStorage.removeItem("chatId");
      }
    });
  }, []);

  /* ---------------- Start chat ---------------- */

  const startChat = async () => {
    if (!name.trim() || !phone.trim()) return;

    const id = crypto.randomUUID();
    localStorage.setItem("chatId", id);

    await setDoc(doc(dbClient, "chats", id), {
      status: "open",
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      lastSender: "user",
      user: {
        name: name.trim(),
        phone: phone.trim(),
      },
    });

    setChatId(id);
    setStarted(true);
  };

  /* ---------------- Messages listener ---------------- */

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(dbClient, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => d.data() as Message);
      setMessages(msgs);

      const last = msgs[msgs.length - 1];
      if (last && last.sender === "admin" && minimized) {
        setHasUnread(true);
      }
    });
  }, [chatId, minimized]);

  /* ---------------- Scroll handling ---------------- */

  useEffect(() => {
    if (!bottomRef.current) return;

    if (firstLoadRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
      firstLoadRef.current = false;
    } else {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  /* ---------------- Send message ---------------- */

  const send = async () => {
    if (!input.trim() || !chatId) return;

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

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* ================= FLOATING ICON ================= */}
      {minimized && (
        <button
          onClick={() => {
            setMinimized(false);
            setHasUnread(false);
          }}
          aria-label="Open chat"
          className="
            relative w-14 h-14 rounded-full
            bg-gradient-to-br from-yellow-400 to-yellow-500
            flex items-center justify-center
            shadow-[0_10px_30px_rgba(234,179,8,0.45)]
            hover:scale-105 transition-transform
          "
        >
          <div className="w-11 h-11 rounded-full bg-neutral-900 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgb(234 179 8)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
            </svg>
          </div>

          {hasUnread && (
            <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-neutral-900 animate-pulse" />
          )}
        </button>
      )}

      {/* ================= CHAT WINDOW ================= */}
      {!minimized && (
        <div className="w-80 bg-neutral-900 rounded-xl border border-white/10 shadow-xl overflow-hidden">
          {/* HEADER */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="font-medium">Chat with us</span>

            <button
              onClick={() => setMinimized(true)}
              aria-label="Minimize chat"
              className="
                w-8 h-8 flex items-center justify-center rounded-full
                text-neutral-400 hover:text-yellow-500
                hover:bg-neutral-800 transition
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M5 12h14" />
              </svg>
            </button>
          </div>

          {/* PRE CHAT */}
          {!started ? (
            <div className="p-4 space-y-3">
              <input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-800 px-3 py-2 rounded text-sm"
              />
              <input
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-neutral-800 px-3 py-2 rounded text-sm"
              />

              <button
                onClick={startChat}
                className="w-full bg-yellow-500 text-black py-2 rounded text-sm font-medium"
              >
                Start chat
              </button>
            </div>
          ) : (
            <>
              {/* MESSAGES */}
              <div className="p-3 h-64 overflow-y-auto space-y-2 text-sm">
                {messages.map((m, i) => {
                  const isUser = m.sender === "user";

                  return (
                    <div
                      key={i}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`
                          max-w-[75%] px-3 py-2 rounded-2xl
                          ${
                            isUser
                              ? "bg-yellow-500 text-black rounded-br-sm"
                              : "bg-neutral-800 text-neutral-200 rounded-bl-sm"
                          }
                        `}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* INPUT */}
              <div className="p-3 flex gap-2 border-t border-white/10">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-neutral-800 px-2 py-1 rounded text-sm"
                  placeholder="Type your message..."
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <button
                  onClick={send}
                  className="bg-yellow-500 px-3 rounded text-sm font-medium"
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
