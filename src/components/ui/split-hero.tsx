import { cn } from "@/lib/utils";
import { Button } from "./button";
import Link from "next/link";

interface SplitHeroProps {
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  image?: React.ReactNode;
  imagePosition?: "left" | "right";
  className?: string;
  variant?: "light" | "dark";
}

export function SplitHero({
  title,
  description,
  ctaText,
  ctaHref,
  secondaryCtaText,
  secondaryCtaHref,
  image,
  imagePosition = "right",
  className,
  variant = "light",
}: SplitHeroProps) {
  const content = (
    <div className="flex flex-col justify-center space-y-6">
      <h1
        className={cn(
          "text-4xl font-bold leading-tight md:text-5xl lg:text-6xl",
          variant === "dark" && "text-white"
        )}
      >
        {title}
      </h1>
      <p
        className={cn(
          "text-lg leading-relaxed md:text-xl",
          variant === "light" ? "text-muted-foreground" : "text-white/80"
        )}
      >
        {description}
      </p>
      {(ctaText || secondaryCtaText) && (
        <div className="flex flex-wrap gap-4">
          {ctaText && ctaHref && (
            <Button
              variant={variant === "light" ? "c40" : "c40Dark"}
              size="lg"
              asChild
            >
              <Link href={ctaHref}>{ctaText}</Link>
            </Button>
          )}
          {secondaryCtaText && secondaryCtaHref && (
            <Button
              variant={variant === "light" ? "c40Green" : "c40Dark"}
              size="lg"
              asChild
            >
              <Link href={secondaryCtaHref}>{secondaryCtaText}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );

  const imageContent = image && (
    <div className="flex items-center justify-center">{image}</div>
  );

  return (
    <section
      className={cn(
        "w-full py-16 md:py-24",
        variant === "dark" && "bg-c40-black",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          {imagePosition === "left" ? (
            <>
              {imageContent}
              {content}
            </>
          ) : (
            <>
              {content}
              {imageContent}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
