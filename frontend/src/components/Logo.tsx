interface Props {
  className?: string
}

export default function Logo({ className = "h-10 w-10" }: Props) {
  return (
    <svg
      viewBox="0 0 96 72"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="KeyTalent logo"
    >
      {/* Gray triangle — upper right */}
      <polygon
        points="68,4 43,47 93,47"
        stroke="#9CA3AF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Blue triangle — upper left */}
      <polygon
        points="28,4 3,47 53,47"
        stroke="#3FA8E0"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Red triangle — lower center */}
      <polygon
        points="48,26 23,69 73,69"
        stroke="#E04040"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
