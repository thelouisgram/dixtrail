import { Spinner } from "@/components/ui/spinner";

interface PageSpinnerProps {
  label?: string;
}

export function PageSpinner({ label = "Loading..." }: PageSpinnerProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Spinner className="h-8 w-8 text-primary" label={label} />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  );
}
