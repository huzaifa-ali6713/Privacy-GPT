import React, { useState, useRef, useEffect, useCallback } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ChatbotAvatar } from "@/components/ChatbotAvatar";
import { CustomizationPanel } from "@/components/CustomizationPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Send, Trash2, Zap, Image, Laugh, HelpCircle } from "lucide-react";
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
  role: "user" | "assistant" | "skill";
  content: string;
  skillResult?: SkillResult;
  timestamp: Date;
}

function QuizCard({ question, onAnswer }: { question: QuizQuestion; onAnswer: (correct: boolean, index: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    onAnswer(i === question.answer, i);
  };

  return (
    <div className="space-y-3">
      <p className="font-semibold text-foreground text-base">🧠 {question.question}</p>
      <div className="grid grid-cols-1 gap-2">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={cn(
              "text-left px-4 py-2.5 rounded-xl border text-sm transition-all",
              selected === null
                ? "border-white/15 bg-white/5 text-foreground hover:bg-primary/20 hover:border-primary/50"
                : i === question.answer
                ? "border-green-500/60 bg-green-500/20 text-green-300"
                : selected === i
                ? "border-red-500/60 bg-red-500/20 text-red-300"
                : "border-white/8 bg-white/3 text-muted-foreground"
            )}
          >
            <span className="font-mono text-xs opacity-50 mr-2">{String.fromCharCode(65 + i)}.</span>
            {opt}
            {selected !== null && i === question.answer && " ✓"}
            {selected !== null && selected === i && i !== question.answer && " ✗"}
          </button>
        ))}
      </div>
      {selected !== null && (
        <p className={cn("text-sm font-medium", selected === question.answer ? "text-green-400" : "text-red-400")}>
          {selected === question.answer ? "🎉 Correct! Well done!" : `❌ Not quite — the answer was: ${question.options[question.answer]}`}
        </p>
      )}
    </div>
  );
}

function ImageSkillCard({ prompt, imageUrl }: { prompt: string; imageUrl: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">🎨 Generating: <em>{prompt}</em></p>
      {!error ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
          {!loaded && (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                <span>Generating image…</span>
              </div>
            </div>
          )}
          <img
            src={imageUrl}
            alt={prompt}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={cn("w-full max-h-[400px] object-cover transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0 h-0")}
          />
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
          Image generation unavailable — try again or check the prompt.
        </div>
      )}
    </div>
  );
}

function AssistantBubble({ content, isStreaming = false, skillResult }: {
  content?: string;
  isStreaming?: boolean;
  skillResult?: SkillResult;
}) {
  const { settings } = useCustomization();
  const styleMap = {
    glass: "glass-panel text-foreground",
    solid: "bg-card text-foreground border border-border",
    minimal: "text-foreground",
  };
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  return (
    <div className={cn("max-w-[88%] rounded-2xl px-5 py-4 text-base transition-all duration-300", styleMap[settings.assistantStyle])}>
      <div className="flex items-center gap-2 mb-3 text-primary text-sm font-medium">
        <ChatbotAvatar size="sm" />
        <span className="text-xs opacity-60 font-semibold tracking-wide">{settings.chatbotName}</span>
        {skillResult && skillResult.type !== "none" && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-mono uppercase tracking-widest">
            {skillResult.type === "image" ? "IMAGE" : skillResult.type === "quiz" ? "QUIZ" : skillResult.type === "ascii" ? "ART" : "SKILL"}
          </span>
        )}
      </div>

      {isStreaming && !content ? (
        <div className="flex items-center h-6 gap-1">
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
        </div>
      ) : skillResult?.type === "image" && skillResult.imageUrl ? (
        <ImageSkillCard prompt={skillResult.content.replace(/^Generating image for: \*\*"/, "").replace(/"\*\*$/, "")} imageUrl={skillResult.imageUrl} />
      ) : skillResult?.type === "quiz" && skillResult.quizData ? (
        <QuizCard
          question={skillResult.quizData}
          onAnswer={(correct) => {
            setQuizAnswered(true);
            setQuizFeedback(correct ? "🎉 Correct! You're a genius!" : "💡 Keep practicing — you'll get it!");
          }}
        />
      ) : (
        <>
          <MarkdownText content={content || skillResult?.content || ""} />
          {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
        </>
      )}
    </div>
  );
}

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { settings } = useCustomization();
  const { processSkill } = useSkills();

  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isProcessingSkill, setIsProcessingSkill] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversations, isLoading: isConversationsLoading } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();
  const deleteConversation = useDeleteOpenaiConversation();

  const { data: activeConversation, isLoading: isActiveConversationLoading } = useGetOpenaiConversation(
    activeConversationId as number,
    { query: { enabled: !!activeConversationId, queryKey: getGetOpenaiConversationQueryKey(activeConversationId as number) } }
  );

  const { sendMessage, isStreaming, streamingContent } = useChatStreaming({
    conversationId: activeConversationId || undefined,
  });

  useEffect(() => {
    const isNewSession = !sessionStorage.getItem("nova-session-active");
    if (isNewSession) {
      sessionStorage.setItem("nova-session-active", "1");
      setActiveConversationId(null);
      setLocalMessages([]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages, streamingContent, localMessages]);

  const handleNewChat = () => {
    setActiveConversationId(null);
    setLocalMessages([]);
    setInputMessage("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isStreaming || isProcessingSkill) return;
    setInputMessage("");

    const skillResult = processSkill(trimmed);

    if (skillResult.type !== "none") {
      setIsProcessingSkill(true);
      const userMsg: LocalMessage = {
        id: Date.now() + "-u",
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      const botMsg: LocalMessage = {
        id: Date.now() + "-s",
        role: "skill",
        content: skillResult.content,
        skillResult,
        timestamp: new Date(),
      };
      setLocalMessages((prev) => [...prev, userMsg, botMsg]);
      setIsProcessingSkill(false);
      return;
    }

    let currentConvId = activeConversationId;
    if (!currentConvId) {
      const newConv = await createConversation.mutateAsync({
        data: { title: trimmed.slice(0, 35) + (trimmed.length > 35 ? "…" : "") },
      });
      currentConvId = newConv.id;
      setActiveConversationId(newConv.id);
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    }

    if (currentConvId) {
      queryClient.setQueryData(getGetOpenaiConversationQueryKey(currentConvId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...old.messages,
            { id: Date.now(), role: "user", content: trimmed, createdAt: new Date().toISOString() },
          ],
        };
      });
      await sendMessage(trimmed, currentConvId);
    }
  };

  const handleDeleteConversation = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          if (activeConversationId === id) {
            setActiveConversationId(null);
            setLocalMessages([]);
          }
        },
      }
    );
  };

  const handleSelectConversation = (id: number) => {
    setLocalMessages([]);
    setActiveConversationId(id);
  };

  const isActive = activeConversationId !== null || localMessages.length > 0;

  const QUICK_PROMPTS = [
    { label: "⚡ /image a neon robot city", cmd: "/image a neon robot city at night with glowing circuits" },
    { label: "😄 /joke", cmd: "/joke" },
    { label: "🧠 /quiz", cmd: "/quiz" },
    { label: "📋 /help", cmd: "/help" },
    { label: "Explain quantum computing", cmd: "Explain quantum computing" },
    { label: "Write a Python script", cmd: "Write a Python script to sort a list" },
  ];

  return (
    <div className="flex h-[100dvh] w-full text-foreground overflow-hidden transition-colors duration-500 relative">
      <AnimatedBackground />

      {/* Sidebar */}
      <div
        className="w-72 flex-shrink-0 flex flex-col z-10 hidden md:flex border-r"
        style={{ background: "rgba(8,10,20,0.82)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <ChatbotAvatar size="sm" />
            <h1 className="font-bold text-base tracking-tight text-foreground transition-all duration-300">
              {settings.chatbotName}
            </h1>
          </div>
          <CustomizationPanel />
        </div>

        <div className="px-3 py-3">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2 border text-foreground shadow-none hover:bg-white/10 transition-all"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)" }}
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <div className="px-3 pb-2">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-mono px-1 mb-1">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { icon: <Image className="h-3 w-3" />, label: "/image", cmd: "/image " },
              { icon: <Laugh className="h-3 w-3" />, label: "/joke", cmd: "/joke" },
              { icon: <HelpCircle className="h-3 w-3" />, label: "/quiz", cmd: "/quiz" },
              { icon: <Zap className="h-3 w-3" />, label: "/help", cmd: "/help" },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setInputMessage(s.cmd)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono text-primary border border-primary/20 bg-primary/10 hover:bg-primary/20 transition-all"
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="flex flex-col gap-1 pb-4">
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-mono px-1 mb-1 mt-2">History</p>
            {isConversationsLoading ? (
              <div className="text-sm text-muted-foreground p-2">Loading…</div>
            ) : !conversations?.length ? (
              <div className="text-xs text-muted-foreground/50 p-2 font-mono">No conversations yet</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    "flex items-center justify-between group px-3 py-2 rounded-md cursor-pointer transition-all text-sm",
                    activeConversationId === conv.id
                      ? "bg-primary/20 text-foreground border border-primary/30"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate text-xs">{conv.title || "New Chat"}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive text-muted-foreground"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="px-4 py-3 border-t text-[10px] text-muted-foreground/40 font-mono" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          Type /help for all skills
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className="flex-1 flex flex-col relative z-10 md:rounded-l-2xl md:my-3 md:mr-3 md:border shadow-2xl"
        style={{ background: "rgba(8,10,20,0.75)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <ChatbotAvatar size="sm" />
            <span className="font-bold text-base text-foreground">{settings.chatbotName}</span>
          </div>
          <div className="flex items-center gap-1">
            <CustomizationPanel />
            <Button variant="ghost" size="icon" onClick={handleNewChat}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6" ref={scrollRef}>
          {!isActive && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
              <div className="relative">
                <ChatbotAvatar size="lg" />
                <div className="absolute -inset-3 rounded-full border border-primary/20 animate-ping opacity-30" />
                <div className="absolute -inset-6 rounded-full border border-primary/10 animate-pulse opacity-20" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
                  How can I help you?
                </h2>
                <p className="text-muted-foreground">
                  Chat naturally, or use skills with <code className="text-primary text-sm">/commands</code>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.cmd}
                    onClick={() => setInputMessage(p.cmd)}
                    className="px-3 py-1.5 text-xs rounded-full border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-primary/30 transition-all font-mono"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isActive && (
            <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full pb-10">
              {isActiveConversationLoading && !activeConversation && activeConversationId ? (
                <div className="flex justify-center py-10">
                  <div className="flex gap-2 items-center text-muted-foreground text-sm">
                    <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              ) : (
                <>
                  {activeConversation?.messages?.map((msg) => (
                    <div key={msg.id} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "user" ? (
                        <div
                          className="max-w-[85%] rounded-2xl px-5 py-3.5 text-base shadow-lg"
                          style={{ backgroundColor: settings.userBubbleColor, color: settings.userBubbleTextColor }}
                        >
                          {msg.content}
                        </div>
                      ) : (
                        <AssistantBubble content={msg.content} />
                      )}
                    </div>
                  ))}
                  {isStreaming && (
                    <div className="flex w-full justify-start">
                      <AssistantBubble content={streamingContent} isStreaming />
                    </div>
                  )}
                </>
              )}

              {localMessages.map((msg) => (
                <div key={msg.id} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "user" ? (
                    <div
                      className="max-w-[85%] rounded-2xl px-5 py-3.5 text-base shadow-lg font-mono text-sm"
                      style={{ backgroundColor: settings.userBubbleColor, color: settings.userBubbleTextColor }}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    <AssistantBubble content={msg.content} skillResult={msg.skillResult} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 md:p-5" style={{ background: "linear-gradient(to top, rgba(8,10,20,0.9) 0%, transparent 100%)" }}>
          <form
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto relative flex items-center rounded-2xl p-1.5 shadow-xl transition-all focus-within:shadow-primary/20"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Message or /image /joke /quiz…"
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm"
              disabled={isStreaming || isProcessingSkill}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e as any);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputMessage.trim() || isStreaming || isProcessingSkill}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 flex-shrink-0 transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="text-center mt-2 text-[10px] text-muted-foreground/40 font-mono">
            AI can make mistakes · Type /help for skills
          </div>
        </div>
      </div>
    </div>
  );
}
