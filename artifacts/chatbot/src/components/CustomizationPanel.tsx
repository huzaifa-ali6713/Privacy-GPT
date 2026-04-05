import React, { useState } from "react";
import { Settings, RotateCcw, Sparkles, Star, Zap, Bot, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCustomization, ThemePreset, AvatarIcon, FontFamily } from "@/context/CustomizationContext";
import { cn } from "@/lib/utils";

const THEME_PRESETS: { id: ThemePreset; label: string; color: string }[] = [
  { id: "dark",    label: "Midnight",  color: "#0d0f1a" },
  { id: "light",   label: "Cloud",     color: "#f3f0ff" },
  { id: "purple",  label: "Nebula",    color: "#a855f7" },
  { id: "ocean",   label: "Ocean",     color: "#06b6d4" },
  { id: "sunset",  label: "Sunset",    color: "#f97316" },
  { id: "forest",  label: "Forest",    color: "#22c55e" },
];

const AVATAR_OPTIONS: { id: AvatarIcon; icon: React.ReactNode; label: string }[] = [
  { id: "sparkles", icon: <Sparkles className="h-5 w-5" />, label: "Sparkles" },
  { id: "star",     icon: <Star className="h-5 w-5" />,     label: "Star" },
  { id: "zap",      icon: <Zap className="h-5 w-5" />,      label: "Zap" },
  { id: "robot",    icon: <Bot className="h-5 w-5" />,      label: "Bot" },
  { id: "initials", icon: <span className="text-xs font-bold">AB</span>, label: "Text" },
];

const FONTS: { id: FontFamily; label: string; preview: string }[] = [
  { id: "inter",   label: "Inter",       preview: "font-sans" },
  { id: "mono",    label: "Monospace",   preview: "font-mono" },
  { id: "serif",   label: "Serif",       preview: "font-serif" },
  { id: "rounded", label: "Rounded",     preview: "font-sans" },
];

const BUBBLE_STYLES = [
  { id: "glass",   label: "Glass" },
  { id: "solid",   label: "Solid" },
  { id: "minimal", label: "Minimal" },
] as const;

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white/80 bg-white/5 hover:bg-white/8 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
      </button>
      {open && <div className="p-4 space-y-4 bg-white/2">{children}</div>}
    </div>
  );
}

function ColorSwatch({ color, onChange, label }: { color: string; onChange: (c: string) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/60">{label}</span>
      <label className="relative cursor-pointer">
        <div
          className="h-8 w-8 rounded-lg border-2 border-white/20 shadow-inner transition-transform hover:scale-110"
          style={{ backgroundColor: color }}
        />
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </label>
    </div>
  );
}

export function CustomizationPanel() {
  const { settings, updateSettings, applyThemePreset, resetSettings } = useCustomization();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 rounded-lg"
          title="Customize"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-80 border-l border-white/8 p-0 flex flex-col"
        style={{ background: "rgba(13,15,26,0.95)", backdropFilter: "blur(24px)" }}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-white/8 flex-row items-center justify-between">
          <SheetTitle className="text-white text-base font-semibold">Customize</SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-white/40 hover:text-white hover:bg-white/10 gap-1"
            onClick={resetSettings}
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">

          {/* Theme Presets */}
          <Section title="Theme Preset">
            <div className="grid grid-cols-3 gap-2">
              {THEME_PRESETS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyThemePreset(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                    settings.theme === t.id
                      ? "border-primary bg-primary/15 text-white"
                      : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div
                    className="h-6 w-6 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="text-[10px] font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Identity */}
          <Section title="Identity">
            <div className="space-y-1">
              <label className="text-xs text-white/60">Chatbot Name</label>
              <Input
                value={settings.chatbotName}
                onChange={(e) => updateSettings({ chatbotName: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-sm h-9 focus-visible:ring-primary/50"
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/60">Avatar Style</label>
              <div className="flex gap-2">
                {AVATAR_OPTIONS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => updateSettings({ avatarIcon: a.id })}
                    title={a.label}
                    className={cn(
                      "flex-1 flex items-center justify-center h-9 rounded-lg border transition-all",
                      settings.avatarIcon === a.id
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {a.icon}
                  </button>
                ))}
              </div>
              {settings.avatarIcon === "initials" && (
                <Input
                  value={settings.avatarInitials}
                  onChange={(e) => updateSettings({ avatarInitials: e.target.value })}
                  placeholder="AB"
                  className="bg-white/5 border-white/10 text-white text-sm h-8 focus-visible:ring-primary/50"
                  maxLength={3}
                />
              )}
            </div>
          </Section>

          {/* Colors */}
          <Section title="Colors">
            <ColorSwatch
              color={settings.primaryColor}
              onChange={(c) => updateSettings({ primaryColor: c, theme: "custom" })}
              label="Accent / Primary"
            />
            <ColorSwatch
              color={settings.userBubbleColor}
              onChange={(c) => updateSettings({ userBubbleColor: c, theme: "custom" })}
              label="Your Bubble"
            />
            <ColorSwatch
              color={settings.userBubbleTextColor}
              onChange={(c) => updateSettings({ userBubbleTextColor: c })}
              label="Bubble Text"
            />
          </Section>

          {/* Background */}
          <Section title="Background">
            <ColorSwatch
              color={settings.bgBase}
              onChange={(c) => updateSettings({ bgBase: c, theme: "custom" })}
              label="Base Color"
            />
            <div className="grid grid-cols-2 gap-2">
              {(["bgBlob1", "bgBlob2", "bgBlob3", "bgBlob4"] as const).map((key, i) => (
                <ColorSwatch
                  key={key}
                  color={settings[key]}
                  onChange={(c) => updateSettings({ [key]: c, theme: "custom" })}
                  label={`Orb ${i + 1}`}
                />
              ))}
            </div>
          </Section>

          {/* Chat Bubbles */}
          <Section title="Assistant Style">
            <div className="flex gap-2">
              {BUBBLE_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateSettings({ assistantStyle: s.id })}
                  className={cn(
                    "flex-1 text-xs py-2 rounded-lg border transition-all",
                    settings.assistantStyle === s.id
                      ? "border-primary bg-primary/20 text-primary font-medium"
                      : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Font */}
          <Section title="Font">
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => updateSettings({ fontFamily: f.id })}
                  className={cn(
                    "text-xs py-2.5 px-3 rounded-lg border text-left transition-all",
                    settings.fontFamily === f.id
                      ? "border-primary bg-primary/20 text-primary font-medium"
                      : "border-white/10 bg-white/5 text-white/50 hover:text-white",
                    f.preview
                  )}
                >
                  {f.label}
                  <div className="text-[10px] opacity-50 mt-0.5">Aa Bb Cc</div>
                </button>
              ))}
            </div>
          </Section>

        </div>
      </SheetContent>
    </Sheet>
  );
}
