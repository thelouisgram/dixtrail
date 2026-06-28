import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const SearchInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "search", ...props }, ref) => {
    return (
      <div className={cn("relative min-w-0 w-full", className)}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type={type}
          ref={ref}
          className="flex h-10 w-full min-w-0 rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm shadow-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-search-cancel-button]:cursor-pointer"
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
