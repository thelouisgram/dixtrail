import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

const logoHeights = {
  sm: "h-6 w-auto",
  md: "h-8 w-auto",
  lg: "h-11 w-auto",
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
      <Image
        src="/brand/logo-horizontal.png"
        alt="Luxe Dispense"
        width={630}
        height={180}
        priority
        className={cn("object-contain", logoHeights[size])}
      />
      {showText && (
        <span
          className={cn(
            "font-semibold uppercase tracking-[0.22em] text-foreground/80",
            size === "lg" ? "text-xs" : "text-[10px]"
          )}
        >
          CRM
        </span>
      )}
    </>
  );

  const classes = cn("inline-flex items-center gap-2", className);

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
