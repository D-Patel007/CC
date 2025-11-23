interface VerifiedBadgeProps {
  isVerified?: boolean
  phoneVerified?: boolean
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
  type?: "email" | "phone" | "both"
}

export default function VerifiedBadge({ 
  isVerified = false,
  phoneVerified = false,
  size = "md", 
  showText = false,
  className = "",
  type = "email"
}: VerifiedBadgeProps) {
  // Determine what to show
  const showEmail = (type === "email" || type === "both") && isVerified;
  const showPhone = (type === "phone" || type === "both") && phoneVerified;
  
  if (!showEmail && !showPhone) return null;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Email Verification Badge */}
      {showEmail && (
        <span 
          className="inline-flex items-center gap-1"
          title="Verified student email"
        >
          <svg 
            className={`${sizeClasses[size]} text-blue-500 dark:text-blue-400`}
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
          {showText && type === "email" && (
            <span className={`${textSizeClasses[size]} font-medium text-blue-600 dark:text-blue-400`}>
              Verified
            </span>
          )}
        </span>
      )}

      {/* Phone Verification Badge */}
      {showPhone && (
        <span 
          className="inline-flex items-center gap-1"
          title="Verified phone number"
        >
          <svg 
            className={`${sizeClasses[size]} text-green-500 dark:text-green-400`}
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M14.97 7.53a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H12a.75.75 0 010-1.5h4.69l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
          {showText && type === "phone" && (
            <span className={`${textSizeClasses[size]} font-medium text-green-600 dark:text-green-400`}>
              Phone Verified
            </span>
          )}
        </span>
      )}
      
      {showText && type === "both" && (showEmail || showPhone) && (
        <span className={`${textSizeClasses[size]} font-medium text-blue-600 dark:text-blue-400`}>
          Verified{showEmail && showPhone && " ✓✓"}
        </span>
      )}
    </span>
  )
}
