interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <line x1="32" y1="8" x2="50.76" y2="17.04" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
      <line x1="42.41" y1="53.62" x2="21.59" y2="53.62" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="8" x2="55.4" y2="37.34" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
      <line x1="55.4" y1="37.34" x2="8.6" y2="37.34" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
      <line x1="50.76" y1="17.04" x2="55.4" y2="37.34" stroke="#97C2FC" strokeWidth="3" strokeLinecap="round" />
      <line x1="55.4" y1="37.34" x2="42.41" y2="53.62" stroke="#97C2FC" strokeWidth="3" strokeLinecap="round" />
      <line x1="50.76" y1="17.04" x2="42.41" y2="53.62" stroke="#97C2FC" strokeWidth="3" strokeLinecap="round" />
      <line x1="21.59" y1="53.62" x2="8.6" y2="37.34" stroke="#2B7CE9" strokeWidth="3" strokeLinecap="round" />
      <line x1="8.6" y1="37.34" x2="13.24" y2="17.04" stroke="#2B7CE9" strokeWidth="3" strokeLinecap="round" />
      <line x1="13.24" y1="17.04" x2="32" y2="8" stroke="#2B7CE9" strokeWidth="3" strokeLinecap="round" />
      <line x1="21.59" y1="53.62" x2="13.24" y2="17.04" stroke="#2B7CE9" strokeWidth="3" strokeLinecap="round" />
      <line x1="8.6" y1="37.34" x2="32" y2="8" stroke="#2B7CE9" strokeWidth="3" strokeLinecap="round" />
      <line x1="43.05" y1="5.21" x2="30.33" y2="60.93" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 4" />
      <circle cx="50.76" cy="17.04" r="5" fill="#97C2FC" />
      <circle cx="55.4" cy="37.34" r="5" fill="#97C2FC" />
      <circle cx="42.41" cy="53.62" r="5" fill="#97C2FC" />
      <circle cx="32" cy="8" r="5" fill="#2B7CE9" />
      <circle cx="21.59" cy="53.62" r="5" fill="#2B7CE9" />
      <circle cx="8.6" cy="37.34" r="5" fill="#2B7CE9" />
      <circle cx="13.24" cy="17.04" r="5" fill="#2B7CE9" />
    </svg>
  );
}
