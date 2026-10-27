import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function defaults({ size = 16, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M3.5 10h13" />
      <path d="m11.5 5 5 5-5 5" />
    </svg>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

export function ResetIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M3.2 8a7 7 0 1 1 .55 5.4" />
      <path d="M3 3.5V8h4.5" />
    </svg>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <svg {...defaults(props)} className={`animate-spin ${props.className ?? ""}`}>
      <path d="M10 2.5a7.5 7.5 0 1 1-7.5 7.5" strokeWidth={2} />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="m4 10.5 3.5 3.5L16 5.5" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M10 3 18 17H2L10 3Z" />
      <path d="M10 8v4" />
      <path d="M10 14.6v.1" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v4.5" />
      <path d="M10 6.4v.1" />
    </svg>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M8 4H4.5A1.5 1.5 0 0 0 3 5.5v10A1.5 1.5 0 0 0 4.5 17h10a1.5 1.5 0 0 0 1.5-1.5V12" />
      <path d="M11 3h6v6" />
      <path d="m17 3-7.5 7.5" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <rect x="7" y="7" width="9.5" height="9.5" rx="2" />
      <path d="M13 4.5H5.5A1.5 1.5 0 0 0 4 6v7" />
    </svg>
  );
}

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="ak-logo" x1="4" y1="32" x2="32" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F2A4A" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect x="0.75" y="0.75" width="34.5" height="34.5" rx="10" fill="url(#ak-logo)" />
      <path
        d="M10 25.5 18 9l8 16.5"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 19.5h8" stroke="#7DD3C7" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="18" cy="9" r="1.7" fill="#FFFFFF" />
    </svg>
  );
}
