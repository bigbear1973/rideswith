import { cn } from "@/lib/utils";

interface Stat {
  value: string;
  label: string;
}

interface StatsBannerProps {
  stats: Stat[];
  className?: string;
}

export function StatsBanner({ stats, className }: StatsBannerProps) {
  return (
    <div
      className={cn(
        "w-full bg-primary py-12 md:py-16",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-4xl font-bold text-primary-foreground md:text-5xl lg:text-6xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-primary-foreground/80 md:text-base">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
