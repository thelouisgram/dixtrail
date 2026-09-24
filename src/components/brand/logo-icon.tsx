import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className }: LogoIconProps) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      width={32}
      height={33}
      className={cn("shrink-0 object-contain", className)}
      aria-hidden
    />
  );
}
