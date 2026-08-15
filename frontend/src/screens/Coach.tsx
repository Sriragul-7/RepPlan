import { useState, useRef, useEffect, useCallback } from "react";
import { BrainIcon, ChevronRightIcon, CloseIcon, DumbbellIcon, TargetIcon, ChartBarIcon, FlameIcon } from "../components/icons";
import {
  api,
  type CoachConversation,
} from "../lib/api";
import { getUserId } from "../lib/user";

type Message = {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: Date;
};

const SUGGESTED_PROMPTS = [
  {
    icon: DumbbellIcon,
    title: "Protein intake",
    subtitle: "How much should you eat daily?",
    prompt: "How much protein should I eat?",
  },
  {
    icon: TargetIcon,
    title: "Set volume",
    subtitle: "Optimal sets for muscle growth",
    prompt: "How many sets should I do for muscle growth?",
  },
  {
    icon: ChartBarIcon,
    title: "Split check",
    subtitle: "Is your current split balanced?",
    prompt: "Is my current split balanced?",
  },
  {
    icon: FlameIcon,
    title: "Pre-workout fuel",
    subtitle: "What to eat before training",
    prompt: "What should I eat before training?",
  },
];

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-ivory font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-ivory">$1</code>')
    .replace(/^• (.*$)/gm, '<span class="block pl-3 before:content-[\'•\'] before:mr-2 before:text-stone">$1</span>')
    .replace(/^(\d+)\. (.*$)/gm, '<span class="block pl-3"><span class="text-stone font-data mr-2">$1.</span>$2</span>');
}

export function Coach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<CoachConversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    api.getCoachConversations().then(setConversations).catch(() => {});
  }, []);

  const loadConversation = async (conv: CoachConversation) => {
    try {
      const msgs = await api.getCoachMessages(conv.id);
      const mapped: Message[] = msgs.map((m) => ({
        id: m.id,
        role: m.role === "assistant" ? "ai" : "user",
        content: m.content,
        timestamp: new Date(m.created_at),
      }));
      setMessages(mapped);
      setConversationId(conv.id);
      setShowHistory(false);
    } catch {
      /* ignore */
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const aiId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: aiId, role: "ai", content: "", timestamp: new Date() },
    ]);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/coach/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": getUserId(),
        },
        body: JSON.stringify({
          message: content.trim(),
          conversation_id: conversationId,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId
                ? { ...m, content: "Rate limit reached. Please wait a moment before trying again." }
                : m
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId
                ? { ...m, content: "Something went wrong. Please try again." }
                : m
            )
          );
        }
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiId ? { ...m, content: m.content + data } : m
              )
            );
          }
        }
      }

      if (buffer.startsWith("data: ") && buffer.slice(6) !== "[DONE]") {
        const data = buffer.slice(6);
        if (data) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, content: m.content + data } : m
            )
          );
        }
      }

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.id === aiId && last.content) {
          api.getCoachConversations().then(setConversations).catch(() => {});
        }
        return prev;
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? { ...m, content: "Connection error. Please check your network and try again." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="animate-slide-up flex h-[calc(100vh-9rem)] flex-col lg:h-[calc(100vh-7rem)]">
      {/* Header */}
      <header className="flex items-center justify-between pt-2 pb-4">
        <div>
          <p className="font-data text-[10px] uppercase tracking-[0.26em] text-stone">
            AI Coach
          </p>
          <h1 className="font-display mt-1 text-[34px] leading-tight text-ivory">
            Intelligence
          </h1>
        </div>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <button
              onClick={startNewConversation}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] transition-all hover:bg-white/[0.08] active:scale-95"
              title="New conversation"
            >
              <svg className="h-5 w-5 text-ivory" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] transition-all hover:bg-white/[0.08] active:scale-95"
          >
            <BrainIcon className="h-5 w-5 text-ivory" />
          </button>
        </div>
      </header>

      {/* Conversation History Panel */}
      {showHistory && (
        <div className="glass-card mb-4 p-4 max-h-60 overflow-y-auto animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <p className="font-accent text-[11px] uppercase tracking-[0.2em] text-stone">
              Recent Conversations
            </p>
            <button onClick={() => setShowHistory(false)} className="text-stone hover:text-ivory">
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          {conversations.length === 0 ? (
            <p className="text-[13px] text-stone">No conversations yet</p>
          ) : (
            <div className="space-y-2">
              {conversations.slice(0, 10).map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  className="ios-tap w-full rounded-xl p-3 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <p className="text-[13px] text-ivory truncate">
                    {conv.title || "New conversation"}
                  </p>
                  <p className="text-[11px] text-stone mt-0.5">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center space-y-3 px-1">
            {/* Suggested Questions */}
            <p className="font-data text-[10px] uppercase tracking-[0.2em] text-stone px-1 pt-2">
              Ask me anything
            </p>
            <div className="space-y-2 px-1">
              {SUGGESTED_PROMPTS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion.prompt)}
                  className="ios-row ios-tap w-full text-left"
                >
                  <div className="glass-card flex h-10 w-10 shrink-0 items-center justify-center">
                    <suggestion.icon className="h-5 w-5 text-ivory" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-ivory">{suggestion.title}</p>
                    <p className="text-xs text-stone">{suggestion.subtitle}</p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-ash" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-ivory text-ink"
                      : "glass-card text-silver"
                  }`}
                >
                  {message.role === "ai" && message.content ? (
                    <div
                      className="text-[15px] leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
                    />
                  ) : (
                    <p className="text-[15px] leading-relaxed whitespace-pre-line">{message.content}</p>
                  )}
                  {message.role === "ai" && isStreaming && message.id === messages[messages.length - 1]?.id && (
                    <span className="inline-block w-1.5 h-4 bg-stone animate-pulse ml-0.5 align-text-bottom" />
                  )}
                  <p
                    className={`mt-1 text-[10px] ${
                      message.role === "user" ? "text-ash" : "text-stone"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="glass-card flex items-center gap-2 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-stone [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-stone [animation-delay:200ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-stone [animation-delay:400ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="glass-card flex items-center gap-3 p-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(input)}
          placeholder="Ask about exercises, nutrition, recovery..."
          className="flex-1 bg-transparent text-[15px] text-ivory placeholder:text-ash outline-none"
          disabled={isStreaming}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isStreaming}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory text-ink transition-all hover:bg-white active:scale-95 disabled:opacity-30"
        >
          {isStreaming ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
