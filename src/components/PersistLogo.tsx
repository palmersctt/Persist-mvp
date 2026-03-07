interface PersistLogoProps {
  size?: number
  variant?: 'dark' | 'light'
  className?: string
}

export default function PersistLogo({ size = 28, variant = 'dark', className }: PersistLogoProps) {
  const circleFill = variant === 'dark' ? '#1C1917' : '#ffffff'
  const chevronStroke = variant === 'dark' ? '#ffffff' : '#1C1917'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="48" fill={circleFill} />
      <path
        d="M38 30 L62 50 L38 70"
        stroke={chevronStroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
