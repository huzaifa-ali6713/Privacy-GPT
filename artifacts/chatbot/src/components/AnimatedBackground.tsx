import React from "react";
import { cn } from "@/lib/utils";
import { useCustomization } from "@/context/CustomizationContext";

export function AnimatedBackground({ className }: { className?: string }) {
  const { settings } = useCustomization();

  return (
    <div
      className={cn("fixed inset-0 overflow-hidden pointer-events-none z-[-1] transition-colors duration-700", className)}
      style={{ backgroundColor: settings.bgBase }}
    >
      <div
        className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] animate-drift-1 mix-blend-screen transition-colors duration-700"
        style={{ backgroundColor: settings.bgBlob1 + "33" }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] animate-drift-2 mix-blend-screen transition-colors duration-700"
        style={{ backgroundColor: settings.bgBlob2 + "33" }}
      />
      <div
        className="absolute top-[20%] right-[10%] w-[35vw] h-[35vw] rounded-full blur-[90px] animate-drift-3 mix-blend-screen transition-colors duration-700"
        style={{ backgroundColor: settings.bgBlob3 + "26" }}
      />
      <div
        className="absolute bottom-[10%] left-[20%] w-[45vw] h-[45vw] rounded-full blur-[110px] animate-drift-4 mix-blend-screen transition-colors duration-700"
        style={{ backgroundColor: settings.bgBlob4 + "26" }}
      />
    </div>
  );
}
