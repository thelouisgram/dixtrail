import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M7 21.5C10.5 13 14 11.5 17.5 14.5C20 16.5 22.5 12 26 8.5"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="8.5" r="2.25" fill="white" />
      <circle cx="7" cy="21.5" r="1.75" fill="white" fillOpacity="0.85" />
    </svg>
  );
}
