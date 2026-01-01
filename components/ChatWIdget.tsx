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
import { FaWhatsapp } from "react-icons/fa";
import { MessageCircle } from "lucide-react";

type Message = {
  sender: "user" | "admin";
  text: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function buildWhatsAppHref(input: string, message: string) {
  const v = input.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) {
    try {
      const url = new URL(v);
      if (!url.searchParams.has("text")) url.searchParams.set("text", message);
      return url.toString();
    } catch {
      return v;
    }
  }
  let digits = v.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function ChatWidget() {
  const { user, isAuthenticated, authInitialized } = useAuthStore();
  const defaultWhatsAppMessage = "Hi Pearl Bloom, I need help with an order.";
  const placeholderWhatsAppNumber = "7618209009";
  const fallbackWhatsAppHref = buildWhatsAppHref(
    placeholderWhatsAppNumber,
    defaultWhatsAppMessage
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatReady, setChatReady] = useState(false);

  // UI
  const [minimized, setMinimized] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [whatsAppHref, setWhatsAppHref] = useState<string | null>(
    fallbackWhatsAppHref
  );

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const firstLoadRef = useRef(true);
  const initializedChatIdRef = useRef<string | null>(null);
  const launcherRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(dbClient, "siteSettings", "main"));
        const data = snap.exists() ? (snap.data() as unknown) : null;
        if (!data || !isRecord(data)) {
          setWhatsAppHref(fallbackWhatsAppHref);
          return;
        }

        const footer = isRecord(data.footer) ? data.footer : null;
        const business = isRecord(data.business) ? data.business : null;
        const businessSocials = business && isRecord(business.socials) ? business.socials : null;

        const footerSocialLinks = footer && Array.isArray(footer.socialLinks) ? footer.socialLinks : null;
        const footerWhatsApp = footerSocialLinks
          ? footerSocialLinks
              .map((x) => (isRecord(x) ? { platform: asString(x.platform), url: asString(x.url) } : null))
              .filter((x): x is NonNullable<typeof x> => Boolean(x && x.platform && x.url))
              .find((x) => x.platform === "whatsapp")?.url ?? null
          : null;

        const candidates = [
          asString(businessSocials?.whatsapp),
          asString(business?.whatsapp),
          asString(business?.whatsappNumber),
          footerWhatsApp,
          asString(footer?.contactPhone),
          placeholderWhatsAppNumber,
        ].filter((x): x is string => Boolean(x && x.trim()));

        const href =
          candidates
            .map((x) => buildWhatsAppHref(x, defaultWhatsAppMessage))
            .find((x): x is string => Boolean(x)) ?? null;

        setWhatsAppHref(href ?? fallbackWhatsAppHref);
      } catch {
        setWhatsAppHref(fallbackWhatsAppHref);
      }
    };

    load();
  }, [defaultWhatsAppMessage, fallbackWhatsAppHref]);

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

  useEffect(() => {
    if (!launcherOpen) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const root = launcherRef.current;
      const target = e.target;
      if (!root || !(target instanceof Node)) return;
      if (root.contains(target)) return;
      setLauncherOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [launcherOpen]);

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
        <div className="relative" ref={launcherRef}>

          <div
            className="relative w-[72px]"
            style={{ height: launcherOpen ? 220 : 72 }}
          >
            <button
              type="button"
              onClick={() => setLauncherOpen((v) => !v)}
              aria-label="Open support options"
              className="absolute inset-0"
              style={{
                background: "transparent",
                pointerEvents: launcherOpen ? "none" : "auto",
                zIndex: 0,
              }}
            />

            <a
              href={whatsAppHref ?? fallbackWhatsAppHref ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp"
              onClick={(e) => {
                if (!launcherOpen) {
                  e.preventDefault();
                  setLauncherOpen(true);
                  return;
                }
              }}
              className="absolute right-0 top-0 w-[58px] h-[58px] rounded-full flex items-center justify-center shadow-xl"
              style={{
                background: "linear-gradient(to bottom right, #22c55e, #16a34a)",
                transition: "transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 220ms ease",
                transform: launcherOpen ? "translate(0px, -92px)" : "translate(0px, 0px)",
                opacity: 1,
                pointerEvents: launcherOpen ? "auto" : "auto",
                zIndex: 2,
                borderRadius: 9999,
                overflow: "hidden",
              }}
            >
              <FaWhatsapp size={22} color="#fff" />
            </a>

            <button
              type="button"
              aria-label="Chat in-app"
              onClick={() => {
                if (!launcherOpen) {
                  setLauncherOpen(true);
                  return;
                }
                setLauncherOpen(false);
                setMinimized(false);
                setHasUnread(false);
              }}
              className="absolute right-0 top-0 w-[58px] h-[58px] rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(to bottom right, #facc15, #f59e0b)",
                color: "#000",
                transition: "transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 220ms ease",
                transform: launcherOpen ? "translate(0px, -160px)" : "translate(0px, 18px)",
                opacity: launcherOpen ? 1 : 0.92,
                zIndex: launcherOpen ? 1 : 0,
              }}
            >
              <MessageCircle size={22} />
              {!launcherOpen && hasUnread ? (
                <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              ) : null}
            </button>
          </div>
        </div>
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
              onClick={() => {
                setMinimized(true);
                setLauncherOpen(false);
              }}
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
