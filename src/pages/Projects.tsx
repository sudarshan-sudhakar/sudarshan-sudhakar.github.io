import { useState } from 'react';
import Nav from '../components/Nav';
import { Chart, type ChartSpec } from '../components/Charts';

interface MetricRow {
  label: string;
  a: string;
  b: string;
}

interface MetricGroup {
  section: string;
  columns: [string, string];
  rows: MetricRow[];
}

interface Project {
  title: string;
  tagline: string;
  repo: string;
  description: string;
  status?: string;
  headline?: { value: string; label: string };
  tags: string[];
  image?: { src: string; alt: string };
  charts?: ChartSpec[];
  metrics?: MetricGroup[];
}

const tandem: Project = {
  title: 'TANDEM — Joint Data & Compute Placement for Multimodal KV Caches',
  tagline: 'What if the memory could decide where your data lives and where it gets computed, at the same time?',
  repo: 'https://github.com/sxdxde/TANDEM',
    headline: { value: '−22%', label: 'energy vs static tiering' },
    tags: ['Simulation', 'Computer Architecture', 'VLMs'],
  description:
    "A VLM re-reads its whole KV cache for every word it writes, so that cache ends up hogging the memory bus. TANDEM is a simulated two-tier memory that decides on the fly where each entry lives and where each read gets computed.\n\nOn real attention traces it uses ~22% less energy than static tiering at the same quality, and under contention it moves 11.8× fewer bus bytes than a flat memory. It doesn't win everywhere though: sparse reads give nothing, and random access can cost up to +82% energy. It's all simulated, so the ratios matter more than the absolute numbers.",
  charts: [
    {
      kind: 'bar',
      title: 'Energy vs static tiering — where dynamic placement wins, and where it doesn’t',
      rows: [
        { label: 'Dense reads, SmolVLM-256M', value: -22.3, display: '−22.3%' },
        { label: 'Dense reads, SmolVLM-500M', value: -23.4, display: '−23.4%' },
        { label: 'Dense reads, bottom-up migration cost', value: -27.4, display: '−27.4%' },
        { label: 'Noisy / stale importance signal (weakest case)', value: -18.6, display: '−18.6%' },
        { label: 'One importance score per token', value: -7.6, display: '−7.6%' },
        { label: 'Sparse (top-10%) reads', value: 0, display: 'no win', muted: true },
        { label: 'Random access, no reuse gate', value: 81.9, display: '+81.9%', bad: true },
        { label: 'Random access, with reuse gate', value: 1.1, display: '+1.1%', bad: true },
      ],
      caption:
        'Negative means dynamic placement uses less energy than static modality tiering. 10× migration cost unless noted; random access means only 3% of entries are read. Quality stays about neutral for the dense cases.',
    },
    {
      kind: 'line',
      title: 'How expensive can moving data get before it stops paying off?',
      xLabels: ['1×', '2×', '5×', '10×', '20×', '50×'],
      xTitle: 'Migration cost, as a multiple of the bottom-up estimate (≈1.05 HOT accesses)',
      yMin: -32,
      yMax: 8,
      yTicks: [-30, -20, -10, 0],
      baseline: 0,
      baselineLabel: 'static tiering = 0%',
      yFormat: (v) => (v > 0 ? `+${v}%` : v < 0 ? `−${Math.abs(v)}%` : '0%'),
      series: [
        {
          name: 'Dynamic vs static (dense reads, energy)',
          tone: 'ink',
          values: [-28.1, -27.5, -25.5, -22.3, -15.9, 3.3],
          labelAt: [0, 3, 4, 5],
        },
      ],
      caption:
        'The saving shrinks as migrations get pricier and flips around 45× the bottom-up cost, which lines up with the ~50× break-even from the earlier cost model. So there’s plenty of headroom, but it isn’t unlimited.',
    },
    {
      kind: 'line',
      title: 'Where should a read be computed? Makespan vs flat memory',
      xLabels: ['2', '4', '8', '16', '32', '64'],
      xTitle: 'Compute-in-memory units available',
      yMin: 0,
      yMax: 5.2,
      yTicks: [0, 1, 2, 3, 4, 5],
      baseline: 1,
      baselineLabel: 'flat memory = 1×',
      yFormat: (v) => `${v}×`,
      series: [
        {
          name: 'Always compute in memory',
          tone: 'soft',
          dashed: true,
          values: [4.98, 2.5, 1.25, 0.64, 0.33, 0.18],
          labelAt: [0, 1, 2],
        },
        {
          name: 'Always send to host',
          tone: 'faint',
          dashed: true,
          values: [0.92, 0.92, 0.92, 0.92, 0.92, 0.92],
        },
        {
          name: 'Adaptive spill scheduler',
          tone: 'ink',
          values: [0.88, 0.76, 0.6, 0.42, 0.27, 0.15],
          labelAt: [3],
        },
      ],
      caption:
        'Lower is faster. With only 2 CIM units, always computing in memory is ~5× slower than a flat memory. The adaptive scheduler is better than both fixed choices at every size, because it spills work to the host only when the memory units are backed up.',
    },
    {
      kind: 'bar',
      title: 'Does it hurt the real model? Next-token distribution shift (KL, dynamic = 1×)',
      rows: [
        { label: 'TANDEM dynamic placement', value: 1, display: '1×' },
        { label: 'Static modality tiering', value: 1.28, display: '≈1.28×', muted: true },
        { label: 'Random placement, same amount of INT4', value: 9.4, display: '9.4×', bad: true },
      ],
      caption:
        'INT4 applied inside the real model, 42 images. Lower means the model’s output moves less. The static figure is back-calculated from the measured 21.8% lower KL, so treat it as approximate.',
    },
  ],
  metrics: [
    {
      section: 'Tiering vs flat memory, under contention (default resources)',
      columns: ['Flat memory', 'Tiered'],
      rows: [
        { label: 'Bus bytes moved', a: '1×', b: '0.085× (11.8× fewer)' },
        { label: 'Energy', a: '1×', b: '≈0.11× (9.3× less)' },
        { label: 'Makespan', a: '1×', b: '0.64×' },
      ],
    },
  ],
};

const projects: Project[] = [
  tandem,
  {
    title: 'NeuroFiLM — Text-Guided Brain Tumor Segmentation on Apple Silicon',
    tagline: 'Can a radiology report steer a tiny U-Net, trained entirely on a laptop?',
    repo: 'https://github.com/sxdxde/neurofilm-brats',
    headline: { value: '0.855', label: 'Dice on held-out slices' },
    tags: ['PyTorch', 'Medical Imaging', 'Apple Silicon'],
    description:
      "A tiny 8.78M-parameter U-Net that reads a radiology report alongside a brain MRI to segment tumors, trained entirely on a MacBook with no CUDA. The report is encoded once by a frozen CLIP and fed in through FiLM layers, which adds just 17.9k parameters.\n\nResult: Dice 0.855 on 5,504 held-out slices. The honest catch: text and image-only tie on Dice. The text just shifts the precision/recall balance.",
    image: {
      src: '/images/publication/quality-adaptive-loss/segmentation_examples.png',
      alt: 'Example brain tumor segmentation results',
    },
    metrics: [
      {
        section: 'Held-out test set (56 patients, 5,504 slices)',
        columns: ['Image-only', 'FiLM + CLIP'],
        rows: [
          { label: 'Dice', a: '0.8556', b: '0.8554' },
          { label: 'Precision', a: '0.9256', b: '0.9365' },
          { label: 'Recall', a: '0.8740', b: '0.8632' },
        ],
      },
    ],
  },
  {
    title: 'HATCH — Hebbian Associative-memory Test for Cross-modal Grounding',
    tagline:
      "Does the Dragon Hatchling (BDH) architecture hatch into a usable drop-in replacement for softmax attention?",
    repo: 'https://github.com/sxdxde/HATCH-Hebbian-Associative-memory-Test-for-Cross-modal-grounding',
    headline: { value: '65.1', label: 'AP50 vs 64.9 baseline' },
    tags: ['Attention', 'Visual Grounding'],
    description:
      "Swaps BDH's growing outer-product memory in for softmax attention in two visual grounding models, tested on Talk2Car.\n\nIt works as a near drop-in for cross-attention (AP50 65.09 vs 64.92, ~1% more parameters), but drops to roughly half the baseline's accuracy when it replaces dense self-attention over long visual sequences.",
    metrics: [
      {
        section: 'Phase 1 — AttnGrounder cross-attention swap (Talk2Car val, n=1163)',
        columns: ['Baseline', 'BDH'],
        rows: [
          { label: 'AP50 (all)', a: '64.92', b: '65.09' },
          { label: 'AP50 (ambiguous scenes)', a: '63.37', b: '63.98' },
          { label: 'Params', a: '75.84M', b: '76.63M (+1.0%)' },
          { label: 'Inference time', a: '—', b: '+12.5%' },
        ],
      },
      {
        section: 'Phase 2 — TransVG self-attention swap',
        columns: ['Baseline', 'BDH'],
        rows: [{ label: 'Best val accuracy @ IoU 0.5', a: '55.20%', b: '26.23%' }],
      },
    ],
  },
  {
    title: 'PULSE — Pain, Understanding & Learning State Engine',
    tagline: 'What if a reinforcement learning agent had skin?',
    repo: 'https://github.com/sxdxde/PULSE-Pain-Understanding-Learning-State-Engine',
    tags: ['Reinforcement Learning', 'PPO'],
    status: 'In Progress',
    description:
      "Normal RL rewards forget instantly. PULSE gives an agent a persistent \"skin\": a grid that stores pain from bad experiences and fades slowly, so danger zones stay avoided across episodes. The policy only vetoes moves into cells that are both painful and genuinely risky.\n\nNow benchmarking 3 agents × 5 seeds against vanilla PPO on reward, goal success and trap rate.",
  },
  {
    title: 'PPR — Probe-Pull-Restart',
    tagline: 'A momentum optimizer that fires cheap trial moves when training stalls, and rolls back when they fail.',
    repo: 'https://github.com/sxdxde/PPR---Probe-Pull-Restart',
    headline: { value: '½', label: 'the loss on Rastrigin' },
    tags: ['Optimization', 'PyTorch'],
    status: 'In Progress',
    description:
      "An SGD-with-momentum optimizer that fires cheap trial moves when training stalls, and rolls back to the best checkpoint if they fail.\n\nIt only really helps on low-dimensional non-convex landscapes (halves the converged loss on Rastrigin). On MNIST it just matches SGD. I also retracted an earlier batch of results after finding a missing loss.backward(), and kept that on the record.",
    metrics: [
      {
        section: 'Rastrigin, low-dimensional synthetic landscape (2-D / 5-D, 8 seeds)',
        columns: ['Momentum', 'PPR'],
        rows: [{ label: 'Converged loss', a: '1×', b: '~0.5× (halved)' }],
      },
      {
        section: 'Probe success rate by direction strategy (up to 15,000 params)',
        columns: ['Random / grad-based', 'coord_align'],
        rows: [
          { label: 'Probe success rate', a: '0% (collapses by 20-D)', b: '42–99%' },
          { label: 'Loss improvement at 15k-D', a: '—', b: '~0.03%' },
        ],
      },
      {
        section: 'Real network parity — MNIST, mini-batch (post-fix)',
        columns: ['SGD baseline', 'PPR'],
        rows: [{ label: 'Accuracy', a: '97.74%', b: '97.75%' }],
      },
      {
        section: 'Stress test — high LR + 20% label noise (digits)',
        columns: ['Baselines', 'PPR'],
        rows: [{ label: 'Accuracy (~10% random floor)', a: '10–14%', b: '17.5%' }],
      },
    ],
  },
  {
    title: 'TEMPO — Timing Engine for Micro-batch Policy Optimization',
    tagline: 'When should a GPU stop waiting and start serving?',
    repo: 'https://github.com/sxdxde/RESEARCH-Smart-Caching-using-Deep-Reinforment-Learning-',
    headline: { value: '9×', label: 'reward at peak load' },
    tags: ['Reinforcement Learning', 'Systems'],
    description:
      "An inference server has to decide when to dispatch queued requests: too early wastes the GPU, too late breaks the latency SLA. TEMPO trains a PPO agent to choose Wait or Serve every 10 ms.\n\nAt peak load (5,000 req/s) it earns ~9× the reward of a Cloudflare-style heuristic while keeping P95 latency at 92 ms. At normal load it only ties, and off-peak it's the weakest, so the win is really about heavy traffic.",
    metrics: [
      {
        section: 'Peak load — 5,000 req/s',
        columns: ['Cloudflare heuristic', 'PPO'],
        rows: [
          { label: 'Mean episode reward', a: '74k', b: '681k' },
          { label: 'P95 total latency (SLA 500 ms)', a: '435 ms', b: '92 ms' },
          { label: 'Avg batch size', a: '220', b: '424' },
        ],
      },
      {
        section: 'Standard load — 2,000 req/s',
        columns: ['Cloudflare heuristic', 'PPO'],
        rows: [
          { label: 'Mean episode reward', a: '226k', b: '223k' },
          { label: 'P95 total latency (SLA 500 ms)', a: '111 ms', b: '70 ms' },
          { label: 'Avg batch size', a: '248', b: '184' },
        ],
      },
      {
        section: 'Off-peak load — 400 req/s',
        columns: ['Cloudflare heuristic', 'PPO'],
        rows: [
          { label: 'Mean episode reward', a: '23k', b: '-6k' },
          { label: 'P95 total latency (SLA 500 ms)', a: '76 ms', b: '154 ms' },
          { label: 'Avg batch size', a: '34', b: '55' },
        ],
      },
    ],
  },
];

function MetricTable({ group }: { group: MetricGroup }) {
  return (
    <div>
      <p className="text-[11px] sm:text-xs uppercase tracking-[0.15em] text-neutral-500 mb-2">
        {group.section}
      </p>
      <table className="w-full text-xs sm:text-sm border-collapse">
        <thead>
          <tr className="text-neutral-500">
            <th className="text-left font-normal py-1.5 border-b border-black/10" />
            <th className="text-left font-normal py-1.5 border-b border-black/10">{group.columns[0]}</th>
            <th className="text-left font-normal py-1.5 border-b border-black/10">{group.columns[1]}</th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row) => (
            <tr key={row.label} className="text-neutral-700">
              <td className="py-1.5 pr-4 border-b border-black/5">{row.label}</td>
              <td className="py-1.5 pr-4 border-b border-black/5">{row.a}</td>
              <td className="py-1.5 border-b border-black/5 font-medium text-neutral-900">{row.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Headline({ project, className = '' }: { project: Project; className?: string }) {
  if (!project.headline) return null;
  return (
    <div className={className}>
      <span className="text-2xl sm:text-3xl font-bold leading-none text-neutral-900 tabular-nums">
        {project.headline.value}
      </span>
      <span className="block mt-1 text-[10px] sm:text-[11px] leading-tight text-neutral-500">
        {project.headline.label}
      </span>
    </div>
  );
}

function Projects() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState<Set<number>>(new Set());

  const toggleMore = (index: number) =>
    setMoreOpen((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <div className="relative min-h-screen w-full bg-[#EEECE1] px-6 py-16 sm:px-8 sm:py-24">
      <Nav />
      <div className="max-w-[720px] mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold mt-6 mb-8 sm:mb-10 text-neutral-900">Projects</h1>

        <div className="divide-y divide-black/10 border-t border-b border-black/10">
          {projects.map((project, index) => {
            const isOpen = openIndex === index;
            const showMore = moreOpen.has(index);

            // One thing up front, everything else tucked behind "More results".
            const charts = project.charts ?? [];
            const metrics = project.metrics ?? [];
            const heroChart = charts[0];
            const heroMetric = heroChart ? undefined : metrics[0];
            const moreCharts = charts.slice(1);
            const moreMetrics = heroChart ? metrics : metrics.slice(1);
            const hasMore = moreCharts.length + moreMetrics.length > 0;

            return (
              <div key={project.title}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="w-full text-left flex items-start justify-between gap-4 py-5 cursor-pointer group"
                >
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors">
                      {project.title}
                      {project.status && (
                        <span className="ml-2 align-middle text-[10px] uppercase tracking-wider text-neutral-500 border border-black/15 px-1.5 py-0.5">
                          {project.status}
                        </span>
                      )}
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 leading-relaxed">{project.tagline}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] sm:text-[11px] text-neutral-600 border border-black/10 px-1.5 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Headline project={project} className="mt-3 sm:hidden" />
                  </div>
                  <div className="shrink-0 flex items-start gap-4">
                    <Headline project={project} className="hidden sm:block text-right max-w-[110px]" />
                    <span
                      className={`mt-1 text-xl leading-none text-neutral-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-45' : ''
                      }`}
                    >
                      +
                    </span>
                  </div>
                </button>

                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="pb-6 space-y-6">
                      <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-line">
                        {project.description}
                      </p>

                      {project.image && (
                        <img
                          src={project.image.src}
                          alt={project.image.alt}
                          loading="lazy"
                          className="w-full border border-black/10"
                        />
                      )}

                      {heroChart && <Chart spec={heroChart} />}
                      {heroMetric && <MetricTable group={heroMetric} />}

                      {hasMore && (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleMore(index)}
                            aria-expanded={showMore}
                            className="text-xs sm:text-sm text-neutral-900 underline underline-offset-4 hover:text-neutral-600 transition-colors cursor-pointer"
                          >
                            {showMore ? 'Hide extra results' : 'More results'}
                          </button>
                          {showMore && (
                            <div className="mt-6 space-y-8">
                              {moreCharts.map((chart) => (
                                <Chart key={chart.title} spec={chart} />
                              ))}
                              {moreMetrics.map((group) => (
                                <MetricTable key={group.section} group={group} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <a
                        href={project.repo}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs sm:text-sm underline underline-offset-4 text-neutral-900 hover:text-neutral-600 transition-colors"
                      >
                        View on GitHub &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Projects;
