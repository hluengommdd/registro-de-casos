export default function Logo({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield Background */}
      <path
        d="M50 5L85 20V45C85 65 72 82 50 95C28 82 15 65 15 45V20L50 5Z"
        fill="url(#gradient1)"
        stroke="url(#gradient2)"
        strokeWidth="2"
      />

      {/* Book/Education Symbol */}
      <path d="M35 35H65V70H35V35Z" fill="white" fillOpacity="0.9" />
      <line x1="50" y1="35" x2="50" y2="70" stroke="#6366f1" strokeWidth="2" />
      <line
        x1="35"
        y1="45"
        x2="48"
        y2="45"
        stroke="#8b5cf6"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="52"
        y1="45"
        x2="65"
        y2="45"
        stroke="#8b5cf6"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="35"
        y1="52"
        x2="48"
        y2="52"
        stroke="#8b5cf6"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="52"
        y1="52"
        x2="65"
        y2="52"
        stroke="#8b5cf6"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="35"
        y1="59"
        x2="48"
        y2="59"
        stroke="#8b5cf6"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <line
        x1="52"
        y1="59"
        x2="65"
        y2="59"
        stroke="#8b5cf6"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />

      {/* Gradients */}
      <defs>
        <linearGradient
          id="gradient1"
          x1="15"
          y1="5"
          x2="85"
          y2="95"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient
          id="gradient2"
          x1="15"
          y1="5"
          x2="85"
          y2="95"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}
