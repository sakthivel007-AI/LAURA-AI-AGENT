"use client";

import { useChat } from "ai/react";
import type { Message } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Download,
  Globe2,
  History,
  Menu,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Terminal,
  Trash2,
  WandSparkles,
  X,
  Zap,
  RotateCcw,
} from "lucide-react";

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};
const STORAGE_KEY = "laura.conversations.v1";
const starters = [
  {
    icon: Globe2,
    title: "Explore something",
    detail: "Go down a rabbit hole. Find the interesting.",
    prompt:
      "Help me explore an interesting emerging technology. Explain what it is, why it matters, and where I can learn more.",
    color: "green",
  },
  {
    icon: WandSparkles,
    title: "Create something",
    detail: "Turn a spark of an idea into something real.",
    prompt:
      "Help me brainstorm a creative side project. Ask me about my interests first, then help me shape an actionable idea.",
    color: "purple",
  },
  {
    icon: Code2,
    title: "Build something",
    detail: "A fresh pair of eyes for your next big idea.",
    prompt:
      "Act as my coding partner. Help me plan a new application, starting with questions about what I want to build.",
    color: "orange",
  },
  {
    icon: BookOpen,
    title: "Understand anything",
    detail: "Less complexity. More clarity.",
    prompt:
      "Teach me a challenging concept using a simple analogy. Ask me what I would like to understand first.",
    color: "blue",
  },
];

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState<"search" | "settings" | null>(null);
  const [query, setQuery] = useState("");
  const [activityOpen, setActivityOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState("Balanced");
  const [capabilities, setCapabilities] = useState<{
    configured: boolean;
    search: boolean;
    model: string;
  } | null>(null);
  const {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    status,
    error,
    reload,
    stop,
  } = useChat({ api: "/api/chat", body: { mode } });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === "streaming" || status === "submitted";
  const active = conversations.find((c) => c.id === activeId);
  const toolCalls = messages.flatMap((m) => m.toolInvocations || []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored))
        setConversations(
          stored
            .filter(
              (c) =>
                c &&
                typeof c.id === "string" &&
                typeof c.title === "string" &&
                Array.isArray(c.messages) &&
                c.messages.every(
                  (m: Message) =>
                    m &&
                    typeof m.id === "string" &&
                    typeof m.content === "string" &&
                    ["user", "assistant"].includes(m.role),
                ),
            )
            .slice(0, 50),
        );
    } catch {
      setNotice("Saved conversations could not be loaded.");
    }
    setReady(true);
    fetch("/api/chat")
      .then((r) => r.json())
      .then(setCapabilities)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready || !activeId || !messages.length) return;
    setConversations((previous) => {
      const existing = previous.find((c) => c.id === activeId);
      const conversation = {
        id: activeId,
        title:
          existing?.title ||
          messages.find((m) => m.role === "user")?.content.slice(0, 55) ||
          "New conversation",
        messages,
        updatedAt: Date.now(),
      };
      return [conversation, ...previous.filter((c) => c.id !== activeId)].slice(
        0,
        50,
      );
    });
  }, [messages, activeId, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      setNotice(
        "Browser storage is full or unavailable. Export your chat to keep a copy.",
      );
    }
  }, [conversations, ready]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setModal((m) => (m === "search" ? null : "search"));
      }
      if (e.key === "Escape") {
        setModal(null);
        setSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function newChat() {
    stop();
    setActiveId("");
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
  }
  function openChat(c: Conversation) {
    stop();
    setActiveId(c.id);
    setMessages(c.messages);
    setInput("");
    setModal(null);
    setSidebarOpen(false);
  }
  function exportChat() {
    const text = `# ${active?.title || "LAURA conversation"}\n\n${messages.map((m) => `## ${m.role === "user" ? "You" : "LAURA"}\n\n${m.content}`).join("\n\n")}`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/markdown" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "laura-conversation.md";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function copyMessage(id: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(id);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setNotice("Clipboard access is unavailable in this browser.");
    }
  }

  return (
    <div className="workspace">
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <a className="brand" href="/" aria-label="LAURA home">
          <span className="brand-symbol">
            <AudioLines size={22} />
          </span>
          <span>
            laura<span className="brand-dot">.</span>
          </span>
          <span className="beta-tag">BETA</span>
        </a>
        <button className="new-chat" onClick={newChat}>
          <Plus size={17} /> New conversation <span>↗</span>
        </button>
        <nav className="navigation" aria-label="Main navigation">
          <button onClick={() => setModal("search")}>
            <Search size={17} /> Search conversations <kbd>⌘ K</kbd>
          </button>
          <button
            className={!messages.length ? "nav-active" : ""}
            onClick={newChat}
          >
            <Sparkles size={17} /> Your workspace{" "}
            <span className="nav-indicator" />
          </button>
        </nav>
        <div className="history-heading">
          RECENT CONVERSATIONS <History size={13} />
        </div>
        <div className="conversation-list">
          {conversations.length ? (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`history-row ${activeId === c.id ? "selected" : ""}`}
              >
                <button onClick={() => openChat(c)}>
                  <MessageSquare size={14} />
                  <span>{c.title}</span>
                </button>
                <button
                  className="delete-chat"
                  aria-label={`Delete ${c.title}`}
                  onClick={() => {
                    if (activeId === c.id) newChat();
                    setConversations((all) => all.filter((x) => x.id !== c.id));
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          ) : (
            <div className="history-empty">
              <MessageSquare size={21} />
              <p>A little space for big ideas.</p>
              <span>Your conversations will appear here.</span>
            </div>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="local-card">
            <ShieldCheck size={17} />
            <div>
              Your space. Your ideas.<p>Chats saved on this device.</p>
            </div>
          </div>
          <button className="settings-nav" onClick={() => setModal("settings")}>
            <Settings2 size={16} /> Settings & preferences
          </button>
          <div className="profile">
            <span className="avatar">Y</span>
            <div>
              Your workspace<small>Local workspace</small>
            </div>
            <button
              aria-label="Open workspace settings"
              onClick={() => setModal("settings")}
            >
              <MoreHorizontal size={19} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={19} />
            </button>
            <span className="desktop-panel-icon">
              <PanelLeftClose size={17} />
            </span>
            <span className="breadcrumb">Workspace</span>
            <ChevronRight size={13} />
            <span className="breadcrumb-current">
              {messages.length ? "Conversation" : "New conversation"}
            </span>
          </div>
          <div className="topbar-right">
            <span className="private-badge">
              <ShieldCheck size={13} /> Local history
            </span>
            <button
              className={`activity-button ${activityOpen ? "active" : ""}`}
              onClick={() => setActivityOpen(!activityOpen)}
            >
              <AudioLines size={15} />
              <span>Activity</span>
              {toolCalls.length > 0 && <b>{toolCalls.length}</b>}
            </button>
          </div>
        </header>

        <div className="conversation-scroll" ref={scrollRef}>
          {!messages.length ? (
            <div className="welcome">
              <div className="eyebrow">
                <span /> A LITTLE INTELLIGENCE. ENDLESS POSSIBILITY.
              </div>
              <h1>
                A clearer mind.
                <br />A little <span>more possible.</span>
              </h1>
              <p className="welcome-description">
                Meet Laura, your thinking partner for the everyday
                <br className="desktop-break" /> and the extraordinary. What
                shall we work on?
              </p>
              <div className="welcome-actions">
                <span>
                  <Sparkles size={13} /> Thoughtful by design
                </span>
                <i />
                <span>
                  <Zap size={13} /> Ready when you are
                </span>
              </div>
              <div className="starter-grid">
                {starters.map(
                  ({ icon: Icon, title, detail, prompt, color }) => (
                    <button
                      className="starter-card"
                      key={title}
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                    >
                      <div className="starter-card-top">
                        <span className={`starter-icon ${color}`}>
                          <Icon size={21} strokeWidth={1.6} />
                        </span>
                        <ArrowUpRight size={16} />
                      </div>
                      <h2>{title}</h2>
                      <p>{detail}</p>
                    </button>
                  ),
                )}
              </div>
              <div className="inspiration">
                <span className="tiny-line" />
                <span>
                  Big questions or small tasks. You’re in the right place.
                </span>
                <span className="tiny-line" />
              </div>
            </div>
          ) : (
            <div className="message-list">
              <div className="chat-heading">
                <span>YOUR CONVERSATION</span>
                <button onClick={exportChat}>
                  <Download size={14} /> Export
                </button>
              </div>
              {messages.map((m) => (
                <article className={`message ${m.role}`} key={m.id}>
                  <span
                    className={`message-avatar ${m.role === "assistant" ? "laura-avatar" : ""}`}
                  >
                    {m.role === "user" ? "Y" : <AudioLines size={18} />}
                  </span>
                  <div className="message-body">
                    <div className="message-author">
                      {m.role === "user" ? "You" : "Laura"}
                      {m.role === "assistant" && (
                        <span>YOUR THINKING PARTNER</span>
                      )}
                    </div>
                    {m.content && (
                      <div className="markdown">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                    {m.toolInvocations?.map((t) => (
                      <details className="inline-tool" key={t.toolCallId}>
                        <summary>
                          <Terminal size={13} /> {t.toolName}{" "}
                          <span>
                            {t.state === "result" ? "Completed" : "Working…"}
                          </span>
                        </summary>
                        <pre>
                          {JSON.stringify(
                            t.state === "result" ? t.result : t.args,
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    ))}
                    {m.role === "assistant" && m.content && (
                      <button
                        className="copy-button"
                        onClick={() => copyMessage(m.id, m.content)}
                      >
                        {copied === m.id ? (
                          <Check size={13} />
                        ) : (
                          <Copy size={13} />
                        )}
                        {copied === m.id ? "Copied" : "Copy response"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
              {busy && (
                <div className="thinking" role="status">
                  <span className="thinking-dot" /> Laura is{" "}
                  {status === "submitted" ? "thinking" : "responding"}…
                </div>
              )}
            </div>
          )}
        </div>

        <div className="composer-area">
          {error && messages.length > 0 && (
            <div className="error-banner" role="alert">
              <span>
                {capabilities?.configured === false
                  ? "Connect a Gemini API key in your server environment to start chatting."
                  : "Something interrupted the response. Please try again."}
              </span>
              <button disabled={busy} onClick={() => reload()}>
                <RotateCcw size={13} /> Retry
              </button>
            </div>
          )}
          <form
            className="composer"
            onSubmit={(e) => {
              if (!input.trim() || busy) {
                e.preventDefault();
                return;
              }
              if (!activeId) setActiveId(crypto.randomUUID());
              handleSubmit(e);
            }}
          >
            <textarea
              ref={inputRef}
              aria-label="Message Laura"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask anything, or let’s figure it out together…"
              rows={2}
              maxLength={12000}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <div className="composer-bottom">
              <div className="composer-options">
                <span className="model-label">
                  <span /> Gemini <ChevronDown size={12} />
                </span>
                <span className="composer-divider" />
                <label className="mode-select">
                  <Sparkles size={13} />
                  <select
                    aria-label="Response style"
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option>Balanced</option>
                    <option>Concise</option>
                    <option>Detailed</option>
                  </select>
                </label>
              </div>
              <div className="send-controls">
                <span>↵ to send</span>
                {busy ? (
                  <button
                    type="button"
                    className="send-button"
                    aria-label="Stop response"
                    onClick={stop}
                  >
                    <Square size={15} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    className="send-button"
                    type="submit"
                    disabled={!input.trim() || !ready}
                    aria-label="Send message"
                  >
                    <ArrowUp size={19} />
                  </button>
                )}
              </div>
            </div>
          </form>
          <div className="composer-caption">
            <span>
              Laura can make mistakes. A second look is always a good idea.
            </span>
            <span className="powered">
              <span /> BUILT TO THINK WITH YOU
            </span>
          </div>
        </div>
        <footer className="workspace-footer">
          <span>
            <span className="footer-mark">✳</span> A little more human. A lot
            more helpful.
          </span>
          <span>
            Made for your next <i>what if.</i> <ArrowUpRight size={12} />
          </span>
        </footer>
      </main>

      {activityOpen && (
        <aside className="activity-panel">
          <div className="activity-title">
            <h2>
              <AudioLines size={17} /> Agent activity
            </h2>
            <button
              className="icon-button"
              aria-label="Close activity"
              onClick={() => setActivityOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <p className="activity-description">
            A look behind the answer. Tool calls from this conversation appear
            here.
          </p>
          {toolCalls.length ? (
            toolCalls.map((t) => (
              <div className="activity-item" key={t.toolCallId}>
                <div>
                  <Terminal size={15} />
                  <strong>{t.toolName}</strong>
                  <span>{t.state === "result" ? "Done" : "Running"}</span>
                </div>
                <pre>{JSON.stringify(t.args, null, 2)}</pre>
                {t.state === "result" && (
                  <details>
                    <summary>View result</summary>
                    <pre>{JSON.stringify(t.result, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))
          ) : (
            <div className="activity-empty">
              <Zap size={26} />
              <h3>Quietly ready.</h3>
              <p>
                Ask Laura to calculate, search the web, or check the time to see
                tools in action.
              </p>
            </div>
          )}
        </aside>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "search" ? "Search conversations" : "Settings"
            }
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const elements = e.currentTarget.querySelectorAll<HTMLElement>(
                  'button, input, select, [tabindex="0"]',
                );
                const first = elements[0],
                  last = elements[elements.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <div className="modal-heading">
              <h2>
                {modal === "search"
                  ? "Find a conversation"
                  : "Your workspace settings"}
              </h2>
              <button
                autoFocus={modal === "settings"}
                className="icon-button"
                aria-label="Close dialog"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            {modal === "search" ? (
              <>
                <div className="search-field">
                  <Search size={18} />
                  <input
                    autoFocus
                    placeholder="Search ideas, questions, conversations…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="search-results">
                  {conversations
                    .filter((c) =>
                      `${c.title} ${c.messages.map((m) => m.content).join(" ")}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((c) => (
                      <button key={c.id} onClick={() => openChat(c)}>
                        <MessageSquare size={16} />
                        <span>
                          {c.title}
                          <small>
                            {new Date(c.updatedAt).toLocaleDateString()}
                          </small>
                        </span>
                        <ChevronRight size={15} />
                      </button>
                    ))}
                  {!conversations.some((c) =>
                    `${c.title} ${c.messages.map((m) => m.content).join(" ")}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  ) && (
                    <p className="no-results">
                      No conversations found. Your next idea is a new chat away.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="settings-content">
                <div className="setting-row">
                  <div>
                    <h3>Gemini connection</h3>
                    <p>
                      {capabilities?.model || "Checking server configuration…"}
                    </p>
                  </div>
                  <span
                    className={`connection-state ${capabilities?.configured ? "connected" : ""}`}
                  >
                    {capabilities
                      ? capabilities.configured
                        ? "Configured"
                        : "Not configured"
                      : "Checking"}
                  </span>
                </div>
                <div className="setting-row">
                  <div>
                    <h3>Web search</h3>
                    <p>Powered by Tavily</p>
                  </div>
                  <span
                    className={`connection-state ${capabilities?.search ? "connected" : ""}`}
                  >
                    {capabilities?.search ? "Configured" : "Not configured"}
                  </span>
                </div>
                <div className="settings-note">
                  <ShieldCheck size={20} />
                  <p>
                    Conversations are stored only in this browser. Messages are
                    sent to Google to generate responses, and search queries are
                    sent to Tavily when enabled. API keys stay on the server.
                  </p>
                </div>
                <p className="setup-help">
                  To connect, set <code>GOOGLE_GENERATIVE_AI_API_KEY</code> in{" "}
                  <code>.env.local</code> and restart the server. Optionally add{" "}
                  <code>TAVILY_API_KEY</code> for web search.
                </p>
                <button
                  className="danger-button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Permanently delete all conversations saved in this browser?",
                      )
                    ) {
                      newChat();
                      setConversations([]);
                      setModal(null);
                      setNotice("Local conversation history cleared.");
                    }
                  }}
                >
                  <Trash2 size={15} /> Clear local history
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
