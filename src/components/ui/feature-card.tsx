import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  className?: string;
  variant?: "light" | "dark";
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  variant = "light",
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg p-6 transition-transform hover:-translate-y-1",
        variant === "light"
          ? "bg-white text-gray-900 shadow-lg"
          : "bg-black/90 text-white",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "mb-4 flex h-12 w-12 items-center justify-center rounded-full",
            variant === "light" ? "bg-primary/10" : "bg-white/10"
          )}
        >
          <Icon
            className={cn(
              "h-6 w-6",
              variant === "light" ? "text-primary" : "text-white"
            )}
          />
        </div>
      )}
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p
        className={cn(
          "text-sm leading-relaxed",
          variant === "light" ? "text-gray-600" : "text-white/80"
        )}
      >
        {description}
      </p>
    </div>
  );
}
