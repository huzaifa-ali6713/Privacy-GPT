import React from "react";
import { cn } from "@/lib/utils";

interface MarkdownTextProps {
  content: string;
  className?: string;
}

export function MarkdownText({ content, className }: MarkdownTextProps) {
  // Very basic markdown parsing for code blocks, bold, and paragraphs
  const renderContent = () => {
    // Split by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // It's a code block
        const codeContent = part.slice(3, -3);
        const firstNewline = codeContent.indexOf("\n");
        let language = "";
        let code = codeContent;
        
        if (firstNewline !== -1 && firstNewline < 20) {
          language = codeContent.slice(0, firstNewline).trim();
          code = codeContent.slice(firstNewline + 1);
        } else if (firstNewline === -1) {
          code = codeContent;
        }

        return (
          <div key={index} className="my-4 rounded-md overflow-hidden bg-black/40 border border-white/10">
            {language && (
              <div className="px-4 py-1.5 bg-white/5 text-xs text-muted-foreground border-b border-white/10 font-mono">
                {language}
              </div>
            )}
            <pre className="p-4 overflow-x-auto text-sm font-mono text-white/90">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Parse bold **text**
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      
      return (
        <span key={index}>
          {boldParts.map((bp, i) => {
            if (bp.startsWith("**") && bp.endsWith("**")) {
              return <strong key={i} className="font-semibold text-white">{bp.slice(2, -2)}</strong>;
            }
            
            // Handle lists (basic lines starting with - or *)
            const lines = bp.split('\n');
            return lines.map((line, j) => {
              if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                return (
                  <div key={`${i}-${j}`} className="flex gap-2 my-1 pl-2">
                    <span className="text-primary mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" />
                    <span>{line.trim().substring(2)}</span>
                  </div>
                );
              }
              return <React.Fragment key={`${i}-${j}`}>{line}{j < lines.length - 1 && <br />}</React.Fragment>;
            });
          })}
        </span>
      );
    });
  };

  return (
    <div className={cn("text-base whitespace-pre-wrap leading-relaxed", className)}>
      {renderContent()}
    </div>
  );
}
