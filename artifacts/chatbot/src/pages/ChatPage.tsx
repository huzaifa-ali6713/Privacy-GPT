import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Plus, MessageSquare, Send, Trash2, Bot } from "lucide-react";
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
import { cn } from "@/lib/utils";

import { MarkdownText } from "@/components/MarkdownText";

export default function ChatPage() {
  const queryClient = useQueryClient();
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
      // Create new conversation first
      const newConv = await createConversation.mutateAsync({
        data: { title: messageToSend.slice(0, 30) + (messageToSend.length > 30 ? "..." : "") },
      });
      currentConvId = newConv.id;
      setActiveConversationId(newConv.id);
      
      // Invalidate list to show new conversation
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    }

    // Now append a temporary user message locally for immediate UI response?
    // Actually, streaming hook doesn't handle local state, so we just trigger it and let the server response + refetch update the UI.
    // Wait, we can patch the cache to show user message immediately.
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
          if (activeConversationId === id) {
            setActiveConversationId(null);
          }
        },
      }
    );
  };

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages, streamingContent]);

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground font-sans overflow-hidden">
      <AnimatedBackground />

      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 glass-panel border-r border-white/5 flex flex-col z-10 hidden md:flex">
        <div className="p-4 flex items-center gap-2 text-primary">
          <Sparkles className="h-6 w-6" />
          <h1 className="font-bold text-xl tracking-tight text-white">Nova AI</h1>
        </div>

        <div className="p-3">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-none"
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
                      ? "bg-primary/20 text-white"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
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
      <div className="flex-1 flex flex-col relative z-10 glass-panel md:rounded-l-2xl md:my-4 md:mr-4 md:border border-white/5 shadow-2xl">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="font-bold text-lg text-white">Nova AI</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleNewChat}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8" ref={scrollRef}>
          {!activeConversationId && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">How can I help you today?</h2>
              <p className="text-muted-foreground text-lg">
                I am Nova, your premium AI assistant. Ask me anything.
              </p>
            </div>
          )}

          {activeConversationId && (
            <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-10">
              {isActiveConversationLoading && !activeConversation ? (
                <div className="flex justify-center py-10">
                  <div className="animate-pulse flex gap-2">
                    <div className="h-2 w-2 bg-primary/50 rounded-full" />
                    <div className="h-2 w-2 bg-primary/50 rounded-full animation-delay-200" />
                    <div className="h-2 w-2 bg-primary/50 rounded-full animation-delay-400" />
                  </div>
                </div>
              ) : (
                <>
                  {activeConversation?.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-5 py-4 text-base",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "glass-panel text-foreground"
                        )}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-2 mb-2 text-primary text-sm font-medium">
                            <Bot className="h-4 w-4" />
                            Nova
                          </div>
                        )}
                        <MarkdownText content={msg.content} />
                      </div>
                    </div>
                  ))}

                  {isStreaming && (
                    <div className="flex w-full justify-start">
                      <div className="max-w-[85%] rounded-2xl px-5 py-4 text-base glass-panel text-foreground">
                        <div className="flex items-center gap-2 mb-2 text-primary text-sm font-medium">
                          <Bot className="h-4 w-4" />
                          Nova
                        </div>
                        {streamingContent ? (
                          <>
                            <MarkdownText content={streamingContent} className="inline" />
                            <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                          </>
                        ) : (
                          <div className="flex items-center h-6 gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-background/80 to-transparent">
          <form
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto relative flex items-center bg-white/5 border border-white/10 rounded-full p-1.5 shadow-xl backdrop-blur-xl transition-all focus-within:border-primary/50 focus-within:bg-white/10"
          >
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask Nova anything..."
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-white placeholder:text-muted-foreground"
              disabled={isStreaming}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputMessage.trim() || isStreaming}
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="text-center mt-3 text-xs text-muted-foreground/60">
            Nova can make mistakes. Consider verifying important information.
          </div>
        </div>
      </div>
    </div>
  );
}
