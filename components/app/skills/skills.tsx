"use client";

import { useRef } from "react";
import { useScrollContext } from "providers/scroll/scroll-context";
import styles from "styles/modules/skills.module.css";

const opacityForBlock = (sectionProgress: number, blockNumber: number) => {
  const progress = sectionProgress - blockNumber;

  if (progress >= 0 && progress < 1) {
    return 1;
  }
  return 0.2;
};

const Skills = () => {
  const { scroll } = useScrollContext();

  const refContainer = useRef<HTMLDivElement>(null);

  const numberOfBlocks = 3;
  let progress = 0;

  if (refContainer.current) {
    const { clientHeight, offsetTop } = refContainer.current;
    const screenHeight = window.innerHeight;
    const halfScreenHeight = screenHeight / 2;
    const percentY =
      Math.min(
        clientHeight + halfScreenHeight,
        Math.max(-screenHeight, scroll - offsetTop) + halfScreenHeight
      ) / clientHeight;

    progress = Math.min(
      numberOfBlocks - 0.5,
      Math.max(0.5, percentY * numberOfBlocks)
    );
  }

  return (
    <section id="skills" className="scroll-mt-20 bg-surface text-white" ref={refContainer}>
      <div className="max-w-4xl min-h-screen flex flex-col justify-center items-center mx-auto px-4 py-16 sm:px-6 sm:py-20 md:px-16 md:py-24 lg:px-20">
        <div className="font-display text-2xl font-semibold leading-[1.25] tracking-tight sm:text-3xl md:text-5xl lg:text-6xl">
          <div
            className={styles.skills__text}
            style={{ opacity: opacityForBlock(progress, 0) }}
          >
            We know our stack inside out.
          </div>
          <span
            className={`${styles.skills__text} inline-block my-6 after:content-['_']`}
            style={{ opacity: opacityForBlock(progress, 1) }}
          >
            Mobile apps (React Native), backends (NestJS & Django), AI solutions,
            robotics, ERP & SaaS. Stripe, secure auth, real-time syncing.
          </span>
          <span
            className={`${styles.skills__text} inline-block text-white/90`}
            style={{ opacity: opacityForBlock(progress, 2) }}
          >
            CI/CD with GitHub Actions & Expo EAS. Microservices, PostgreSQL,
            GraphQL. Shipped to Play Store, App Store, and enterprise.
          </span>
        </div>
      </div>
    </section>
  );
};

export default Skills;
