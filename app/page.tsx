"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDashboardData } from "@/lib/hooks";
import { CHAT_FUNCTION_URL, SUPABASE_ANON_KEY, supabase } from "@/lib/supabase";
import type { ChatMessage, NutritionMeal, BodyMetric } from "@/lib/supabase";

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
const CheckCirc = Ic(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>);
const Circ = Ic(<circle cx="12" cy="12" r="10" />);
const SendIc = Ic(<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>);
const Utensils = Ic(<><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7" /></>);
const TrendUp = Ic(<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>);
const Shield = Ic(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />);
const MsgCircle = Ic(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>);
const Plus = Ic(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>);
const X = Ic(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>);

/* ═══════════════════════════════════════════════════════════════
   CADENCE AVATAR — The Living Pulse Ring
   ═══════════════════════════════════════════════════════════════ */
const CAD = {
  base: "#00E5CC",       // cyan-teal
  violet: "#7B61FF",     // thinking/processing
  green: "#00FF88",      // success
  red: "#FF3D5A",        // error/alert
  orange: "#FF8800",     // deep work / zone
  bg: "#0A0A0F",         // near-black
};

function CadenceAvatar({ status = "online", size = 200 }: { status?: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ status, transitionStart: 0, prevStatus: status });
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (stateRef.current.status !== status) {
      stateRef.current.prevStatus = stateRef.current.status;
      stateRef.current.transitionStart = performance.now();
      stateRef.current.status = status;
    }
  }, [status]);

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
    const ringR = size * 0.30;
    const tubeR = size * 0.055;
    const TILT_X = 0.26;
    const SEGMENTS = 180;

    const particles: { angle: number; vAngle: number; dist: number; sz: number; opacity: number }[] = [];
    for (let i = 0; i < 8; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        vAngle: (0.001 + Math.random() * 0.003) * (Math.random() > 0.5 ? 1 : -1),
        dist: ringR * 0.3 + Math.random() * ringR * 0.4,
        sz: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.4,
      });
    }

    let successPingT = -1;

    function getStateParams(s: string) {
      if (s === "thinking") return {
        rotSpeed: Math.PI * 2 / 4,
        pulseFreq: 2.5,
        pulseAmp: 0.7,
        color: [123, 97, 255] as number[],
        glowIntensity: 1.4,
        harmonic2: 0.35,
        particleCount: 18,
        particleOrbit: true,
      };
      if (s === "success") return {
        rotSpeed: Math.PI * 2 / 8,
        pulseFreq: 1.0,
        pulseAmp: 0.4,
        color: [0, 229, 204] as number[],
        glowIntensity: 1.6,
        harmonic2: 0,
        particleCount: 8,
        particleOrbit: false,
      };
      if (s === "error") return {
        rotSpeed: Math.PI * 2 / 8,
        pulseFreq: 4.0,
        pulseAmp: 1.0,
        color: [255, 61, 90] as number[],
        glowIntensity: 1.2,
        harmonic2: 0,
        particleCount: 5,
        particleOrbit: false,
      };
      if (s === "idle") return {
        rotSpeed: Math.PI * 2 / 8,
        pulseFreq: 1.0,
        pulseAmp: 0.25,
        color: [0, 229 * 0.7, 204 * 0.7] as number[],
        glowIntensity: 0.5,
        harmonic2: 0,
        particleCount: 6,
        particleOrbit: false,
      };
      return {
        rotSpeed: Math.PI * 2 / 8,
        pulseFreq: 1.0,
        pulseAmp: 0.35,
        color: [0, 229, 204] as number[],
        glowIntensity: 1.0,
        harmonic2: 0,
        particleCount: 8,
        particleOrbit: false,
      };
    }

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
    function lerpColor(a: number[], b: number[], t: number) { return a.map((v, i) => lerp(v, b[i], t)); }

    function draw(ts: number) {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed = (ts - startTimeRef.current) / 1000;
      const s = stateRef.current.status;
      const transT = Math.min(1, (ts - stateRef.current.transitionStart) / 400);
      const easeT = transT < 1 ? transT * transT * (3 - 2 * transT) : 1;

      const cur = getStateParams(s);
      const prev = getStateParams(stateRef.current.prevStatus);
      const rotSpeed = lerp(prev.rotSpeed, cur.rotSpeed, easeT);
      const pulseFreq = lerp(prev.pulseFreq, cur.pulseFreq, easeT);
      const pulseAmp = lerp(prev.pulseAmp, cur.pulseAmp, easeT);
      const color = lerpColor(prev.color, cur.color, easeT);
      const glowI = lerp(prev.glowIntensity, cur.glowIntensity, easeT);
      const harm2 = lerp(prev.harmonic2, cur.harmonic2, easeT);

      if (s === "success" && stateRef.current.prevStatus !== "success" && transT < 0.1) {
        successPingT = elapsed;
      }

      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = CAD.bg;
      ctx.fillRect(0, 0, size, size);

      const yOsc = Math.sin(elapsed * Math.PI * 2 / 4) * 2;
      const ccy = cy + yOsc;
      const rotAngle = elapsed * rotSpeed;

      const glowR = ringR + tubeR * 1.15;
      const auraGrad = ctx.createRadialGradient(cx, ccy, ringR * 0.6, cx, ccy, glowR * 1.3);
      auraGrad.addColorStop(0, `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])},${0.06 * glowI})`);
      auraGrad.addColorStop(0.6, `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])},${0.03 * glowI})`);
      auraGrad.addColorStop(1, "transparent");
      ctx.fillStyle = auraGrad;
      ctx.beginPath(); ctx.arc(cx, ccy, glowR * 1.3, 0, Math.PI * 2); ctx.fill();

      const lightAngle = -Math.PI * 0.75;

      for (let i = 0; i < SEGMENTS; i++) {
        const a1 = (i / SEGMENTS) * Math.PI * 2;
        const a2 = ((i + 1) / SEGMENTS) * Math.PI * 2;

        const tiltY1 = Math.sin(a1) * TILT_X;
        const tiltY2 = Math.sin(a2) * TILT_X;

        const pulsePhase = a1 - elapsed * pulseFreq * Math.PI * 2;
        const displacement = Math.sin(pulsePhase) * pulseAmp * tubeR;
        const displacement2 = Math.sin(pulsePhase * 2.3 + 0.5) * harm2 * tubeR;
        let errorSpike = 0;
        if (s === "error" && transT < 0.8) {
          const sawPhase = ((a1 - elapsed * 8) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          errorSpike = sawPhase < 1.0 ? (1 - sawPhase) * tubeR * 1.5 * (1 - transT) : 0;
        }
        const totalDisp = displacement + displacement2 + errorSpike;

        const ra1 = a1 + rotAngle;
        const ra2 = a2 + rotAngle;
        const x1 = cx + Math.cos(ra1) * (ringR + totalDisp);
        const y1 = ccy + Math.sin(ra1) * (ringR + totalDisp) * (1 - TILT_X * 0.3);
        const x2 = cx + Math.cos(ra2) * (ringR + totalDisp);
        const y2 = ccy + Math.sin(ra2) * (ringR + totalDisp) * (1 - TILT_X * 0.3);

        const depthFactor = 1 + tiltY1 * 0.5;
        const currentTube = tubeR * depthFactor * (0.8 + pulseAmp * 0.2 * Math.abs(Math.sin(pulsePhase)));

        const normalAngle = ra1;
        const lightDot = Math.cos(normalAngle - lightAngle) * 0.5 + 0.5;
        const depthLight = (1 + tiltY1) * 0.5;
        const brightness = 0.2 + lightDot * 0.5 + depthLight * 0.3;

        const sss = Math.max(0, Math.sin(pulsePhase)) * pulseAmp * 0.4;

        const r = Math.round(color[0] * brightness + sss * 40);
        const g = Math.round(color[1] * brightness + sss * 60);
        const b = Math.round(color[2] * brightness + sss * 50);
        const alpha = 0.7 + brightness * 0.3;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)},${alpha})`;
        ctx.lineWidth = currentTube * 2;
        ctx.lineCap = "round";
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      const innerGlow = ctx.createRadialGradient(cx, ccy, ringR * 0.85, cx, ccy, ringR * 1.15);
      innerGlow.addColorStop(0, "transparent");
      innerGlow.addColorStop(0.4, `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])},${0.04 * glowI})`);
      innerGlow.addColorStop(0.6, `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])},${0.02 * glowI})`);
      innerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = innerGlow;
      ctx.beginPath(); ctx.arc(cx, ccy, ringR * 1.15, 0, Math.PI * 2); ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])},${0.5 * glowI})`;
      ctx.lineWidth = 1;
      for (let i = 0; i <= SEGMENTS; i++) {
        const a = (i / SEGMENTS) * Math.PI * 2;
        const ra = a + rotAngle;
        const pulsePhase = a - elapsed * pulseFreq * Math.PI * 2;
        const disp = Math.sin(pulsePhase) * pulseAmp * tubeR * 0.6;
        const disp2 = Math.sin(pulsePhase * 2.3 + 0.5) * harm2 * tubeR * 0.5;
        const outerR = ringR + tubeR + 3 + disp + disp2;
        const x = cx + Math.cos(ra) * outerR;
        const y = ccy + Math.sin(ra) * outerR * (1 - TILT_X * 0.3);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      const pulseAngle = rotAngle + elapsed * pulseFreq * Math.PI * 2;
      const px = cx + Math.cos(pulseAngle) * ringR;
      const py = ccy + Math.sin(pulseAngle) * ringR * (1 - TILT_X * 0.3);
      const pulseGlow = ctx.createRadialGradient(px, py, 0, px, py, tubeR * 3);
      pulseGlow.addColorStop(0, `rgba(${Math.round(Math.min(255, color[0] + 60))},${Math.round(Math.min(255, color[1] + 60))},${Math.round(Math.min(255, color[2] + 60))},${0.5 * glowI})`);
      pulseGlow.addColorStop(0.5, `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])},${0.15 * glowI})`);
      pulseGlow.addColorStop(1, "transparent");
      ctx.fillStyle = pulseGlow;
      ctx.beginPath(); ctx.arc(px, py, tubeR * 3, 0, Math.PI * 2); ctx.fill();

      if (successPingT > 0) {
        const pingAge = elapsed - successPingT;
        if (pingAge < 1.0) {
          const pingR = ringR + pingAge * size * 0.2;
          const pingAlpha = (1 - pingAge) * 0.6;
          ctx.beginPath();
          ctx.arc(cx, ccy, pingR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0,255,136,${pingAlpha})`;
          ctx.lineWidth = 2 * (1 - pingAge);
          ctx.stroke();
        }
      }

      const activeCount = Math.round(lerp(
        getStateParams(stateRef.current.prevStatus).particleCount,
        cur.particleCount,
        easeT
      ));
      const orbitDir = cur.particleOrbit ? 1 : 0;
      particles.forEach((pt, idx) => {
        if (idx >= activeCount) return;
        pt.angle += pt.vAngle + orbitDir * rotSpeed * 0.3 * (1 / 60);
        const x = cx + Math.cos(pt.angle) * pt.dist;
        const y = ccy + Math.sin(pt.angle) * pt.dist;
        const op = pt.opacity * glowI * (0.4 + Math.sin(elapsed * 2 + idx) * 0.3);
        ctx.beginPath(); ctx.arc(x, y, pt.sz, 0, Math.PI * 2);
        const pg = ctx.createRadialGradient(x, y, 0, x, y, pt.sz * 2);
        pg.addColorStop(0, `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])},${op})`);
        pg.addColorStop(1, `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])},0)`);
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(x, y, pt.sz * 2, 0, Math.PI * 2); ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  const glowColor = status === "thinking" ? CAD.violet
    : status === "error" ? CAD.red
    : status === "success" ? CAD.green
    : CAD.base;

  return (
    <canvas ref={canvasRef} style={{
      width: size, height: size, borderRadius: "50%",
      filter: `drop-shadow(0 0 ${status === "thinking" ? 25 : status === "idle" ? 8 : 15}px ${glowColor}${status === "idle" ? "18" : "50"})`,
      transition: "filter 0.5s ease",
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
   NUTRITION FORM
   ═══════════════════════════════════════════════════════════════ */
function NutritionForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    description: "",
    meal_type: "lunch",
    protein: 30,
    carbs: 20,
    fat: 15,
    fiber: 5,
    calories: 350,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.description.trim()) return;
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("nutrition_meals").insert({
        date: today,
        time_logged: form.time,
        meal_type: form.meal_type,
        description: form.description,
        protein_g: form.protein,
        carbs_g: form.carbs,
        net_carbs_g: form.carbs - form.fiber,
        fat_g: form.fat,
        fiber_g: form.fiber,
        calories: form.calories,
      });
      if (!error) {
        setForm({
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          description: "",
          meal_type: "lunch",
          protein: 30,
          carbs: 20,
          fat: 15,
          fiber: 5,
          calories: 350,
        });
        onSuccess();
      }
    } catch (e) {
      console.error("Nutrition log error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginTop: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <input
          type="time"
          value={form.time}
          onChange={e => setForm({ ...form, time: e.target.value })}
          style={{ padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}
        />
        <select
          value={form.meal_type}
          onChange={e => setForm({ ...form, meal_type: e.target.value })}
          style={{ padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
        <input
          type="text"
          placeholder="Meal description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          style={{ gridColumn: "1 / -1", padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}
        />
        <input
          type="number"
          placeholder="Protein (g)"
          value={form.protein}
          onChange={e => setForm({ ...form, protein: Number(e.target.value) })}
          style={{ padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}
        />
        <input
          type="number"
          placeholder="Carbs (g)"
          value={form.carbs}
          onChange={e => setForm({ ...form, carbs: Number(e.target.value) })}
          style={{ padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}
        />
        <input
          type="number"
          placeholder="Fat (g)"
          value={form.fat}
          onChange={e => setForm({ ...form, fat: Number(e.target.value) })}
          style={{ padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}
        />
        <input
          type="number"
          placeholder="Calories"
          value={form.calories}
          onChange={e => setForm({ ...form, calories: Number(e.target.value) })}
          style={{ padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting || !form.description.trim()}
        style={{
          width: "100%",
          marginTop: 12,
          padding: "12px",
          borderRadius: 8,
          border: "none",
          background: C.green,
          color: "#000",
          fontWeight: 600,
          cursor: submitting ? "default" : "pointer",
          opacity: submitting || !form.description.trim() ? 0.5 : 1,
        }}
      >
        {submitting ? "Saving..." : "Log Meal"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BODY METRICS FORM
   ═══════════════════════════════════════════════════════════════ */
function BodyMetricsForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    weight_lbs: "",
    body_fat: "",
    resting_hr: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.weight_lbs) return;
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("body_metrics").insert({
        date: today,
        weight_lbs: parseFloat(form.weight_lbs),
        body_fat_percentage: form.body_fat ? parseFloat(form.body_fat) : null,
        resting_heart_rate: form.resting_hr ? parseInt(form.resting_hr) : null,
      });
      if (!error) {
        setForm({ weight_lbs: "", body_fat: "", resting_hr: "" });
        onSuccess();
      }
    } catch (e) {
      console.error("Body metrics error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginTop: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <input
          type="number"
          placeholder="Weight (lbs)"
          value={form.weight_lbs}
          onChange={e => setForm({ ...form, weight_lbs: e.target.value })}
          step="0.1"
          style={{ padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}
        />
        <input
          type="number"
          placeholder="Body Fat %"
          value={form.body_fat}
          onChange={e => setForm({ ...form, body_fat: e.target.value })}
          step="0.1"
          style={{ padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}
        />
        <input
          type="number"
          placeholder="Resting HR (bpm)"
          value={form.resting_hr}
          onChange={e => setForm({ ...form, resting_hr: e.target.value })}
          style={{ gridColumn: "1 / -1", padding: "10px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting || !form.weight_lbs}
        style={{
          width: "100%",
          marginTop: 12,
          padding: "12px",
          borderRadius: 8,
          border: "none",
          background: C.cyan,
          color: "#000",
          fontWeight: 600,
          cursor: submitting ? "default" : "pointer",
          opacity: submitting || !form.weight_lbs ? 0.5 : 1,
        }}
      >
        {submitting ? "Saving..." : "Log Metrics"}
      </button>
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

  useEffect(() => {
    async function loadHistory() {
      try {
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
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)", background: C.bg }}>
      {/* Chat header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
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
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "18px 20px", background: C.bg, display: "flex", flexDirection: "column", gap: 14 }}>
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
      <div style={{ display: "flex", gap: 10, padding: "14px 18px", background: C.surface, borderTop: `1px solid ${C.border}` }}>
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
   MAIN DASHBOARD — Mobile-first Bottom Tab Navigation
   ═══════════════════════════════════════════════════════════════ */
export default function CadenceCommandCenter() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [agentStatus] = useState("online");
  const [time, setTime] = useState(new Date());
  const [showNutritionForm, setShowNutritionForm] = useState(false);
  const [showBodyMetricsForm, setShowBodyMetricsForm] = useState(false);
  const d = useDashboardData();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const openTasks = d.tasks.filter(t => t.status !== "completed" && t.status !== "failed").length;
  const critTasks = d.tasks.filter(t => t.priority <= 2 && t.status !== "completed").length;
  const prioLabel = (p: number) => p <= 2 ? "critical" : p <= 4 ? "high" : p <= 6 ? "normal" : "low";
  const prioColor = (p: number) => p <= 2 ? C.red : p <= 4 ? C.yellow : C.textMuted;
  const statusColor = (s: string) => s === "completed" ? C.green : s === "in_progress" ? C.cyan : C.textDim;
  const StatusIcon = (s: string) => s === "completed" ? CheckCirc : s === "in_progress" ? ClockIc : Circ;

  const navItems = [
    { id: "dashboard", icon: Activity, label: "Dashboard" },
    { id: "training", icon: Dumbbell, label: "Training" },
    { id: "chat", icon: MsgCircle, label: "Chat" },
    { id: "conn", icon: Brain, label: "Conn" },
  ];

  if (d.loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <CadenceAvatar status="thinking" size={120} />
        <div style={{ color: C.textMuted, fontSize: 13, letterSpacing: 1 }}>CONNECTING TO CADENCE…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column" }}>
      {/* Main content area */}
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 70, padding: "20px" }}>
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                  <CadenceAvatar status={agentStatus} size={40} />
                  <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Cadence</span>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 1 }}>GENESIS RACE</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.cyan, lineHeight: 1.1 }}>{d.genesisCountdown} <span style={{ fontSize: 12, fontWeight: 400, color: C.textDim }}>days</span></div>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
              <StatCard icon={Target} label="Tasks" value={openTasks} color={C.accent} sub={critTasks > 0 ? `${critTasks} crit` : "clear"} />
              <StatCard icon={Dumbbell} label="Day" value={`D${d.currentDay}`} color={C.green} sub={`${d.totalDays > 0 ? Math.round((d.completedDays / d.totalDays) * 100) : 0}%`} />
              <StatCard icon={Dollar} label="Today" value={`$${d.todayCost.toFixed(2)}`} color={C.cyan} sub="$10/day budget" />
              <StatCard icon={Brain} label="Memory" value={d.memories.length} color={C.purple} sub={`${d.memories.filter(m => m.category === "core").length} core`} />
            </div>

            {/* Nutrition Today */}
            <Panel title="Nutrition Today" icon={Utensils} color={C.gold} action={<span style={{ fontSize: 11, color: C.textDim }}>Keto</span>}>
              <MacroBar label="Protein" value={d.nutritionTotals.protein} target={180} color={C.accent} />
              <MacroBar label="Fat" value={d.nutritionTotals.fat} target={140} color={C.gold} />
              <MacroBar label="Net Carbs" value={d.nutritionTotals.netCarbs} target={30} color={C.green} />
              <MacroBar label="Calories" value={d.nutritionTotals.calories} target={2200} unit="kcal" color={C.cyan} />
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  onClick={() => setShowNutritionForm(!showNutritionForm)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    color: C.textSoft,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {showNutritionForm ? "Cancel" : "+ Add Meal"}
                </button>
              </div>
              {showNutritionForm && <NutritionForm onSuccess={() => { setShowNutritionForm(false); d.refetchAll(); }} />}
              {d.nutritionMeals.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}15` }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>Meals Logged</div>
                  {d.nutritionMeals.map(m => (
                    <div key={m.id} style={{ fontSize: 11, color: C.textSoft, padding: "6px 0", borderBottom: `1px solid ${C.border}15` }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{m.time_logged} · {m.meal_type}</span>
                        <span style={{ color: C.textMuted }}>{Math.round(m.calories || 0)} kcal</span>
                      </div>
                      <div style={{ fontSize: 10, color: C.textDim }}>{m.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Body Metrics */}
            {d.latestBody && (
              <Panel title="Body Metrics" icon={TrendUp} color={C.cyan} action={<span style={{ fontSize: 11, color: C.textDim }}>Latest</span>}>
                <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 6 }}>{Number(d.latestBody.weight_lbs).toFixed(1)} <span style={{ fontSize: 14, fontWeight: 400, color: C.textMuted }}>lbs</span></div>
                {d.latestBody.body_fat_percentage && <div style={{ fontSize: 13, color: C.gold, marginBottom: 6 }}>BF: {Number(d.latestBody.body_fat_percentage).toFixed(1)}%</div>}
                {d.latestBody.resting_heart_rate && <div style={{ fontSize: 13, color: C.red, marginBottom: 12 }}>RHR: {d.latestBody.resting_heart_rate} bpm</div>}
                <button
                  onClick={() => setShowBodyMetricsForm(!showBodyMetricsForm)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    color: C.textSoft,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {showBodyMetricsForm ? "Cancel" : "+ Log Metrics"}
                </button>
                {showBodyMetricsForm && <BodyMetricsForm onSuccess={() => { setShowBodyMetricsForm(false); d.refetchAll(); }} />}
              </Panel>
            )}

            {/* Training Status */}
            <Panel title="Genesis Training" icon={Dumbbell} color={C.green} action={<span style={{ fontSize: 11, color: C.cyan }}>{d.genesisCountdown}d to race</span>}>
              <div style={{ marginBottom: 14 }}>
                <ProgressBar value={d.completedDays} max={d.totalDays || 98} color={C.green} height={7} label="Progress" />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: C.textDim }}>{d.completedDays} of {d.totalDays} days</span>
                  <span style={{ fontSize: 10, color: C.cyan }}>May 3, 2026</span>
                </div>
              </div>
              {d.training.slice(0, 3).map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}15` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: t.completed ? `${C.green}15` : `${C.textDim}10`, color: t.completed ? C.green : C.textDim, border: `1px solid ${t.completed ? C.green + "30" : C.border}` }}>D{t.day_number}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: C.text }}>{t.workout_name}</div>
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{t.focus}</div>
                  </div>
                  {t.completed && <CheckCirc size={15} color={C.green} />}
                </div>
              ))}
            </Panel>
          </div>
        )}

        {/* TRAINING TAB */}
        {activeTab === "training" && (
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <ChatWindow status={agentStatus} onDataChanged={d.refetchAll} />
        )}

        {/* CONN TAB */}
        {activeTab === "conn" && (
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* Tasks */}
            <Panel title="Heartbeat Queue" icon={Target} color={C.accent} action={<span style={{ fontSize: 11, color: C.textDim }}>{openTasks} open</span>}>
              {d.tasks.filter(t => t.status !== "completed").length > 0 ? (
                d.tasks.filter(t => t.status !== "completed").map(t => {
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
                })
              ) : (
                <div style={{ fontSize: 12, color: C.textDim, padding: 20, textAlign: "center" }}>No active tasks</div>
              )}
            </Panel>

            {/* Memory Bank */}
            <Panel title="Memory Bank" icon={Brain} color={C.purple} action={<span style={{ fontSize: 11, color: C.textDim }}>{d.memories.length} entries</span>}>
              {d.memories.length > 0 ? (
                d.memories.map(m => (
                  <div key={m.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}15` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{m.key.replace(/_/g, " ")}</span>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: `${C.purple}15`, color: C.purple, fontWeight: 600 }}>{m.category.replace(/_/g, " ")}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.55 }}>{m.content.length > 150 ? m.content.slice(0, 150) + "…" : m.content}</div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: C.textDim, padding: 20, textAlign: "center" }}>No memories yet</div>
              )}
            </Panel>

            {/* Soul Directives */}
            <Panel title="Soul Directives" icon={Shield} color={C.gold}>
              {d.soul.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {d.soul.map(s => (
                    <div key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, padding: "7px 14px", borderRadius: 20, background: `${C.cyan}08`, border: `1px solid ${C.cyan}18`, color: C.textSoft }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.cyan }} />
                      {s.directive}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: C.textDim, padding: 20, textAlign: "center" }}>No soul directives</div>
              )}
            </Panel>

            {/* Identity */}
            <Panel title="Cadence Identity" icon={Zap} color={C.green}>
              {d.cadenceIdentity.length > 0 ? (
                d.cadenceIdentity.slice(0, 10).map(item => (
                  <div key={item.id} style={{ display: "flex", padding: "9px 0", borderBottom: `1px solid ${C.border}15` }}>
                    <span style={{ fontSize: 11, color: C.textDim, width: 120, flexShrink: 0 }}>{item.key.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: 12, color: C.textSoft }}>{item.value.length > 100 ? item.value.slice(0, 100) + "…" : item.value}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: C.textDim, padding: 20, textAlign: "center" }}>No identity data</div>
              )}
            </Panel>
          </div>
        )}
      </main>

      {/* BOTTOM TAB NAVIGATION */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 100,
      }}>
        {navItems.map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                flex: 1,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                background: active ? `${C.accent}06` : "transparent",
                border: "none",
                cursor: "pointer",
                borderTop: active ? `2px solid ${C.cyan}` : "none",
                transition: "all 0.2s",
              }}
            >
              <item.icon size={20} color={active ? C.cyan : C.textDim} />
              <span style={{ fontSize: 9, color: active ? C.cyan : C.textDim, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Global animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .fade-in {
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
