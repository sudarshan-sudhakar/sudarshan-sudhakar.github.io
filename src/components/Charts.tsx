// Tiny dependency-free charts that match the site's paper-and-ink look.

export interface BarRow {
  label: string;
  value: number;
  /** text shown on the right, defaults to the formatted value */
  display?: string;
  /** draw this bar in the "bad news" colour */
  bad?: boolean;
  /** draw this bar muted (a reference/baseline) */
  muted?: boolean;
}

export interface BarChartSpec {
  kind: 'bar';
  title: string;
  caption?: string;
  rows: BarRow[];
}

export interface LineSeries {
  name: string;
  values: number[];
  /** "ink" is the hero line, "soft" and "faint" are the comparison lines */
  tone: 'ink' | 'soft' | 'faint';
  dashed?: boolean;
  /** indices of points that get a printed value */
  labelAt?: number[];
}

export interface LineChartSpec {
  kind: 'line';
  title: string;
  caption?: string;
  xLabels: string[];
  xTitle?: string;
  series: LineSeries[];
  yMin: number;
  yMax: number;
  yTicks: number[];
  /** the y value that counts as "no change" / baseline, drawn as a heavier rule */
  baseline: number;
  baselineLabel?: string;
  /** format a y value for axis ticks and point labels */
  yFormat?: (v: number) => string;
}

export type ChartSpec = BarChartSpec | LineChartSpec;

const INK = '#171717';
const BAD = '#9a3b2e';
const SOFT = '#737373';
const FAINT = '#b5b2a4';

function BarChart({ spec }: { spec: BarChartSpec }) {
  const values = spec.rows.map((r) => r.value);
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  const span = hi - lo || 1;
  const zero = ((0 - lo) / span) * 100;

  return (
    <div className="space-y-3">
      {spec.rows.map((row) => {
        const w = (Math.abs(row.value) / span) * 100;
        const left = row.value >= 0 ? zero : zero - w;
        const color = row.bad ? BAD : row.muted ? FAINT : INK;
        return (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-[11px] sm:text-xs text-neutral-700">
              <span>{row.label}</span>
              <span className="tabular-nums font-medium text-neutral-900 shrink-0">
                {row.display ?? row.value}
              </span>
            </div>
            <div className="relative mt-1 h-3 bg-black/[0.04]">
              <div
                className="absolute top-0 h-full"
                style={{
                  left: `${left}%`,
                  width: `${Math.max(w, 0.6)}%`,
                  background: color,
                }}
              />
              <div className="absolute top-[-3px] bottom-[-3px] w-px bg-neutral-900/60" style={{ left: `${zero}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LineChart({ spec }: { spec: LineChartSpec }) {
  const W = 640;
  const H = 280;
  const pad = { l: 46, r: 18, t: 14, b: 46 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const n = spec.xLabels.length;
  const fmt = spec.yFormat ?? ((v: number) => String(v));

  const x = (i: number) => pad.l + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.t + (1 - (v - spec.yMin) / (spec.yMax - spec.yMin)) * innerH;
  const stroke = (t: LineSeries['tone']) => (t === 'ink' ? INK : t === 'soft' ? SOFT : FAINT);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={spec.title}
        fontFamily="inherit"
      >
        {spec.yTicks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgba(0,0,0,0.08)" />
            <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end" fontSize="11" fill="#737373">
              {fmt(t)}
            </text>
          </g>
        ))}

        <line
          x1={pad.l}
          x2={W - pad.r}
          y1={y(spec.baseline)}
          y2={y(spec.baseline)}
          stroke="rgba(23,23,23,0.55)"
          strokeWidth="1.25"
        />
        {spec.baselineLabel && (
          <text x={W - pad.r} y={y(spec.baseline) - 6} textAnchor="end" fontSize="10.5" fill="#525252">
            {spec.baselineLabel}
          </text>
        )}

        {spec.xLabels.map((label, i) => (
          <text key={label} x={x(i)} y={H - pad.b + 18} textAnchor="middle" fontSize="11" fill="#737373">
            {label}
          </text>
        ))}
        {spec.xTitle && (
          <text x={pad.l + innerW / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#525252">
            {spec.xTitle}
          </text>
        )}

        {spec.series.map((s) => (
          <g key={s.name}>
            <polyline
              fill="none"
              stroke={stroke(s.tone)}
              strokeWidth={s.tone === 'ink' ? 2.25 : 1.75}
              strokeDasharray={s.dashed ? '5 4' : undefined}
              strokeLinejoin="round"
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            />
            {s.values.map((v, i) => (
              <g key={i}>
                <circle cx={x(i)} cy={y(v)} r={s.tone === 'ink' ? 3.5 : 2.75} fill={stroke(s.tone)}>
                  <title>{`${s.name} @ ${spec.xLabels[i]}: ${fmt(v)}`}</title>
                </circle>
                {s.labelAt?.includes(i) && (
                  <text
                    x={x(i)}
                    y={y(v) + (v >= spec.baseline ? -9 : 17)}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={stroke(s.tone)}
                  >
                    {fmt(v)}
                  </text>
                )}
              </g>
            ))}
          </g>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] sm:text-xs text-neutral-600">
        {spec.series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-2">
            <svg width="22" height="8" aria-hidden="true">
              <line
                x1="0"
                x2="22"
                y1="4"
                y2="4"
                stroke={stroke(s.tone)}
                strokeWidth="2.25"
                strokeDasharray={s.dashed ? '4 3' : undefined}
              />
            </svg>
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Chart({ spec }: { spec: ChartSpec }) {
  return (
    <figure>
      <figcaption className="text-[11px] sm:text-xs uppercase tracking-[0.15em] text-neutral-500 mb-3">
        {spec.title}
      </figcaption>
      {spec.kind === 'bar' ? <BarChart spec={spec} /> : <LineChart spec={spec} />}
      {spec.caption && (
        <p className="mt-3 text-[11px] sm:text-xs leading-relaxed text-neutral-500">{spec.caption}</p>
      )}
    </figure>
  );
}
