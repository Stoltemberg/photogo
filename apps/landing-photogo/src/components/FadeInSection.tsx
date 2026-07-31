"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type FadeInSectionProps = {
  children: ReactNode;
  /** Tailwind delay utility class: delay-100, delay-200, etc. */
  delay?: string;
  /** Extra className on the wrapper div. */
  className?: string;
  /** Trigger again every time it enters the viewport (default: once). */
  once?: boolean;
  /** Viewport margin string for IntersectionObserver rootMargin. */
  rootMargin?: string;
};

/**
 * Wrap a block so it fades + slides up when scrolled into view.
 * Falls back to visible immediately if IntersectionObserver is undefined
 * (SSR / very old browsers) so content is never permanently hidden.
 */
export function FadeInSection({
  children,
  delay,
  className = "",
  once = true,
  rootMargin = "0px 0px -80px 0px",
}: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IO — show right away.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { rootMargin, threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, rootMargin]);

  return (
    <div
      ref={ref}
      className={`reveal ${delay ?? ""} ${
        visible ? "is-visible" : ""
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}
