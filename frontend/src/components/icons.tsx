import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { filled?: boolean };

function outline(props: IconProps): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props,
  };
}

/* ------------------------------------------------------------- Nav */

export function HomeIcon(props: IconProps) {
  const { filled, ...rest } = props;
  if (filled)
    return (
      <svg {...rest} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.1a1 1 0 0 1 .7.3l8.3 7.5a1 1 0 0 1-.7 1.7H19v8a2 2 0 0 1-2 2h-3a1 1 0 0 1-1-1v-5h-2v5a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2v-8H3.7a1 1 0 0 1-.7-1.7l8.3-7.5a1 1 0 0 1 .7-.3z" />
      </svg>
    );
  return (
    <svg {...outline(rest)}>
      <path d="M3 10.9 12 3.5l9 7.4" />
      <path d="M5 9.3V20.5h14V9.3" />
      <path d="M9.8 20.5v-6.2h4.4v6.2" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  const { filled, ...rest } = props;
  if (filled)
    return (
      <svg {...rest} viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 2.5a1 1 0 0 1 1 1V5h6V3.5a1 1 0 1 1 2 0V5h1.5A2.5 2.5 0 0 1 21 7.5v11A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-11A2.5 2.5 0 0 1 5.5 5H7V3.5a1 1 0 0 1 1-1zM5 10.5v8c0 .28.22.5.5.5h13c.28 0 .5-.22.5-.5v-8H5z" />
      </svg>
    );
  return (
    <svg {...outline(rest)}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <path d="M8 15h.01M12 15h.01M16 15h.01" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  const { filled, ...rest } = props;
  if (filled)
    return (
      <svg {...rest} viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.06 2.94a1.5 1.5 0 0 1 2.12 0l3.88 3.88a1.5 1.5 0 0 1 0 2.12l-10.6 10.6a1.5 1.5 0 0 1-.75.4l-3.2.8a.5.5 0 0 1-.6-.6l.8-3.2a1.5 1.5 0 0 1 .4-.75z" />
      </svg>
    );
  return (
    <svg {...outline(rest)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function ChartBarIcon(props: IconProps) {
  const { filled, ...rest } = props;
  if (filled)
    return (
      <svg {...rest} viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="12" width="4" height="8" rx="1.5" />
        <rect x="10" y="7" width="4" height="13" rx="1.5" />
        <rect x="17" y="3" width="4" height="17" rx="1.5" />
      </svg>
    );
  return (
    <svg {...outline(rest)}>
      <path d="M3 20.5h18" />
      <path d="M6 16v-5M12 16V7M18 16v-9" />
    </svg>
  );
}

/* ---------------------------------------------------------------- Actions */

export function PlusIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function SwapIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <path d="M7 4 3 8l4 4" />
      <path d="M3 8h13a5 5 0 0 1 0 10h-3" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function SkipIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <polyline points="5 7 13 12 5 17" />
      <line x1="13" y1="7" x2="13" y2="17" />
    </svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ---------------------------------------------------------------- New accents */

export function FlameIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export function TimerIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function DumbbellIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <path d="M14.4 14.4 9.6 9.6" />
      <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
      <path d="m21.5 21.5-1.4-1.4M3.9 3.9 2.5 2.5" />
      <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5.5 21c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
    </svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function BrainIcon(props: IconProps) {
  const { filled, ...rest } = props;
  if (filled)
    return (
      <svg {...rest} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C9.5 2 7.5 3.5 7.5 5.5c0 .5.1 1 .3 1.4C6.3 7.5 5 9.1 5 11c0 1.5.8 2.8 2 3.5v2c0 .6.4 1 1 1h1v1.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V18h2v1.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V18h1c.6 0 1-.4 1-1v-2c1.2-.7 2-2 2-3.5 0-1.9-1.3-3.5-2.8-4.1.2-.4.3-.9.3-1.4C16.5 3.5 14.5 2 12 2z" />
      </svg>
    );
  return (
    <svg {...outline(rest)}>
      <path d="M12 2C9.5 2 7.5 3.5 7.5 5.5c0 .5.1 1 .3 1.4C6.3 7.5 5 9.1 5 11c0 1.5.8 2.8 2 3.5v2c0 .6.4 1 1 1h1v1.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V18h2v1.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V18h1c.6 0 1-.4 1-1v-2c1.2-.7 2-2 2-3.5 0-1.9-1.3-3.5-2.8-4.1.2-.4.3-.9.3-1.4C16.5 3.5 14.5 2 12 2z" />
      <path d="M9 11.5c0-.3.2-.5.5-.5s.5.2.5.5v1c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-1zM14 11.5c0-.3.2-.5.5-.5s.5.2.5.5v1c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-1z" />
    </svg>
  );
}