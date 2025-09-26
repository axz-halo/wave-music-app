export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-sk4-white border border-sk4-gray p-3">
      <Skeleton className="w-full aspect-square mb-3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3 mt-2" />
    </div>
  );
}


