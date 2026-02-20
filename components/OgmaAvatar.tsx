"use client";

/**
 * OGMA AVATAR — Canvas-based crystalline intelligence visualization
 *
 * Preserved from the original Cadence Command Center (pre-Cadence rebrand).
 * This is Ogma's self-designed visual identity — a procedural crystalline form
 * with asymmetric faceted core, orbital light paths, and floating particles.
 *
 * Color palette: Deep ocean + bioluminescence
 *   - Background glow: purple (59,7,100)
 *   - Primary: cyan (#06b6d4 / rgb 6,182,212)
 *   - Accent: gold (#d4a017 / rgb 212,160,23)
 *   - Core fill: dark blue gradients
 *
 * States: online, thinking, success, error, idle
 *
 * To reuse for Ogma's next model deployment, drop this component in and render:
 *   <OgmaAvatar status="online" size={200} />
 */

import { useRef, useEffect } from "react";

export default function OgmaAvatar({ status = "online", size = 200 }: { status?: string; size?: number }) {
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
