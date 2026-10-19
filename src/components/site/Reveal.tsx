"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Entrance for the parts of each section. Content is visible without script:
 * the hidden start state applies only once `html.js-reveal` is set here.
 * Anything already scrolled past (an anchor jump, the End key) is revealed at once.
 */
export function Reveal() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll("video").forEach((v) => {
        v.pause();
        v.removeAttribute("autoplay");
      });
      return;
    }
    const pending = new Set(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    const sweep = () => {
      const line = window.innerHeight * 0.92;
      for (const el of pending) {
        if (el.getBoundingClientRect().top < line) {
          el.classList.add("is-in");
          pending.delete(el);
        }
      }
      if (!pending.size) window.removeEventListener("scroll", onScroll);
    };
    let raf = 0;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), sweep()));
    };
    root.classList.add("js-reveal");
    sweep();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);
  return null;
}
