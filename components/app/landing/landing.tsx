"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useScrollContext } from "providers/scroll/scroll-context";
import ArrowDown from "public/arrow-down.webp";
import LandingScene from "components/app/landing/landing-scene";
import styles from "styles/modules/landing.module.css";

const Landing = () => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const refContainer = useRef<HTMLDivElement>(null);
  const { scroll } = useScrollContext();

  useEffect(() => {
    const t = setTimeout(() => setImageLoaded(true), 600);
    return () => clearTimeout(t);
  }, []);

  const height = refContainer.current?.clientHeight ?? 1;
  const progress = Math.min(1, Math.max(0, scroll / height));

  const handleImageLoaded = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const scrollToBooking = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requestAnimationFrame(() => {
      const el = document.getElementById("book");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    });
  }, []);

  return (
    <div
      className={`${styles.landing__background} min-h-[100dvh] min-h-screen flex flex-col justify-center items-center sticky top-0 z-0 px-4 sm:px-6 safe-area-inset overflow-hidden`}
      ref={refContainer}
      style={{ transform: `translateY(-${progress * 20}vh)` }}
    >
      <LandingScene />
      {/* Dark overlay so text is always readable over 3D */}
      <div className={styles.landing__overlay} aria-hidden />

      <div
        className={`${styles.landing__content} flex-grow-0 transition-all duration-[800ms] ease-out pt-10 sm:pt-12 ${imageLoaded ? "opacity-100" : "opacity-0"
          }`}
      >
        <Link
          href="/"
          className={styles.landing__pill}
          aria-label="BOLT FUSION TECH home"
        >
          <span className={styles.landing__pillBold}>BOLT</span>
          <span className={styles.landing__pillDivider} aria-hidden />
          <span className={styles.landing__pillLight}>FUSION TECH</span>
        </Link>
      </div>

      <div
        className={`${styles.landing__hero} flex flex-1 flex-col justify-center items-center text-center transition-all duration-[800ms] ease-out px-4 max-w-3xl ${imageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
      >
        <div className={styles.landing__eyebrowWrap}>
          <div className={styles.landing__eyebrowLine} aria-hidden />
          <p className={styles.landing__eyebrow}>Software Agency — Engineering Excellence</p>
        </div>
        <h1 className={styles.landing__title} aria-label="BOLT FUSION TECH">
          <span className={styles.landing__titlePrimary}>BOLT</span>
          <span className={styles.landing__titleAccent} aria-hidden />
          <span className={styles.landing__titleSecondary}>FUSION TECH</span>
        </h1>
        <p className={styles.landing__subtitle}>
          Mobile · Backend · AI · Robotics · ERP · SaaS. Secure, scalable, delivered.
        </p>
        <button
          type="button"
          onClick={scrollToBooking}
          className={`group ${styles.landing__cta}`}
        >
          <span>Request consultation</span>
          <svg
            className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-y-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      <div
        className={`${styles.landing__scrollWrap} flex-grow-0 transition-all duration-[800ms] ease-out pb-12 sm:pb-14 ${imageLoaded ? "opacity-100" : "opacity-0 -translate-y-6"
          }`}
      >
        <div className={styles.landing__scrollLine} aria-hidden />
        <Image
          src={ArrowDown}
          alt="Scroll down"
          onLoad={handleImageLoaded}
          width={28}
          height={28}
          className={`${styles.landing__scroll} w-6 h-6 sm:w-7 sm:h-7`}
        />
      </div>
    </div>
  );
};

export default Landing;
