import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  
  let variant: "default" | "destructive" | "outline" | "secondary" = "default";
  let colorClass = "";

  if (normalizedStatus.includes("closed") || normalizedStatus.includes("approved")) {
    colorClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200";
    variant = "outline";
  } else if (normalizedStatus.includes("overdue") || normalizedStatus.includes("rejected")) {
    colorClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200";
    variant = "outline";
  } else if (normalizedStatus.includes("progress") || normalizedStatus.includes("review") || normalizedStatus.includes("submitted")) {
    colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200";
    variant = "outline";
  } else if (normalizedStatus.includes("open") || normalizedStatus.includes("draft")) {
    colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200";
    variant = "outline";
  }

  return (
    <Badge variant={variant} className={`font-medium border-transparent ${colorClass} ${className}`}>
      {status}
    </Badge>
  );
}
