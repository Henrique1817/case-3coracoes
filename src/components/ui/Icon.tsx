const PATHS = {
  cart: "M3 4h2l2.4 10.2a1.5 1.5 0 0 0 1.5 1.1h7.7a1.5 1.5 0 0 0 1.4-1l2-6.3H6.2M9.5 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  cup: "M4 9h12v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Zm12 1h1.5a2.5 2.5 0 0 1 0 5H16M7 3c0 1 1 1.5 1 2.5S7 7 7 7m4-4c0 1 1 1.5 1 2.5S11 7 11 7M3 21h14",
  tag: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Zm5-4.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  shield: "M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Zm-3.5 9 2.5 2.5L15.5 10",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 10a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3",
  chart: "M4 20V4m0 16h16M8 16v-5m4 5V8m4 8v-3m4 3V6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
