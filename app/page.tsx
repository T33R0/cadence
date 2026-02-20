"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDashboardData } from "@/lib/hooks";
import { CHAT_FUNCTION_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import type { ChatMessage } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   COLOR SYSTEM — Deep ocean + bioluminescence
   ═══════════════════════════════════════════════════════════════ */
const C = {
  bg: "#060b18", surface: "#0c1424", surfaceAlt: "#101c30",
  surfaceHi: "#142240", border: "#1a2744",
  text: "#e2e8f0", textSoft: "#94a3b8", textMuted: "#64748b", textDim: "#334155",
  accent: "#3b82f6", cyan: "#06b6d4", green: "#10b981",
  gold: "#d4a017", purple: "#7c3aed", red: "#ef4444", yellow: "#f59e0b",
};

/* ═══════════════════════════════════════════════════════════════
   INLINE SVG ICONS
   ═══════════════════════════════════════════════════════════════ */
const Ic = (ch: React.ReactNode) => ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {ch}
  </svg>
);
const Activity = Ic(<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>);
const Brain = Ic(<><path d="M9.5 2A5.5 5.5 0 0 0 5 6a5.5 5.5 0 0 0 .3 1.8A5.5 5.5 0 0 0 4 12a5.5 5.5 0 0 0 2.8 4.8A4 4 0 0 0 9 22h0a4 4 0 0 0 2-1" /><path d="M14.5 2A5.5 5.5 0 0 1 19 6a5.5 5.5 0 0 1-.3 1.8A5.5 5.5 0 0 1 20 12a5.5 5.5 0 0 1-2.8 4.8A4 4 0 0 1 15 22h0a4 4 0 0 1-2-1" /><path d="M12 2v20" /></>);
const Zap = Ic(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />);
const Target = Ic(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>);
const Dollar = Ic(<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>);
const Dumbbell = Ic(<><path d="m6.5 6.5 11 11" /><path d="m21 21-1-1" /><path d="m3 3 1 1" /><path d="m18 22 4-4" /><path d="m2 6 4-4" /><path d="m3 10 7-7" /><path d="m14 21 7-7" /></>);
const ClockIc = Ic(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>);
const AlertTri = Ic(<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>);
const CheckCirc = Ic(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>);
const Circ = Ic(<circle cx="12" cy="12" r="10" />);
const SendIc = Ic(<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>);
const Utensils = Ic(<><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7" /></>);
const TrendUp = Ic(<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>);
const Shield = Ic(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />);
const CpuIc = Ic(<><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /></>);
const DbIc = Ic(<><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>);
const Refresh = Ic(<><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>);
const MsgCircle = Ic(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>);

/* ═══════════════════════════════════════════════════════════════
   CADENCE AVATAR — Canvas-based crystalline intelligence
   ═══════════════════════════════════════════════════════════════ */
function CadenceAvatar({ status = "online", size = 200 }: { status?: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const stateRef = useRef({ status });

  useEffect(() => { stateRef.current.status = status; }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2;

    // Core vertices — asymmetric crystalline
    const coreVerts: { angle: number; baseR: number; phase: number }[] = [];
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2 - Math.PI / 2;
      const rm = i < 5 ? 1.0 + Math.sin(i * 0.7) * 0.25 : 0.7 + Math.cos(i * 1.1) * 0.2;
      coreVerts.push({ angle, baseR: size * 0.12 * rm, phase: Math.random() * Math.PI * 2 });
    }

    // Light paths
    const paths: any[] = [];
    for (let i = 0; i < 18; i++) {
      paths.push({
        angle: (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
        length: 0.3 + Math.random() * 0.55,
        isComplete: Math.random() > 0.35,
        loopsBack: Math.random() > 0.7,
        isGold: Math.random() > 0.75,
        speed: 0.3 + Math.random() * 0.7,
        width: 0.5 + Math.random() * 1.5,
        curvature: (Math.random() - 0.5) * 0.6,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Particles
    const particles: any[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        dist: size * 0.15 + Math.random() * size * 0.3,
        speed: 0.002 + Math.random() * 0.008,
        sz: 0.5 + Math.random() * 2,
        isGold: Math.random() > 0.8,
        opacity: 0.2 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.02,
      });
    }

    function getParams(t: number) {
      const s = stateRef.current.status;
      if (s === "thinking") return { pulseSpeed: 3, brightness: 1.4, chaos: 0, breathe: 0.02, pathSpeed: 2.5 };
      if (s === "success") return { pulseSpeed: 0.8, brightness: 1.6, chaos: 0, breathe: 0.01, pathSpeed: 0.5 };
      if (s === "error") {
        const d = Math.min(1, t * 0.0003);
        return { pulseSpeed: 5 - d * 3, brightness: 1.2, chaos: 0.8 - d * 0.6, breathe: 0.05 - d * 0.03, pathSpeed: 4 - d * 2 };
      }
      if (s === "idle") return { pulseSpeed: 0.3, brightness: 0.3, chaos: 0, breathe: 0.008, pathSpeed: 0.2 };
      return { pulseSpeed: 1, brightness: 1, chaos: 0, breathe: 0.015, pathSpeed: 1 };
    }

    function draw(ts: number) {
      timeRef.current = ts;
      const t = ts;
      const p = getParams(t);
      ctx.clearRect(0, 0, size, size);

      // Background glow
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
      bg.addColorStop(0, `rgba(59,7,100,${0.15 * p.brightness})`);
      bg.addColorStop(0.5, `rgba(30,4,60,${0.08 * p.brightness})`);
      bg.addColorStop(1, "transparent");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);

      const breathe = 1 + Math.sin(t * p.breathe) * 0.04;

      // Light paths
      paths.forEach((path, i) => {
        const pp = ((t * 0.001 * path.speed * p.pathSpeed + path.phase) % 1);
        const maxR = size * 0.42 * path.length;
        const ch = p.chaos * (Math.sin(t * 0.01 + i) * 0.5 + 0.5);
        const startR = size * 0.08;
        const pa = path.angle + ch * Math.sin(t * 0.005 + i);

        ctx.beginPath();
        ctx.strokeStyle = path.isGold
          ? `rgba(212,160,23,${(0.15 + pp * 0.35) * p.brightness})`
          : `rgba(6,182,212,${(0.1 + pp * 0.3) * p.brightness})`;
        ctx.lineWidth = path.width * (0.5 + pp * 0.5);

        for (let s = 0; s <= 20; s++) {
          const f = s / 20;
          let r = startR + f * maxR * breathe;
          if (path.loopsBack && f > 0.6) r = startR + 0.6 * maxR * breathe - (f - 0.6) / 0.4 * 0.3 * maxR * breathe;
          const co = Math.sin(f * Math.PI) * path.curvature;
          const a = pa + co;
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          if (!path.isComplete && !path.loopsBack && f > path.length * 0.7) break;
        }
        ctx.stroke();

        // Pulse particle
        const pf = pp * (path.isComplete ? 1 : path.length);
        let pr = startR + pf * maxR * breathe;
        if (path.loopsBack && pf > 0.6) pr = startR + 0.6 * maxR * breathe - (pf - 0.6) / 0.4 * 0.3 * maxR * breathe;
        const ppa = pa + Math.sin(pf * Math.PI) * path.curvature;
        const px = cx + Math.cos(ppa) * pr, py = cy + Math.sin(ppa) * pr;
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 4);
        const pc = path.isGold ? "212,160,23" : "6,182,212";
        pg.addColorStop(0, `rgba(${pc},${0.8 * p.brightness})`);
        pg.addColorStop(1, `rgba(${pc},0)`);
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, 3 + path.width, 0, Math.PI * 2);
        ctx.fill();
      });

      // Core glow
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.2);
      cg.addColorStop(0, `rgba(6,182,212,${0.25 * p.brightness})`);
      cg.addColorStop(0.5, `rgba(10,37,64,${0.4 * p.brightness})`);
      cg.addColorStop(1, "transparent");
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(cx, cy, size * 0.18 * breathe, 0, Math.PI * 2); ctx.fill();

      // Faceted core
      ctx.beginPath();
      coreVerts.forEach((v, i) => {
        const w = Math.sin(t * 0.002 + v.phase) * 2 * (1 + p.chaos);
        const r = (v.baseR + w) * breathe;
        const x = cx + Math.cos(v.angle + t * 0.0003) * r;
        const y = cy + Math.sin(v.angle + t * 0.0003) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      const cf = ctx.createRadialGradient(cx - size * 0.02, cy - size * 0.02, 0, cx, cy, size * 0.14);
      cf.addColorStop(0, `rgba(10,50,80,${0.9 * p.brightness})`);
      cf.addColorStop(0.6, `rgba(6,30,50,${0.8 * p.brightness})`);
      cf.addColorStop(1, `rgba(4,15,30,${0.6 * p.brightness})`);
      ctx.fillStyle = cf; ctx.fill();
      ctx.strokeStyle = `rgba(6,182,212,${0.5 * p.brightness})`; ctx.lineWidth = 1.5; ctx.stroke();

      // Facet lines + gold threads
      for (let i = 0; i < coreVerts.length; i++) {
        const v = coreVerts[i];
        const r = (v.baseR + Math.sin(t * 0.002 + v.phase) * 2) * breathe;
        const x = cx + Math.cos(v.angle + t * 0.0003) * r;
        const y = cy + Math.sin(v.angle + t * 0.0003) * r;
        if (i % 3 === 0) {
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y);
          ctx.strokeStyle = `rgba(212,160,23,${0.25 * p.brightness})`; ctx.lineWidth = 0.5; ctx.stroke();
        }
        const j = (i + 3) % coreVerts.length;
        const v2 = coreVerts[j];
        const r2 = (v2.baseR + Math.sin(t * 0.002 + v2.phase) * 2) * breathe;
        const x2 = cx + Math.cos(v2.angle + t * 0.0003) * r2;
        const y2 = cy + Math.sin(v2.angle + t * 0.0003) * r2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(6,182,212,${0.15 * p.brightness})`; ctx.lineWidth = 0.5; ctx.stroke();
      }

      // Center point
      const cen = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.04);
      cen.addColorStop(0, `rgba(200,240,255,${0.6 * p.brightness})`);
      cen.addColorStop(0.5, `rgba(6,182,212,${0.3 * p.brightness})`);
      cen.addColorStop(1, "transparent");
      ctx.fillStyle = cen; ctx.beginPath(); ctx.arc(cx, cy, size * 0.04, 0, Math.PI * 2); ctx.fill();

      // Floating particles
      particles.forEach(pt => {
        pt.angle += pt.speed * p.pathSpeed;
        pt.dist += Math.sin(t * 0.001 + pt.angle) * pt.drift;
        const x = cx + Math.cos(pt.angle) * pt.dist * breathe;
        const y = cy + Math.sin(pt.angle) * pt.dist * breathe;
        const op = pt.opacity * p.brightness * (0.5 + Math.sin(t * 0.003 + pt.angle) * 0.5);
        ctx.beginPath(); ctx.arc(x, y, pt.sz, 0, Math.PI * 2);
        ctx.fillStyle = pt.isGold ? `rgba(212,160,23,${op})` : `rgba(6,182,212,${op * 0.7})`;
        ctx.fill();
      });

      // Outer pulse ring
      if (stateRef.current.status !== "idle") {
        const rp = (Math.sin(t * 0.002 * p.pulseSpeed) + 1) / 2;
        ctx.beginPath(); ctx.arc(cx, cy, size * 0.38 + rp * size * 0.05, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6,182,212,${0.08 * rp * p.brightness})`; ctx.lineWidth = 1; ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size, status]);

  return (
    <canvas ref={canvasRef} style={{
      width: size, height: size, borderRadius: "50%",
      filter: `drop-shadow(0 0 ${status === "thinking" ? 30 : 15}px rgba(6,182,212,${status === "idle" ? 0.1 : 0.3}))`,
      transition: "filter 0.6s ease",
    }} />
  );
}

/* ═══════════════════════════════════════════════════════════════
   UI COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, color = C.accent, sub }: any) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${color}08`, filter: "blur(20px)" }} />
      <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}20` }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, color = C.accent, children, action }: any) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, background: `${color}06` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon size={15} color={color} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, letterSpacing: 1, textTransform: "uppercase" }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding: "14px 18px" }}>{children}</div>
    </div>
  );
}

function ProgressBar({ value, max, color = C.green, height = 6, label }: any) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      {label && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 11, color: C.textMuted }}>{label}</span><span style={{ fontSize: 11, color, fontWeight: 600 }}>{pct}%</span></div>}
      <div style={{ height, background: C.surfaceHi, borderRadius: height / 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: height / 2, background: `linear-gradient(90deg, ${color}, ${C.cyan})`, boxShadow: `0 0 10px ${color}25` }} />
      </div>
    </div>
  );
}

function MacroBar({ label, value, target, unit = "g", color }: any) {
  const pct = Math.min((value / target) * 100, 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: C.textMuted }}>{label}</span>
        <span style={{ fontSize: 11, color: C.textSoft, fontWeight: 500 }}>{Math.round(value)}{unit} <span style={{ color: C.textDim }}>/ {target}{unit}</span></span>
      </div>
      <div style={{ height: 5, background: C.surfaceHi, borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: `linear-gradient(90deg, ${color}, ${color}bb)`, boxShadow: `0 0 8px ${color}30`, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHAT WITH CADENCE
   ═══════════════════════════════════════════════════════════════ */
type ChatMsg = { id: string; role: "user" | "assistant"; content: string; created_at: string };

const MODEL_OPTIONS = [
  { key: "haiku-4.5", label: "Haiku 4.5", cost: "$1/$5" },
  { key: "sonnet-4", label: "Sonnet 4", cost: "$3/$15" },
  { key: "sonnet-4.5", label: "Sonnet 4.5", cost: "$3/$15" },
  { key: "opus-4.6", label: "Opus 4.6", cost: "$15/$75" },
];

function useChat(onDataChanged?: () => void) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [model, setModelState] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("cadence_chat_model") || "haiku-4.5";
    }
    return "haiku-4.5";
  });
  const setModel = useCallback((m: string) => {
    setModelState(m);
    if (typeof window !== "undefined") sessionStorage.setItem("cadence_chat_model", m);
  }, []);
  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("cadence_chat_session");
      if (stored) return stored;
      const id = crypto.randomUUID();
      sessionStorage.setItem("cadence_chat_session", id);
      return id;
    }
    return crypto.randomUUID();
  });

  // Load chat history from DB on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data, error } = await supabase
          .from("chat_messages")
          .select("id, role, content, created_at")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true })
          .limit(50);
        if (!error && data && data.length > 0) {
          setMessages(data.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
          })));
        }
      } catch (e) {
        console.error("Failed to load chat history:", e);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, [sessionId]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await fetch(CHAT_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ message: text.trim(), session_id: sessionId, model }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, {
          id: data.message_id || crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString(),
        }]);
        // Auto-refresh dashboard data when Cadence used tools (created tasks, saved memories, etc.)
        if (data.tool_calls > 0 && onDataChanged) {
          setTimeout(() => onDataChanged(), 500);
        }
      } else if (data.error) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${data.error}`,
          created_at: new Date().toISOString(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Connection error. Check that the Edge Function is running.",
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  }, [sending, sessionId, onDataChanged, model]);

  const clearChat = useCallback(() => {
    setMessages([]);
    const id = crypto.randomUUID();
    sessionStorage.setItem("cadence_chat_session", id);
  }, []);

  return { messages, sending, send, clearChat, sessionId, loadingHistory, model, setModel };
}

function ChatWindow({ status, onDataChanged }: { status: string; onDataChanged?: () => void }) {
  const { messages, sending, send, clearChat, loadingHistory, model, setModel } = useChat(onDataChanged);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      send(input);
      setInput("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", maxHeight: 800 }}>
      {/* Chat header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px 14px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CadenceAvatar status={status} size={32} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Cadence</div>
            <div style={{ fontSize: 10, color: sending ? C.cyan : C.green }}>
              {sending ? "thinking..." : "online"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            disabled={sending}
            style={{
              fontSize: 10, color: C.textSoft, background: C.surfaceHi, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: "4px 8px", cursor: "pointer", outline: "none",
              appearance: "none", WebkitAppearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center",
              paddingRight: 20,
            }}
          >
            {MODEL_OPTIONS.map(m => (
              <option key={m.key} value={m.key}>{m.label} ({m.cost})</option>
            ))}
          </select>
          <button onClick={clearChat} style={{ fontSize: 10, color: C.textDim, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
            New Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "18px 20px", background: C.bg, borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 14 }}>
        {loadingHistory && messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <CadenceAvatar status="thinking" size={80} />
            <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center" }}>Loading conversation...</div>
          </div>
        )}
        {!loadingHistory && messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <CadenceAvatar status="idle" size={80} />
            <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
              Talk directly with Cadence. Ask about tasks, training, nutrition, body metrics, or anything on your mind.
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 10 }}>
            {msg.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.cyan}12`, border: `1px solid ${C.cyan}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <MsgCircle size={14} color={C.cyan} />
              </div>
            )}
            <div style={{
              maxWidth: "75%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.role === "user" ? `${C.accent}18` : C.surface,
              border: `1px solid ${msg.role === "user" ? C.accent + "25" : C.border}`,
              fontSize: 13,
              lineHeight: 1.6,
              color: C.text,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.cyan}12`, border: `1px solid ${C.cyan}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MsgCircle size={14} color={C.cyan} />
            </div>
            <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: C.cyan,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.4,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10, padding: "14px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0 0 14px 14px" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Message Cadence..."
          disabled={sending}
          style={{
            flex: 1, background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: "10px 14px", color: C.text, fontSize: 13, outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          style={{
            width: 42, height: 42, borderRadius: 10, border: "none", cursor: "pointer",
            background: input.trim() ? `linear-gradient(135deg, ${C.accent}, ${C.cyan})` : C.surfaceHi,
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: input.trim() ? 1 : 0.4, transition: "all 0.2s",
          }}
        >
          <SendIc size={16} color={input.trim() ? "#fff" : C.textDim} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
export default function CadenceCommandCenter() {
  const [activeTab, setActiveTab] = useState("overview");
  const [agentStatus] = useState("online");
  const [time, setTime] = useState(new Date());
  const d = useDashboardData();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Derived data
  const openTasks = d.tasks.filter(t => t.status !== "completed" && t.status !== "failed").length;
  const critTasks = d.tasks.filter(t => t.priority <= 2 && t.status !== "completed").length;
  const prioLabel = (p: number) => p <= 2 ? "critical" : p <= 4 ? "high" : p <= 6 ? "normal" : "low";
  const prioColor = (p: number) => p <= 2 ? C.red : p <= 4 ? C.yellow : C.textMuted;
  const statusColor = (s: string) => s === "completed" ? C.green : s === "in_progress" ? C.cyan : C.textDim;
  const StatusIcon = (s: string) => s === "completed" ? CheckCirc : s === "in_progress" ? ClockIc : Circ;
  const memTypeColor = (t: string) => t === "core_memory" ? C.green : t === "decision" ? C.gold : t === "skill" ? C.purple : t === "preference" ? C.cyan : C.accent;

  const navItems = [
    { id: "overview", icon: Activity, label: "Overview" },
    { id: "tasks", icon: Target, label: "Tasks" },
    { id: "memory", icon: Brain, label: "Memory" },
    { id: "training", icon: Dumbbell, label: "Training" },
    { id: "cost", icon: Dollar, label: "Cost" },
    { id: "soul", icon: Shield, label: "Soul" },
    { id: "chat", icon: MsgCircle, label: "Chat" },
  ];

  // Loading state
  if (d.loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <CadenceAvatar status="thinking" size={120} />
        <div style={{ color: C.textMuted, fontSize: 13, letterSpacing: 1 }}>CONNECTING TO CADENCE…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      {/* Sidebar */}
      <nav style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 68, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 18, gap: 2, zIndex: 10 }}>
        <div style={{ marginBottom: 14 }}><CadenceAvatar status={agentStatus} size={38} /></div>
        {navItems.map(item => {
          const active = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)} title={item.label} style={{ width: 46, height: 46, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: active ? `${C.accent}12` : "transparent", border: active ? `1px solid ${C.accent}25` : "1px solid transparent", cursor: "pointer", position: "relative" }}>
              <item.icon size={18} color={active ? C.cyan : C.textDim} />
              {active && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, borderRadius: "0 3px 3px 0", background: C.cyan }} />}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 18 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}60` }} />
          <span style={{ fontSize: 8, color: C.textDim, writingMode: "vertical-lr" as any, transform: "rotate(180deg)" }}>v0.2</span>
        </div>
      </nav>

      {/* Main */}
      <main style={{ marginLeft: 68, padding: "24px 30px", maxWidth: 1440 }}>
        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Cadence</span>
              <span style={{ fontSize: 10, padding: "3px 12px", borderRadius: 20, fontWeight: 600, background: `${C.green}12`, color: C.green, border: `1px solid ${C.green}25` }}>● ONLINE</span>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted }}>
              {time.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })} · {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button onClick={d.refetchAll} title="Refresh" style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}>
              <Refresh size={16} color={C.textDim} />
            </button>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 1 }}>GENESIS RACE</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.cyan, lineHeight: 1.1 }}>{d.genesisCountdown} <span style={{ fontSize: 12, fontWeight: 400, color: C.textDim }}>days</span></div>
            </div>
            <CadenceAvatar status={agentStatus} size={56} />
          </div>
        </header>

        {/* ══════════ OVERVIEW ══════════ */}
        {activeTab === "overview" && (
          <div className="fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
              <StatCard icon={Target} label="Open Tasks" value={openTasks} color={C.accent} sub={critTasks ? `${critTasks} critical` : "All clear"} />
              <StatCard icon={Brain} label="Memories" value={d.memories.length} color={C.purple} sub={`${d.memories.filter(m => m.memory_type === "core_memory").length} core`} />
              <StatCard icon={Dumbbell} label="Training Day" value={`D${d.currentDay}`} color={C.green} sub={`${d.totalDays > 0 ? Math.round((d.completedDays / d.totalDays) * 100) : 0}% complete`} />
              <StatCard icon={Dollar} label="Today's Spend" value={`$${d.todayCost.toFixed(2)}`} color={C.cyan} sub="$10/day budget" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
              {/* Tasks */}
              <Panel title="Tasks" icon={Target} color={C.accent} action={<span style={{ fontSize: 11, color: C.textDim }}>{openTasks} open</span>}>
                {d.tasks.filter(t => t.status !== "completed").slice(0, 6).map(t => {
                  const SI = StatusIcon(t.status);
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}15` }}>
                      <SI size={16} color={statusColor(t.status)} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: t.status === "in_progress" ? 600 : 400 }}>{t.task}</div>
                        {t.description && <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>{t.description}</div>}
                      </div>
                      <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: `${prioColor(t.priority)}15`, color: prioColor(t.priority), textTransform: "uppercase", fontWeight: 600 }}>{prioLabel(t.priority)}</span>
                    </div>
                  );
                })}
                {d.tasks.length === 0 && <div style={{ fontSize: 12, color: C.textDim, padding: 20, textAlign: "center" }}>No tasks in heartbeat queue</div>}
              </Panel>

              {/* Memory */}
              <Panel title="Memory Bank" icon={Brain} color={C.purple} action={<span style={{ fontSize: 11, color: C.textDim }}>{d.memories.length} entries</span>}>
                {d.memories.slice(0, 5).map(m => (
                  <div key={m.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}15` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{m.key.replace(/_/g, " ")}</span>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: `${memTypeColor(m.memory_type)}15`, color: memTypeColor(m.memory_type), fontWeight: 600 }}>{m.memory_type.replace(/_/g, " ")}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.55 }}>{m.content.length > 150 ? m.content.slice(0, 150) + "…" : m.content}</div>
                  </div>
                ))}
              </Panel>

              {/* Training */}
              <Panel title="Genesis Training" icon={Dumbbell} color={C.green} action={<span style={{ fontSize: 11, color: C.cyan }}>{d.genesisCountdown}d to race</span>}>
                <div style={{ marginBottom: 14 }}>
                  <ProgressBar value={d.completedDays} max={d.totalDays || 98} color={C.green} height={7} label={d.training[0] ? `${d.training[0].phase} · Week ${d.training[0].week}` : "Loading…"} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: C.textDim }}>{d.completedDays} of {d.totalDays} days</span>
                    <span style={{ fontSize: 10, color: C.cyan }}>May 3, 2026</span>
                  </div>
                </div>
                {d.training.slice(0, 5).map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}15` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: t.completed ? `${C.green}15` : `${C.textDim}10`, color: t.completed ? C.green : C.textDim, border: `1px solid ${t.completed ? C.green + "30" : C.border}` }}>D{t.day_number}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.text }}>{t.workout_name}</div>
                      <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{t.focus} · {t.phase}</div>
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    {t.completed && <CheckCirc size={15} color={C.green} />}
                  </div>
                ))}
              </Panel>

              {/* Nutrition + Body */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Panel title="Nutrition Today" icon={Utensils} color={C.gold} action={<span style={{ fontSize: 11, color: C.textDim }}>Keto</span>}>
                  <MacroBar label="Protein" value={d.nutritionTotals.protein} target={180} color={C.accent} />
                  <MacroBar label="Fat" value={d.nutritionTotals.fat} target={140} color={C.gold} />
                  <MacroBar label="Net Carbs" value={d.nutritionTotals.netCarbs} target={30} color={C.green} />
                  <MacroBar label="Calories" value={d.nutritionTotals.calories} target={2200} unit="kcal" color={C.cyan} />
                  {d.nutritionMeals.length === 0 && <div style={{ fontSize: 11, color: C.textDim, marginTop: 8 }}>No meals logged today</div>}
                </Panel>

                {d.latestBody && (
                  <Panel title="Body Metrics" icon={TrendUp} color={C.cyan}>
                    <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 2 }}>{Number(d.latestBody.weight_lbs).toFixed(1)} <span style={{ fontSize: 14, fontWeight: 400, color: C.textMuted }}>lbs</span></div>
                    {d.latestBody.body_fat_percentage && <div style={{ fontSize: 12, color: C.gold }}>BF: {Number(d.latestBody.body_fat_percentage).toFixed(1)}%</div>}
                    {d.latestBody.resting_heart_rate && <div style={{ fontSize: 12, color: C.red, marginTop: 4 }}>RHR: {d.latestBody.resting_heart_rate} bpm</div>}
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 8 }}>Last: {new Date(d.latestBody.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </Panel>
                )}
              </div>
            </div>

            {/* Soul strip */}
            <div style={{ padding: "16px 20px", background: C.surfaceAlt, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, letterSpacing: 1 }}>
                <Shield size={12} color={C.gold} /> SOUL DIRECTIVES
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {d.soul.slice(0, 6).map(s => (
                  <div key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, padding: "7px 14px", borderRadius: 20, background: `${C.cyan}08`, border: `1px solid ${C.cyan}18`, color: C.textSoft }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.cyan }} />
                    {s.directive}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ TASKS ══════════ */}
        {activeTab === "tasks" && (
          <div className="fade-in">
            <Panel title="All Tasks" icon={Target} color={C.accent}>
              {d.tasks.map(t => {
                const SI = StatusIcon(t.status);
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}15` }}>
                    <SI size={16} color={statusColor(t.status)} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: t.status === "in_progress" ? 600 : 400, textDecoration: t.status === "completed" ? "line-through" : "none", opacity: t.status === "completed" ? 0.6 : 1 }}>{t.task}</div>
                      {t.description && <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>{t.description}</div>}
                    </div>
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: `${prioColor(t.priority)}15`, color: prioColor(t.priority), textTransform: "uppercase", fontWeight: 600 }}>{prioLabel(t.priority)}</span>
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: `${C.accent}10`, color: C.accent }}>{t.category}</span>
                  </div>
                );
              })}
              {d.tasks.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.textDim }}>Heartbeat queue empty</div>}
            </Panel>
          </div>
        )}

        {/* ══════════ MEMORY ══════════ */}
        {activeTab === "memory" && (
          <div className="fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
              {["core_memory", "decision", "skill", "preference", "knowledge"].map(type => {
                const ct = d.memories.filter(m => m.memory_type === type).length;
                if (ct === 0) return null;
                return (
                  <div key={type} style={{ padding: "14px 16px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: memTypeColor(type), textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{type.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{ct}</div>
                  </div>
                );
              })}
            </div>
            <Panel title="Memory Bank" icon={Brain} color={C.purple}>
              {d.memories.map(m => (
                <div key={m.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}15` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{m.key.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: `${memTypeColor(m.memory_type)}15`, color: memTypeColor(m.memory_type), fontWeight: 600 }}>{m.memory_type.replace(/_/g, " ")}</span>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
                      {[...Array(5)].map((_, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i < m.importance ? C.gold : C.border }} />)}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.55 }}>{m.content}</div>
                  {m.tags.length > 0 && <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>{m.tags.map(tag => <span key={tag} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: `${C.accent}10`, color: C.textDim }}>{tag}</span>)}</div>}
                </div>
              ))}
            </Panel>
          </div>
        )}

        {/* ══════════ TRAINING ══════════ */}
        {activeTab === "training" && (
          <div className="fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
              <Panel title="Genesis Training Log" icon={Dumbbell} color={C.green}>
                <div style={{ marginBottom: 18 }}>
                  <ProgressBar value={d.completedDays} max={d.totalDays || 98} color={C.green} height={8} label="Overall Progress" />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: C.textDim }}>{d.completedDays} of {d.totalDays} completed</span>
                    <span style={{ fontSize: 11, color: C.cyan, fontWeight: 600 }}>{d.genesisCountdown} days to race</span>
                  </div>
                </div>
                {d.training.map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}15` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: t.completed ? `${C.green}15` : `${C.textDim}10`, color: t.completed ? C.green : C.textDim, border: `1px solid ${t.completed ? C.green + "30" : C.border}` }}>D{t.day_number}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.text }}>{t.workout_name}</div>
                      <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{t.focus} · {t.phase} Wk{t.week}</div>
                      {t.notes && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4, fontStyle: "italic" }}>{t.notes.length > 80 ? t.notes.slice(0, 80) + "…" : t.notes}</div>}
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    {t.completed && <CheckCirc size={15} color={C.green} />}
                  </div>
                ))}
              </Panel>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {d.latestBody && (
                  <Panel title="Body Metrics" icon={TrendUp} color={C.cyan}>
                    <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 2 }}>{Number(d.latestBody.weight_lbs).toFixed(1)} <span style={{ fontSize: 14, fontWeight: 400, color: C.textMuted }}>lbs</span></div>
                    {d.bodyMetrics.length >= 2 && (() => {
                      const diff = Number(d.bodyMetrics[0].weight_lbs) - Number(d.bodyMetrics[d.bodyMetrics.length - 1].weight_lbs);
                      return <div style={{ fontSize: 12, color: diff < 0 ? C.green : C.red }}>{diff < 0 ? "▼" : "▲"} {Math.abs(diff).toFixed(1)} lbs (7d)</div>;
                    })()}
                    {d.latestBody.body_fat_percentage && <MacroBar label="Body Fat %" value={Number(d.latestBody.body_fat_percentage)} target={100} unit="%" color={C.gold} />}
                  </Panel>
                )}

                <Panel title="Nutrition Today" icon={Utensils} color={C.gold}>
                  <MacroBar label="Protein" value={d.nutritionTotals.protein} target={180} color={C.accent} />
                  <MacroBar label="Fat" value={d.nutritionTotals.fat} target={140} color={C.gold} />
                  <MacroBar label="Net Carbs" value={d.nutritionTotals.netCarbs} target={30} color={C.green} />
                  <MacroBar label="Calories" value={d.nutritionTotals.calories} target={2200} unit="kcal" color={C.cyan} />
                </Panel>

                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <CadenceAvatar status={agentStatus} size={120} />
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 12, letterSpacing: 1 }}>CADENCE · ACTIVE</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ COST ══════════ */}
        {activeTab === "cost" && (
          <div className="fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
              <StatCard icon={Dollar} label="Today" value={`$${d.todayCost.toFixed(2)}`} color={C.green} sub="$10/day budget" />
              <StatCard icon={Dollar} label="Total Logged" value={`$${d.costLog.reduce((s, c) => s + (Number(c.cost_usd) || 0), 0).toFixed(2)}`} color={C.accent} sub={`${d.costLog.length} sessions`} />
              <StatCard icon={CpuIc} label="Total Tokens" value={`${((d.costLog.reduce((s, c) => s + (c.tokens_input || 0) + (c.tokens_output || 0), 0)) / 1000).toFixed(1)}K`} color={C.cyan} />
            </div>
            <Panel title="Cost Log" icon={Dollar} color={C.cyan}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 0 10px", borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                <div style={{ width: 6 }} />
                <span style={{ fontSize: 10, color: C.textDim, flex: 1 }}>TASK</span>
                <span style={{ fontSize: 10, color: C.textDim, width: 140 }}>MODEL</span>
                <span style={{ fontSize: 10, color: C.textDim, width: 60, textAlign: "right" }}>TOKENS</span>
                <span style={{ fontSize: 10, color: C.textDim, width: 60, textAlign: "right" }}>COST</span>
              </div>
              {d.costLog.map(e => {
                const mc = e.model_used?.includes("sonnet") ? C.accent : e.model_used?.includes("haiku") ? C.green : e.model_used?.includes("gemini") ? C.gold : C.textMuted;
                const tokens = ((e.tokens_input || 0) + (e.tokens_output || 0));
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0", borderBottom: `1px solid ${C.border}15` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: mc, boxShadow: `0 0 6px ${mc}50`, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{e.task_type || "session"}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${mc}12`, color: mc, fontWeight: 500, width: 140, textAlign: "center" }}>{e.model_used || "unknown"}</span>
                    <span style={{ fontSize: 11, color: C.textDim, width: 60, textAlign: "right" }}>{tokens > 0 ? `${(tokens / 1000).toFixed(1)}K` : "—"}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.green, width: 60, textAlign: "right" }}>${Number(e.cost_usd || 0).toFixed(3)}</span>
                  </div>
                );
              })}
              {d.costLog.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.textDim }}>No cost data logged yet</div>}
            </Panel>
          </div>
        )}

        {/* ══════════ SOUL ══════════ */}
        {activeTab === "soul" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 28, padding: "30px 0" }}>
              <div style={{ textAlign: "center" }}>
                <CadenceAvatar status={agentStatus} size={180} />
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 16, letterSpacing: 2 }}>CADENCE</div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>Rhythm, pace, precision — the tempo of peak performance</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <Panel title="Soul Directives" icon={Shield} color={C.gold}>
                {d.soul.map(s => (
                  <div key={s.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}15` }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, padding: "7px 14px", borderRadius: 20, background: `${C.cyan}08`, border: `1px solid ${C.cyan}18`, color: C.textSoft }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.cyan }} />
                      {s.directive}
                    </div>
                    <span style={{ fontSize: 9, marginLeft: 8, color: C.textDim }}>{s.category}</span>
                  </div>
                ))}
              </Panel>

              <Panel title="Identity" icon={Zap} color={C.green}>
                {d.identity.slice(0, 15).map(item => (
                  <div key={item.id} style={{ display: "flex", padding: "9px 0", borderBottom: `1px solid ${C.border}15` }}>
                    <span style={{ fontSize: 11, color: C.textDim, width: 120, flexShrink: 0 }}>{item.key.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: 12, color: C.textSoft }}>{item.value.length > 100 ? item.value.slice(0, 100) + "…" : item.value}</span>
                  </div>
                ))}
              </Panel>
            </div>
          </div>
        )}

        {/* ══════════ CHAT ══════════ */}
        {activeTab === "chat" && (
          <div className="fade-in">
            <ChatWindow status={agentStatus} onDataChanged={d.refetchAll} />
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: 28, padding: "14px 0", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}80` }} />
            <span style={{ fontSize: 11, color: C.textMuted }}>connected · bghyjxxjtkzvmfkbibqp</span>
          </div>
          <span style={{ fontSize: 11, color: C.textDim }}>{time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · Cadence v0.3.0</span>
        </footer>
      </main>
    </div>
  );
}
