import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

type UseChatStreamingProps = {
  conversationId?: number;
};

export function useChatStreaming({ conversationId }: UseChatStreamingProps) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const sendMessage = useCallback(
    async (userMessage: string, currentConversationId: number) => {
      setIsStreaming(true);
      setStreamingContent("");

      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}api/openai/conversations/${currentConversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: userMessage }),
          }
        );

        if (!response.ok) throw new Error("Request failed");

        const contentType = response.headers.get("content-type") || "";

        // Netlify Functions return JSON (non-streaming)
        if (contentType.includes("application/json")) {
          const data = await response.json();
          if (data.content) {
            // Simulate a smooth typing effect for the full response
            const words = data.content.split(" ");
            for (let i = 0; i <= words.length; i++) {
              await new Promise((r) => setTimeout(r, 18));
              setStreamingContent(words.slice(0, i).join(" "));
            }
          }
          setIsStreaming(false);
          queryClient.invalidateQueries({
            queryKey: [`/api/openai/conversations/${currentConversationId}`],
          });
          return;
        }

        // Replit / SSE streaming
        if (!response.body) throw new Error("No response body");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) setStreamingContent((prev) => prev + data.content);
                if (data.done) setIsStreaming(false);
              } catch {}
            }
          }
        }
      } catch (error) {
        console.error("Error streaming message:", error);
      } finally {
        setIsStreaming(false);
        queryClient.invalidateQueries({
          queryKey: [`/api/openai/conversations/${currentConversationId}`],
        });
      }
    },
    [queryClient]
  );

  return { sendMessage, isStreaming, streamingContent };
}
