import React, { useState, useRef, useEffect, useCallback } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ChatbotAvatar } from "@/components/ChatbotAvatar";
import { CustomizationPanel } from "@/components/CustomizationPanel";
import { RobotAvatar, RobotState } from "@/components/RobotAvatar";
import { Button } from "@/components/ui/button";
import { Plus, Send, Zap, Image, Laugh, HelpCircle, ChevronUp, ChevronDown } from "lucide-react";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useGetOpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
  getGetOpenaiConversationQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useChatStreaming } from "@/hooks/use-chat-streaming";
import { useSkills, SkillResult, QuizQuestion } from "@/hooks/use-skills";
import { useCustomization } from "@/context/CustomizationContext";
import { cn } from "@/lib/utils";
import { MarkdownText } from "@/components/MarkdownText";

interface LocalMessage {
  id: string;
  role: "user" | "skill";
  content: string;
  skillResult?: SkillResult;
}

function QuizCard({ question, onAnswer }: { question: QuizQuestion; onAnswer: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      <p className="font-semibold text-base">🧠 {question.question}</p>
      <div className="flex flex-col gap-2">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => { if (selected === null) { setSelected(i); onAnswer(i === question.answer); } }}
            className={cn(
              "text-left px-4 py-2.5 rounded-xl border text-sm transition-all duration-300",
              selected === null
                ? "border-white/15 bg-white/5 hover:bg-primary/20 hover:border-primary/50"
                : i === question.answer
                ? "border-green-500/60 bg-green-500/20 text-green-300"
                : selected === i
                ? "border-red-500/60 bg-red-500/20 text-red-300"
                : "border-white/8 bg-white/3 text-muted-foreground"
            )}
          >
            <span className="font-mono text-xs opacity-40 mr-2">{String.fromCharCode(65 + i)}.</span>
            {opt}
            {selected !== null && i === question.answer && " ✓"}
            {selected !== null && selected === i && i !== question.answer && " ✗"}
          </button>
        ))}
      </div>
      {selected !== null && (
        <p className={cn("text-sm font-semibold animate-msg-in", selected === question.answer ? "text-green-400" : "text-red-400")}>
          {selected === question.answer ? "🎉 Correct! Brilliant!" : `❌ Answer: ${question.options[question.answer]}`}
        </p>
      )}
    </div>
  );
}

function ImageCard({ prompt, url }: { prompt: string; url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">🎨 <em>{prompt}</em></p>
      {!error ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10">
          {!loaded && (
            <div className="h-44 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm bg-white/5">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Generating…</span>
            </div>
          )}
          <img src={url} alt={prompt} onLoad={() => setLoaded(true)} onError={() => setError(true)}
            className={cn("w-full max-h-72 object-cover transition-opacity duration-700", loaded ? "opacity-100" : "opacity-0 h-0")} />
        </div>
      ) : (
        <div className="h-24 flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs">
          Image generation failed — check the prompt.
        </div>
      )}
    </div>
  );
}

function Bubble({
  role, content, skillResult, isStreaming,
}: {
  role: "user" | "assistant" | "skill";
  content?: string;
  skillResult?: SkillResult;
  isStreaming?: boolean;
}) {
  const { settings } = useCustomization();
  const styleMap = {
    glass: "glass-bubble",
    solid: "solid-bubble",
    minimal: "minimal-bubble",
  };

  if (role === "user") {
    return (
      <div className="flex justify-end animate-msg-in">
        <div
          className="max-w-[82%] rounded-2xl rounded-br-md px-4 py-3 text-sm shadow-lg leading-relaxed"
          style={{ background: settings.userBubbleColor, color: settings.userBubbleTextColor }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2.5 animate-msg-in">
      <div className="flex-shrink-0 mt-1">
        <ChatbotAvatar size="sm" />
      </div>
      <div className={cn("max-w-[82%] rounded-2xl rounded-bl-md px-4 py-3 text-sm shadow-lg leading-relaxed", styleMap[settings.assistantStyle])}>
        {skillResult?.type === "image" && skillResult.imageUrl ? (
          <ImageCard prompt={skillResult.content.replace(/^Generating image for: \*\*"/, "").replace(/"\*\*$/, "")} url={skillResult.imageUrl} />
        ) : skillResult?.type === "quiz" && skillResult.quizData ? (
          <QuizCard question={skillResult.quizData} onAnswer={() => {}} />
        ) : isStreaming && !content ? (
          <div className="flex items-center gap-1.5 h-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0.3s]" />
          </div>
        ) : (
          <>
            <MarkdownText content={content || skillResult?.content || ""} />
            {isStreaming && <span className="inline-block w-1 h-4 ml-0.5 bg-primary animate-pulse align-middle rounded-sm" />}
          </>
        )}
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  { emoji: "⚡", label: "/image robot", cmd: "/image a neon robot city at night" },
  { emoji: "😄", label: "/joke",        cmd: "/joke" },
  { emoji: "🧠", label: "/quiz",        cmd: "/quiz" },
  { emoji: "📋", label: "/help",        cmd: "/help" },
];

const SKILLS_BAR = [
  { icon: <Image className="h-3.5 w-3.5" />,     label: "/image",  cmd: "/image " },
  { icon: <Laugh className="h-3.5 w-3.5" />,     label: "/joke",   cmd: "/joke" },
  { icon: <HelpCircle className="h-3.5 w-3.5" />,label: "/quiz",   cmd: "/quiz" },
  { icon: <Zap className="h-3.5 w-3.5" />,       label: "/help",   cmd: "/help" },
];

/* ─── ROBOT STATE LABEL ─────────────────────────────── */
const STATE_LABELS: Record<RobotState, string> = {
  idle:       "Standing by",
  typing:     "Listening…",
  thinking:   "Processing…",
  responding: "Responding…",
  delivered:  "Done!",
};

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { settings } = useCustomization();
  const { processSkill } = useSkills();

  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [convId, setConvId] = useState<number | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [robotState, setRobotState] = useState<RobotState>("idle");
  const deliverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversations } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();
  const deleteConversation = useDeleteOpenaiConversation();

  const { data: activeConversation } = useGetOpenaiConversation(
    convId as number,
    { query: { enabled: !!convId, queryKey: getGetOpenaiConversationQueryKey(convId as number) } }
  );

  const { sendMessage, isStreaming, streamingContent } = useChatStreaming({ conversationId: convId || undefined });

  /* ─── ROBOT STATE MACHINE ───────────────────────── */
  // Typing → set while input has chars and not streaming
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (e.target.value.trim() && !isStreaming) {
      setRobotState("typing");
    } else if (!e.target.value.trim() && !isStreaming) {
      setRobotState("idle");
    }
  };

  // Watch streaming to drive thinking → responding → delivered → idle
  const prevStreamingRef = useRef(false);
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    prevStreamingRef.current = isStreaming;

    if (isStreaming && !wasStreaming) {
      // Just started streaming (thinking phase before first token)
      setRobotState("thinking");
    }
    if (isStreaming && streamingContent) {
      // Tokens arriving → responding
      setRobotState("responding");
    }
    if (!isStreaming && wasStreaming) {
      // Streaming just ended → delivered
      setRobotState("delivered");
      if (deliverTimerRef.current) clearTimeout(deliverTimerRef.current);
      deliverTimerRef.current = setTimeout(() => setRobotState("idle"), 2000);
    }
  }, [isStreaming, streamingContent]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (deliverTimerRef.current) clearTimeout(deliverTimerRef.current); }, []);

  /* ─── Session init ──────────────────────────────── */
  useEffect(() => {
    if (!sessionStorage.getItem("nova-session")) {
      sessionStorage.setItem("nova-session", "1");
      setConvId(null);
      setLocalMessages([]);
    }
  }, []);

  /* ─── Auto scroll ───────────────────────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [activeConversation?.messages, streamingContent, localMessages]);

  const handleNewChat = () => {
    setConvId(null);
    setLocalMessages([]);
    setInput("");
    setSkillsOpen(false);
    setRobotState("idle");
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleSend = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || isStreaming) return;
    setInput("");
    setSkillsOpen(false);
    setRobotState("thinking");

    const skill = processSkill(msg);
    if (skill.type !== "none") {
      setLocalMessages((p) => [
        ...p,
        { id: Date.now() + "-u", role: "user", content: msg },
        { id: Date.now() + "-s", role: "skill", content: skill.content, skillResult: skill },
      ]);
      setRobotState("delivered");
      deliverTimerRef.current = setTimeout(() => setRobotState("idle"), 1500);
      return;
    }

    let cid = convId;
    if (!cid) {
      const c = await createConversation.mutateAsync({ data: { title: msg.slice(0, 40) } });
      cid = c.id;
      setConvId(cid);
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    }

    queryClient.setQueryData(getGetOpenaiConversationQueryKey(cid!), (old: any) => old
      ? { ...old, messages: [...old.messages, { id: Date.now(), role: "user", content: msg, createdAt: new Date().toISOString() }] }
      : old
    );
    await sendMessage(msg, cid!);
  };

  const hasMessages = convId !== null || localMessages.length > 0;
  const allMessages = [
    ...(activeConversation?.messages || []).map((m: any) => ({ ...m, source: "remote" as const })),
  ];

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden text-foreground relative" style={{ maxWidth: "100vw" }}>
      <AnimatedBackground />

      {/* ── FLOATING ROBOT AVATAR ───────────────────── */}
      <div
        className={cn(
          "fixed right-3 bottom-24 z-30 pointer-events-none select-none",
          "transition-all duration-500",
          robotState === "idle"       && "opacity-40 scale-90",
          robotState === "typing"     && "opacity-70 scale-95",
          robotState === "thinking"   && "opacity-90 scale-100",
          robotState === "responding" && "opacity-95 scale-105",
          robotState === "delivered"  && "opacity-80 scale-95",
        )}
      >
        {/* Glow ring behind robot */}
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-2xl transition-all duration-500",
            robotState === "thinking"   && "opacity-60 scale-150",
            robotState === "responding" && "opacity-50 scale-140",
            ["idle","typing","delivered"].includes(robotState) && "opacity-20 scale-110",
          )}
          style={{ background: settings.primaryColor }}
        />
        <RobotAvatar state={robotState} className="relative" style={{ width: 80, height: 120 } as React.CSSProperties} />

        {/* State label badge */}
        <div className={cn(
          "absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap",
          "text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all duration-300",
          robotState === "idle"       && "opacity-0",
          robotState !== "idle"       && "opacity-100",
          "bg-black/60 border-primary/30 text-primary/80",
        )}>
          {STATE_LABELS[robotState]}
        </div>
      </div>

      {/* TOP BAR */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 app-header flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <ChatbotAvatar size="sm" />
            <span className="absolute -inset-1.5 rounded-full border border-primary/30 animate-ring-1 pointer-events-none" />
            <span className="absolute -inset-3 rounded-full border border-primary/15 animate-ring-2 pointer-events-none" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none gradient-text">{settings.chatbotName}</h1>
            <p className="text-[10px] text-primary/60 font-mono mt-0.5 flex items-center gap-1">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors duration-300",
                robotState === "thinking" || robotState === "responding"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-green-400 animate-pulse"
              )} />
              {robotState === "thinking" ? "Thinking…" : robotState === "responding" ? "Responding…" : "Online"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <CustomizationPanel />
          <Button variant="ghost" size="icon" onClick={handleNewChat}
            className="h-8 w-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* MESSAGES */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin">
        {!hasMessages && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 space-y-5 pb-10">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-24 h-24 rounded-full border border-primary/20 animate-ring-1" />
              <span className="absolute w-36 h-36 rounded-full border border-primary/10 animate-ring-2" />
              <ChatbotAvatar size="lg" />
            </div>
            <div>
              <h2 className="text-2xl font-bold gradient-text mb-2">How can I help?</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Chat naturally or use <code className="text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">/commands</code> for skills
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {QUICK_PROMPTS.map((p) => (
                <button key={p.cmd} onClick={() => { setInput(p.cmd); setRobotState("typing"); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-left hover:bg-white/10 hover:border-primary/30 transition-all duration-300 group">
                  <span className="text-base group-hover:scale-110 transition-transform">{p.emoji}</span>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground font-mono">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="flex flex-col gap-3 pb-2 pr-24">
            {allMessages.map((m) => (
              <Bubble key={m.id} role={m.role} content={m.content} />
            ))}
            {isStreaming && <Bubble role="assistant" content={streamingContent} isStreaming />}
            {localMessages.map((m) => (
              <Bubble key={m.id} role={m.role === "skill" ? "assistant" : "user"} content={m.content} skillResult={m.skillResult} />
            ))}
          </div>
        )}
      </div>

      {/* SKILLS BAR */}
      <div className="relative z-20 px-3 flex-shrink-0">
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          skillsOpen ? "max-h-16 opacity-100 mb-2" : "max-h-0 opacity-0"
        )}>
          <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar pr-20">
            {SKILLS_BAR.map((s) => (
              <button key={s.label} onClick={() => { setInput(s.cmd); setSkillsOpen(false); setRobotState("typing"); inputRef.current?.focus(); }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition-all">
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* INPUT BAR */}
        <div className="flex items-center gap-2 pb-safe mb-3 pr-0">
          <button onClick={() => setSkillsOpen((v) => !v)}
            className="flex-shrink-0 h-11 w-11 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all">
            {skillsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>

          <form onSubmit={handleSend} className="flex-1 flex items-center gap-2 rounded-2xl input-glow px-4 py-2.5"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Message…"
              disabled={isStreaming}
              className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/50 font-sans min-w-0"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(e); }}
              onFocus={() => { if (!input.trim() && !isStreaming) setRobotState("idle"); }}
              onBlur={() => { if (!input.trim() && !isStreaming) setRobotState("idle"); }}
            />
            <button type="submit" disabled={!input.trim() || isStreaming}
              className={cn(
                "flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-300",
                input.trim() && !isStreaming
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-110 send-glow"
                  : "bg-white/10 text-muted-foreground"
              )}>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
