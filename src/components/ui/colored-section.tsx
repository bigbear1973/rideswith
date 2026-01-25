import { cn } from "@/lib/utils";

type ColorVariant = "green" | "cyan" | "black" | "white";

interface ColoredSectionProps {
  color: ColorVariant;
  children: React.ReactNode;
  className?: string;
}

const colorStyles: Record<ColorVariant, string> = {
  green: "bg-c40-green text-black",
  cyan: "bg-c40-cyan text-black",
  black: "bg-c40-black text-white",
  white: "bg-white text-foreground dark:bg-card dark:text-card-foreground",
};

export function ColoredSection({ color, children, className }: ColoredSectionProps) {
  return (
    <section
      className={cn(
        "w-full py-16 md:py-24",
        colorStyles[color],
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        {children}
      </div>
    </section>
  );
}
