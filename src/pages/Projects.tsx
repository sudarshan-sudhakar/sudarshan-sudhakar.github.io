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
  image?: { src: string; alt: string };
  charts?: ChartSpec[];
  metrics?: MetricGroup[];
}

const tandem: Project = {
  title: 'TANDEM — Tiered, Adaptive, Near-memory Data-and-compute placement for Efficient Multimodal KV caches',
  tagline: 'What if the memory could decide where your data lives and where it gets computed, at the same time?',
  repo: 'https://github.com/sxdxde/TANDEM',
  description:
    "Here's the problem: a vision-language model turns one image into hundreds of visual tokens, and then every single word it writes has to re-read all of their key-value (KV) entries, in every layer. So during decoding, that cache is basically what the memory bus spends its whole life on. TANDEM asks if a runtime can be smarter about it by making two calls together: where each KV entry should live, and where each read should actually be computed.\n\nThe memory has two tiers. HOT is regular FP16 DRAM/HBM, lossless. WARM is INT4 sitting in compute-in-memory arrays: about 10× cheaper per byte, a bit slower, and lossy. A monitor watches how important and how reused each (token, layer) entry really is, then promotes or demotes entries on the fly, knowing every move costs time, energy and bus traffic. A separate scheduler decides whether a WARM read runs inside the memory or gets pulled out to the host, depending on how backed up things are.\n\nIt's a SimPy simulation (3,402 runs in the contention study) driven by real attention traces from SmolVLM-256M and 500M on 42 images, with leave-one-trace-out cross-validation and bootstrap confidence intervals. It started as a Computer Architecture course project at IIITDM Kancheepuram.\n\nWhat worked: when data actually gets reused, dynamic placement uses about 22–23% less energy than static tiering at neutral quality. Put INT4 inside the real model and it nudges the next-token distribution ~22% less than static tiering, and ~9× less than random placement of the same size. Under contention, tiering moves 11.8× fewer bus bytes than a flat memory and finishes in 0.64× the time, and the adaptive spill scheduler beats both \"always compute in memory\" and \"always send it to the host\".\n\nWhat didn't, and I kept it all in the paper: the first synthetic-trace win vanished on real attention (visual tokens only get ~6% of it), the win isn't just a layer prior, it disappears under sparse reads, and one importance score per token only gets you −7.6%. Under random access, dynamic placement can burn up to +82% more energy unless migrations are priced against observed reuse, and even with that gate it missed my own pre-set target. Also, there's no real CIM hardware here, so the absolute energy numbers aren't hardware claims. The ratios between policies are the point.",
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
    description:
      "A lightweight FiLM-conditioned U-Net (8.78M parameters) that fuses FLAIR MRI with radiology reports on BraTS 2020 for whole-tumor segmentation, trained entirely on a MacBook Pro M1 Pro using PyTorch MPS — no CUDA.\n\nMain novelty: the report is encoded once by a frozen CLIP ViT-B/32 text encoder and cached, then injected through FiLM layers (a learned per-channel scale and shift, zero-initialised so the text pathway must earn its effect) at the bottleneck and all four decoder stages. Text conditioning costs only 17.9k parameters, and keeping the 63M-parameter text transformer out of the training loop is what makes laptop training feasible. The image-only baseline is the same network with the embedding zeroed, so any difference is attributable to text alone.\n\nHeadline result: Dice 0.855 and precision 0.937 on 5,504 held-out slices (patient-level split), with 82% of slices above Dice 0.8. Reported honestly: text and image-only tie on Dice — conditioning shifts the precision/recall trade-off (+1.1pp precision, −1.1pp recall) rather than overlap, with a negligible effect size.",
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
    description:
      "Swaps BDH's explicit, growing outer-product memory (ρ = Kᵀ·V) into two visual grounding architectures — AttnGrounder (CNN + cross-attention) and TransVG (transformer self-attention) — and evaluates both against their softmax-attention baselines on Talk2Car, a natural-language object-grounding benchmark for autonomous driving commands.\n\nHeadline result: BDH is a viable, near-drop-in replacement for narrow, well-scoped cross-attention (comparable-to-modestly-better AP50, ~1% param overhead) — but this does not generalize to dense self-attention over long, visual-token-dominated sequences, where it lands at roughly half the baseline's accuracy.",
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
    status: 'In Progress',
    description:
      "Standard RL reward signals are stateless — they fire once on entry to a bad state and leave no trace. PULSE instead gives the agent a persistent, spatial, time-varying internal state: a learnable Slab (grid of vectors) that accumulates deformation from harmful experiences and fades slowly over time, so pain compounds around known danger zones instead of resetting each episode.\n\nA ResistanceField adds jelly-like viscosity around traps the agent feels before entering, and a PainShapedPolicy vetoes actions whose target cell exceeds a learned aversion threshold — reading pain × physical risk as an AND gate, so only confirmed personal suffering in a genuinely dangerous location gets filtered.\n\nCurrently in Phase 6: a 3-agent × 5-seed convergence benchmark testing whether this embodied pain system makes agents converge faster and avoid danger more reliably than vanilla PPO, evaluated jointly on reward, goal-success rate, and trap rate, with Cohen's d for effect size given the small seed count.",
  },
  {
    title: 'PPR — Probe-Pull-Restart',
    tagline: 'A momentum optimizer that fires cheap trial moves when training stalls, and rolls back when they fail.',
    repo: 'https://github.com/sxdxde/PPR---Probe-Pull-Restart',
    status: 'In Progress',
    description:
      "A PyTorch torch.optim.Optimizer that augments SGD-with-momentum with two add-on mechanisms for escaping bad loss basins: tentacle probing (cheap trial moves fired when training stalls, steering toward any lower-loss spot found) and reincarnation (rolling back to the best checkpoint plus jitter when repeated probing fails).\n\nHeadline result: PPR is neutral-to-matching on tasks the base optimizer already handles well (MNIST, digits), and shows a genuine, reproducible improvement only in one tested regime — low-dimensional non-convex synthetic landscapes (Rastrigin, ≤5-D). The original probing direction (random or gradient-based) was found to collapse to 0% success past ~20 dimensions; coord_align — probing one coordinate at a time — fixes this mechanically, restoring 42–99% probe success up to 15,000 parameters, though the absolute effect at that scale is small.\n\nOne earlier batch of MNIST results was fully retracted after discovering a missing loss.backward() call had trained PPR on zero gradients throughout — kept on the record rather than quietly deleted.",
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
    description:
      "An inference server gets a constant stream of requests, and dispatching them in a batch is a trade-off: serve too early and tiny batches waste GPU capacity; wait too long and clients blow their latency SLA. TEMPO trains a PPO agent that decides every 10 ms whether to Wait or Serve the queued requests.\n\nThe agent observes a 7-dimensional state (queue size, oldest wait, EMA arrival rate, time since last dispatch, batch fill ratio, time of day, and an urgency ratio that folds GPU processing time into the SLA budget) and is rewarded for throughput while being penalised for latency and SLA violations. It is benchmarked against a Cloudflare-style dual-threshold heuristic, alongside Discrete SAC and D3QN agents, on total client-perceived latency (queue wait + GPU time) against a 500 ms SLA, and ships with a drop-in deployment middleware.\n\nHeadline result: the learned policy matters most under load. At peak traffic (5,000 req/s) PPO earns roughly 9× the reward of the fixed heuristic while holding P95 latency at ~92 ms, because it grows its batches to ~424 requests where the heuristic averages ~220 and its P95 climbs to 435 ms, close to the SLA. At the standard 2,000 req/s the gap closes: PPO matches the heuristic's reward with lower P95 latency, but with a heavier P99 tail, and it does not beat it outright. At off-peak traffic (400 req/s) PPO is the weakest of the four agents. D3QN was competitive with PPO at peak load, so the win is for learned batching in general, not PPO specifically.\n\nThe learned decision boundary is curved, not the two straight lines of the heuristic: the agent holds off on small queues and shifts its dispatch threshold with time since the last dispatch and the wait of the oldest request.",
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

function Projects() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="relative min-h-screen w-full bg-[#EEECE1] px-6 py-16 sm:px-8 sm:py-24">
      <Nav />
      <div className="max-w-[720px] mx-auto">

        <h1 className="text-2xl sm:text-4xl font-bold mt-6 mb-8 sm:mb-10 text-neutral-900">
          Projects
        </h1>

        <div className="divide-y divide-black/10 border-t border-b border-black/10">
          {projects.map((project, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={project.title}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="w-full text-left flex items-start justify-between gap-4 py-5 cursor-pointer group"
                >
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors">
                      {project.title}
                      {project.status && (
                        <span className="ml-2 align-middle text-[10px] uppercase tracking-wider text-neutral-500 border border-black/15 px-1.5 py-0.5">
                          {project.status}
                        </span>
                      )}
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                      {project.tagline}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 mt-1 text-xl leading-none text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''
                      }`}
                  >
                    +
                  </span>
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

                      {project.charts?.map((chart) => (
                        <Chart key={chart.title} spec={chart} />
                      ))}

                      {project.metrics?.map((group) => (
                        <div key={group.section}>
                          <p className="text-[11px] sm:text-xs uppercase tracking-[0.15em] text-neutral-500 mb-2">
                            {group.section}
                          </p>
                          <table className="w-full text-xs sm:text-sm border-collapse">
                            <thead>
                              <tr className="text-neutral-500">
                                <th className="text-left font-normal py-1.5 border-b border-black/10" />
                                <th className="text-left font-normal py-1.5 border-b border-black/10">
                                  {group.columns[0]}
                                </th>
                                <th className="text-left font-normal py-1.5 border-b border-black/10">
                                  {group.columns[1]}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.rows.map((row) => (
                                <tr key={row.label} className="text-neutral-700">
                                  <td className="py-1.5 pr-4 border-b border-black/5">{row.label}</td>
                                  <td className="py-1.5 pr-4 border-b border-black/5">{row.a}</td>
                                  <td className="py-1.5 border-b border-black/5 font-medium text-neutral-900">
                                    {row.b}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}

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
