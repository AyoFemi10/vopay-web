'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
}

export function Carousel({ children, className = '' }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="relative w-full overflow-hidden">
      {/* Left fade gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
      
      <motion.div
        ref={scrollRef}
        className={`flex overflow-x-auto no-scrollbar gap-4 snap-x snap-mandatory px-4 py-2 ${className}`}
      >
        {children}
      </motion.div>
      
      {/* Right fade gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />
    </div>
  );
}
