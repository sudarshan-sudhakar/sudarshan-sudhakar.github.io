import { useState } from 'react';
import { Link } from 'react-router-dom';

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
  metrics?: MetricGroup[];
}

const projects: Project[] = [
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
];

function Projects() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen w-full bg-[#EEECE1] px-6 py-16 sm:px-8 sm:py-24">
      <div className="max-w-[720px] mx-auto">
        <Link
          to="/"
          className="text-xs sm:text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-800 transition-colors"
        >
          &larr; Back
        </Link>

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
