type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton-shimmer skeleton-delayed bg-white/5 rounded ${className}`} />;
}