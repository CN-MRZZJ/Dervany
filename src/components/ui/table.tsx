import { cn } from "@/lib/utils";

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn(
          "w-full caption-bottom text-sm",
          "border-separate border-spacing-0",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10",
        "bg-white/80 backdrop-blur-sm",
        "border-b border-slate-200",
        "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
        "first:rounded-tl-lg last:rounded-tr-lg",
        className
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "border-b border-slate-100 px-4 py-2.5 text-slate-700 tabular-nums",
        "transition-colors",
        className
      )}
      {...props}
    />
  );
}
