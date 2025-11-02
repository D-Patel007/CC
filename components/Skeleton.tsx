interface SkeletonProps {
  className?: string
  variant?: "text" | "circular" | "rectangular"
  width?: string | number
  height?: string | number
  count?: number
}

export default function Skeleton({ 
  className = "", 
  variant = "rectangular",
  width,
  height,
  count = 1
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]"
  
  const variantClasses = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg"
  }

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  }

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div 
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
          />
        ))}
      </div>
    )
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  )
}

// Pre-built skeleton components for common use cases
export function ListingCardSkeleton() {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-border overflow-hidden shadow-subtle">
      <Skeleton className="w-full h-48" variant="rectangular" />
      <div className="p-4 space-y-3">
        <Skeleton className="w-3/4 h-6" />
        <Skeleton className="w-full h-4" count={2} />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="w-20 h-6" />
          <Skeleton className="w-16 h-4" />
        </div>
      </div>
    </div>
  )
}

export function ProfileCardSkeleton() {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={64} height={64} />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-1/2 h-6" />
          <Skeleton className="w-3/4 h-4" />
        </div>
      </div>
      <Skeleton className="w-full h-4" count={3} />
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i}
          className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
        >
          <div className="w-2/3">
            <Skeleton className="w-full h-16 mb-1" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
      ))}
    </div>
  )
}
