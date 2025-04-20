import { cn } from "@/lib/utils"

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Shell({ className, children, ...props }: ShellProps) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  )
} 