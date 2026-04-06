import React, { useEffect, useRef } from "react";
import { useCustomization } from "@/context/CustomizationContext";
import { cn } from "@/lib/utils";

export type RobotState = "idle" | "typing" | "thinking" | "responding" | "delivered";

interface RobotAvatarProps {
  state: RobotState;
  className?: string;
}

export function RobotAvatar({ state, className }: RobotAvatarProps) {
  const { settings } = useCustomization();
  const primary = settings.primaryColor;

  return (
    <div className={cn("robot-avatar-wrap", `robot-${state}`, className)}>
      <svg
        viewBox="0 0 120 180"
        xmlns="http://www.w3.org/2000/svg"
        className="robot-svg"
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={primary} stopOpacity="1" />
            <stop offset="100%" stopColor={primary} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="chestGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.9" />
            <stop offset="100%" stopColor={primary} stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1d35" />
            <stop offset="100%" stopColor="#0d0f1a" />
          </linearGradient>
          <linearGradient id="headGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22264a" />
            <stop offset="100%" stopColor="#14172e" />
          </linearGradient>
          <clipPath id="visorClip">
            <rect x="22" y="38" width="76" height="20" rx="6" />
          </clipPath>
        </defs>

        {/* ─── ANTENNA ─── */}
        <g className="robot-antenna">
          <line x1="60" y1="8" x2="60" y2="22" stroke={primary} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <circle className="robot-antenna-tip" cx="60" cy="6" r="4" fill={primary} filter="url(#glow)" />
        </g>

        {/* ─── HEAD ─── */}
        <g className="robot-head">
          <rect x="18" y="22" width="84" height="68" rx="18" fill="url(#headGrad)" stroke={primary} strokeWidth="1.2" strokeOpacity="0.35" />

          {/* Ear panels */}
          <rect x="10" y="38" width="10" height="24" rx="4" fill="#1a1d35" stroke={primary} strokeWidth="0.8" strokeOpacity="0.3" />
          <rect x="100" y="38" width="10" height="24" rx="4" fill="#1a1d35" stroke={primary} strokeWidth="0.8" strokeOpacity="0.3" />
          <circle cx="15" cy="50" r="2.5" fill={primary} opacity="0.5" className="robot-ear-light" />
          <circle cx="105" cy="50" r="2.5" fill={primary} opacity="0.5" className="robot-ear-light" />

          {/* ─── VISOR ─── */}
          <rect x="22" y="38" width="76" height="22" rx="7" fill="rgba(0,0,0,0.7)" stroke={primary} strokeWidth="0.8" strokeOpacity="0.4" />

          {/* ─── EYES ─── */}
          <g className="robot-eyes">
            {/* Left eye */}
            <g className="robot-eye-left">
              <ellipse cx="42" cy="49" rx="10" ry="7" fill="rgba(0,0,0,0.8)" />
              <ellipse className="robot-pupil" cx="42" cy="49" rx="6" ry="5" fill={primary} opacity="0.9" filter="url(#glow)" />
              <ellipse cx="42" cy="49" rx="3" ry="2.5" fill="white" opacity="0.9" />
              <circle cx="44" cy="47.5" r="1" fill="white" opacity="0.6" />
              {/* scan line */}
              <rect className="robot-scan-line" x="32" y="47" width="20" height="2" rx="1" fill={primary} opacity="0" clipPath="url(#visorClip)" />
            </g>
            {/* Right eye */}
            <g className="robot-eye-right">
              <ellipse cx="78" cy="49" rx="10" ry="7" fill="rgba(0,0,0,0.8)" />
              <ellipse className="robot-pupil" cx="78" cy="49" rx="6" ry="5" fill={primary} opacity="0.9" filter="url(#glow)" />
              <ellipse cx="78" cy="49" rx="3" ry="2.5" fill="white" opacity="0.9" />
              <circle cx="80" cy="47.5" r="1" fill="white" opacity="0.6" />
              <rect className="robot-scan-line" x="68" y="47" width="20" height="2" rx="1" fill={primary} opacity="0" />
            </g>
          </g>

          {/* ─── MOUTH ─── */}
          <g className="robot-mouth">
            <rect x="36" y="68" width="48" height="8" rx="4" fill="rgba(0,0,0,0.7)" stroke={primary} strokeWidth="0.6" strokeOpacity="0.3" />
            {/* Mouth segments / speaking indicators */}
            <rect className="mouth-seg" x="39" y="70" width="6" height="4" rx="2" fill={primary} opacity="0.35" />
            <rect className="mouth-seg" x="47" y="70" width="6" height="4" rx="2" fill={primary} opacity="0.35" />
            <rect className="mouth-seg" x="55" y="70" width="6" height="4" rx="2" fill={primary} opacity="0.35" />
            <rect className="mouth-seg" x="63" y="70" width="6" height="4" rx="2" fill={primary} opacity="0.35" />
            <rect className="mouth-seg" x="71" y="70" width="6" height="4" rx="2" fill={primary} opacity="0.35" />
          </g>
        </g>

        {/* ─── NECK ─── */}
        <rect x="50" y="90" width="20" height="10" rx="3" fill="#141629" stroke={primary} strokeWidth="0.6" strokeOpacity="0.2" />

        {/* ─── BODY ─── */}
        <g className="robot-body">
          <rect x="14" y="100" width="92" height="64" rx="16" fill="url(#bodyGrad)" stroke={primary} strokeWidth="1.2" strokeOpacity="0.25" />

          {/* Chest panel */}
          <rect x="30" y="112" width="60" height="36" rx="10" fill="rgba(0,0,0,0.5)" stroke={primary} strokeWidth="0.8" strokeOpacity="0.3" />

          {/* Chest core light */}
          <circle className="robot-chest-core" cx="60" cy="124" r="9" fill={primary} opacity="0.15" filter="url(#chestGlow)" />
          <circle className="robot-chest-core-inner" cx="60" cy="124" r="5" fill={primary} opacity="0.7" />
          <circle cx="60" cy="124" r="2.5" fill="white" opacity="0.8" />

          {/* Circuit lines on body */}
          <g opacity="0.2" stroke={primary} strokeWidth="0.8" strokeLinecap="round">
            <line x1="34" y1="138" x2="50" y2="138" />
            <line x1="70" y1="138" x2="86" y2="138" />
            <line x1="34" y1="143" x2="44" y2="143" />
            <line x1="76" y1="143" x2="86" y2="143" />
          </g>

          {/* Side indicator dots */}
          <circle className="robot-dot-1" cx="24" cy="118" r="3" fill={primary} opacity="0.4" />
          <circle className="robot-dot-2" cx="24" cy="128" r="3" fill={primary} opacity="0.25" />
          <circle className="robot-dot-1" cx="96" cy="118" r="3" fill={primary} opacity="0.4" />
          <circle className="robot-dot-2" cx="96" cy="128" r="3" fill={primary} opacity="0.25" />
        </g>

        {/* ─── ARMS ─── */}
        <g className="robot-arm-left">
          <rect x="0" y="103" width="16" height="44" rx="8" fill="#14172e" stroke={primary} strokeWidth="0.8" strokeOpacity="0.3" />
          <circle cx="8" cy="148" r="5" fill="#1a1d35" stroke={primary} strokeWidth="0.6" strokeOpacity="0.3" />
          <circle cx="8" cy="116" r="2" fill={primary} opacity="0.3" />
        </g>
        <g className="robot-arm-right">
          <rect x="104" y="103" width="16" height="44" rx="8" fill="#14172e" stroke={primary} strokeWidth="0.8" strokeOpacity="0.3" />
          <circle cx="112" cy="148" r="5" fill="#1a1d35" stroke={primary} strokeWidth="0.6" strokeOpacity="0.3" />
          <circle cx="112" cy="116" r="2" fill={primary} opacity="0.3" />
        </g>

        {/* ─── LEGS / BASE ─── */}
        <g className="robot-base">
          <rect x="32" y="164" width="22" height="14" rx="6" fill="#14172e" stroke={primary} strokeWidth="0.8" strokeOpacity="0.2" />
          <rect x="66" y="164" width="22" height="14" rx="6" fill="#14172e" stroke={primary} strokeWidth="0.8" strokeOpacity="0.2" />
          <ellipse cx="60" cy="180" rx="40" ry="4" fill={primary} opacity="0.08" />
        </g>
      </svg>
    </div>
  );
}
