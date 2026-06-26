import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { LogoIcon } from "./logo-icon";

interface LogoProps {
  href?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

const iconSizes = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

const textSizes = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
};

export function Logo({
  href = "/dashboard",
  showText = true,
  size = "md",
  className,
  onClick,
}: LogoProps) {
  const content = (
    <>
      <LogoIcon className={iconSizes[size]} />
      {showText && (
        <span className={cn("font-bold tracking-tight", textSizes[size])}>
          {APP_NAME.slice(0, 3)}
          <span className="text-primary">{APP_NAME.slice(3)}</span>
        </span>
      )}
    </>
  );

  const classes = cn("inline-flex items-center gap-2.5", className);

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
