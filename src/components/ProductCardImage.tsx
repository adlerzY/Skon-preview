"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductCardImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <div className="absolute inset-0 skeleton-shimmer animate-pulse bg-white/5" />}
      <Image
        src={src}
        alt={alt}
        fill
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-opacity duration-300 ease-in-out brightness-[0.99] group-hover:brightness-110 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </>
  );
}