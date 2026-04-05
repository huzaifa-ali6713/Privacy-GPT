import React from "react";
import { cn } from "@/lib/utils";

export function AnimatedBackground({ className }: { className?: string }) {
  return (
    <div className={cn("fixed inset-0 overflow-hidden pointer-events-none z-[-1] bg-background", className)}>
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[100px] animate-drift-1 mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/20 blur-[120px] animate-drift-2 mix-blend-screen" />
      <div className="absolute top-[20%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-pink-500/15 blur-[90px] animate-drift-3 mix-blend-screen" />
      <div className="absolute bottom-[10%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-purple-600/15 blur-[110px] animate-drift-4 mix-blend-screen" />
    </div>
  );
}
