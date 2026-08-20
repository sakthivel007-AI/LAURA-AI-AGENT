"use client";

import { useChat } from "ai/react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/chat",
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const isBusy = status === "streaming" || status === "submitted";

  return (
    <main className="h-screen w-full flex flex-col bg-bg text-ink">

      {/* Header */}
      <header className="flex items-center px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-good opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-good" />
          </span>

          <h1 className="font-display font-semibold text-[15px] tracking-tight">
            LAURA{" "}
            <span className="text-muted font-normal">
              / An Agentic AI
            </span>
          </h1>
        </div>
      </header>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6"
      >
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Welcome screen */}
          {messages.length === 0 && (
            <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center gap-2 text-muted">
              <div className="w-12 h-12 rounded-full bg-surface border border-border mb-3 flex items-center justify-center">
                <span className="text-xl">✦</span>
              </div>

             

              <p className="text-sm max-w-md">
                HI BABY! HOW CAN I HELP YOU TODAY?😘
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "flex justify-end"
                  : "flex justify-start"
              }
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent/15 border border-accent/30 px-4 py-3 text-[14.5px] leading-relaxed"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm bg-surface border border-border px-4 py-3 text-[14.5px] leading-relaxed prose prose-invert prose-sm prose-p:my-1.5 prose-pre:bg-surface2"
                }
              >
                {m.role === "user" ? (
                  m.content
                ) : (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isBusy && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-surface border border-border px-4 py-3 flex gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-muted animate-blink"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-muted animate-blink"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-muted animate-blink"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-border"
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-surface border border-border rounded-2xl px-3 py-2 focus-within:border-accent/60 transition-colors">

            <textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Message your agent..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-[14.5px] placeholder:text-muted py-2 max-h-32"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  (e.target as HTMLTextAreaElement).form?.requestSubmit();
                }
              }}
            />

            <button
              type="submit"
              disabled={isBusy || !input.trim()}
              className="shrink-0 bg-accent text-bg font-medium text-sm rounded-xl px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              Send
            </button>

          </div>

          <p className="text-center text-[11px] text-muted mt-2">
            AI can make mistakes. Check important information.
          </p>
        </div>
      </form>

    </main>
  );
}