import React from "react";
import { Sparkles, Star, Zap, Bot } from "lucide-react";
import { useCustomization, AvatarIcon } from "@/context/CustomizationContext";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<AvatarIcon, React.ReactNode> = {
  sparkles: <Sparkles className="h-full w-full p-[22%]" />,
  star: <Star className="h-full w-full p-[22%]" />,
  zap: <Zap className="h-full w-full p-[22%]" />,
  brain: <Bot className="h-full w-full p-[22%]" />,
  robot: <Bot className="h-full w-full p-[22%]" />,
  initials: null,
};

interface ChatbotAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ChatbotAvatar({ size = "md", className }: ChatbotAvatarProps) {
  const { settings } = useCustomization();
  const sizeMap = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-14 w-14 text-xl" };

  return (
    <div
      className={cn(
        "rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 font-bold transition-all duration-300",
        sizeMap[size],
        className
      )}
    >
      {settings.avatarIcon === "initials" ? (
        <span>{settings.avatarInitials.slice(0, 2).toUpperCase()}</span>
      ) : (
        ICON_MAP[settings.avatarIcon]
      )}
    </div>
  );
}
