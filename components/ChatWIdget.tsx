"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  query,
  orderBy,
  getDoc,
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
  const [minimized, setMinimized] = useState(false);

  const initializedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);


  /* ---------------- Restore chat on load ---------------- */

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

  /* ---------------- Auto scroll to bottom ---------------- */

useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);


  /* ---------------- Create chat ---------------- */

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
      user: { name, phone },
    });

    setChatId(id);
    setStarted(true);
  };

  /* ---------------- Realtime messages ---------------- */

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(dbClient, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    return onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => d.data() as Message)
      );
    });
  }, [chatId]);

  /* ---------------- Send message ---------------- */

  const send = async () => {
    if (!input.trim() || !chatId) return;

    const text = input.trim();
    setInput("");

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
        lastSender: "user", // 🔥 key for admin notification
      },
      { merge: true }
    );
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* MINIMIZED ICON */}
      {minimized && (
        <button
          onClick={() => setMinimized(false)}
          className="w-14 h-14 rounded-full bg-neutral-900 border border-yellow-500/40 flex items-center justify-center shadow-xl hover:scale-105 transition"
          aria-label="Open chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="rgb(234 179 8)"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h8m-8 4h5m7-2a9 9 0 11-4.5-7.794L21 3v6h-6l2.293-2.293A8.963 8.963 0 0119 12z"
            />
          </svg>
        </button>
      )}

      {/* CHAT WIDGET */}
      {!minimized && (
        <div className="w-80 bg-neutral-900 rounded-xl border border-white/10 shadow-xl overflow-hidden">
          {/* HEADER */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="font-medium">Chat with us</span>

            <button
              onClick={() => setMinimized(true)}
              className="text-neutral-400 hover:text-yellow-500 transition"
              aria-label="Minimize chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
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

              <p className="text-xs text-neutral-400 text-center">
                Our team usually replies within a few minutes.
              </p>
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
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`
          max-w-[75%] px-3 py-2 text-sm rounded-2xl
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
  {/* 👇 scroll anchor */}
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
