"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, Loader2, MapPin, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  logoDark: string | null;
  primaryColor: string | null;
}

export default function CreateChapterPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingBrand, setLoadingBrand] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    async function loadBrand() {
      try {
        const res = await fetch(`/api/communities/${slug}`);
        if (!res.ok) {
          throw new Error("Brand not found");
        }
        const data = await res.json();
        setBrand(data);
      } catch {
        setError("Brand not found");
      } finally {
        setLoadingBrand(false);
      }
    }
    loadBrand();
  }, [slug]);

  const handleCityChange = (value: string) => {
    setCity(value);
    // Auto-fill chapter name based on city
    if (value && !name) {
      setName(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand.id,
          name: name.trim(),
          city: city.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create chapter");
      }

      const chapter = await res.json();
      router.push(`/communities/${brand.slug}/${chapter.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create chapter");
    } finally {
      setLoading(false);
    }
  };

  if (loadingBrand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase mb-2">Community not found</h1>
          <Button asChild variant="outline">
            <Link href="/communities">Back to Communities</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 md:px-[60px] py-12 md:py-[60px]">
        {/* Back link */}
        <Link
          href={`/communities/${brand.slug}`}
          className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground mb-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to {brand.name}
        </Link>

        {/* Header */}
        <div className="flex items-start gap-6 mb-12">
          {brand.logo ? (
            <BrandLogo
              logo={brand.logo}
              logoDark={brand.logoDark}
              name={brand.name}
              primaryColor={brand.primaryColor}
              className="h-16 w-16"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-xl font-bold">
              {brand.name.charAt(0)}
            </div>
          )}
          <div>
            <span className="label-editorial block mb-2">New Chapter</span>
            <h1 className="heading-display mb-2">
              Start a {brand.name} Chapter
            </h1>
            <p className="text-muted-foreground text-lg">
              Create a local chapter in your city
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Chapter Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Leipzig"
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    required
                    minLength={2}
                    maxLength={50}
                  />
                  <p className="text-sm text-muted-foreground">
                    The city where your chapter will organize rides
                  </p>
                </div>

                {/* Chapter Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Chapter Name *
                    <span className="text-muted-foreground text-sm ml-2">
                      Usually the city name
                    </span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Leipzig"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={50}
                  />
                  <p className="text-sm text-muted-foreground">
                    Will display as &quot;{brand.name} {name || "..."}&quot;
                  </p>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !name.trim() || !city.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Chapter"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 bg-muted/50 border-border">
            <CardContent className="pt-6">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                You&apos;ll be the Chapter Lead
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>
                  - You&apos;ll get a verified badge next to your name
                </li>
                <li>- You can invite other ambassadors to help organize rides</li>
                <li>
                  - All rides you create will display {brand.name} branding
                </li>
                <li>- Your chapter will appear on the {brand.name} brand page</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
