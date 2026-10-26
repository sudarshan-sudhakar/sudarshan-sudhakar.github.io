import { useState } from 'react';
import Nav from '../components/Nav';

interface Role {
  title: string;
  period?: string;
  summary: string;
  points?: { heading?: string; text: string }[];
}

interface Experience {
  org: string;
  logo: string;
  meta: string;
  location: string;
  roles: Role[];
  skills?: string;
  documents?: { label: string; href: string }[];
}

const experiences: Experience[] = [
  {
    org: 'IIITDM Kancheepuram',
    logo: '/images/experience/iiitdm.jpeg',
    meta: 'Research & Teaching',
    location: 'Chennai, Tamil Nadu, India · On-site',
    roles: [
      {
        title: 'Research Intern',
        period: 'May 2026 - Present',
        summary:
          'Worked on machine learning research in medical imaging, cyber-physical security and vision-language models under faculty guidance.',
        points: [
          {
            heading: 'Text-guided brain tumour segmentation (medical imaging, vision-language), guided by Dr. Umarani J',
            text: 'A lightweight 10.4M-parameter model that fuses four MRI modalities with radiology report embeddings from a frozen text model (RadBERT). It reaches 83.4% Dice on BraTS2020/TextBraTS, with lower boundary error (HD95) than the published best at about one-third of the parameters. I worked with PhD scholars on literature review, ablation studies and manuscript writing, and I am second author. Being prepared for submission to IEEE Transactions on Medical Imaging (TMI).',
          },
          {
            heading: 'Skin lesion classification (medical imaging), guided by Dr. Umarani J',
            text: 'A quality-adaptive loss that uses scarce expert image-quality ratings to improve classification. A shuffled-quality control showed the loss itself drives about 65% of the gain. Submitted to IEEE INDICON 2026.',
          },
          {
            heading: 'False data injection on EV charging (cyber-physical security), guided by Dr. Pradeepkumar Bhale',
            text: 'A sole-author study of attacks on electric vehicle charging infrastructure. A published detector scoring 84.4% F1 fell to 37.3% against independently sampled attacks, and I proposed adding a new input stream to the detector. Being prepared for submission to IEEE Transactions on Transportation Electrification (TTE).',
          },
          {
            heading: 'Pedestrian intention detection (computer vision, vision-language models), guided by Dr. Rahul Raman',
            text: 'Currently building a small vision-language model (sVLM) on state space architectures such as Mamba, Cobra, Zamba and BDH. This is also my final year project.',
          },
        ],
      },
      {
        title: 'Teaching Assistant',
        summary:
          'Teaching Assistant for Pattern Recognition and Machine Learning (PRML), supporting a core machine learning course for about 150 pre-final and final year students.',
        points: [
          { text: 'Taught perceptrons and support vector machines (SVMs), working from the intuition to the maths.' },
          { text: 'Helped students get from an idea to a working implementation.' },
          { text: 'Answered students’ questions and explained concepts they found difficult.' },
        ],
      },
    ],
  },
  {
    org: 'SwitchiT',
    logo: '/images/experience/switchit.jpeg',
    meta: 'Internship',
    location: 'Remote',
    roles: [
      {
        title: 'AI Engineer Intern',
        period: 'Sep 2025 - Apr 2026 · 8 mos',
        summary:
          'Developing an AI mentor system that provides personalized guidance and career support for users on the SwitchiT platform.',
      },
    ],
    documents: [{ label: 'SwitchiT Offer Letter', href: '/certificates/switchit-offer-letter.pdf' }],
  },
  {
    org: 'Yellow.ai',
    logo: '/images/experience/yellowai.jpeg',
    meta: 'Internship',
    location: 'Abu Dhabi Emirate, United Arab Emirates · Hybrid',
    roles: [
      {
        title: 'Artificial Intelligence Intern',
        period: 'May 2025 - Jul 2025 · 3 mos',
        summary:
          'Worked on two projects combining technical problem-solving with applied AI/ML development.',
        points: [
          {
            heading: 'Conversational Agent Development (Yellow.ai Platform)',
            text: 'Collaborated under the mentorship of Mr. Neethish to design and implement a customer-facing conversational agent. Gained hands-on experience in conversational flow design, natural language understanding (NLU), and integration of chatbot workflows using the Yellow.ai platform to enhance customer engagement and service automation.',
          },
          {
            heading: 'Internal Ticket Analysis & Classification (GenAI Applications)',
            text: 'Worked with Mr. Jishnu on leveraging generative AI models to streamline internal support workflows. Built and refined ticket classification pipelines, enabling automated categorization and progress tracking of organizational requests. This project demonstrated the potential of GenAI to improve efficiency and resolution quality in enterprise processes.',
          },
        ],
      },
    ],
    skills:
      'Conversational AI (Yellow.ai), Generative AI Applications, Natural Language Processing (NLP), Data Classification, Workflow Automation, Team Collaboration, Applied Machine Learning',
    documents: [
      { label: 'Internship Completion Certificate', href: '/certificates/yellowai-completion-certificate.pdf' },
    ],
  },
  {
    org: 'Google Developer Student Clubs',
    logo: '/images/experience/gdsc.jpeg',
    meta: 'Leadership',
    location: 'Chennai, Tamil Nadu, India · On-site',
    roles: [
      {
        title: 'GDSC Co-Chair',
        period: 'Sep 2024 - May 2025 · 9 mos',
        summary:
          'Led the student developer community at IIITDM Kancheepuram, helping fellow students learn and build with Google technologies.',
        points: [
          { text: 'Organised hackathons that gave students a hands-on way to build working projects in teams and apply what they learned in class.' },
          { text: 'Ran sessions on Google analytics tools, introducing students to how data is collected, tracked and turned into insights.' },
          { text: 'Worked with the core team to plan events, coordinate logistics and keep the club active throughout the year.' },
          { text: 'Mentored peers in technical skills and built a community around learning, collaboration and problem solving.' },
        ],
      },
    ],
    documents: [{ label: 'GDSC Acceptance Mail', href: '/certificates/gdsc-acceptance-mail.pdf' }],
  },
];

function Experience() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="relative min-h-screen w-full bg-[#EEECE1] px-6 py-16 sm:px-8 sm:py-24">
      <Nav />
      <div className="max-w-[720px] mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold mt-6 mb-8 sm:mb-10 text-neutral-900">
          Experience
        </h1>

        <div className="divide-y divide-black/10 border-t border-b border-black/10">
          {experiences.map((exp, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={exp.org}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="w-full text-left flex items-start justify-between gap-4 py-5 cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={exp.logo}
                      alt={`${exp.org} logo`}
                      className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 object-contain bg-white border border-black/10"
                    />
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors">
                        {exp.roles.map((role) => role.title).join(' · ')}
                        <span className="ml-2 align-middle text-[10px] uppercase tracking-wider text-neutral-500 border border-black/15 px-1.5 py-0.5">
                          {exp.meta}
                        </span>
                      </h2>
                      <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                        {exp.org}
                        {exp.roles[0].period && ` · ${exp.roles[0].period}`}
                      </p>
                    </div>
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
                    <div className="pb-6 sm:pl-16 space-y-6">
                      <p className="text-xs sm:text-sm text-neutral-500">{exp.location}</p>

                      {exp.roles.map((role) => (
                        <div key={role.title} className="space-y-3">
                          {exp.roles.length > 1 && (
                            <p className="text-[11px] sm:text-xs uppercase tracking-[0.15em] text-neutral-500">
                              {role.title}
                              {role.period && ` · ${role.period}`}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed text-neutral-600">{role.summary}</p>
                          {role.points && (
                            <ul className="space-y-3">
                              {role.points.map((point) => (
                                <li
                                  key={point.text}
                                  className="text-sm leading-relaxed text-neutral-600 pl-4 border-l border-black/15"
                                >
                                  {point.heading && (
                                    <span className="block font-medium text-neutral-900 mb-0.5">
                                      {point.heading}
                                    </span>
                                  )}
                                  {point.text}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}

                      {exp.skills && (
                        <div>
                          <p className="text-[11px] sm:text-xs uppercase tracking-[0.15em] text-neutral-500 mb-2">
                            Skills
                          </p>
                          <p className="text-sm leading-relaxed text-neutral-600">{exp.skills}</p>
                        </div>
                      )}

                      {exp.documents && (
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          {exp.documents.map((doc) => (
                            <a
                              key={doc.href}
                              href={doc.href}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block text-xs sm:text-sm underline underline-offset-4 text-neutral-900 hover:text-neutral-600 transition-colors"
                            >
                              {doc.label} &rarr;
                            </a>
                          ))}
                        </div>
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

export default Experience;
