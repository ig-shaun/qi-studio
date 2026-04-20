import type { SVGProps } from "react";
import type { ViewId } from "./views";

type P = SVGProps<SVGSVGElement>;

const base: P = {
  viewBox: "0 0 18 18",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const icons: Record<ViewId, (p?: P) => JSX.Element> = {
  intent: (p) => (
    <svg {...base} {...p}>
      <circle cx="9" cy="9" r="2" />
      <circle cx="9" cy="9" r="5" opacity="0.55" />
      <circle cx="9" cy="9" r="7.5" opacity="0.3" />
    </svg>
  ),
  organism: (p) => (
    <svg {...base} {...p}>
      <circle cx="9" cy="9" r="2.4" />
      <path d="M9 1.5v3" />
      <path d="M9 13.5v3" />
      <path d="M1.5 9h3" />
      <path d="M13.5 9h3" />
      <path d="M3.8 3.8l2.1 2.1" />
      <path d="M12.1 12.1l2.1 2.1" />
      <path d="M14.2 3.8l-2.1 2.1" />
      <path d="M5.9 12.1L3.8 14.2" />
    </svg>
  ),
  loops: (p) => (
    <svg {...base} {...p}>
      <path d="M3 9a6 6 0 1 0 1.8-4.3" />
      <path d="M3 3v3h3" />
    </svg>
  ),
  pods: (p) => (
    <svg {...base} {...p}>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="12" cy="6" r="2.2" />
      <circle cx="9" cy="12" r="2.2" />
      <path d="M7.6 7.6l2.2 2.8" />
      <path d="M10.4 7.6L8.2 10.4" />
      <path d="M8 6h2" />
    </svg>
  ),
  roles: (p) => (
    <svg {...base} {...p}>
      <circle cx="5" cy="5" r="1.8" />
      <circle cx="13" cy="5" r="1.8" />
      <circle cx="5" cy="13" r="1.8" />
      <circle cx="13" cy="13" r="1.8" />
      <path d="M5 7v4" />
      <path d="M13 7v4" />
      <path d="M7 5h4" />
      <path d="M7 13h4" />
    </svg>
  ),
  agents: (p) => (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="12" height="9" rx="2" />
      <path d="M6 5V3.5" />
      <path d="M12 5V3.5" />
      <circle cx="7" cy="9.5" r="0.9" fill="currentColor" />
      <circle cx="11" cy="9.5" r="0.9" fill="currentColor" />
      <path d="M7 12h4" />
    </svg>
  ),
  flow: (p) => (
    <svg {...base} {...p}>
      <path d="M2 6h14" />
      <path d="M2 9h14" />
      <path d="M2 12h14" />
      <circle cx="5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  governance: (p) => (
    <svg {...base} {...p}>
      <path d="M9 2L3 4.5V9c0 3.6 2.6 6 6 7 3.4-1 6-3.4 6-7V4.5L9 2z" />
      <path d="M6.5 9l2 2 3-3.5" />
    </svg>
  ),
  fitness: (p) => (
    <svg {...base} {...p}>
      <path d="M2 14l3-5 3 2 4-6 4 8" />
      <circle cx="5" cy="9" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="8" cy="11" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  plan: (p) => (
    <svg {...base} {...p}>
      <path d="M2 15L7 9l3 3 6-8" />
      <path d="M12 4h4v4" />
    </svg>
  ),
};

export function BrandMark(p: P = {}) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...p}>
      <circle
        cx="16"
        cy="16"
        r="13.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />
      <circle
        cx="16"
        cy="16"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      <circle cx="16" cy="16" r="3.2" fill="currentColor" />
    </svg>
  );
}

export function ChevronRight(p: P = {}) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" {...p}>
      <path
        d="M5.5 3 10 8l-4.5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon(p: P = {}) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" {...p}>
      <circle
        cx="7"
        cy="7"
        r="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="10.5"
        y1="10.5"
        x2="14"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon(p: P = {}) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" {...p}>
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
