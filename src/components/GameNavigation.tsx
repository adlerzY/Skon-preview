// components/GameNavigation.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GAMES_DATA } from "@/context/games";

export default function GameNavigation() {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef({ isDown: false, startX: 0, scrollLeft: 0, isDragged: false });
  const [fadeType, setFadeType] = useState<'none' | 'left' | 'right' | 'both'>('none');

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollWidth, clientWidth, scrollLeft } = scrollRef.current;
    if (scrollWidth <= clientWidth) {
      setFadeType('none');
      return;
    }
    const currentScroll = Math.abs(Math.round(scrollLeft));
    const maxScroll = scrollWidth - clientWidth;
    const isAtStart = currentScroll <= 2;
    const isAtEnd = currentScroll >= maxScroll - 2;
    if (isAtStart && isAtEnd) setFadeType('none');
    else if (isAtStart) setFadeType('left');
    else if (isAtEnd) setFadeType('right');
    else setFadeType('both');
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    dragInfo.current.isDown = true;
    dragInfo.current.isDragged = false;
    dragInfo.current.startX = e.pageX - scrollRef.current.offsetLeft;
    dragInfo.current.scrollLeft = scrollRef.current.scrollLeft;
  };

  const handleMouseLeaveOrUp = () => {
    dragInfo.current.isDown = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragInfo.current.isDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragInfo.current.startX) * 1.5;
    if (Math.abs(walk) > 5) dragInfo.current.isDragged = true;
    scrollRef.current.scrollLeft = dragInfo.current.scrollLeft - walk;
    checkScroll();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragInfo.current.isDragged) e.preventDefault();
  };

  const getMaskStyle = () => {
    const fadeWidth = "80px";
    switch (fadeType) {
      case 'left': return { maskImage: `linear-gradient(to right, transparent, black ${fadeWidth})` };
      case 'right': return { maskImage: `linear-gradient(to left, transparent, black ${fadeWidth})` };
      case 'both': return { maskImage: `linear-gradient(to right, transparent, black ${fadeWidth}, black calc(100% - ${fadeWidth}), transparent)` };
      default: return { maskImage: 'none' };
    }
  };

  return (
    <div className="w-full relative select-none my-4 bg-brand-surface overflow-hidden">
      <div
        ref={scrollRef}
        className="flex items-center overflow-x-auto cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-[mask-image] duration-300"
        style={getMaskStyle()}
        onScroll={checkScroll}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
      >
        {GAMES_DATA.map((game, i) => {
          const isActive = pathname?.startsWith(game.link);
          return (
            <Link
              key={i}
              href={game.link}
              draggable={false}
              onClick={handleClick}
              className={`flex-shrink-0 flex items-center justify-center p-5 transition-all duration-300 group border-b-[3px] ${ isActive ? "bg-white/10 rounded-none border-[#0074E1] opacity-100" : "bg-transparent border-transparent opacity-80 hover:opacity-100 rounded-none hover:bg-white/5" }`}
            >
              <div className="relative w-12 h-12 pointer-events-none transition-transform duration-300 group-hover:scale-110">
                <Image
                  src={game.img}
                  alt={game.title}
                  fill
                  className={`object-contain ${isActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : ""}`}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}