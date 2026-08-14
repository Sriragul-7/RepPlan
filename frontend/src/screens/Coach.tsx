import { useState, useRef, useEffect } from "react";
import { GlassCard } from "../components/GlassCard";
import { BrainIcon, ChevronRightIcon, FlameIcon, TargetIcon, TimerIcon } from "../components/icons";
import { getFitnessResponse, getQuickSuggestions } from "../lib/chatbot";

type Message = {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: Date;
};

const AI_SUGGESTIONS = [
  {
    icon: FlameIcon,
    title: "Recovery Status",
    subtitle: "Based on your recent sessions",
    prompt: "How is my recovery status?",
    response:
      "Your recovery looks solid. You trained 4 days this week with adequate rest between muscle groups. Consider a lighter session today focusing on mobility and flexibility.",
  },
  {
    icon: TargetIcon,
    title: "Workout Recommendation",
    subtitle: "Optimized for your goals",
    prompt: "What workout should I do today?",
    response:
      "Based on your progress, I recommend a Push day with progressive overload on bench press. Your last session was strong — aim for 2.5kg more on your working sets.",
  },
  {
    icon: TimerIcon,
    title: "Rest Optimization",
    subtitle: "Timing between sets",
    prompt: "How long should I rest between sets?",
    response:
      "Your rest periods are optimal for hypertrophy (90-120s). For heavy compounds like squat and deadlift, consider extending to 3-4 minutes for maximum force production.",
  },
];

const INSIGHTS = [
  "Your bench press has increased 12% over the last 4 weeks. Consistent progressive overload is paying off.",
  "You've hit a new PR on deadlift this week. Your posterior chain is responding well to the current programming.",
  "Volume distribution looks balanced across muscle groups. Chest and back are evenly developed.",
  "Your workout consistency is at 85% — excellent adherence to the program.",
];

export function Coach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));

    const response = getFitnessResponse(content);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "ai",
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsTyping(false);
    inputRef.current?.focus();
  };

  const handleSuggestion = async (suggestion: (typeof AI_SUGGESTIONS)[0]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: suggestion.prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "ai",
      content: suggestion.response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const quickSuggestions = getQuickSuggestions();

  return (
    <div className="animate-slide-up flex h-[calc(100vh-8rem)] flex-col">
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
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04]">
          <BrainIcon className="h-5 w-5 text-ivory" />
        </div>
      </header>

      {/* AI Orb Visualization */}
      {messages.length === 0 && (
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-white/[0.06] backdrop-blur-xl" />
              </div>
              <div className="absolute inset-0 animate-glow-pulse rounded-full bg-white/[0.04]" />
            </div>
            <div className="absolute -inset-4 rounded-full border border-white/[0.04] animate-pulse-soft" />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            {/* Daily Insight */}
            <GlassCard className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-ivory" />
                <p className="font-accent text-[11px] uppercase tracking-[0.2em] text-stone">
                  Daily Insight
                </p>
              </div>
              <p className="text-[15px] leading-relaxed text-silver">
                {INSIGHTS[new Date().getDay() % INSIGHTS.length]}
              </p>
            </GlassCard>

            {/* Quick Actions */}
            <p className="font-data text-[10px] uppercase tracking-[0.2em] text-stone px-1 pt-2">
              Quick Analysis
            </p>
            {AI_SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(suggestion)}
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

            {/* Quick Question Suggestions */}
            <p className="font-data text-[10px] uppercase tracking-[0.2em] text-stone px-1 pt-2">
              Popular Questions
            </p>
            <div className="flex flex-wrap gap-2 px-1">
              {quickSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion)}
                  className="glass-card rounded-full px-3 py-2 text-[13px] text-silver transition-all hover:bg-white/[0.06] active:scale-95"
                >
                  {suggestion}
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
                  <p className="text-[15px] leading-relaxed whitespace-pre-line">{message.content}</p>
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
            {isTyping && (
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
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Ask about exercises, nutrition, recovery..."
          className="flex-1 bg-transparent text-[15px] text-ivory placeholder:text-ash outline-none"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isTyping}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory text-ink transition-all hover:bg-white active:scale-95 disabled:opacity-30"
        >
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
        </button>
      </div>
    </div>
  );
}
