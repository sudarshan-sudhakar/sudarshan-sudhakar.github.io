import { useState } from 'react';
import Nav from '../components/Nav';

interface Publication {
  title: string;
  venue: string;
  status: string;
  authors: string;
  affiliation: string;
  sections: { heading: string; body: string }[];
  tools: string;
  links: { label: string; href: string }[];
  figure?: { src: string; alt: string; caption: string };
}

const publications: Publication[] = [
  {
    title: 'Learning with Quality-Adaptive Loss for Skin Lesion Classification',
    venue:
      'First-author research paper, accepted at the 23rd Edition of the IEEE India Council International Conference (INDICON 2026)',
    status: 'Accepted',
    authors: 'Sudarshan Sudhakar, Aishwarya N, Umarani Jayaraman',
    affiliation: 'Indian Institute of Information Technology, Design and Manufacturing, Chennai',
    sections: [
      {
        heading: 'Overview',
        body: 'Medical images vary widely in quality because of lighting, focus, framing and hair occlusion, yet most training pipelines treat every image as equally informative. This project introduces a quality-adaptive loss function for skin lesion classification. It uses the quality ratings given by dermatology experts to decide how much each training image influences the model. It is my first research paper, and my first as lead author.',
      },
      {
        heading: 'Motivation',
        body: "Quality-aware training methods usually have to estimate image quality from the image itself, because no human judgement has been recorded. MCR-SL changes this. It is the only public skin lesion dataset that records an expert quality rating (1–10) for each lesion's diagnostic image. That made it possible to use real expert judgement as a training signal, not an estimate.",
      },
      {
        heading: 'Approach',
        body: 'The proposed loss function weights each sample by its expert quality rating. Lower-quality dermoscopic images receive a higher weight, because a degraded image still carries a valid diagnosis and acts as a hard example for the model. The classifier combines an EfficientNet-B0 image encoder with a metadata encoder through channel-gated fusion. Evaluation used subject-disjoint stratified 5-fold cross-validation, so no patient appears in both training and test sets.',
      },
      {
        heading: 'Results',
        body: 'On the binary malignant versus non-malignant task, the loss alone raised balanced accuracy from 0.783 to 0.820 and sensitivity from 0.672 to 0.764. Adding test-time augmentation and multi-image averaging brings the full pipeline to 0.840 balanced accuracy. This is comparable to the 0.836 reported by the DiffMIC architecture on PAD-UFES-20, a dataset of 2,298 images, whereas this work used only 240 lesions, of which 17.9% are malignant. Attention maps show that the model focuses on the lesion itself in low-quality cases it previously misclassified.',
      },
      {
        heading: 'Significance',
        body: 'The work establishes the first published benchmark on MCR-SL. It also shows that, on small and heavily imbalanced medical datasets, changing how samples are weighted during training can be an effective alternative to a more complex architecture. The paper reports the findings that did not hold up under closer scrutiny alongside those that did.',
      },
    ],
    tools: 'Python, PyTorch, timm, scikit-learn, Grad-CAM, matplotlib; trained on an NVIDIA A100',
    links: [
      {
        label: 'Code: github.com/sxdxde/Learning-with-Quality-Adaptive-Loss-for-Skin-Lesion-Classification',
        href: 'https://github.com/sxdxde/Learning-with-Quality-Adaptive-Loss-for-Skin-Lesion-Classification',
      },
    ],
    figure: {
      src: '/images/publication/quality-adaptive-loss/linkedin_gradcam_before_after.png',
      alt: 'Grad-CAM heatmaps before and after the quality-adaptive loss on low-quality skin lesion images',
      caption:
        'Grad-CAM before and after the quality-adaptive loss: on low-quality cases the model previously misclassified, attention moves onto the lesion itself.',
    },
  },
];

function Publications() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="relative min-h-screen w-full bg-[#EEECE1] px-6 py-16 sm:px-8 sm:py-24">
      <Nav />
      <div className="max-w-[720px] mx-auto">

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
                    <div className="pb-6 space-y-4">
                      <div className="text-sm leading-relaxed text-neutral-600">
                        <p className="font-medium text-neutral-800">{pub.authors}</p>
                        <p>{pub.affiliation}</p>
                      </div>
                      {pub.sections.map((section) => (
                        <div key={section.heading} className="space-y-1.5">
                          <p className="text-[11px] sm:text-xs uppercase tracking-[0.15em] text-neutral-500">
                            {section.heading}
                          </p>
                          <p className="text-sm leading-relaxed text-neutral-600">{section.body}</p>
                        </div>
                      ))}
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
                      <p className="text-sm leading-relaxed text-neutral-600">
                        <span className="text-[11px] sm:text-xs uppercase tracking-[0.15em] text-neutral-500 mr-2">
                          Tools
                        </span>
                        {pub.tools}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        {pub.links.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-900 underline underline-offset-2 hover:text-neutral-500 break-all"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
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
