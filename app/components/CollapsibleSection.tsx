"use client";

import { useState, useRef, useEffect } from "react";

interface CollapsibleSectionProps {
  title: string;
  itemCount?: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  itemCount,
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    defaultExpanded ? undefined : 0
  );

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded && contentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (contentRef.current && isExpanded) {
          setContentHeight(contentRef.current.scrollHeight);
        }
      });
      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isExpanded]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isExpanded ? 'rounded-t-lg' : 'rounded-lg'}`}
        aria-expanded={isExpanded}
      >
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {title}
          {itemCount !== undefined && (
            <span className="ml-2 text-gray-500 dark:text-gray-400">
              ({itemCount})
            </span>
          )}
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        data-collapsible-content
        style={{
          height: contentHeight,
          transition: "height 200ms ease-out",
          overflowY: "hidden",
          overflowX: "auto",
        }}
      >
        <div ref={contentRef} className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
