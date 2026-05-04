import { cn } from "@/lib/utils";

type Variant = "neutral" | "success" | "warning" | "danger" | "info";

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        variant === "neutral" && "bg-slate-50 text-slate-700 border-slate-200",
        variant === "success" &&
          "bg-emerald-50 text-emerald-700 border-emerald-200",
        variant === "warning" &&
          "bg-amber-50 text-amber-700 border-amber-200",
        variant === "danger" && "bg-rose-50 text-rose-700 border-rose-200",
        variant === "info" && "bg-sky-50 text-sky-700 border-sky-200",
        className
      )}
      {...props}
    />
  );
}

