"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function StepViewport({ children }: { children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;

    const measure = () => setHeight(Math.ceil(node.getBoundingClientRect().height));
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={height === null ? undefined : { height: height + 8 }}
      className="-m-1 overflow-hidden p-1 transition-[height] duration-300 ease-out motion-reduce:transition-none [overflow-anchor:none]"
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}