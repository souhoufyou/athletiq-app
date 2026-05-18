import type { CSSProperties } from "react";

type SkeletonVariant = "text" | "card" | "circle" | "button";

export type SkeletonProps = {
  className?: string;
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
};

// `card` is a neutral block: callers supply their own radius/height so it can
// match any surface. The other variants carry sensible defaults.
const variantClasses: Record<SkeletonVariant, string> = {
  text: "h-3.5 w-full rounded-md",
  card: "w-full",
  circle: "rounded-full",
  button: "h-12 w-full rounded-xl"
};

function toCssSize(value?: string | number): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

export function Skeleton({ className = "", variant = "text", width, height }: SkeletonProps) {
  const style: CSSProperties = {
    width: toCssSize(width),
    height: toCssSize(height)
  };

  return (
    <div
      aria-hidden="true"
      className={`skeleton ${variantClasses[variant]} ${className}`.trim()}
      style={style}
    />
  );
}
