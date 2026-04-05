import React, { useState, useRef, useEffect } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ChatbotAvatar } from "@/components/ChatbotAvatar";
import { CustomizationPanel } from "@/components/CustomizationPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Plus, MessageSquare, Send, Trash2 } from "lucide-react";
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
import { useCustomization } from "@/context/CustomizationContext";
import { cn } from "@/lib/utils";
import { MarkdownText } from "@/components/MarkdownText";

function AssistantBubble({ content, isStreaming = false }: { content?: string; isStreaming?: boolean }) {
  const { settings } = useCustomization();

  const styleMap = {
    glass: "glass-panel text-foreground",
    solid: "bg-card text-foreground border border-border",
    minimal: "text-foreground",
  };

  return (
    <div className={cn(
      "max-w-[85%] rounded-2xl px-5 py-4 text-base transition-all duration-300",
      styleMap[settings.assistantStyle]
    )}>
      <div className="flex items-center gap-2 mb-2 text-primary text-sm font-medium">
        <ChatbotAvatar size="sm" />
        <span className="text-xs opacity-60">{settings.chatbotName}</span>
      </div>
      {isStreaming && !content ? (
        <div className="flex items-center h-6 gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
        </div>
      ) : (
        <>
          <MarkdownText content={content || ""} />
          {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
        </>
      )}
    </div>
  );
}

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { settings } = useCustomization();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleNewChat = () => {
    setActiveConversationId(null);
    setInputMessage("");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    let currentConvId = activeConversationId;
    const messageToSend = inputMessage;
    setInputMessage("");

    if (!currentConvId) {
      const newConv = await createConversation.mutateAsync({
        data: { title: messageToSend.slice(0, 30) + (messageToSend.length > 30 ? "..." : "") },
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
            { id: Date.now(), role: "user", content: messageToSend, createdAt: new Date().toISOString() },
          ],
        };
      });
      await sendMessage(messageToSend, currentConvId);
    }
  };

  const handleDeleteConversation = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          if (activeConversationId === id) setActiveConversationId(null);
        },
      }
    );
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages, streamingContent]);

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden transition-colors duration-500">
      <AnimatedBackground />

      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 glass-panel border-r border-white/5 flex flex-col z-10 hidden md:flex transition-colors duration-500">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ChatbotAvatar size="sm" />
            <h1 className="font-bold text-base tracking-tight text-foreground transition-all duration-300">
              {settings.chatbotName}
            </h1>
          </div>
          <CustomizationPanel />
        </div>

        <div className="px-3 pb-2">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2 bg-white/5 hover:bg-white/10 text-foreground border border-white/10 shadow-none"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="flex flex-col gap-1 pb-4">
            {isConversationsLoading ? (
              <div className="text-sm text-muted-foreground p-2">Loading...</div>
            ) : conversations?.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2">No conversations yet</div>
            ) : (
              conversations?.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={cn(
                    "flex items-center justify-between group px-3 py-2 rounded-md cursor-pointer transition-colors text-sm",
                    activeConversationId === conv.id
                      ? "bg-primary/20 text-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{conv.title || "New Chat"}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive text-muted-foreground"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10 glass-panel md:rounded-l-2xl md:my-4 md:mr-4 md:border border-white/5 shadow-2xl transition-colors duration-500">

        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-white/5 flex items-center justify-between">
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8" ref={scrollRef}>
          {!activeConversationId && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <ChatbotAvatar size="lg" />
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3 transition-all duration-300">
                  How can I help you today?
                </h2>
                <p className="text-muted-foreground text-lg">
                  Ask me anything — I'm here to help.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {["Explain quantum computing", "Write a Python script", "Plan a trip to Japan", "Brainstorm startup ideas"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInputMessage(s)}
                    className="px-3 py-1.5 text-xs rounded-full border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeConversationId && (
            <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-10">
              {isActiveConversationLoading && !activeConversation ? (
                <div className="flex justify-center py-10">
                  <div className="animate-pulse flex gap-2">
                    <div className="h-2 w-2 bg-primary/50 rounded-full" />
                    <div className="h-2 w-2 bg-primary/50 rounded-full" />
                    <div className="h-2 w-2 bg-primary/50 rounded-full" />
                  </div>
                </div>
              ) : (
                <>
                  {activeConversation?.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {msg.role === "user" ? (
                        <div
                          className="max-w-[85%] rounded-2xl px-5 py-4 text-base shadow-lg transition-all duration-300"
                          style={{
                            backgroundColor: settings.userBubbleColor,
                            color: settings.userBubbleTextColor,
                          }}
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
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-background/80 to-transparent transition-colors duration-500">
          <form
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto relative flex items-center bg-white/5 border border-white/10 rounded-full p-1.5 shadow-xl backdrop-blur-xl transition-all focus-within:border-primary/50 focus-within:bg-white/10"
          >
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-foreground placeholder:text-muted-foreground"
              disabled={isStreaming}
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
              disabled={!inputMessage.trim() || isStreaming}
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 flex-shrink-0 transition-all duration-300"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="text-center mt-3 text-xs text-muted-foreground/60">
            AI can make mistakes. Consider verifying important information.
          </div>
        </div>
      </div>
    </div>
  );
}
