"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

interface SwarmVisualizationProps {
  isActive: boolean;
  startTime?: Date;
  extendedMode?: boolean;
}

const EXTENDED_THRESHOLD_MS = 45000; // 45 seconds

export default function SwarmVisualization({
  isActive,
  startTime,
  extendedMode: extendedModeProp,
}: SwarmVisualizationProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showExtendedMessage, setShowExtendedMessage] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setElapsedTime(0);
      setShowExtendedMessage(false);
      return;
    }

    const start = startTime || new Date();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - start.getTime();
      setElapsedTime(elapsed);
      
      if (elapsed >= EXTENDED_THRESHOLD_MS || extendedModeProp) {
        setShowExtendedMessage(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, startTime, extendedModeProp]);

  if (!isActive) return null;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {/* Animated swarm visualization */}
      <div className="relative w-32 h-32">
        {/* Central node */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full clarity-gradient flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Orbiting nodes */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              animation: `spin ${3 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            <div
              className={`absolute w-3 h-3 rounded-full ${
                i % 3 === 0
                  ? "bg-blue-500"
                  : i % 3 === 1
                  ? "bg-purple-500"
                  : "bg-green-500"
              }`}
              style={{
                top: "0%",
                left: "50%",
                transform: "translateX(-50%)",
                opacity: 0.7,
              }}
            />
          </div>
        ))}
      </div>

      {/* Status message */}
      <div className="text-center space-y-2">
        {showExtendedMessage ? (
          <>
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="font-medium">Improving quality...</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Taking a bit longer to ensure the best results
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-foreground">Generating your brief</p>
            <p className="text-sm text-muted-foreground">
              Analyzing sources and synthesizing insights
            </p>
          </>
        )}
      </div>

      {/* Subtle progress indicator (not specific counts) */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>Processing</span>
        {elapsedTime > 0 && (
          <span className="text-muted-foreground/60">
            · {formatTime(elapsedTime)}
          </span>
        )}
      </div>
    </div>
  );
}
