"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDES = [
  {
    src: "/archive/edison-ticker.jpg",
    w: 1920,
    h: 2375,
    alt: "Edison's Universal stock printer under a glass dome, its paper tape curling from the type wheel",
    caption: "Edison’s Universal stock printer, 1870s. It printed prices with no source, no time and no status.",
  },
  {
    src: "/archive/daumier-quotations-1865.jpg",
    w: 3402,
    h: 3516,
    alt: "Daumier lithograph of two men in a café reading the stock prices in a newspaper",
    caption: "Daumier, 1865. Two readers of the stock prices, and no way to tell how old they were.",
  },
  {
    src: "/archive/telegraph-receipt-1882.jpg",
    w: 1920,
    h: 1938,
    alt: "An 1882 Indian Telegraph receipt with four stamps cancelled AKYAB 23-4-82",
    caption: "A telegraph receipt, 1882. Proof the message was sent, not that it was true.",
  },
];

/** The signature move: the stage crossfades between three archive pictures, slowly. */
export function HeroStage() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id: number | undefined;
    const start = () => {
      id = window.setInterval(() => setI((n) => (n + 1) % SLIDES.length), 7600);
    };
    const onVis = () => {
      window.clearInterval(id);
      if (!document.hidden) start();
    };
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <figure className="hero-stage tag">
      <span className="tag-hole" />
      <div className="hero-pics">
        {SLIDES.map((s, n) => (
          <Image
            key={s.src}
            src={s.src}
            width={s.w}
            height={s.h}
            alt={n === i ? s.alt : ""}
            aria-hidden={n !== i}
            priority={n === 0}
            sizes="(max-width: 800px) 100vw, 50vw"
            className={`hero-pic${n === i ? " is-on" : ""}`}
          />
        ))}
      </div>
      <figcaption className="hero-caption" aria-live="polite">
        {SLIDES[i].caption}
      </figcaption>
    </figure>
  );
}
