'use client';

export function WaveCardSkeleton() {
  return (
    <div className="sk4-spotify-wave-card p-sk4-md h-full flex flex-col min-h-[240px] sm:min-h-[260px] animate-pulse">
      {/* User Info */}
      <div className="flex items-center space-x-sk4-sm mb-sk4-md">
        <div className="w-9 h-9 rounded-full bg-sk4-gray" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-sk4-gray rounded w-24" />
          <div className="h-3 bg-sk4-light-gray rounded w-16" />
        </div>
      </div>

      {/* Music Info */}
      <div className="flex items-center space-x-sk4-md mb-sk4-md">
        <div className="w-16 h-16 rounded-full bg-sk4-gray flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-sk4-gray rounded w-full" />
          <div className="h-3 bg-sk4-light-gray rounded w-3/4" />
        </div>
        <div className="w-12 h-6 bg-sk4-light-gray rounded" />
      </div>

      {/* Comment */}
      <div className="mb-sk4-md p-sk4-md bg-sk4-light-gray rounded-sk4-soft">
        <div className="space-y-2">
          <div className="h-3 bg-sk4-gray rounded w-full" />
          <div className="h-3 bg-sk4-gray rounded w-5/6" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-sk4-md border-t border-sk4-gray/50 mt-auto">
        <div className="flex items-center space-x-2">
          <div className="w-16 h-8 bg-sk4-light-gray rounded-sk4-soft" />
          <div className="w-16 h-8 bg-sk4-light-gray rounded-sk4-soft" />
          <div className="w-16 h-8 bg-sk4-light-gray rounded-sk4-soft" />
        </div>
        <div className="w-8 h-8 bg-sk4-light-gray rounded-sk4-soft" />
      </div>
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="sk4-spotify-card p-sk4-lg animate-pulse">
      <div className="text-center space-y-sk4-md">
        {/* Avatar */}
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-sk4-gray" />
        </div>
        
        {/* User Info */}
        <div className="space-y-2">
          <div className="h-6 bg-sk4-gray rounded w-32 mx-auto" />
          <div className="h-4 bg-sk4-light-gray rounded w-48 mx-auto" />
          <div className="h-3 bg-sk4-light-gray rounded w-24 mx-auto" />
        </div>

        {/* Stats */}
        <div className="flex justify-center space-x-8 pt-sk4-md">
          <div className="text-center space-y-1">
            <div className="h-6 w-12 bg-sk4-gray rounded mx-auto" />
            <div className="h-3 w-16 bg-sk4-light-gray rounded" />
          </div>
          <div className="w-px bg-sk4-gray"></div>
          <div className="text-center space-y-1">
            <div className="h-6 w-12 bg-sk4-gray rounded mx-auto" />
            <div className="h-3 w-16 bg-sk4-light-gray rounded" />
          </div>
        </div>

        {/* Button */}
        <div className="h-10 bg-sk4-light-gray rounded-lg w-full" />
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="sk4-spotify-card p-sk4-lg animate-pulse">
      <div className="h-5 bg-sk4-gray rounded w-24 mb-sk4-md" />
      <div className="grid grid-cols-3 gap-sk4-md">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center space-y-sk4-sm">
            <div className="w-12 h-12 bg-sk4-light-gray rounded-lg mx-auto" />
            <div className="h-6 bg-sk4-gray rounded w-12 mx-auto" />
            <div className="h-3 bg-sk4-light-gray rounded w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlaylistCardSkeleton() {
  return (
    <div className="sk4-spotify-card p-sk4-md animate-pulse">
      <div className="aspect-square bg-sk4-gray rounded-lg mb-sk4-md" />
      <div className="space-y-2">
        <div className="h-4 bg-sk4-gray rounded w-full" />
        <div className="h-3 bg-sk4-light-gray rounded w-3/4" />
        <div className="h-3 bg-sk4-light-gray rounded w-1/2" />
      </div>
    </div>
  );
}

export function ChallengeCardSkeleton() {
  return (
    <div className="sk4-spotify-card p-sk4-md animate-pulse">
      <div className="aspect-video bg-sk4-gray rounded-lg mb-sk4-md" />
      <div className="space-y-2">
        <div className="h-5 bg-sk4-gray rounded w-full" />
        <div className="h-3 bg-sk4-light-gray rounded w-5/6" />
        <div className="h-3 bg-sk4-light-gray rounded w-2/3" />
      </div>
      <div className="flex items-center justify-between mt-sk4-md pt-sk4-md border-t border-sk4-gray">
        <div className="h-3 bg-sk4-light-gray rounded w-20" />
        <div className="h-8 bg-sk4-light-gray rounded w-24" />
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-sk4-sm p-sk4-sm bg-sk4-light-gray rounded-lg animate-pulse">
      <div className="w-12 h-12 rounded-lg bg-sk4-gray flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-sk4-gray rounded w-3/4" />
        <div className="h-3 bg-sk4-medium-gray rounded w-1/2" />
      </div>
      <div className="h-3 bg-sk4-medium-gray rounded w-12" />
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="sk4-spotify-header animate-pulse">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-sk4-md">
          <div className="w-10 h-10 bg-sk4-gray rounded-lg" />
          <div className="h-5 bg-sk4-gray rounded w-24" />
        </div>
        <div className="h-10 bg-sk4-gray rounded w-32" />
      </div>
    </div>
  );
}

export function FeaturedBannerSkeleton() {
  return (
    <div className="min-w-[300px] h-[180px] bg-sk4-gray rounded-lg animate-pulse" />
  );
}

// Grid Skeletons
export function WaveGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="sk4-spotify-grid">
      {Array.from({ length: count }).map((_, i) => (
        <WaveCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PlaylistGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-sk4-lg">
      {Array.from({ length: count }).map((_, i) => (
        <PlaylistCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChallengeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-sk4-md">
      {Array.from({ length: count }).map((_, i) => (
        <ChallengeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-sk4-sm">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}





