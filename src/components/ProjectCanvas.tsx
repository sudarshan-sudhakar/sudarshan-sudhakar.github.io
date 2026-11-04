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

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * TEMPO: requests pile up in a queue; a gate decides to wait or serve. Under
 * load (cursor / hover) the queue fills faster, so the batches get bigger.
 */
function tempoScene(W: number, H: number): Scene {
  const COLS = 10;
  const CAP = 30;
  const qx = 22;
  const qy = H * 0.3;
  const sx = 6.2;
  const sy = 8;
  const gpuW = 26;
  const gpuX = W - gpuW - 4;
  const gpuY = H * 0.18;
  const gpuH = H * 0.56;
  const gateX = gpuX - 9;

  let queue: { age: number }[] = [];
  let flying: { x: number; y: number; tx: number; ty: number; t: number }[] = [];
  let flash = 0;
  let open = 0;
  const slot = (i: number) => ({ x: qx + (i % COLS) * sx, y: qy + Math.floor(i / COLS) * sy });

  return {
    step(dt, pointer, excited) {
      const busy = excited || !!pointer;
      if (Math.random() < dt * (busy ? 16 : 5) && queue.length < CAP) queue.push({ age: 0 });
      queue.forEach((r) => (r.age += dt));

      const threshold = busy ? 22 : 12;
      if (queue.length && (queue.length >= threshold || queue[0].age > 2)) {
        queue.forEach((_, i) => {
          const s = slot(i);
          flying.push({ x: s.x, y: s.y, tx: gpuX + gpuW / 2, ty: gpuY + gpuH / 2 + rnd(-0.25, 0.25) * gpuH, t: 0 });
        });
        queue = [];
        flash = 1;
        open = 1;
      }
      flying.forEach((f) => (f.t += dt * 2.2));
      flying = flying.filter((f) => f.t < 1);
      flash *= Math.exp(-dt * 3);
      open *= Math.exp(-dt * 2);
    },
    draw(ctx) {
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = `rgba(${INK},${0.5 - 0.4 * open})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gateX, gpuY);
      ctx.lineTo(gateX, gpuY + gpuH);
      ctx.stroke();

      ctx.fillStyle = `rgba(${ACCENT},${flash * 0.35})`;
      ctx.fillRect(gpuX, gpuY, gpuW, gpuH);
      ctx.strokeStyle = `rgba(${INK},0.55)`;
      ctx.strokeRect(gpuX + 0.5, gpuY + 0.5, gpuW, gpuH);
      ctx.font = '8px ui-sans-serif, system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(${INK},0.5)`;
      ctx.fillText('GPU', gpuX + 4, gpuY + gpuH / 2);
      ctx.fillText(open > 0.3 ? 'SERVE' : 'WAIT', qx - 2, H - 6);

      queue.forEach((r, i) => {
        const s = slot(i);
        const size = 4 * Math.min(1, r.age * 8);
        ctx.fillStyle = r.age > 1.4 ? `rgba(${ACCENT},0.9)` : `rgba(${INK},0.75)`;
        ctx.fillRect(s.x - size / 2, s.y - size / 2, size, size);
      });
      ctx.fillStyle = `rgba(${ACCENT},0.9)`;
      flying.forEach((f) => {
        const x = lerp(f.x, f.tx, f.t);
        const y = lerp(f.y, f.ty, f.t);
        ctx.fillRect(x - 2, y - 2, 4, 4);
      });
    },
  };
}

/**
 * PULSE: an agent walks a grid toward a goal. Stepping on a trap leaves
 * "pain" that spreads and fades slowly; the agent vetoes painful cells. The
 * cursor pokes extra pain into cells it touches.
 */
function pulseScene(W: number, H: number): Scene {
  const C = 12;
  const R = 5;
  const cs = 11;
  const gx = (W - C * cs) / 2;
  const gy = (H - R * cs) / 2;
  const traps: [number, number][] = [
    [4, 1],
    [6, 3],
    [9, 2],
  ];
  const isTrap = (c: number, r: number) => traps.some(([tc, tr]) => tc === c && tr === r);
  const pain = new Array(C * R).fill(0);
  const agent = { c: 0, r: 2, wait: 0, blink: 0 };
  let goalFlash = 0;

  const respawn = () => {
    agent.c = 0;
    agent.r = 2;
    agent.blink = 1;
  };

  return {
    step(dt, pointer, excited) {
      for (let i = 0; i < pain.length; i++) pain[i] *= Math.exp(-dt * 0.12);
      if (pointer) {
        const c = Math.floor((pointer.x - gx) / cs);
        const r = Math.floor((pointer.y - gy) / cs);
        if (c >= 0 && c < C && r >= 0 && r < R) pain[r * C + c] = Math.min(1, pain[r * C + c] + dt * 3);
      }
      goalFlash *= Math.exp(-dt * 3);
      agent.blink *= Math.exp(-dt * 3);

      agent.wait -= dt;
      if (agent.wait > 0) return;
      agent.wait = excited ? 0.14 : 0.28;

      const moves = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]
        .map(([dc, dr]) => ({ c: agent.c + dc, r: agent.r + dr }))
        .filter((m) => m.c >= 0 && m.c < C && m.r >= 0 && m.r < R);
      const safe = moves.filter((m) => pain[m.r * C + m.c] < 0.45);
      const pool = safe.length ? safe : moves;
      let best = pool[0];
      let bestScore = Infinity;
      for (const m of pool) {
        const score = Math.abs(C - 1 - m.c) + Math.abs(R - 1 - m.r) + Math.random() * 1.6;
        if (score < bestScore) {
          bestScore = score;
          best = m;
        }
      }
      agent.c = best.c;
      agent.r = best.r;

      if (isTrap(agent.c, agent.r)) {
        for (let r = 0; r < R; r++) {
          for (let c = 0; c < C; c++) {
            const d2 = (c - agent.c) ** 2 + (r - agent.r) ** 2;
            pain[r * C + c] = Math.min(1, pain[r * C + c] + Math.exp(-d2 / 1.6));
          }
        }
        respawn();
        agent.wait = 0.4;
      } else if (agent.c === C - 1 && agent.r === R - 1) {
        goalFlash = 1;
        respawn();
        agent.wait = 0.4;
      }
    },
    draw(ctx) {
      ctx.clearRect(0, 0, W, H);
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          const x = gx + c * cs;
          const y = gy + r * cs;
          const p = pain[r * C + c];
          if (p > 0.02) {
            ctx.fillStyle = `rgba(${ACCENT},${p * 0.55})`;
            ctx.fillRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
          }
          ctx.fillStyle = `rgba(${INK},0.14)`;
          ctx.fillRect(x + cs / 2 - 0.75, y + cs / 2 - 0.75, 1.5, 1.5);
        }
      }
      ctx.strokeStyle = `rgba(${INK},0.55)`;
      ctx.lineWidth = 1;
      for (const [c, r] of traps) {
        const x = gx + c * cs + cs / 2;
        const y = gy + r * cs + cs / 2;
        ctx.beginPath();
        ctx.moveTo(x - 2.5, y - 2.5);
        ctx.lineTo(x + 2.5, y + 2.5);
        ctx.moveTo(x + 2.5, y - 2.5);
        ctx.lineTo(x - 2.5, y + 2.5);
        ctx.stroke();
      }
      const gxp = gx + (C - 1) * cs + cs / 2;
      const gyp = gy + (R - 1) * cs + cs / 2;
      ctx.strokeStyle = `rgba(${INK},${0.5 + 0.5 * goalFlash})`;
      ctx.beginPath();
      ctx.arc(gxp, gyp, 3.5 + goalFlash * 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(${INK},${0.5 + 0.5 * (1 - agent.blink)})`;
      ctx.fillRect(gx + agent.c * cs + cs / 2 - 2.5, gy + agent.r * cs + cs / 2 - 2.5, 5, 5);
    },
  };
}

/**
 * PPR: a heavy ball (SGD + momentum) rolls down a bumpy loss curve and gets
 * stuck in a dip. It then fires probes, pulls itself into a better spot if it
 * finds one, and "reincarnates" at the start if probing keeps failing. The
 * cursor nudges the ball sideways.
 */
function pprScene(W: number, H: number): Scene {
  const f = (x: number) => 0.75 * x * x + 0.16 * (1 - Math.cos(9 * Math.PI * x));
  const df = (x: number) => (f(x + 1e-3) - f(x - 1e-3)) / 2e-3;
  const px = (x: number) => 8 + ((x + 1) / 2) * (W - 16);
  const py = (x: number) => H - 8 - (f(x) * (H - 18)) / 1.1;

  const start = () => (Math.random() < 0.5 ? -0.9 : 0.9);
  let x = start();
  let v = 0;
  let still = 0;
  let fails = 0;
  let phase: 'roll' | 'probe' | 'pull' | 'hold' = 'roll';
  let timer = 0;
  let cands: number[] = [];
  let pullTo = 0;
  let acc = 0;
  let trail: { x: number; y: number }[] = [];

  return {
    step(dt, pointer, excited) {
      timer += dt;
      if (phase === 'roll') {
        acc += dt * 60 * (excited ? 1.8 : 1);
        while (acc >= 1) {
          acc -= 1;
          if (pointer) v += (((pointer.x - 8) / (W - 16)) * 2 - 1 - x) * 0.0012;
          v = v * 0.9 - 0.004 * df(x);
          x = clamp(x + v, -1, 1);
          still = Math.abs(v) < 0.0009 ? still + 1 : 0;
        }
        trail.push({ x: px(x), y: py(x) });
        if (trail.length > 10) trail.shift();
        if (still > 40) {
          still = 0;
          v = 0;
          timer = 0;
          if (Math.abs(x) < 0.06) {
            phase = 'hold';
          } else {
            phase = 'probe';
            cands = Array.from({ length: 4 }, () => clamp(x + rnd(-0.38, 0.38), -1, 1));
          }
        }
      } else if (phase === 'probe') {
        if (timer > 0.55) {
          const best = cands.reduce((a, b) => (f(b) < f(a) ? b : a));
          if (f(best) < f(x) - 0.02) {
            pullTo = best;
            phase = 'pull';
            fails = 0;
          } else if (++fails >= 3) {
            x = start();
            fails = 0;
            phase = 'roll';
            trail = [];
          } else {
            phase = 'roll';
            v = rnd(-0.01, 0.01);
          }
          timer = 0;
        }
      } else if (phase === 'pull') {
        x = lerp(x, pullTo, Math.min(1, dt * 8));
        if (timer > 0.35) {
          x = pullTo;
          phase = 'roll';
          timer = 0;
        }
      } else if (timer > 1.4) {
        x = start();
        fails = 0;
        phase = 'roll';
        trail = [];
      }
    },
    draw(ctx) {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = `rgba(${INK},0.55)`;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const xx = -1 + (i / 120) * 2;
        if (i === 0) ctx.moveTo(px(xx), py(xx));
        else ctx.lineTo(px(xx), py(xx));
      }
      ctx.stroke();

      trail.forEach((t, i) => {
        ctx.fillStyle = `rgba(${INK},${(i / trail.length) * 0.25})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y - 3, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });

      if (phase === 'probe') {
        ctx.strokeStyle = `rgba(${ACCENT},0.6)`;
        ctx.fillStyle = `rgba(${ACCENT},0.9)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        cands.forEach((c) => {
          ctx.beginPath();
          ctx.moveTo(px(x), py(x) - 3);
          ctx.lineTo(px(c), py(c) - 1);
          ctx.stroke();
          ctx.fillRect(px(c) - 1.5, py(c) - 2.5, 3, 3);
        });
        ctx.setLineDash([]);
      }

      ctx.fillStyle = phase === 'hold' ? `rgba(${ACCENT},0.95)` : `rgba(${INK},0.9)`;
      ctx.beginPath();
      ctx.arc(px(x), py(x) - 3.5, 3.2, 0, Math.PI * 2);
      ctx.fill();
    },
  };
}

/**
 * NeuroFiLM: an axial brain slice with a tumour. The predicted mask (rust)
 * wobbles loosely around the true tumour with an image-only model, then snaps
 * tight once "the report" is on, which is whenever the cursor is nearby. The
 * tumour follows the cursor.
 */
function neuroScene(W: number, H: number): Scene {
  const cx = 96;
  const cy = H / 2;
  const rx = 40;
  const ry = 25;
  const M = 40;
  const noise = new Array(M).fill(0);
  let t = 0;
  let text = 0;
  let tx = cx + 8;
  let ty = cy - 3;

  return {
    step(dt, pointer, excited) {
      t += dt;
      text = lerp(text, pointer || excited ? 1 : 0, Math.min(1, dt * 4));
      const gxp = pointer ? clamp(pointer.x, cx - rx * 0.5, cx + rx * 0.5) : cx + 12 * Math.cos(t * 0.45);
      const gyp = pointer ? clamp(pointer.y, cy - ry * 0.5, cy + ry * 0.5) : cy + 6 * Math.sin(t * 0.6);
      tx = lerp(tx, gxp, Math.min(1, dt * 3));
      ty = lerp(ty, gyp, Math.min(1, dt * 3));
      for (let i = 0; i < M; i++) noise[i] += -noise[i] * 3 * dt + (Math.random() - 0.5) * Math.sqrt(dt) * 7;
    },
    draw(ctx) {
      ctx.clearRect(0, 0, W, H);

      // report glyph
      ctx.fillStyle = `rgba(${INK},${0.2 + 0.6 * text})`;
      [20, 26, 14, 22].forEach((len, i) => ctx.fillRect(6, 12 + i * 6, len, 1.5));
      ctx.font = '8px ui-sans-serif, system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(${INK},0.5)`;
      ctx.fillText(text > 0.5 ? 'image + text' : 'image only', 4, H - 6);
      ctx.strokeStyle = `rgba(${ACCENT},${text * 0.5})`;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(34, 24);
      ctx.lineTo(cx - rx - 2, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // brain
      ctx.strokeStyle = `rgba(${INK},0.55)`;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(${INK},0.12)`;
      ctx.lineWidth = 1;
      for (const k of [0.72, 0.45]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * k, ry * k, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx, cy - ry + 2);
      ctx.lineTo(cx, cy + ry - 2);
      ctx.stroke();

      // true tumour + predicted mask
      const R = 9;
      const radius = (th: number) => R * (1 + 0.18 * Math.sin(3 * th + t * 0.3) + 0.1 * Math.sin(5 * th - t * 0.2));
      const trace = (r: (i: number, th: number) => number) => {
        ctx.beginPath();
        for (let i = 0; i <= M; i++) {
          const th = (i / M) * Math.PI * 2;
          const rr = r(i % M, th);
          const x = tx + Math.cos(th) * rr;
          const y = ty + Math.sin(th) * rr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      };
      trace((_, th) => radius(th));
      ctx.fillStyle = `rgba(${INK},0.22)`;
      ctx.fill();

      const amp = lerp(1, 0.22, text) * 2.6;
      const bias = 1.4 * (1 - text);
      trace((i, th) => {
        const s = (noise[(i + M - 1) % M] + 2 * noise[i] + noise[(i + 1) % M]) / 4;
        return radius(th) + bias + s * amp;
      });
      ctx.strokeStyle = `rgba(${ACCENT},0.95)`;
      ctx.lineWidth = 1.25;
      ctx.stroke();
    },
  };
}

/**
 * HATCH: an egg wobbles and cracks, then hatches into a small growing
 * associative memory (an outer-product grid, rho = K^T V) that gains one row
 * and column per step. The cursor "warms" the egg so it cracks faster.
 */
function hatchScene(W: number, H: number): Scene {
  const ex = 36;
  const ey = H / 2 + 1;
  const rx = 13;
  const ry = 18;
  const mx = 82;
  const cell = 8;
  const MAXN = 6;
  const my = (H - MAXN * cell) / 2;

  const makeVec = () => Array.from({ length: MAXN }, () => 0.25 + Math.random() * 0.75);
  let kv = makeVec();
  let vv = makeVec();
  let phase = 0;
  let p = 0;
  let tH = 0;
  let n = 0;
  let tn = 0;
  let hold = 0;
  let fade = 1;
  let t = 0;
  const crack = Array.from({ length: 8 }, (_, i) => ({
    x: lerp(-rx * 0.95, rx * 0.95, i / 7),
    y: (i % 2 ? 1 : -1) * rnd(1.5, 4) + 1,
  }));

  return {
    step(dt, pointer, excited) {
      t += dt;
      const warm = pointer ? Math.max(0, 1 - Math.hypot(pointer.x - ex, pointer.y - ey) / 55) : 0;
      if (phase === 0) {
        p += dt * 0.16 * (1 + 3.5 * warm + (excited ? 1 : 0));
        if (p >= 1) {
          phase = 1;
          tH = 0;
          n = 0;
          tn = 0;
          hold = 0;
        }
      } else if (phase === 1) {
        tH = Math.min(1, tH + dt * 2.5);
        tn += dt;
        if (tn > 0.42 && n < MAXN) {
          n++;
          tn = 0;
        }
        if (n >= MAXN) {
          hold += dt;
          if (hold > 1.6) phase = 2;
        }
      } else {
        fade -= dt * 1.6;
        if (fade <= 0) {
          phase = 0;
          p = 0;
          fade = 1;
          kv = makeVec();
          vv = makeVec();
        }
      }
    },
    draw(ctx) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = phase === 2 ? Math.max(0, fade) : 1;

      ctx.save();
      ctx.translate(ex, ey);
      if (phase === 0) ctx.rotate(Math.sin(t * 20) * 0.07 * p * p);
      ctx.strokeStyle = `rgba(${INK},0.7)`;
      ctx.fillStyle = `rgba(${INK},0.05)`;
      ctx.lineWidth = 1.25;
      if (phase === 0) {
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const upTo = p * (crack.length - 1);
        ctx.strokeStyle = `rgba(${ACCENT},0.95)`;
        ctx.beginPath();
        ctx.moveTo(crack[0].x, crack[0].y);
        for (let i = 1; i < crack.length; i++) {
          if (i <= upTo) ctx.lineTo(crack[i].x, crack[i].y);
          else {
            const k = upTo - (i - 1);
            if (k > 0) ctx.lineTo(lerp(crack[i - 1].x, crack[i].x, k), lerp(crack[i - 1].y, crack[i].y, k));
            break;
          }
        }
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(-5 * tH, -6 * tH, rx, ry, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(5 * tH, 5 * tH, rx, ry, 0, 0, Math.PI);
        ctx.stroke();
      }
      ctx.restore();

      if (phase >= 1) {
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            const fresh = (i === n - 1 || j === n - 1) && phase === 1 ? Math.max(0, 1 - tn / 0.42) : 0;
            const val = kv[i] * vv[j];
            ctx.fillStyle = fresh > 0.05 ? `rgba(${ACCENT},${0.4 + 0.55 * fresh})` : `rgba(${INK},${0.15 + 0.7 * val})`;
            ctx.fillRect(mx + j * cell, my + i * cell, cell - 2.5, cell - 2.5);
          }
        }
        ctx.font = '9px ui-sans-serif, system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(${INK},0.5)`;
        ctx.fillText('ρ', mx + MAXN * cell + 2, H / 2);
      }
      ctx.globalAlpha = 1;
    },
  };
}

const SCENES = {
  tandem: tandemScene,
  tempo: tempoScene,
  pulse: pulseScene,
  ppr: pprScene,
  neurofilm: neuroScene,
  hatch: hatchScene,
} as const;
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
