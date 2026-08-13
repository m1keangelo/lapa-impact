/**
 * Home Section 3 — "How a dollar travels" (home.md §Section 3).
 * Pinned GSAP ScrollTrigger story on desktop (350vh scrub distance):
 * photos crossfade per step, progress rail fills, step text swaps.
 * Mobile + prefers-reduced-motion: static stacked cards, no pin.
 *
 * GSAP ISOLATION: this component deliberately uses no Framer Motion —
 * scroll-driven storytelling lives here, UI motion lives elsewhere
 * (react-dev.md library isolation rule).
 */
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

/** Numbers + imagery are language-independent; copy comes from the i18n dict. */
const STEP_MEDIA = [
  { n: '01', img: '/how-step-1.jpg' },
  { n: '02', img: '/how-step-2.jpg' },
  { n: '03', img: '/how-step-3.jpg' },
  { n: '04', img: '/how-step-4.jpg' },
];

interface JourneyStep {
  n: string;
  title: string;
  body: string;
  img: string;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Static stacked variant — mobile, and reduced-motion everywhere. */
function StackedSteps({ steps }: { steps: JourneyStep[] }) {
  return (
    <div className="mx-auto grid w-full max-w-container gap-6 px-5 md:px-8">
      {steps.map((s) => (
        <article
          key={s.n}
          className="overflow-hidden rounded-card border border-border bg-surface"
        >
          <img
            src={s.img}
            alt=""
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="p-5">
            <p className="text-outline-amber font-mono text-5xl font-medium leading-none">
              {s.n}
            </p>
            <h3 className="mt-3 font-display text-2xl font-medium tracking-[-0.01em] text-text">
              {s.title}
            </h3>
            <p className="mt-2 text-[15px] leading-[1.55] text-text-muted">{s.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Journey() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const mounted = useRef(false);
  const { t } = useLanguage();

  // Merge language-independent media with the localized step copy.
  const steps: JourneyStep[] = STEP_MEDIA.map((m, i) => ({
    ...m,
    title: t.home.journey.steps[i]?.title ?? '',
    body: t.home.journey.steps[i]?.body ?? '',
  }));

  // Step text swap animation (y-shift crossfade) when the scrub changes step.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (reducedMotion || !textRef.current) return;
    gsap.fromTo(
      textRef.current,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
    );
  }, [step, reducedMotion]);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => {
        const photos = gsap.utils.toArray<HTMLElement>('.journey-photo');
        gsap.set(photos, { opacity: 0, scale: 1.03, y: 20 });
        gsap.set(photos[0], { opacity: 1, scale: 1, y: 0 });

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=350%',
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              const s = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
              setStep((prev) => (prev === s ? prev : s));
            },
          },
        });

        // Progress rail fill tracks overall scrub.
        tl.fromTo(fillRef.current, { scaleY: 0 }, { scaleY: 1, duration: 4 }, 0);

        // Photo crossfades at each step boundary.
        for (let i = 1; i < steps.length; i++) {
          tl.to(photos[i - 1], { opacity: 0, scale: 0.97, duration: 0.5 }, i - 0.25).to(
            photos[i],
            { opacity: 1, scale: 1, y: 0, duration: 0.5 },
            i - 0.25,
          );
        }
      });
      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  const current = steps[step];

  return (
    <section aria-label={t.home.journey.aria} className="py-20 md:py-0">
      {/* Section heading (outside the pin) */}
      <div className="mx-auto w-full max-w-container px-5 pb-10 md:px-8 md:pb-0 md:pt-24">
        <p className="eyebrow flex items-center gap-3">
          <span className="inline-block h-px w-4 bg-amber" aria-hidden />
          {t.home.journey.eyebrow}
        </p>
        <h2 className="mt-3 font-display text-2xl font-medium leading-[1.2] tracking-[-0.01em] text-text md:text-[32px]">
          {t.home.journey.title}
        </h2>
      </div>

      {reducedMotion ? (
        <div className="mt-8 md:mt-0 md:pb-24">
          <StackedSteps steps={steps} />
        </div>
      ) : (
        <>
          {/* Pinned desktop story */}
          <div
            ref={sectionRef}
            className="relative hidden md:flex md:h-[100dvh] md:items-center"
          >
            <div className="mx-auto grid w-full max-w-container grid-cols-5 items-center gap-12 px-8">
              {/* Narrative column (40%) */}
              <div className="col-span-2 flex gap-6">
                {/* Progress rail */}
                <div className="relative w-[2px] self-stretch bg-border" aria-hidden>
                  <div
                    ref={fillRef}
                    className="absolute inset-0 origin-top bg-amber"
                    style={{ transform: 'scaleY(0)' }}
                  />
                  <div className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 flex-col justify-between py-1">
                    {steps.map((s, i) => (
                      <span
                        key={s.n}
                        className={cn(
                          'block h-2 w-2 rounded-full transition-all duration-300',
                          i === step ? 'scale-125 bg-amber' : 'bg-border-strong',
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div ref={textRef}>
                  <p className="text-outline-amber font-mono text-[64px] font-medium leading-none">
                    {current.n}
                  </p>
                  <h3 className="mt-4 font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text">
                    {current.title}
                  </h3>
                  <p className="mt-3 max-w-[42ch] text-[15px] leading-[1.55] text-text-muted">
                    {current.body}
                  </p>
                </div>
              </div>

              {/* Photo column (60%) */}
              <div className="col-span-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-border bg-surface">
                  {steps.map((s) => (
                    <img
                      key={s.n}
                      src={s.img}
                      alt=""
                      className="journey-photo absolute inset-0 h-full w-full object-cover"
                      style={{ opacity: 0 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile stacked story */}
          <div className="md:hidden">
            <StackedSteps steps={steps} />
          </div>
        </>
      )}
    </section>
  );
}
