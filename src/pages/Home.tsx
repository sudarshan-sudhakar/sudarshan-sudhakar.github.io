import { Link } from 'react-router-dom';
import bgVideo from '../assets/walkman2.mp4';
import bgPoster from '../assets/walkman2-poster.jpg';

function Home() {
  return (
    <div className="min-h-screen md:h-screen w-full flex flex-col md:flex-row bg-[#EEECE1] overflow-x-hidden md:overflow-hidden">
      {/* Left Content (65%) */}
      <div className="w-full md:w-[65%] min-h-[50vh] md:h-full flex items-center justify-center px-6 py-16 sm:px-8 sm:py-24">
        <div className="max-w-[580px] w-full">
          <h1 className="text-2xl sm:text-4xl font-bold mb-5 sm:mb-8 text-neutral-900 flex items-center gap-3 sm:gap-4">
            <span className="leading-none">Sudarshan Sudhakar</span>
          </h1>

          <div className="space-y-4 sm:space-y-6 text-sm sm:text-lg leading-relaxed text-neutral-600">
            <p>
              Heyy, I'm a researcher exploring the beauty of multi-modal
              models and VLM's in Medical Imaging and Visual Surveilliance.
              Currently a member of the ViBES Lab at IIITDM Kancheepuram,
              under the supervision of Dr. Rahul Raman.
            </p>

            <p>
              My research contributions are towards building memory and compute
              efficient models for Segmentation, Cognitive Prediction and
              Classification through domian specific loss functions.
            </p>

            <p>
              Currently exploring vision implementation of State Space Models and
              integrating them as sVLM.
            </p>

            <p>
              Always open for collaborations.
            </p>
          </div>

          <div className="mt-8 sm:mt-12 text-xs sm:text-sm space-x-6 text-neutral-500">
            <a href="https://github.com/sxdxde" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-neutral-800 transition-colors">Github</a>
            <a href="https://www.linkedin.com/in/sudarshan-sudhakar/" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-neutral-800 transition-colors">linkedin</a>
            <a href="mailto:sudarshansudhakar@gmail.com" className="underline underline-offset-4 hover:text-neutral-800 transition-colors">email</a>
            <a href="https://x.com/suiiddy" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-neutral-800 transition-colors">X</a>
          </div>

          <Link
            to="/projects"
            className="mt-6 sm:mt-8 inline-flex items-center gap-2 px-4 py-2 border border-neutral-900/80 text-xs sm:text-sm text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
          >
            Projects <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Right Video (35%) */}
      <div className="w-full md:w-[35%] aspect-[9/16] md:aspect-auto md:h-full relative overflow-hidden bg-[#EEECE1]">
        <video
          src={bgVideo}
          poster={bgPoster}
          preload="auto"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover mix-blend-multiply"
        />
      </div>
    </div>
  );
}

export default Home;
