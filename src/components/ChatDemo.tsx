"use client";

import { motion, AnimatePresence, easeOut } from "framer-motion";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const DEMO_API_URL = process.env.NEXT_PUBLIC_DELTA_API_URL || "https://delta-80ht.onrender.com";

export default function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Delta, your AI health companion. I can help you with nutrition, fitness, sleep, and building healthy habits. What would you like to work on today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateUserId = () => {
    if (typeof window === "undefined") return "demo-user";
    const stored = localStorage.getItem("delta-demo-user-id");
    if (stored) return stored;
    const newId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("delta-demo-user-id", newId);
    return newId;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const userId = generateUserId();
      const response = await fetch(`${DEMO_API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I'm having trouble responding right now. Please try again.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="bg-background rounded-3xl overflow-hidden">
        <div
          ref={messagesContainerRef}
          className="h-[400px] overflow-y-auto p-6 space-y-4"
        >
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-primary text-white rounded-tr-md"
                      : "bg-border rounded-tl-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-border px-4 py-3 rounded-2xl rounded-tl-md">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                      className="w-2 h-2 rounded-full bg-muted"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="p-4">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Delta anything about health..."
              rows={1}
              className="flex-1 px-4 py-3 bg-background border border-border rounded-xl resize-none focus:outline-none focus:border-primary transition-colors text-sm"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-primary text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </motion.button>
          </div>
          <p className="text-xs text-muted mt-2 text-center">
            This is a demo. <a href="/signup" className="text-primary hover:underline">Sign up</a> for the full experience.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
