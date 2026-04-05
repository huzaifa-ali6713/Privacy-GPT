import React, { useRef, useEffect } from "react";
import { useCustomization } from "@/context/CustomizationContext";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  pulsePhase: number;
  connected: number[];
}

interface Packet {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

interface Gear {
  x: number;
  y: number;
  radius: number;
  teeth: number;
  angle: number;
  speed: number;
  opacity: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16) || 0,
    parseInt(clean.substring(2, 4), 16) || 0,
    parseInt(clean.substring(4, 6), 16) || 0,
  ];
}

function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): string {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r},${g},${b})`;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useCustomization();
  const settingsRef = useRef(settings);
  const animRef = useRef<number>(0);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const NODE_COUNT = Math.floor((W * H) / 28000);
    const nodes: Node[] = [];
    const packets: Packet[] = [];
    const gears: Gear[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3 + 1.5,
        pulsePhase: Math.random() * Math.PI * 2,
        connected: [],
      });
    }

    const MAX_DIST = 180;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < MAX_DIST) {
          nodes[i].connected.push(j);
          nodes[j].connected.push(i);
        }
      }
    }

    const GEAR_COUNT = 6;
    for (let i = 0; i < GEAR_COUNT; i++) {
      gears.push({
        x: Math.random() * W,
        y: Math.random() * H,
        radius: 30 + Math.random() * 60,
        teeth: Math.floor(8 + Math.random() * 12),
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.004),
        opacity: 0.05 + Math.random() * 0.1,
      });
    }

    function spawnPacket() {
      if (nodes.length < 2) return;
      const fromIdx = Math.floor(Math.random() * nodes.length);
      const from = nodes[fromIdx];
      if (!from.connected.length) return;
      const toIdx = from.connected[Math.floor(Math.random() * from.connected.length)];
      packets.push({
        fromNode: fromIdx,
        toNode: toIdx,
        progress: 0,
        speed: 0.008 + Math.random() * 0.014,
        color: Math.random() > 0.5 ? settingsRef.current.bgBlob1 : settingsRef.current.primaryColor,
      });
    }

    let t = 0;
    let lastPacketTime = 0;

    function drawGear(gear: Gear, accent: string) {
      const [ar, ag, ab] = hexToRgb(accent);
      ctx.save();
      ctx.translate(gear.x, gear.y);
      ctx.rotate(gear.angle);
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${gear.opacity})`;
      ctx.lineWidth = 1.5;

      const inner = gear.radius * 0.7;
      const outer = gear.radius;
      const toothDepth = gear.radius * 0.25;
      const step = (Math.PI * 2) / gear.teeth;

      ctx.beginPath();
      for (let i = 0; i < gear.teeth; i++) {
        const a1 = i * step;
        const a2 = a1 + step * 0.4;
        const a3 = a1 + step * 0.6;
        const a4 = a1 + step;
        ctx.lineTo(Math.cos(a1) * inner, Math.sin(a1) * inner);
        ctx.lineTo(Math.cos(a2) * outer, Math.sin(a2) * outer);
        ctx.lineTo(Math.cos(a2) * (outer + toothDepth), Math.sin(a2) * (outer + toothDepth));
        ctx.lineTo(Math.cos(a3) * (outer + toothDepth), Math.sin(a3) * (outer + toothDepth));
        ctx.lineTo(Math.cos(a3) * outer, Math.sin(a3) * outer);
        ctx.lineTo(Math.cos(a4) * inner, Math.sin(a4) * inner);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, inner * 0.3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    function render(now: number) {
      const s = settingsRef.current;
      const [br, bg2, bb] = hexToRgb(s.bgBase);
      const accent1 = hexToRgb(s.bgBlob1);
      const accent2 = hexToRgb(s.bgBlob2);
      const primary = hexToRgb(s.primaryColor);

      ctx.fillStyle = `rgb(${br},${bg2},${bb})`;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = `rgba(${accent1[0]},${accent1[1]},${accent1[2]},0.03)`;
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let gx = 0; gx < W; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }

      gears.forEach((g) => {
        g.angle += g.speed;
        drawGear(g, s.bgBlob1);
      });

      if (now - lastPacketTime > 300 && packets.length < 20) {
        spawnPacket();
        lastPacketTime = now;
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        for (const j of n.connected) {
          if (j <= i) continue;
          const other = nodes[j];
          const dx = n.x - other.x;
          const dy = n.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const alpha = (1 - dist / MAX_DIST) * 0.12;
          ctx.strokeStyle = `rgba(${accent2[0]},${accent2[1]},${accent2[2]},${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();

          if (Math.random() < 0.0003) {
            const midX = (n.x + other.x) / 2;
            const midY = (n.y + other.y) / 2;
            const cornerX = (Math.random() > 0.5 ? n.x : other.x);
            ctx.strokeStyle = `rgba(${accent1[0]},${accent1[1]},${accent1[2]},${alpha * 1.4})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(cornerX, midY);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }

      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          packets.splice(i, 1);
          continue;
        }
        const from = nodes[p.fromNode];
        const to = nodes[p.toNode];
        const px = from.x + (to.x - from.x) * p.progress;
        const py = from.y + (to.y - from.y) * p.progress;
        const [pr, pg2, pb] = hexToRgb(p.color);
        const trail = 6;
        for (let tr = 0; tr < trail; tr++) {
          const tp = Math.max(0, p.progress - tr * 0.03);
          const tx2 = from.x + (to.x - from.x) * tp;
          const ty2 = from.y + (to.y - from.y) * tp;
          const trAlpha = (1 - tr / trail) * 0.9;
          const trSize = (1 - tr / trail) * 3;
          ctx.fillStyle = `rgba(${pr},${pg2},${pb},${trAlpha})`;
          ctx.beginPath();
          ctx.arc(tx2, ty2, trSize, 0, Math.PI * 2);
          ctx.fill();
        }
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 8);
        glow.addColorStop(0, `rgba(${pr},${pg2},${pb},0.6)`);
        glow.addColorStop(1, `rgba(${pr},${pg2},${pb},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      nodes.forEach((n, i) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.pulsePhase += 0.02;

        const pulse = 0.5 + 0.5 * Math.sin(n.pulsePhase);
        const nodeColor = i % 3 === 0 ? primary : i % 3 === 1 ? accent1 : accent2;
        const glowR = n.size + pulse * 4;

        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR * 2);
        grad.addColorStop(0, `rgba(${nodeColor[0]},${nodeColor[1]},${nodeColor[2]},${0.3 + pulse * 0.3})`);
        grad.addColorStop(1, `rgba(${nodeColor[0]},${nodeColor[1]},${nodeColor[2]},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${nodeColor[0]},${nodeColor[1]},${nodeColor[2]},${0.6 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fill();
      });

      const scanY = ((t * 0.3) % (H + 80)) - 40;
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scanGrad.addColorStop(0, `rgba(${primary[0]},${primary[1]},${primary[2]},0)`);
      scanGrad.addColorStop(0.5, `rgba(${primary[0]},${primary[1]},${primary[2]},0.04)`);
      scanGrad.addColorStop(1, `rgba(${primary[0]},${primary[1]},${primary[2]},0)`);
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 40, W, 80);

      t++;
      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1] pointer-events-none"
      style={{ display: "block" }}
    />
  );
}
