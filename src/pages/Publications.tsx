import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Publication {
  title: string;
  venue: string;
  status: string;
  abstract: string;
  figure?: { src: string; alt: string; caption: string };
}

const publications: Publication[] = [
  {
    title: 'Learning with Quality-Adaptive Loss for Skin Lesion Classification',
    venue: 'Submitted at INDICON 2026',
    status: 'Under Review',
    abstract:
      "Image quality varies widely in clinical practice, yet most quality-aware training methods cannot observe it directly and instead estimate it from image statistics, since expert quality ratings are rarely recorded alongside diagnosis labels. This paper introduces a quality-adaptive loss function that scales each sample's training loss using a real, expert-assigned quality rating as an input to the loss, rather than to the classifier. Up-weighting low-quality samples outperformed down-weighting, improving balanced accuracy by 0.037 and sensitivity by 0.092 over baseline, a gain a shuffled-quality control confirms depends on real quality information rather than reweighting alone. The full pipeline reaches 0.840 balanced accuracy versus 0.810 without the quality-adaptive loss, with about 65% of the total gain attributable to it alone. The paper also includes an ablation study that reversed two seemingly positive findings under closer scrutiny.",
    figure: {
      src: '/images/publication/quality-adaptive-loss/hard_vs_nonhard_gradcam.png',
      alt: 'Grad-CAM heatmaps comparing baseline and quality-adaptive loss predictions on high-quality and low-quality skin lesion images',
      caption:
        'Grad-CAM on higher-quality (top) and lower-quality (bottom) images. The quality-adaptive loss corrects predictions on harder, low-quality samples.',
    },
  },
];

function Publications() {
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
          Publications
        </h1>

        <div className="divide-y divide-black/10 border-t border-b border-black/10">
          {publications.map((pub, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={pub.title}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="w-full text-left flex items-start justify-between gap-4 py-5 cursor-pointer group"
                >
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors">
                      {pub.title}
                      <span className="ml-2 align-middle text-[10px] uppercase tracking-wider text-neutral-500 border border-black/15 px-1.5 py-0.5">
                        {pub.status}
                      </span>
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                      {pub.venue}
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
                    <div className="pb-6 space-y-3">
                      <p className="text-[11px] sm:text-xs uppercase tracking-[0.15em] text-neutral-500">
                        Abstract
                      </p>
                      <p className="text-sm leading-relaxed text-neutral-600">{pub.abstract}</p>
                      {pub.figure && (
                        <figure className="pt-3">
                          <img
                            src={pub.figure.src}
                            alt={pub.figure.alt}
                            loading="lazy"
                            className="w-full max-w-[480px] mx-auto border border-black/10 bg-white"
                          />
                          <figcaption className="mt-2 text-xs text-neutral-500 leading-relaxed">
                            {pub.figure.caption}
                          </figcaption>
                        </figure>
                      )}
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

export default Publications;
