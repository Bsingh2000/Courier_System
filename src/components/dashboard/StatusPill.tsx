import { cn } from "@/lib/utils";

interface StatusPillProps {
  label: string;
  tone: string;
  className?: string;
}

export function StatusPill({ label, tone, className }: StatusPillProps) {
  return <span className={cn("chip", tone, className)}>{label}</span>;
}
