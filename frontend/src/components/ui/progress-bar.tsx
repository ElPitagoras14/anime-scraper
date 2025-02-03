import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
}

export default function ProgressBar({ value, className }: ProgressBarProps) {
  return (
    <div
      className={cn(
        "w-full h-4 bg-muted rounded-lg overflow-hidden",
        className
      )}
    >
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
}
