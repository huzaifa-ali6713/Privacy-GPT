import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type AvatarIcon = "sparkles" | "star" | "zap" | "brain" | "robot" | "initials";
export type FontFamily = "inter" | "mono" | "serif" | "rounded";
export type ThemePreset = "dark" | "light" | "purple" | "ocean" | "sunset" | "forest" | "custom";

export interface ChatSettings {
  chatbotName: string;
  avatarIcon: AvatarIcon;
  avatarInitials: string;
  theme: ThemePreset;
  primaryColor: string;
  userBubbleColor: string;
  userBubbleTextColor: string;
  assistantStyle: "glass" | "solid" | "minimal";
  fontFamily: FontFamily;
  bgBlob1: string;
  bgBlob2: string;
  bgBlob3: string;
  bgBlob4: string;
  bgBase: string;
}

const DEFAULTS: ChatSettings = {
  chatbotName: "Nova AI",
  avatarIcon: "sparkles",
  avatarInitials: "AI",
  theme: "dark",
  primaryColor: "#9b5de5",
  userBubbleColor: "#9b5de5",
  userBubbleTextColor: "#ffffff",
  assistantStyle: "glass",
  fontFamily: "inter",
  bgBlob1: "#9b5de5",
  bgBlob2: "#3b82f6",
  bgBlob3: "#ec4899",
  bgBlob4: "#7c3aed",
  bgBase: "#0d0f1a",
};

export const THEME_PRESETS: Record<ThemePreset, Partial<ChatSettings>> = {
  dark: {
    primaryColor: "#9b5de5",
    userBubbleColor: "#9b5de5",
    userBubbleTextColor: "#ffffff",
    bgBlob1: "#9b5de5",
    bgBlob2: "#3b82f6",
    bgBlob3: "#ec4899",
    bgBlob4: "#7c3aed",
    bgBase: "#0d0f1a",
  },
  light: {
    primaryColor: "#7c3aed",
    userBubbleColor: "#7c3aed",
    userBubbleTextColor: "#ffffff",
    bgBlob1: "#c4b5fd",
    bgBlob2: "#93c5fd",
    bgBlob3: "#f9a8d4",
    bgBlob4: "#a78bfa",
    bgBase: "#f3f0ff",
  },
  purple: {
    primaryColor: "#a855f7",
    userBubbleColor: "#a855f7",
    userBubbleTextColor: "#ffffff",
    bgBlob1: "#a855f7",
    bgBlob2: "#7c3aed",
    bgBlob3: "#ec4899",
    bgBlob4: "#6d28d9",
    bgBase: "#100820",
  },
  ocean: {
    primaryColor: "#06b6d4",
    userBubbleColor: "#0284c7",
    userBubbleTextColor: "#ffffff",
    bgBlob1: "#06b6d4",
    bgBlob2: "#3b82f6",
    bgBlob3: "#0ea5e9",
    bgBlob4: "#0369a1",
    bgBase: "#020e1a",
  },
  sunset: {
    primaryColor: "#f97316",
    userBubbleColor: "#ef4444",
    userBubbleTextColor: "#ffffff",
    bgBlob1: "#f97316",
    bgBlob2: "#ef4444",
    bgBlob3: "#ec4899",
    bgBlob4: "#f59e0b",
    bgBase: "#1a0a02",
  },
  forest: {
    primaryColor: "#22c55e",
    userBubbleColor: "#16a34a",
    userBubbleTextColor: "#ffffff",
    bgBlob1: "#22c55e",
    bgBlob2: "#06b6d4",
    bgBlob3: "#84cc16",
    bgBlob4: "#10b981",
    bgBase: "#021a08",
  },
  custom: {},
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hexToHsl(hex: string): string {
  try {
    const [r, g, b] = hexToRgb(hex);
    const [h, s, l] = rgbToHsl(r, g, b);
    return h + " " + s + "% " + l + "%";
  } catch {
    return "265 80% 65%";
  }
}

function getLightness(hex: string): number {
  try {
    const [r, g, b] = hexToRgb(hex);
    const [, , l] = rgbToHsl(r, g, b);
    return l;
  } catch { return 10; }
}

const FONT_MAP: Record<FontFamily, string> = {
  inter: "'Inter', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  serif: "Georgia, 'Times New Roman', serif",
  rounded: "'Nunito', 'Varela Round', sans-serif",
};

function buildCss(s: ChatSettings): string {
  const primaryHsl = hexToHsl(s.primaryColor);
  const userBubbleHsl = hexToHsl(s.userBubbleColor);
  const userTextHsl = hexToHsl(s.userBubbleTextColor);
  const bgL = getLightness(s.bgBase);
  const bgHsl = hexToHsl(s.bgBase);
  const isLightBg = bgL > 55;

  const fgHsl = isLightBg ? "230 25% 12%" : "220 20% 90%";
  const cardHsl = isLightBg ? "0 0% 100%" : "230 20% 12%";
  const mutedFgHsl = isLightBg ? "220 15% 45%" : "220 15% 55%";
  const borderHsl = isLightBg ? "220 15% 82%" : "230 15% 18%";
  const inputHsl = isLightBg ? "220 15% 88%" : "230 15% 20%";
  const sidebarHsl = isLightBg ? "220 20% 95%" : "230 25% 9%";
  const accentHsl = isLightBg ? primaryHsl.split(" ")[0] + " 40% 85%" : primaryHsl.split(" ")[0] + " 40% 22%";
  const secondaryHsl = isLightBg ? primaryHsl.split(" ")[0] + " 20% 88%" : primaryHsl.split(" ")[0] + " 20% 16%";
  const mutedHsl = isLightBg ? primaryHsl.split(" ")[0] + " 20% 90%" : primaryHsl.split(" ")[0] + " 20% 14%";

  return `:root {
    --background: ${bgHsl};
    --foreground: ${fgHsl};
    --card: ${cardHsl};
    --card-foreground: ${fgHsl};
    --card-border: ${borderHsl};
    --sidebar: ${sidebarHsl};
    --sidebar-foreground: ${fgHsl};
    --sidebar-border: ${borderHsl};
    --sidebar-primary: ${primaryHsl};
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: ${accentHsl};
    --sidebar-accent-foreground: ${fgHsl};
    --sidebar-ring: ${primaryHsl};
    --popover: ${cardHsl};
    --popover-foreground: ${fgHsl};
    --popover-border: ${borderHsl};
    --primary: ${primaryHsl};
    --primary-foreground: 0 0% 100%;
    --secondary: ${secondaryHsl};
    --secondary-foreground: ${fgHsl};
    --muted: ${mutedHsl};
    --muted-foreground: ${mutedFgHsl};
    --accent: ${accentHsl};
    --accent-foreground: ${primaryHsl};
    --destructive: 0 70% 55%;
    --destructive-foreground: 0 0% 100%;
    --border: ${borderHsl};
    --input: ${inputHsl};
    --ring: ${primaryHsl};
    --chart-1: ${primaryHsl};
    --app-font-sans: ${FONT_MAP[s.fontFamily]};
  }`;
}

function injectStyles(css: string) {
  let el = document.getElementById("chatbot-custom-theme") as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = "chatbot-custom-theme";
    document.head.appendChild(el);
  }
  el.textContent = css;
}

function loadSettings(): ChatSettings {
  try {
    const saved = localStorage.getItem("chatbot-customization");
    if (saved) return { ...DEFAULTS, ...JSON.parse(saved) };
  } catch {}
  return { ...DEFAULTS };
}

function saveSettings(settings: ChatSettings) {
  try {
    localStorage.setItem("chatbot-customization", JSON.stringify(settings));
  } catch {}
}

interface CustomizationContextValue {
  settings: ChatSettings;
  updateSettings: (patch: Partial<ChatSettings>) => void;
  applyThemePreset: (preset: ThemePreset) => void;
  resetSettings: () => void;
}

const CustomizationContext = createContext<CustomizationContextValue | null>(null);

export function CustomizationProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ChatSettings>(loadSettings);

  useEffect(() => {
    injectStyles(buildCss(settings));
  }, []);

  const updateSettings = useCallback((patch: Partial<ChatSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      injectStyles(buildCss(next));
      saveSettings(next);
      return next;
    });
  }, []);

  const applyThemePreset = useCallback((preset: ThemePreset) => {
    setSettings((prev) => {
      const presetValues = THEME_PRESETS[preset];
      const next: ChatSettings = { ...prev, ...presetValues, theme: preset };
      injectStyles(buildCss(next));
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const next = { ...DEFAULTS };
    injectStyles(buildCss(next));
    saveSettings(next);
    setSettings(next);
  }, []);

  return (
    <CustomizationContext.Provider value={{ settings, updateSettings, applyThemePreset, resetSettings }}>
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const ctx = useContext(CustomizationContext);
  if (!ctx) throw new Error("useCustomization must be used inside CustomizationProvider");
  return ctx;
}
