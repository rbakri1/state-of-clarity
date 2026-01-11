interface SkeletonProps {
  variant?: "text" | "paragraph" | "card" | "avatar" | "button";
  className?: string;
  lines?: number;
}

export function Skeleton({
  variant = "text",
  className = "",
  lines = 3,
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";

  switch (variant) {
    case "text":
      return (
        <div
          className={`${baseClasses} h-4 w-full ${className}`}
          aria-hidden="true"
        />
      );

    case "paragraph":
      return (
        <div className={`space-y-2 ${className}`} aria-hidden="true">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`${baseClasses} h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
            />
          ))}
        </div>
      );

    case "card":
      return (
        <div
          className={`rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 ${className}`}
          aria-hidden="true"
        >
          <div className={`${baseClasses} h-4 w-2/3`} />
          <div className="space-y-2">
            <div className={`${baseClasses} h-3 w-full`} />
            <div className={`${baseClasses} h-3 w-5/6`} />
            <div className={`${baseClasses} h-3 w-4/6`} />
          </div>
          <div className={`${baseClasses} h-8 w-24`} />
        </div>
      );

    case "avatar":
      return (
        <div
          className={`${baseClasses} h-10 w-10 rounded-full ${className}`}
          aria-hidden="true"
        />
      );

    case "button":
      return (
        <div
          className={`${baseClasses} h-10 w-24 rounded-md ${className}`}
          aria-hidden="true"
        />
      );

    default:
      return (
        <div
          className={`${baseClasses} h-4 w-full ${className}`}
          aria-hidden="true"
        />
      );
  }
}
