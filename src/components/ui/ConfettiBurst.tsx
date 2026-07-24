"use client";

import { useEffect, useState } from "react";

interface Piece {
  id: number;
  x: number;
  y: number;
  rotate: number;
  color: string;
  delay: number;
}

const COLORS = ["#0074e0", "#75dd04", "#ffb400", "#ffffff", "#c2c2c4"];
const PIECE_COUNT = 18;
const DURATION_MS = 900;

export default function ConfettiBurst({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const next = Array.from({ length: PIECE_COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / PIECE_COUNT + Math.random() * 0.4;
      const distance = 60 + Math.random() * 60;
      return {
        id: Date.now() + i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: Math.random() * 360,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 80,
      };
    });
    setPieces(next);
    const timer = setTimeout(() => setPieces([]), DURATION_MS + 150);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-visible" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-1/2 left-1/2 w-1.5 h-2.5 rounded-sm"
          style={{
            backgroundColor: p.color,
            animation: `btl-confetti-fly ${DURATION_MS}ms ease-out ${p.delay}ms forwards`,
            "--tx": `${p.x}px`,
            "--ty": `${p.y}px`,
            "--rot": `${p.rotate}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}