import { useEffect, useRef } from 'react';

type Pointer = { x: number; y: number } | null;

interface Scene {
  step: (dt: number, pointer: Pointer, excited: boolean) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

const INK = '23,23,23';
const ACCENT = '154,59,46';

/**
 * TANDEM: a handful of KV entries that live in a HOT row (big, FP16) or a
 * WARM row (small, INT4). Importance random-walks; entries cross a threshold
 * to migrate (with hysteresis and a minimum dwell, because moves cost
 * something). The cursor "reads" nearby entries, which pumps their importance.
 */
function tandemScene(W: number, H: number): Scene {
  const N = 10;
  const labelW = 32;
  const x0 = labelW + 8;
  const gap = (W - x0 - 8) / (N - 1);
  const hotY = H * 0.27;
  const warmY = H * 0.73;

  const ents = Array.from({ length: N }, () => {
    const base = 0.12 + Math.random() * 0.65;
    const tier = base > 0.45 ? 0 : 1;
    return { base, imp: base, spike: 0, tier, pos: tier, dwell: Math.random() * 2, pulse: 0 };
  });

  return {
    step(dt, pointer, excited) {
      ents.forEach((e, i) => {
        const x = x0 + i * gap;
        if (Math.random() < dt * (excited ? 0.9 : 0.22)) e.spike = 1;
        if (pointer && Math.abs(pointer.x - x) < gap * 1.1) e.spike = 1;
        e.spike *= Math.exp(-dt * 2.2);

        const target = Math.min(1, e.base + 0.55 * e.spike);
        e.imp += (target - e.imp) * dt * 3 + (Math.random() - 0.5) * 0.25 * Math.sqrt(dt);
        e.imp = Math.max(0, Math.min(1, e.imp));

        e.dwell += dt;
        if (e.dwell > 1.1) {
          if (e.tier === 1 && e.imp > 0.6) {
            e.tier = 0;
            e.dwell = 0;
            e.pulse = 1;
          } else if (e.tier === 0 && e.imp < 0.3) {
            e.tier = 1;
            e.dwell = 0;
            e.pulse = 1;
          }
        }
        e.pos += (e.tier - e.pos) * Math.min(1, dt * 6);
        e.pulse *= Math.exp(-dt * 2.5);
      });
    },

    draw(ctx) {
      ctx.clearRect(0, 0, W, H);

      ctx.font = '8px ui-sans-serif, system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(${INK},0.5)`;
      ctx.fillText('HOT', 0, hotY);
      ctx.fillText('WARM', 0, warmY);

      ctx.strokeStyle = `rgba(${INK},0.12)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      for (const y of [hotY, warmY]) {
        ctx.beginPath();
        ctx.moveTo(x0 - 6, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ents.forEach((e, i) => {
        const x = x0 + i * gap;
        const y = hotY + (warmY - hotY) * e.pos;
        const moving = Math.abs(e.tier - e.pos) > 0.03;
        const size = 8 - 3.5 * e.pos;

        if (moving) {
          ctx.strokeStyle = `rgba(${ACCENT},${0.18 + 0.3 * e.pulse})`;
          ctx.beginPath();
          ctx.moveTo(x, hotY);
          ctx.lineTo(x, warmY);
          ctx.stroke();
        }

        const alpha = 0.3 + 0.7 * e.imp;
        ctx.fillStyle = moving ? `rgba(${ACCENT},0.95)` : `rgba(${INK},${alpha})`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      });
    },
  };
}

const SCENES = { tandem: tandemScene } as const;
export type SceneName = keyof typeof SCENES;

export default function ProjectCanvas({
  scene,
  excited = false,
  width = 150,
  height = 60,
  className = '',
}: {
  scene: SceneName;
  /** parent says the row is hovered, so the scene can get livelier */
  excited?: boolean;
  width?: number;
  height?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<Pointer>(null);
  const excitedRef = useRef(excited);
  useEffect(() => {
    excitedRef.current = excited;
  }, [excited]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const sc = SCENES[scene](width, height);

    // Reduced motion: settle the scene a bit and draw one still frame.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (let i = 0; i < 60; i++) sc.step(1 / 30, null, false);
      sc.draw(ctx);
      return;
    }

    let raf = 0;
    let last = 0;
    let visible = false;

    const frame = (t: number) => {
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
      last = t;
      sc.step(dt, pointerRef.current, excitedRef.current);
      sc.draw(ctx);
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      const shouldRun = visible && !document.hidden;
      if (shouldRun && !raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!shouldRun && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(canvas);
    document.addEventListener('visibilitychange', sync);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scene, width, height]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ width, height }}
      className={className}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        pointerRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      }}
      onPointerLeave={() => {
        pointerRef.current = null;
      }}
    />
  );
}
