"use client";

import { useState, useEffect, useRef } from "react";

interface ReadingProgressBarProps {
  contentSelector?: string;
}

export function ReadingProgressBar({ contentSelector }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const calculateProgress = () => {
      const content = contentSelector 
        ? document.querySelector(contentSelector) as HTMLElement
        : null;
      
      if (content) {
        const contentRect = content.getBoundingClientRect();
        const contentTop = content.offsetTop;
        const contentHeight = content.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollY = window.scrollY;
        
        const startPoint = contentTop;
        const endPoint = contentTop + contentHeight - windowHeight;
        
        if (endPoint <= startPoint) {
          setProgress(scrollY >= startPoint ? 100 : 0);
          return;
        }
        
        if (scrollY <= startPoint) {
          setProgress(0);
        } else if (scrollY >= endPoint) {
          setProgress(100);
        } else {
          const progressPercent = ((scrollY - startPoint) / (endPoint - startPoint)) * 100;
          setProgress(Math.min(100, Math.max(0, progressPercent)));
        }
      } else {
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const scrollY = window.scrollY;
        
        const scrollableHeight = documentHeight - windowHeight;
        if (scrollableHeight <= 0) {
          setProgress(100);
          return;
        }
        
        const progressPercent = (scrollY / scrollableHeight) * 100;
        setProgress(Math.min(100, Math.max(0, progressPercent)));
      }
    };

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(calculateProgress);
    };

    calculateProgress();
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [contentSelector]);

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-gray-200/50 dark:bg-gray-800/50 print:hidden"
      role="progressbar"
      data-reading-progress
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full bg-primary transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
